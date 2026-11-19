import { NextRequest, NextResponse } from 'next/server';
import { hookEngine } from '@/lib/hookEngine';
import { HookCandidate, CaseDossierInput } from '@/lib/hookEngine/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const candidate: HookCandidate = body.candidate;
    const newHookText: string = body.newHookText;
    const newGiantKeyword: string = body.newGiantKeyword;
    const dossier: CaseDossierInput = body.dossier;

    if (!candidate || !newHookText || !newGiantKeyword || !dossier) {
      return NextResponse.json(
        { ok: false, error: 'Parameter candidate, newHookText, newGiantKeyword, dan dossier wajib disertakan' },
        { status: 400 }
      );
    }

    const updated = hookEngine.rescoreCandidate({
      candidate,
      newHookText,
      newGiantKeyword,
      dossier,
    });

    return NextResponse.json({
      ok: true,
      candidate: updated,
    });
  } catch (err: any) {
    console.error('API /api/hook-engine/rescore error:', err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Gagal menghitung ulang skor hook',
      },
      { status: 500 }
    );
  }
}
