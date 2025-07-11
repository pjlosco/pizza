import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Helper function to properly format private key
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

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

export async function POST(request: NextRequest) {
  try {
    // Verify the request is coming from a trusted source
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting test order cleanup...');

    // Validate environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create Google Auth and Sheets API client
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch all orders
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:N',
    });

    if (!response.data.values || response.data.values.length <= 1) {
      return NextResponse.json({
        success: true,
        message: 'No orders to clean up',
        deletedCount: 0
      });
    }

    // Separate header row from data rows
    const headerRow = response.data.values[0];
    const dataRows = response.data.values.slice(1);

    // Find test orders to delete
    const rowsToDelete: number[] = [];
    const ordersToKeep: any[] = [];

    dataRows.forEach((row, index) => {
      if (row.length >= 7) {
        const customerName = row[1] || '';
        const customerPhone = row[2] || '';
        const referralCode = row[6] || '';
        
        // Identify test orders
        const isTestOrder = 
          customerName.toLowerCase().includes('test') ||
          customerPhone.includes('555') ||
          customerPhone.includes('123') ||
          referralCode.toLowerCase().includes('invalid') ||
          referralCode.toLowerCase().includes('test') ||
          customerName.toLowerCase().includes('user');
        
        if (isTestOrder) {
          rowsToDelete.push(index + 2); // +2 because sheets are 1-indexed and we have a header
          console.log(`Marking test order for deletion: ${customerName} (${customerPhone}) - ${referralCode}`);
        } else {
          ordersToKeep.push(row);
        }
      } else {
        // Invalid row, keep it to be safe
        ordersToKeep.push(row);
      }
    });

    if (rowsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No test orders found to clean up',
        deletedCount: 0
      });
    }

    console.log(`Found ${rowsToDelete.length} test orders to delete`);

    // Delete rows from bottom to top to avoid index shifting issues
    const sortedRowsToDelete = rowsToDelete.sort((a, b) => b - a);
    
    for (const rowIndex of sortedRowsToDelete) {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: 0, // First sheet
                    dimension: 'ROWS',
                    startIndex: rowIndex - 1, // Sheets API is 0-indexed
                    endIndex: rowIndex // Delete one row
                  }
                }
              }
            ]
          }
        });
        console.log(`Deleted test order row ${rowIndex}`);
      } catch (deleteError) {
        console.error(`Failed to delete row ${rowIndex}:`, deleteError);
      }
    }

    console.log('Test order cleanup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Test orders cleaned up successfully',
      deletedCount: rowsToDelete.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in test order cleanup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean up test orders', details: error },
      { status: 500 }
    );
  }
}

// Also support GET for manual triggers
export async function GET(request: NextRequest) {
  return POST(request);
} 