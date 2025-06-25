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

    const orderData = await request.json();
    
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
      'Pending', // Status
      orderData.customer.specialRequests || '', // Notes - Special Requests
    ];

    console.log('Attempting to append to spreadsheet:', SPREADSHEET_ID);

    // Append order to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:J', // Use first worksheet
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [orderRow],
      },
    });

    console.log('Order successfully appended to spreadsheet');
    return NextResponse.json({ success: true, message: 'Order submitted successfully' });
  } catch (error) {
    console.error('Error submitting order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit order' },
      { status: 500 }
    );
  }
} 