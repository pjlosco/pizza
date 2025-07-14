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
    // ARCHIVING IMPLEMENTATION - Move old orders to Archive tab instead of deleting
    // This preserves order history for analytics, customer service, and audit trail
    // Archive orders older than 2 days to keep the main Orders tab clean
    
    // Verify the request is coming from a trusted source (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Only require authentication if CRON_SECRET is set
    if (cronSecret && cronSecret.trim() !== '') {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('Running scheduled order archiving...');

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

    console.log('Archiving orders older than:', cutoffDateString);

    // Create Google Auth and Sheets API client
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch all orders from the Orders tab
    const ordersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A:N',
    });

    if (!ordersResponse.data.values || ordersResponse.data.values.length <= 1) {
      console.log('No orders to archive');
      return NextResponse.json({
        success: true,
        message: 'No orders to archive',
        archivedCount: 0,
        timestamp: new Date().toISOString()
      });
    }

    // Separate header row from data rows
    const headerRow = ordersResponse.data.values[0];
    const dataRows = ordersResponse.data.values.slice(1);

    // Find rows to archive (orders older than cutoff date)
    const rowsToArchive: number[] = [];
    const ordersToArchive: any[] = [];
    const ordersToKeep: any[] = [];

    dataRows.forEach((row, index) => {
      if (row.length >= 4) {
        const orderDate = row[3]; // Column D: Order date
        
        if (orderDate && orderDate < cutoffDateString) {
          // This order is older than 2 days, mark for archiving
          rowsToArchive.push(index + 2); // +2 because sheets are 1-indexed and we have a header
          // Add archived date to the order data
          const archivedOrder = [...row, new Date().toISOString()]; // Add archived timestamp
          ordersToArchive.push(archivedOrder);
          console.log(`Marking order for archiving: ${orderDate} - ${row[1]} (${row[2]})`);
        } else {
          // Keep this order
          ordersToKeep.push(row);
        }
      } else {
        // Invalid row, keep it to be safe
        ordersToKeep.push(row);
      }
    });

    if (rowsToArchive.length === 0) {
      console.log('No old orders found to archive');
      return NextResponse.json({
        success: true,
        message: 'No old orders found to archive',
        archivedCount: 0,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`Found ${rowsToArchive.length} orders to archive`);

    // First, append orders to the Archive tab
    if (ordersToArchive.length > 0) {
      try {
        // Check if Archive tab has headers, if not add them
        const archiveResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Archive!A:O', // Include the new Archived Date column
        });

        let archiveHeaders = archiveResponse.data.values?.[0] || [];
        
        // If Archive tab is empty or doesn't have the right headers, add them
        if (archiveHeaders.length === 0) {
          archiveHeaders = [
            'Timestamp', 'Name', 'Phone', 'Order Date', 'Pickup Time', 'Email', 
            'Referral Code', 'Items', 'Total', 'Order Status', 'Special Requests', 
            'Payment Method', 'Payment Status', 'Payment ID', 'Archived Date'
          ];
          
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Archive!A1',
            valueInputOption: 'RAW',
            requestBody: {
              values: [archiveHeaders]
            }
          });
        }

        // Append archived orders to the Archive tab
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Archive!A:O',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: ordersToArchive
          }
        });
        
        console.log(`Successfully archived ${ordersToArchive.length} orders`);
      } catch (archiveError) {
        console.error('Failed to archive orders:', archiveError);
        return NextResponse.json(
          { success: false, error: 'Failed to archive orders', details: archiveError },
          { status: 500 }
        );
      }
    }

    // Now delete the archived rows from the Orders tab (from bottom to top to avoid index shifting)
    const sortedRowsToArchive = rowsToArchive.sort((a: number, b: number) => b - a);
    
    for (const rowIndex of sortedRowsToArchive) {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: 0, // Orders sheet (first sheet)
                    dimension: 'ROWS',
                    startIndex: rowIndex - 1, // Sheets API is 0-indexed
                    endIndex: rowIndex // Delete one row
                  }
                }
              }
            ]
          }
        });
        console.log(`Removed archived order from row ${rowIndex}`);
      } catch (deleteError) {
        console.error(`Failed to remove archived order from row ${rowIndex}:`, deleteError);
      }
    }

    console.log('Order archiving completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Order archiving completed successfully',
      archivedCount: rowsToArchive.length,
      cutoffDate: cutoffDateString,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in scheduled order archiving:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to archive orders', details: error },
      { status: 500 }
    );
  }
} 