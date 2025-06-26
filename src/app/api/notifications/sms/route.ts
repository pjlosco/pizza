import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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

    // Format the order details for SMS
    const pizzaItems = orderDetails.items.map((item: any) => 
      `${item.quantity}x ${item.name}`
    ).join(', ');

    const message = `🍕 NEW ORDER RECEIVED!

Customer: ${customerInfo.name}
Phone: ${customerInfo.phone}
Email: ${customerInfo.email}
Pickup Date: ${customerInfo.orderDate}

Order: ${pizzaItems}
Total: $${orderDetails.total}

Special Requests: ${customerInfo.specialRequests || 'None'}

Referral Code: ${customerInfo.referralCode}`;

    console.log('Sending SMS with details:', {
      from: process.env.TWILIO_PHONE_NUMBER,
      to: process.env.BUSINESS_PHONE_NUMBER,
      messageLength: message.length,
      accountSid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...'
    });

    // Send SMS to business owner
    const smsResponse = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: process.env.BUSINESS_PHONE_NUMBER!
    });

    console.log('SMS sent successfully:', smsResponse.sid);
    console.log('SMS status:', smsResponse.status);
    console.log('SMS direction:', smsResponse.direction);

    return NextResponse.json({ 
      success: true, 
      messageId: smsResponse.sid,
      status: smsResponse.status,
      direction: smsResponse.direction
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send SMS', details: error },
      { status: 500 }
    );
  }
} 