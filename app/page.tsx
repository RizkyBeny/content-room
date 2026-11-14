import Link from 'next/link';
import { getAllJobs } from '@/lib/db/storage';
import { Plus, Video, Sparkles, Clock } from 'lucide-react';

export default function HomePage() {
  const jobs = Object.values(getAllJobs()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-8 py-4">
      {/* Hero Banner */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Dynamic Video Engine v0.2
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Generate Video Explainer 9:16 dari Artikel
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Ubah tautan artikel berita menjadi video narasi vertikal berkualitas tinggi. Didukung oleh Google Flow MCP (Veo & Imagen) dan HeyGen HyperFrames untuk render presisi.
          </p>
        </div>
        <Link
          href="/composer"
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25 shrink-0"
        >
          <Plus className="w-5 h-5" />
          Buat Video Baru
        </Link>
      </div>

      {/* Recent Jobs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            Daftar Video Explainer
          </h2>
          <span className="text-xs text-slate-500">{jobs.length} proyek tersimpan</span>
        </div>

        {jobs.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 space-y-3">
            <p className="text-slate-400 text-sm">Belum ada video explainer yang dibuat.</p>
            <Link
              href="/composer"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
            >
              Mulai buat video pertama &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/workspace/${job.id}`}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {job.themePresetId}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        job.status === 'VIDEO_READY'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : job.status === 'FAILED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition line-clamp-2">
                    {job.angle?.name || job.articleUrl}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {job.script?.fullText || job.articleUrl}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(job.createdAt).toLocaleDateString('id-ID')}
                  </span>
                  <span>{job.script?.estimatedDurationSec ? `~${job.script.estimatedDurationSec}s` : '9:16'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

