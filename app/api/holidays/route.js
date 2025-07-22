import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year');
  
  if (!year) {
    return NextResponse.json({ error: 'Year query parameter is required' }, { status: 400 });
  }
  
  const botApiUrl = `https://apigw1.bot.or.th/bot/public/financial-institutions-holidays/?year=${year}`;
  const apiKey = process.env.BOT_API_KEY;
  
  // Check if the API key exists
  if (!apiKey) {
    console.error("CRITICAL: BOT_API_KEY is not set in the environment variables.");
    return NextResponse.json({ 
      error: 'API configuration error',
      holidays: [] 
    }, { status: 500 });
  }
  
  try {
    const response = await fetch(botApiUrl, {
      method: 'GET',
      headers: {
        'X-IBM-Client-Id': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // เพิ่ม User-Agent เผื่อ API ต้องการ
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js)',
      },
      next: { revalidate: 3600 * 24 } // Revalidate once a day
    });
    
    // Log response details for debugging
    // console.log('Response status:', response.status);
    // console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // Get response text first to debug
    const responseText = await response.text();
    
    // Check if the response is HTML (error page)
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      console.error('Received HTML response instead of JSON:', responseText.substring(0, 500));
      
      // Common BOT API error scenarios
      if (response.status === 401) {
        throw new Error('Invalid API Key or authentication failed');
      } else if (response.status === 404) {
        throw new Error('API endpoint not found. URL might have changed.');
      } else if (response.status === 403) {
        throw new Error('Access forbidden. Check API permissions.');
      }
      
      throw new Error(`BOT API returned HTML instead of JSON. Status: ${response.status}`);
    }
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', responseText.substring(0, 200));
      throw new Error('Invalid JSON response from BOT API');
    }
    
    // Check if response has expected structure
    if (!data.result || !data.result.data) {
      console.error('Unexpected data structure:', data);
      throw new Error('BOT API response missing expected data structure');
    }
    
    // Map holidays data
    const holidays = data.result.data.map(holiday => ({
      date: holiday.Date,
      name: holiday.HolidayDescriptionThai,
      // เพิ่ม field อื่นๆ ถ้าต้องการ
      nameEng: holiday.HolidayDescriptionEnglish || '',
      weekDay: holiday.WeekDay || ''
    }));
    
    return NextResponse.json({ 
      holidays,
      success: true 
    });
    
  } catch (error) {
    console.error("Error fetching from BOT API:", error.message);
    console.error("Full error:", error);
    
    // Return more informative error to client (in development)
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ 
        error: error.message,
        holidays: [] 
      }, { status: 500 });
    }
    
    // In production, return generic error
    return NextResponse.json({ 
      error: 'Failed to fetch holiday data',
      holidays: [] 
    }, { status: 500 });
  }
}