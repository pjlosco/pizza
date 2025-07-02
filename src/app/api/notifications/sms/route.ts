import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Function to format phone number to E164 format
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 1 and has 11 digits, it's already US format
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // If it has 10 digits, add +1 for US
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it already has country code (starts with 1 and has 11+ digits)
  if (cleaned.length >= 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // Default: assume US number and add +1
  return `+1${cleaned}`;
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || 
        !process.env.TWILIO_PHONE_NUMBER || !process.env.BUSINESS_PHONE_NUMBER) {
      console.error('Missing Twilio environment variables');
      return NextResponse.json(
        { success: false, error: 'SMS service not configured' },
        { status: 500 }
      );
    }

    const { orderDetails, customerInfo } = await request.json();

    // Format phone numbers to E164
    const formattedFromNumber = formatPhoneNumber(process.env.TWILIO_PHONE_NUMBER);
    const formattedToNumber = formatPhoneNumber(process.env.BUSINESS_PHONE_NUMBER);

    console.log('Phone number formatting:', {
      originalFrom: process.env.TWILIO_PHONE_NUMBER,
      formattedFrom: formattedFromNumber,
      originalTo: process.env.BUSINESS_PHONE_NUMBER,
      formattedTo: formattedToNumber
    });

    // Format the order details for SMS
    const pizzaItems = orderDetails.items.map((item: any) => 
      `${item.quantity}x ${item.name}`
    ).join(', ');

    const message = `🍕 NEW ORDER RECEIVED!
${customerInfo.name} ${customerInfo.phone} ${customerInfo.orderDate}
$${orderDetails.total}`;

    console.log('Sending SMS with details:', {
      from: formattedFromNumber,
      to: formattedToNumber,
      messageLength: message.length,
      accountSid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...'
    });

    // Send SMS to business owner
    const smsResponse = await client.messages.create({
      body: message,
      from: formattedFromNumber,
      to: formattedToNumber
    });

    console.log('SMS sent successfully:', smsResponse.sid);
    console.log('SMS status:', smsResponse.status);
    console.log('SMS direction:', smsResponse.direction);

    return NextResponse.json({ 
      success: true, 
      messageId: smsResponse.sid,
      status: smsResponse.status,
      direction: smsResponse.direction,
      phoneNumbers: {
        from: formattedFromNumber,
        to: formattedToNumber
      }
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send SMS', details: error },
      { status: 500 }
    );
  }
} 