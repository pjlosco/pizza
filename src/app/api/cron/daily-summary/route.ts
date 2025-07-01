import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is coming from a trusted source (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Running scheduled daily summary...');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Call the daily summary API
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/daily-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date: today }),
    });

    if (!response.ok) {
      throw new Error(`Daily summary API call failed: ${response.statusText}`);
    }

    const result = await response.json();

    console.log('Daily summary completed:', result);

    return NextResponse.json({
      success: true,
      message: 'Daily summary sent successfully',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in scheduled daily summary:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send daily summary', details: error },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
} 