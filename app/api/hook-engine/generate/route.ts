import { NextRequest, NextResponse } from 'next/server';
import { hookEngine } from '@/lib/hookEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await hookEngine.createSession({
      sourceUrl: body.sourceUrl,
      caseId: body.caseId,
      rawBrief: body.rawBrief,
      segment: body.segment,
      productData: body.productData,
      synthesizeMedia: body.synthesizeMedia ?? false,
    });

    return NextResponse.json({
      ok: true,
      session,
    });
  } catch (err: any) {
    console.error('API /api/hook-engine/generate error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Gagal memproses sesi hook engine',
      },
      { status: 500 }
    );
  }
}
