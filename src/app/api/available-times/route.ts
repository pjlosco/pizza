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

// Generate all possible time slots (4 PM - 8 PM with 20-minute increments)
function generateAllTimeSlots(): string[] {
  const times = [];
  const startHour = 16; // 4 PM
  const endHour = 20; // 8 PM
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += 20) {
      // Don't add 8:20 PM or 8:40 PM - stop at 8:00 PM
      if (hour === endHour && minutes > 0) break;
      
      const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  
  return times;
}

// Convert 24-hour time to 12-hour format for comparison
function formatTimeFor12Hour(timeString: string): string {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !SPREADSHEET_ID) {
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get date from query parameters
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    if (!date) {
      return NextResponse.json(
        { success: false, message: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Create Google Auth and Sheets API client
    const auth = createGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch only order dates and pickup times to check for existing bookings
    const ordersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'D:E', // Only fetch order date (D) and pickup time (E) columns
    });

    // Generate all possible time slots
    const allTimeSlots = generateAllTimeSlots();
    
    // Get booked time slots for the requested date
    const bookedTimes = new Set<string>();
    
    if (ordersResponse.data.values) {
      // Skip header row (if any) and process data rows
      const dataRows = ordersResponse.data.values.slice(1);
      
      for (const row of dataRows) {
        if (row.length >= 2) {
          const orderDate = row[0]; // Column D: Order date
          const pickupTime = row[1]; // Column E: Pickup time (formatted)
          
          // If this order is for the requested date and has a pickup time
          if (orderDate === date && pickupTime) {
            // Convert the formatted time back to 24-hour format for comparison
            try {
              // Parse the formatted time (e.g., "4:00 PM") back to 24-hour format
              const timeDate = new Date(`2000-01-01 ${pickupTime}`);
              if (!isNaN(timeDate.getTime())) {
                const hours = timeDate.getHours().toString().padStart(2, '0');
                const minutes = timeDate.getMinutes().toString().padStart(2, '0');
                const time24Hour = `${hours}:${minutes}`;
                bookedTimes.add(time24Hour);
              }
            } catch (timeParseError) {
              console.warn('Could not parse pickup time:', pickupTime);
            }
          }
        }
      }
    }

    // Filter out booked times and create available time slots
    const availableTimeSlots = allTimeSlots
      .filter(time => !bookedTimes.has(time))
      .map(time => ({
        value: time,
        display: formatTimeFor12Hour(time)
      }));

    return NextResponse.json({
      success: true,
      date,
      availableTimeSlots
    });

  } catch (error) {
    console.error('Error fetching available times:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch available times' },
      { status: 500 }
    );
  }
} 