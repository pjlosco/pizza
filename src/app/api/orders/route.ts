import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    
    // Format order data for spreadsheet
    const orderRow = [
      new Date().toISOString(), // Timestamp
      orderData.customer.name,
      orderData.customer.phone,
      orderData.customer.address,
      orderData.customer.email,
      orderData.customer.referralCode,
      orderData.items.map((item: any) => `${item.name} (${item.quantity})`).join(', '),
      `$${orderData.total}`,
      'Pending', // Status
      '', // Notes
    ];

    // Append order to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A:J', // Adjust range based on your sheet
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [orderRow],
      },
    });

    return NextResponse.json({ success: true, message: 'Order submitted successfully' });
  } catch (error) {
    console.error('Error submitting order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit order' },
      { status: 500 }
    );
  }
} 