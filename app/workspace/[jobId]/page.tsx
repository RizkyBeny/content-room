'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { VideoJob } from '@/lib/db/storage';
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  RotateCw,
  Sparkles,
  Volume2,
  Video,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const [job, setJob] = useState<VideoJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Script editing state
  const [scriptText, setScriptText] = useState('');
  const [isSavingScript, setIsSavingScript] = useState(false);

  // Audio state
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Video render state
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);

  // Polling helper
  const fetchJob = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error('Job tidak ditemukan');
      const data = await res.json();
      setJob(data.job);
      if (data.job?.script?.fullText && !scriptText) {
        setScriptText(data.job.script.fullText);
      }
      setIsLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat job';
      setError(msg);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    const interval = setInterval(() => {
      fetchJob();
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId]);

  // Audio Playback
  useEffect(() => {
    if (job?.audio?.url) {
      const audio = new Audio(job.audio.url);
      audio.onended = () => setIsPlayingAudio(false);
      setAudioElement(audio);
    }
  }, [job?.audio?.url]);

  const toggleAudio = () => {
    if (!audioElement) return;
    if (isPlayingAudio) {
      audioElement.pause();
      setIsPlayingAudio(false);
    } else {
      audioElement.play();
      setIsPlayingAudio(true);
    }
  };

  // Save Script
  const handleSaveScript = async () => {
    setIsSavingScript(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/script`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fullText: scriptText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJob(data.job);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyimpan script');
    } finally {
      setIsSavingScript(false);
    }
  };

  // Generate Audio via Flow MCP
  const handleGenerateAudio = async () => {
    setIsGeneratingAudio(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/audio`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ voice: selectedVoice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJob(data.job);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal men-generate voice over');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Trigger Video Render via HyperFrames
  const handleRenderVideo = async () => {
    setIsRenderingVideo(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/render`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setJob(data.job);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal merender video');
    } finally {
      setIsRenderingVideo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-slate-400 text-sm">Memuat workspace video...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <p className="text-white font-bold">{error || 'Job tidak ditemukan'}</p>
        <Link href="/" className="text-cyan-400 text-sm hover:underline">
          &larr; Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const isScriptEditable = job.status === 'SCRIPT_READY';
  const isAudioReady = job.status === 'AUDIO_READY' || job.status === 'VIDEO_READY' || job.status === 'VIDEO_GENERATING';
  const isVideoReady = job.status === 'VIDEO_READY';

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{job.angle?.name || 'Explainer Workspace'}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {job.themePresetId}
              </span>
            </h1>
            <p className="text-xs text-slate-500 truncate max-w-md">{job.articleUrl}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                job.status === 'VIDEO_READY'
                  ? 'bg-emerald-400'
                  : job.status === 'FAILED'
                  ? 'bg-rose-400'
                  : 'bg-cyan-400 animate-pulse'
              }`}
            ></span>
            <span className="text-slate-300 font-semibold">{job.status}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Script & Audio Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Angle & Summary Card */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Editorial Angle
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Est. ~{job.script?.estimatedDurationSec} detik
              </span>
            </div>
            <h2 className="text-base font-bold text-white">{job.angle?.name}</h2>
            <p className="text-xs text-slate-400 leading-relaxed">{job.angle?.rationale}</p>
          </div>

          {/* 2. Script Narration */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Naskah Suara (Voice Over)
              </label>
              <div className="text-xs text-slate-400">
                {job.script?.totalWords} kata &bull;{' '}
                <span className={job.script && job.script.estimatedDurationSec > 60 ? 'text-rose-400 font-bold' : ''}>
                  ~{job.script?.estimatedDurationSec}s
                </span>
              </div>
            </div>

            <textarea
              rows={6}
              disabled={!isScriptEditable || isSavingScript}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition leading-relaxed resize-none disabled:opacity-75"
            />

            {isScriptEditable && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveScript}
                  disabled={isSavingScript}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {isSavingScript ? 'Menyimpan...' : 'Simpan Perubahan Naskah'}
                </button>
              </div>
            )}
          </div>

          {/* 3. Voice Over Generator & Preview */}
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                Audio Voice Over (Flow MCP)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  disabled={isGeneratingAudio}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Puck">Voice: Puck (Neutral Documentary)</option>
                  <option value="Charon">Voice: Charon (Deep Authority)</option>
                  <option value="Aoede">Voice: Aoede (Expressive Female)</option>
                  <option value="Fenrir">Voice: Fenrir (Energetic Male)</option>
                </select>
                <button
                  type="button"
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                >
                  {isGeneratingAudio ? 'Men-generate...' : 'Generate Voice Over'}
                </button>
              </div>
            </div>

            {/* Audio Preview Card */}
            {job.audio?.url ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleAudio}
                    className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold hover:scale-105 transition"
                  >
                    {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <div>
                    <p className="text-xs font-bold text-white">Preview Narasi</p>
                    <p className="text-[11px] text-slate-400">Durasi aktual: {job.audio.durationSec}s</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 h-6">
                  {[40, 75, 50, 90, 60, 30, 80, 45, 100, 65, 85, 35, 70, 95].map((h, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full transition-all ${
                        isPlayingAudio ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                      }`}
                      style={{ height: `${h}%` }}
                    ></span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                Klik &quot;Generate Voice Over&quot; untuk membuat audio narasi menggunakan Flow MCP.
              </div>
            )}
          </div>

          {/* 4. Approve & Render Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleRenderVideo}
              disabled={!isAudioReady || isRenderingVideo}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRenderingVideo ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  Merender Video via HyperFrames...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Approve & Generate Video 9:16
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Video Output & Render Progress (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                Hasil Video (9:16)
              </span>
              {isVideoReady && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Siap Unduh
                </span>
              )}
            </div>

            {/* Video Canvas Container */}
            <div className="w-[300px] h-[533px] rounded-2xl bg-black border-2 border-slate-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
              {isVideoReady && job.video?.url ? (
                <video
                  src={job.video.url}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : job.status === 'VIDEO_GENERATING' ? (
                <div className="text-center p-6 space-y-4">
                  <div className="w-12 h-12 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div className="space-y-1">
                    <p className="text-white font-bold text-sm">Generating Video...</p>
                    <p className="text-xs text-slate-400">{job.progress?.step || 'Merender frame...'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3 text-slate-600">
                  <Video className="w-12 h-12 mx-auto stroke-1" />
                  <p className="text-xs font-medium text-slate-400">
                    {!isAudioReady
                      ? 'Buat Voice Over terlebih dahulu di panel kiri'
                      : 'Audio siap! Klik Approve & Generate Video'}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isVideoReady && job.video?.url && (
              <div className="w-full grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRenderVideo}
                  disabled={isRenderingVideo}
                  className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <RotateCw className="w-4 h-4" />
                  Regenerate
                </button>
                <a
                  href={job.video.url}
                  download="explainer-video.mp4"
                  className="py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition text-center"
                >
                  <Download className="w-4 h-4" />
                  Download MP4
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

