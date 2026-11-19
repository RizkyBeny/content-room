import { NextResponse } from 'next/server';
import { HISTORICAL_BENCHMARKS } from '@/lib/hookEngine/caseLibrary';

export async function GET() {
  return NextResponse.json({
    ok: true,
    cases: HISTORICAL_BENCHMARKS,
  });
}
