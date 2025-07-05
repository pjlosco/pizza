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

export async function GET(request: NextRequest) {
  return await cleanupOrders(request);
}

export async function POST(request: NextRequest) {
  return await cleanupOrders(request);
}

async function cleanupOrders(request: NextRequest) {
  try {
    // TODO: FUTURE ENHANCEMENT (Q1 2025) - Replace deletion with archiving
    // Instead of deleting old orders, we should move them to an archive sheet
    // This will preserve order history for analytics and customer service
    // Archive orders older than 30 days instead of deleting after 2 days
    // Benefits: Analytics, customer service, audit trail, compliance
    
    // Verify the request is coming from a trusted source (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Running scheduled order cleanup...');

    // Validate environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
      console.error('Missing Google Sheets environment variables');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Calculate cutoff date (2 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 2);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    console.log('Cleaning up orders older than:', cutoffDateString);

    // Create Google Auth and Sheets API client
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch all orders
    const ordersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A:N',
    });

    if (!ordersResponse.data.values || ordersResponse.data.values.length <= 1) {
      console.log('No orders to clean up');
      return NextResponse.json({
        success: true,
        message: 'No orders to clean up',
        deletedCount: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Separate header row from data rows
    const headerRow = ordersResponse.data.values[0];
    const dataRows = ordersResponse.data.values.slice(1);

    // Find rows to delete (orders older than cutoff date)
    const rowsToDelete: number[] = [];
    const ordersToKeep: any[] = [];

    dataRows.forEach((row, index) => {
      if (row.length >= 4) {
        const orderDate = row[3]; // Column D: Order date
        
        if (orderDate && orderDate < cutoffDateString) {
          // This order is older than 2 days, mark for deletion
          rowsToDelete.push(index + 2); // +2 because sheets are 1-indexed and we have a header
          console.log(`Marking order for deletion: ${orderDate} - ${row[1]} (${row[2]})`);
        } else {
          // Keep this order
          ordersToKeep.push(row);
        }
      } else {
        // Invalid row, keep it to be safe
        ordersToKeep.push(row);
      }
    });

    if (rowsToDelete.length === 0) {
      console.log('No old orders found to clean up');
      return NextResponse.json({
        success: true,
        message: 'No old orders found to clean up',
        deletedCount: 0,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`Found ${rowsToDelete.length} orders to delete`);

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
        console.log(`Deleted row ${rowIndex}`);
      } catch (deleteError) {
        console.error(`Failed to delete row ${rowIndex}:`, deleteError);
      }
    }

    console.log('Order cleanup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Order cleanup completed successfully',
      deletedCount: rowsToDelete.length,
      cutoffDate: cutoffDateString,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in scheduled order cleanup:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup orders', details: error },
      { status: 500 }
    );
  }
} 