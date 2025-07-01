import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Helper function to properly format private key
function formatPrivateKey(privateKey: string): string {
  try {
    // Remove quotes from the beginning and end if they exist
    let formatted = privateKey.trim();
    if (formatted.startsWith('"') && formatted.endsWith('"')) {
      formatted = formatted.slice(1, -1);
    }
    if (formatted.startsWith("'") && formatted.endsWith("'")) {
      formatted = formatted.slice(1, -1);
    }
    
    // Remove any existing formatting and clean up
    formatted = formatted
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
    
    // Remove any extra whitespace between lines
    formatted = formatted.split('\n').map(line => line.trim()).join('\n');
    
    // If it already has markers, just return it cleaned up
    if (formatted.includes('-----BEGIN PRIVATE KEY-----') && formatted.includes('-----END PRIVATE KEY-----')) {
      console.log('Private key already has markers, using as-is');
      return formatted;
    }
    
    // If it doesn't have markers, add them
    if (!formatted.startsWith('-----BEGIN PRIVATE KEY-----')) {
      formatted = '-----BEGIN PRIVATE KEY-----\n' + formatted;
    }
    if (!formatted.endsWith('-----END PRIVATE KEY-----')) {
      formatted = formatted + '\n-----END PRIVATE KEY-----';
    }
    
    console.log('Private key formatted successfully, length:', formatted.length);
    return formatted;
  } catch (error) {
    console.error('Error formatting private key:', error);
    throw new Error('Failed to format private key');
  }
}

// Helper function to create Google Auth
function createGoogleAuth() {
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('GOOGLE_PRIVATE_KEY is not set');
    }
    
    const formattedPrivateKey = formatPrivateKey(privateKey);
    
    // Try using JWT auth instead of GoogleAuth
    const auth = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      formattedPrivateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    
    return auth;
  } catch (error) {
    console.error('Error creating Google Auth:', error);
    throw error;
  }
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      console.error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL');
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Missing service account email' },
        { status: 500 }
      );
    }

    if (!process.env.GOOGLE_PRIVATE_KEY) {
      console.error('Missing GOOGLE_PRIVATE_KEY');
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Missing private key' },
        { status: 500 }
      );
    }

    if (!SPREADSHEET_ID) {
      console.error('Missing GOOGLE_SPREADSHEET_ID');
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Missing spreadsheet ID' },
        { status: 500 }
      );
    }

    const orderData = await request.json();
    
    // Create a unique order identifier for duplicate detection
    const orderIdentifier = `${orderData.customer.phone}-${orderData.customer.orderDate}-${orderData.total}-${orderData.items.map((item: any) => `${item.name}(${item.quantity})`).join(',')}`;
    
    console.log('Order identifier for duplicate detection:', orderIdentifier);
    
    // Log private key format for debugging (without exposing the actual key)
    const privateKeyLength = process.env.GOOGLE_PRIVATE_KEY?.length || 0;
    const hasNewlines = process.env.GOOGLE_PRIVATE_KEY?.includes('\\n') || false;
    const hasMarkers = process.env.GOOGLE_PRIVATE_KEY?.includes('-----BEGIN PRIVATE KEY-----') || false;
    const hasEndMarkers = process.env.GOOGLE_PRIVATE_KEY?.includes('-----END PRIVATE KEY-----') || false;
    const startsWithBegin = process.env.GOOGLE_PRIVATE_KEY?.startsWith('-----BEGIN PRIVATE KEY-----') || false;
    const endsWithEnd = process.env.GOOGLE_PRIVATE_KEY?.endsWith('-----END PRIVATE KEY-----') || false;
    
    console.log('Environment variables loaded:', {
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Set' : 'Missing',
      privateKey: process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Missing',
      privateKeyLength,
      hasNewlines,
      hasMarkers,
      hasEndMarkers,
      startsWithBegin,
      endsWithEnd,
      spreadsheetId: SPREADSHEET_ID ? 'Set' : 'Missing'
    });

    // Test private key format before creating auth
    try {
      const testFormattedKey = formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY);
      console.log('Private key formatted successfully, length:', testFormattedKey.length);
      console.log('First 50 chars:', testFormattedKey.substring(0, 50));
      console.log('Last 50 chars:', testFormattedKey.substring(testFormattedKey.length - 50));
    } catch (formatError) {
      console.error('Private key formatting failed:', formatError);
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Invalid private key format' },
        { status: 500 }
      );
    }

    // Create Google Auth and Sheets API client
    let auth;
    try {
      auth = createGoogleAuth();
      console.log('Google Auth created successfully');
    } catch (authError) {
      console.error('Google Auth creation failed:', authError);
      return NextResponse.json(
        { success: false, message: 'Server configuration error: Failed to create authentication' },
        { status: 500 }
      );
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // Check for recent duplicate orders (within last 5 minutes)
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      console.log('Checking for duplicate orders since:', fiveMinutesAgo);
      
      const recentOrders = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'A:M',
      });
      
      if (recentOrders.data.values) {
        const recentOrderRows = recentOrders.data.values.slice(-10); // Check last 10 orders
        for (const row of recentOrderRows) {
          if (row.length >= 8) {
            const orderTime = row[0]; // Timestamp
            const customerPhone = row[2]; // Phone
            const orderDate = row[3]; // Order date
            const total = row[7]; // Total
            
            // Check if this is a recent duplicate
            if (orderTime && new Date(orderTime) > new Date(fiveMinutesAgo) &&
                customerPhone === orderData.customer.phone &&
                orderDate === orderData.customer.orderDate &&
                total === `$${orderData.total}`) {
              console.log('Duplicate order detected:', {
                orderTime,
                customerPhone,
                orderDate,
                total
              });
              return NextResponse.json(
                { success: false, message: 'Duplicate order detected. Please wait a moment before trying again.' },
                { status: 409 }
              );
            }
          }
        }
      }
    } catch (duplicateCheckError) {
      console.log('Duplicate check failed, proceeding with order:', duplicateCheckError);
    }
    
    // Format payment information
    const paymentMethod = orderData.paymentInfo?.type === 'card' 
      ? `Credit Card${orderData.paymentInfo.cardLast4 ? ` ending in ${orderData.paymentInfo.cardLast4}` : ''}`
      : 'Cash on pickup';
    
    const paymentStatus = orderData.paymentInfo?.type === 'card' 
      ? (orderData.paymentInfo.paymentId ? 'Paid' : 'Failed')
      : 'Cash on pickup';

    // Format order data for spreadsheet
    const orderRow = [
      new Date().toISOString(), // Timestamp
      orderData.customer.name,
      orderData.customer.phone,
      orderData.customer.orderDate,
      orderData.customer.email,
      orderData.customer.referralCode,
      orderData.items.map((item: any) => `${item.name} (${item.quantity})`).join(', '),
      `$${orderData.total}`,
      'Pending', // Order Status
      orderData.customer.specialRequests || '', // Notes - Special Requests
      paymentMethod, // Payment Method
      paymentStatus, // Payment Status
      orderData.paymentInfo?.paymentId || '', // Payment ID (for card payments)
    ];

    console.log('Attempting to append to spreadsheet:', SPREADSHEET_ID);

    // Append order to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:M', // Use first worksheet
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [orderRow],
      },
    });

    console.log('Order successfully appended to spreadsheet');

    // Send SMS notification (don't block the order if SMS fails)
    console.log('=== SMS NOTIFICATION DEBUG ===');
    console.log('Attempting to send SMS notification...');
    console.log('Base URL:', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001');
    
    try {
      const smsUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'}/api/notifications/sms`;
      console.log('SMS URL:', smsUrl);
      
      const smsPayload = {
        orderDetails: {
          items: orderData.items,
          total: orderData.total
        },
        customerInfo: orderData.customer
      };
      console.log('SMS Payload:', JSON.stringify(smsPayload, null, 2));
      
      const smsResponse = await fetch(smsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smsPayload),
      });

      console.log('SMS Response status:', smsResponse.status);
      console.log('SMS Response ok:', smsResponse.ok);
      
      if (smsResponse.ok) {
        const smsResult = await smsResponse.json();
        console.log('SMS Response data:', smsResult);
        console.log('SMS notification sent successfully');
      } else {
        const errorText = await smsResponse.text();
        console.log('SMS notification failed with status:', smsResponse.status);
        console.log('SMS error response:', errorText);
      }
    } catch (smsError) {
      console.log('SMS notification error (order still saved):', smsError);
      console.log('Error details:', {
        name: (smsError as Error).name,
        message: (smsError as Error).message,
        stack: (smsError as Error).stack
      });
    }
    console.log('=== END SMS DEBUG ===');

    return NextResponse.json({ success: true, message: 'Order submitted successfully' });
  } catch (error) {
    console.error('Error submitting order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit order' },
      { status: 500 }
    );
  }
} 