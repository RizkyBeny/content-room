'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { THEME_PRESETS } from '@/lib/hyperframes/presets';
import { Sparkles, Globe, ArrowRight, Palette, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ComposerPage() {
  const router = useRouter();
  const [articleUrl, setArticleUrl] = useState('');
  const [brief, setBrief] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('modern-dark');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowStatus, setFlowStatus] = useState<{ ok: boolean; message?: string }>({ ok: false });

  useEffect(() => {
    fetch('/api/flow-mcp/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setFlowStatus({ ok: true, message: `Flow MCP Terhubung (${data.status?.credits ?? '50'} kredit tersisa)` });
        } else {
          setFlowStatus({ ok: false, message: data.error || 'Flow MCP offline' });
        }
      })
      .catch(() => {
        setFlowStatus({ ok: false, message: 'Gagal mengecek Flow MCP' });
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleUrl.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          articleUrl: articleUrl.trim(),
          brief: brief.trim() || undefined,
          themePresetId: selectedTheme,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memulai job pembuatan video');
      }

      router.push(`/workspace/${data.job.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          Composer Video Explainer
        </h1>
        <p className="text-slate-400 text-sm">
          Tempelkan tautan artikel untuk diekstrak, diformulasikan ke naskah padat, dan dikomposisikan ke video 9:16.
        </p>
      </div>

      {/* Flow MCP Status Banner */}
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
          flowStatus.ok
            ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
            : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {flowStatus.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{flowStatus.message || 'Mengecek status Flow MCP...'}</span>
        </div>
        {!flowStatus.ok && (
          <span className="text-[11px] underline opacity-80">Jalankan pnpm flow:studio</span>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Proses Gagal</p>
              <p className="text-xs text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* 1. Article URL */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Tautan Artikel (Kumparan / Media Web)
          </label>
          <input
            type="url"
            required
            placeholder="https://kumparan.com/..."
            value={articleUrl}
            onChange={(e) => setArticleUrl(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition"
          />
          <p className="text-[11px] text-slate-500">
            Sistem akan mengekstrak judul, poin berita, statistik, dan kutipan faktual dari artikel.
          </p>
        </div>

        {/* 2. Optional Brief / Intent */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Brief & Intent Tambahan (Opsional)
          </label>
          <textarea
            rows={3}
            placeholder="Contoh: Fokuskan angle pada dampak biaya hidup bagi pekerja kelas menengah..."
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition resize-none"
          />
        </div>

        {/* 3. Theme Presets */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Palette className="w-4 h-4 text-cyan-400" />
            Pilih Visual Theme Preset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.values(THEME_PRESETS).map((preset) => {
              const isSelected = selectedTheme === preset.id;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => setSelectedTheme(preset.id)}
                  disabled={isLoading}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between space-y-3 relative overflow-hidden ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: preset.colors.primary }}
                      ></span>
                      <span className="font-bold text-white text-sm">{preset.name}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{preset.description}</p>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    <span
                      className="w-5 h-5 rounded border border-white/20"
                      style={{ backgroundColor: preset.colors.bg }}
                    ></span>
                    <span
                      className="w-5 h-5 rounded border border-white/20"
                      style={{ backgroundColor: preset.colors.cardBg }}
                    ></span>
                    <span
                      className="w-5 h-5 rounded border border-white/20"
                      style={{ backgroundColor: preset.colors.primary }}
                    ></span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !articleUrl.trim()}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              Mengekstrak & Merancang Naskah...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Buat Konten & Naskah Explainer
              <ArrowRight className="w-5 h-5" />
            </span>
          )}
        </button>
      </form>
    </div>
  );
}

