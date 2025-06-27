import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

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

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing',
      authToken: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Missing',
      fromNumber: process.env.TWILIO_PHONE_NUMBER || 'Missing',
      toNumber: process.env.BUSINESS_PHONE_NUMBER || 'Missing'
    };

    console.log('Environment check:', envCheck);

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || 
        !process.env.TWILIO_PHONE_NUMBER || !process.env.BUSINESS_PHONE_NUMBER) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        envCheck
      });
    }

    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Format phone numbers to E164
    const formattedFromNumber = formatPhoneNumber(process.env.TWILIO_PHONE_NUMBER);
    const formattedToNumber = formatPhoneNumber(process.env.BUSINESS_PHONE_NUMBER);

    console.log('Phone number formatting:', {
      originalFrom: process.env.TWILIO_PHONE_NUMBER,
      formattedFrom: formattedFromNumber,
      originalTo: process.env.BUSINESS_PHONE_NUMBER,
      formattedTo: formattedToNumber
    });

    // Test message
    const testMessage = `🧪 Twilio Test Message

This is a test message from Losco's Pizzeria SMS system.

Time: ${new Date().toLocaleString()}
Status: Testing SMS functionality

If you receive this, SMS notifications are working!`;

    console.log('Sending test SMS...');
    console.log('From:', formattedFromNumber);
    console.log('To:', formattedToNumber);

    const message = await client.messages.create({
      body: testMessage,
      from: formattedFromNumber,
      to: formattedToNumber
    });

    console.log('Test SMS sent successfully:', message.sid);

    return NextResponse.json({
      success: true,
      messageId: message.sid,
      status: message.status,
      direction: message.direction,
      envCheck,
      phoneNumbers: {
        originalFrom: process.env.TWILIO_PHONE_NUMBER,
        formattedFrom: formattedFromNumber,
        originalTo: process.env.BUSINESS_PHONE_NUMBER,
        formattedTo: formattedToNumber
      },
      testMessage: testMessage.substring(0, 100) + '...'
    });

  } catch (error) {
    console.error('Twilio test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Twilio test failed',
      details: (error as Error).message,
      envCheck: {
        accountSid: process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Missing',
        authToken: process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Missing',
        fromNumber: process.env.TWILIO_PHONE_NUMBER || 'Missing',
        toNumber: process.env.BUSINESS_PHONE_NUMBER || 'Missing'
      }
    });
  }
} 