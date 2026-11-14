import { NextResponse } from 'next/server';
import { flowClient } from '@/lib/flowMcp/client';

export async function GET() {
  try {
    const health = await flowClient.checkHealth();
    if (!health.ok) {
      return NextResponse.json({ ok: false, error: health.error });
    }

    const status = await flowClient.getStatus().catch(() => ({}));
    return NextResponse.json({ ok: true, health: health.info, status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal menghubungi Flow MCP';
    return NextResponse.json({ ok: false, error: message });
  }
}

