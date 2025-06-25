import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Helper function to properly format private key
function formatPrivateKey(privateKey: string): string {
  // Remove any existing formatting
  let formatted = privateKey.replace(/\\n/g, '\n');
  
  // Ensure it starts and ends with the proper markers
  if (!formatted.includes('-----BEGIN PRIVATE KEY-----')) {
    formatted = '-----BEGIN PRIVATE KEY-----\n' + formatted;
  }
  if (!formatted.includes('-----END PRIVATE KEY-----')) {
    formatted = formatted + '\n-----END PRIVATE KEY-----';
  }
  
  return formatted;
}

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY ? formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY) : undefined,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
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
    
    console.log('Environment variables loaded:', {
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Set' : 'Missing',
      privateKey: process.env.GOOGLE_PRIVATE_KEY ? 'Set' : 'Missing',
      privateKeyLength,
      hasNewlines,
      hasMarkers,
      spreadsheetId: SPREADSHEET_ID ? 'Set' : 'Missing'
    });

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
      '', // Notes
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