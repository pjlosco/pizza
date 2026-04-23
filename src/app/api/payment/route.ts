import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { sourceId, amount, customerInfo } = await request.json();

    if (!sourceId || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      );
    }

    // Check if environment variables are available
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const environment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
    
    if (!accessToken) {
      console.error('❌ SQUARE_ACCESS_TOKEN is not set in environment variables');
      return NextResponse.json(
        { error: 'Payment configuration error' },
        { status: 500 }
      );
    }

    console.log('✅ Square Environment:', environment);
    console.log('✅ Access Token available:', !!accessToken);

    // Determine the correct API URL based on environment
    const baseUrl = environment === 'production' 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com';

    // Use the location ID from environment variables
    // For server-side, use SQUARE_LOCATION_ID; for client-side fallback, use NEXT_PUBLIC_SQUARE_LOCATION_ID
    const locationId = process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || 'LOCATION_ID_NEEDED';

    // Create payment request
    const paymentData = {
      source_id: sourceId,
      amount_money: {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'USD'
      },
      location_id: locationId,
      idempotency_key: uuidv4(),
      note: `Pizza order for ${customerInfo?.name || 'Customer'}`,
      buyer_email_address: customerInfo?.email,
    };

    console.log('Processing payment with Square:', {
      amount: paymentData.amount_money.amount,
      currency: paymentData.amount_money.currency,
      customerName: customerInfo?.name,
      environment: environment
    });

    // Make the API call to Square
    const response = await fetch(`${baseUrl}/v2/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-18'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();

    if (response.ok && result.payment) {
      console.log('✅ Payment successful:', result.payment.id);

      return NextResponse.json({
        success: true,
        paymentId: result.payment.id,
        status: result.payment.status
      });
    } else {
      // Extract specific error information from Square's response
      let errorMessage = 'Payment processing failed';
      const errors = result.errors || [];

      if (errors.length > 0) {
        const firstError = errors[0];
        errorMessage = firstError.detail || firstError.message || 'Payment processing failed';
        console.error('❌ Payment failed:', firstError.code, '-', errorMessage);
      } else {
        console.error('❌ Payment failed:', result);
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: errors
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    
    return NextResponse.json(
      { error: 'Payment processing failed', details: [(error as Error).message] },
      { status: 500 }
    );
  }
} 