import { NextResponse } from 'next/server';
import { getJob } from '@/lib/db/storage';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);

  if (!job) {
    return NextResponse.json({ error: 'Job tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ job });
}

