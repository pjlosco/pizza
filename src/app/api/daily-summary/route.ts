import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import twilio from 'twilio';

// Helper function to properly format private key (copied from orders/route.ts)
function formatPrivateKey(privateKey: string): string {
  try {
    let formatted = privateKey.trim();
    if (formatted.startsWith('"') && formatted.endsWith('"')) {
      formatted = formatted.slice(1, -1);
    }
    if (formatted.startsWith("'") && formatted.endsWith("'")) {
      formatted = formatted.slice(1, -1);
    }
    
    formatted = formatted
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
    
    formatted = formatted.split('\n').map(line => line.trim()).join('\n');
    
    if (formatted.includes('-----BEGIN PRIVATE KEY-----') && formatted.includes('-----END PRIVATE KEY-----')) {
      return formatted;
    }
    
    if (!formatted.startsWith('-----BEGIN PRIVATE KEY-----')) {
      formatted = '-----BEGIN PRIVATE KEY-----\n' + formatted;
    }
    if (!formatted.endsWith('-----END PRIVATE KEY-----')) {
      formatted = formatted + '\n-----END PRIVATE KEY-----';
    }
    
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

// Function to format phone number to E164 format
function formatPhoneNumber(phoneNumber: string): string {
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  if (cleaned.length >= 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  return `+1${cleaned}`;
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SPREADSHEET_ID) {
      return NextResponse.json(
        { success: false, error: 'Google Sheets configuration missing' },
        { status: 500 }
      );
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || 
        !process.env.TWILIO_PHONE_NUMBER || !process.env.BUSINESS_PHONE_NUMBER) {
      return NextResponse.json(
        { success: false, error: 'Twilio configuration missing' },
        { status: 500 }
      );
    }

    const { date } = await request.json();
    const targetDate = date || new Date().toISOString().split('T')[0]; // Default to today

    console.log('Fetching daily summary for date:', targetDate);

    // Create Google Auth and Sheets API client
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch all orders from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'A:N', // Covers all columns including pickup time and payment info
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      // No orders or only header row
      const message = `📊 ${new Date(targetDate).toLocaleDateString()}: No orders today 🌟`;

      await sendSMS(message);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Daily summary sent (no orders)',
        orderCount: 0,
        totalRevenue: 0
      });
    }

    // Filter orders for the target date
    const header = rows[0];
    const dataRows = rows.slice(1);
    
    // Find the pickup date column (assuming it's in column D based on orders API)
    const pickupDateColumnIndex = 3; // Column D (0-indexed)
    
    const dailyOrders = dataRows.filter(row => {
      if (row.length <= pickupDateColumnIndex) return false;
      const orderDate = row[pickupDateColumnIndex];
      return orderDate === targetDate;
    });

    console.log(`Found ${dailyOrders.length} orders for ${targetDate}`);

    if (dailyOrders.length === 0) {
      const message = `📊 ${new Date(targetDate).toLocaleDateString()}: No orders today 🌟`;

      await sendSMS(message);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Daily summary sent (no orders)',
        orderCount: 0,
        totalRevenue: 0
      });
    }

    // Process orders data
    let totalRevenue = 0;
    let cashOrders = 0;
    let cardOrders = 0;
    const orderDetails: string[] = [];

    dailyOrders.forEach((row, index) => {
      try {
        const timestamp = row[0] || '';
        const customerName = row[1] || 'Unknown';
        const customerPhone = row[2] || '';
        const pickupDate = row[3] || '';
        const pickupTime = row[4] || '';
        const email = row[5] || '';
        const referralCode = row[6] || '';
        const items = row[7] || '';
        const total = row[8] || '0';
        const orderStatus = row[9] || 'pending';
        const specialRequests = row[10] || '';
        const paymentMethod = row[11] || 'cash';
        const paymentStatus = row[12] || '';
        const paymentId = row[13] || '';

        // Parse total amount
        const amount = parseFloat(total.replace('$', ''));
        if (!isNaN(amount)) {
          totalRevenue += amount;
        }

        // Count payment methods
        if (paymentMethod.toLowerCase() === 'cash') {
          cashOrders++;
        } else {
          cardOrders++;
        }

        // Format order detail
        const orderTime = timestamp ? new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        }) : '';
        
        const timeInfo = pickupTime ? `🕐 Pickup: ${pickupTime}` : `⏰ Ordered: ${orderTime}`;
        
        orderDetails.push(
          `${index + 1}. ${customerName} - ${total}\n   ${items}\n   📞 ${customerPhone}\n   ${timeInfo}`
        );
      } catch (error) {
        console.error('Error processing order row:', error);
      }
    });

    // TODO: FUTURE ENHANCEMENT - Restore robust message format after Twilio trial
    // Current robust format includes:
    // - Detailed order breakdown with customer names, phones, pickup times
    // - Full item descriptions
    // - Payment method breakdown
    // - Order timestamps
    // - Truncation logic for long messages
    // 
    // Simplified format for Twilio trial limits:
    const date_formatted = new Date(targetDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let message = `📊 ${date_formatted}
🍕 Orders: ${dailyOrders.length}
💰 Revenue: $${totalRevenue.toFixed(2)}
💳 Cash: ${cashOrders} | Card: ${cardOrders}`;

    // Add brief order list if there are orders
    // if (dailyOrders.length > 0) {
    //   const briefOrders = dailyOrders.map((row, index) => {
    //     const customerName = row[1] || 'Unknown';
    //     const total = row[8] || '0';
    //     return `${index + 1}. ${customerName} - ${total}`;
    //   }).join('\n');
      
    //   message += `\n\n📋 Orders:\n${briefOrders}`;
    // }

    await sendSMS(message);

    return NextResponse.json({ 
      success: true, 
      message: 'Daily summary sent successfully',
      orderCount: dailyOrders.length,
      totalRevenue: totalRevenue,
      date: targetDate
    });

  } catch (error) {
    console.error('Error generating daily summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate daily summary', details: error },
      { status: 500 }
    );
  }
}

async function sendSMS(message: string) {
  // Initialize Twilio client
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  // Format phone numbers
  const formattedFromNumber = formatPhoneNumber(process.env.TWILIO_PHONE_NUMBER!);
  const formattedToNumber = formatPhoneNumber(process.env.BUSINESS_PHONE_NUMBER!);

  console.log('Sending daily summary SMS...');

  // Send SMS
  const smsResponse = await client.messages.create({
    body: message,
    from: formattedFromNumber,
    to: formattedToNumber
  });

  console.log('Daily summary SMS sent successfully:', smsResponse.sid);
  return smsResponse;
} 