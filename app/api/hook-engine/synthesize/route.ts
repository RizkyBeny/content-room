import { NextRequest, NextResponse } from 'next/server';
import { synthesizeHookMedia } from '@/lib/hookEngine/flowMediaSynthesizer';
import { HookCandidate, CaseDossierInput } from '@/lib/hookEngine/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const candidate: HookCandidate = body.candidate;
    const dossier: CaseDossierInput = body.dossier;

    if (!candidate || !dossier) {
      return NextResponse.json(
        { ok: false, error: 'Parameter candidate dan dossier wajib disertakan' },
        { status: 400 }
      );
    }

    const media = await synthesizeHookMedia(candidate, dossier);
    const updatedCandidate: HookCandidate = {
      ...candidate,
      media,
    };

    return NextResponse.json({
      ok: true,
      candidate: updatedCandidate,
    });
  } catch (err: any) {
    console.error('API /api/hook-engine/synthesize error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Gagal mensintesis media Flow MCP',
      },
      { status: 500 }
    );
  }
}
