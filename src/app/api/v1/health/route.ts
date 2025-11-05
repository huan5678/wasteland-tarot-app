/**
 * Backend Health Check API Route
 * 
 * Purpose: Verify backend availability before loading the app
 * Used by: BackendHealthCheck component to wake up serverless backend
 * 
 * This route is separate from the main catch-all proxy because:
 * 1. Needs fast response (no complex header/cookie processing)
 * 2. Called on every app startup (must be lightweight)
 * 3. Should retry on failure without triggering auth errors
 */

import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 秒超時

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    
    console.log('[Health Check] Backend status:', data);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[Health Check] Backend timeout after 10s');
        return NextResponse.json(
          { status: 'error', message: 'Backend timeout' },
          { status: 504 }
        );
      }
      console.error('[Health Check] Backend unavailable:', error.message);
    }
    
    return NextResponse.json(
      { status: 'error', message: 'Backend unavailable' },
      { status: 503 }
    );
  }
}
