'use client';

import React, { useState, useEffect } from 'react';
import {
  HookSimulatorSession,
  HookCandidate,
  HistoricalBenchmarkCase,
  ContentSegmentKey,
  ProductDossierInput,
} from '@/lib/hookEngine';

const SEGMENT_OPTIONS: { key: ContentSegmentKey; label: string; icon: string; shortBadge: string }[] = [
  { key: 'video_reels', label: 'Short Video (9:16)', icon: '📱', shortBadge: 'Reels / TikTok' },
  { key: 'commerce_ugc', label: 'Commerce & UGC', icon: '🛍️', shortBadge: 'Ad Video' },
  { key: 'news_anchor', label: 'News Anchor', icon: '🎙️', shortBadge: 'Investigasi' },
  { key: 'carousel_swipe', label: 'Carousel (Slide 1)', icon: '📑', shortBadge: 'Cover Post' },
  { key: 'article_blog', label: 'SEO Article', icon: '✍️', shortBadge: 'H1 & Lead' },
  { key: 'single_image_post', label: 'Feed Post', icon: '🖼️', shortBadge: 'Post + Caption' },
];

export default function HookEnginePage() {
  const [activeTab, setActiveTab] = useState<'url' | 'benchmark' | 'brief'>('benchmark');
  const [selectedSegment, setSelectedSegment] = useState<ContentSegmentKey>('video_reels');
  const [sourceUrl, setSourceUrl] = useState(
    'https://kumparan.com/kumparannews/pemerintah-dpr-sepakati-ruu-perampasan-aset-dibawa-ke-paripurna-untuk-disahkan-jadi-uu-28b45xHQ7o7'
  );
  const [selectedCaseId, setSelectedCaseId] = useState('kumparan-ruu-perampasan-aset');
  const [rawBrief, setRawBrief] = useState('');
  const [benchmarkCases, setBenchmarkCases] = useState<HistoricalBenchmarkCase[]>([]);
  const [session, setSession] = useState<HookSimulatorSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [synthesizingId, setSynthesizingId] = useState<string | null>(null);
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editKeyword, setEditKeyword] = useState('');
  const [promotedWinner, setPromotedWinner] = useState<HookCandidate | null>(null);

  // Dedicated Product Form for Commerce & UGC
  const [productForm, setProductForm] = useState<ProductDossierInput>({
    productName: 'GlowMatrix Retinol Encapsulated 1%',
    category: 'beauty_skincare',
    targetPersona: 'Wanita 20-35 tahun pejuang jerawat & flek hitam',
    painPoint: 'Bekas jerawat hitam gak hilang-hilang meski udah beli skincare jutaan',
    uspBenefit: 'Formula Encapsulated slow-release, samarkan flek dalam 14 hari tanpa purging',
    offerPrice: 'Diskon 45% + Gratis Re-fill pouch khusus hari ini',
    productUrl: 'https://shopee.co.id/glowmatrix-retinol-serum',
  });

  // Switch default selected case when changing segment
  const handleSelectSegment = (seg: ContentSegmentKey) => {
    setSelectedSegment(seg);
    if (seg === 'commerce_ugc') {
      const ugcCase = benchmarkCases.find((b) => b.caseId === 'ugc-skincare-retinol');
      if (ugcCase) setSelectedCaseId(ugcCase.caseId);
    } else {
      const nonUgc = benchmarkCases.find((b) => b.caseId === 'kumparan-ruu-perampasan-aset');
      if (nonUgc) setSelectedCaseId(nonUgc.caseId);
    }
  };

  // Load benchmark cases on mount
  useEffect(() => {
    fetch('/api/hook-engine/cases')
      .then((res) => res.json())
      .then((data) => {
        if (data.cases) {
          setBenchmarkCases(data.cases);
          const defaultCase = selectedSegment === 'commerce_ugc'
            ? data.cases.find((c: any) => c.caseId === 'ugc-skincare-retinol')
            : data.cases.find((c: any) => c.caseId === 'kumparan-ruu-perampasan-aset');
          if (defaultCase) {
            setSelectedCaseId(defaultCase.caseId);
          }
        }
      })
      .catch(console.error);
  }, [selectedSegment]);

  const handleGenerate = async () => {
    setLoading(true);
    setPromotedWinner(null);
    try {
      const payload: any = { synthesizeMedia: true, segment: selectedSegment };
      if (activeTab === 'url') {
        payload.sourceUrl = sourceUrl;
      } else if (activeTab === 'benchmark') {
        payload.caseId = selectedCaseId;
      } else {
        if (selectedSegment === 'commerce_ugc') {
          payload.productData = productForm;
        } else {
          payload.rawBrief = rawBrief;
        }
      }

      const res = await fetch('/api/hook-engine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.ok && data.session) {
        setSession(data.session);
      } else {
        alert(data.error || 'Gagal memproses sesi hook engine');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesizeMedia = async (candidate: HookCandidate) => {
    if (!session) return;
    setSynthesizingId(candidate.id);
    try {
      const res = await fetch('/api/hook-engine/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          dossier: session.dossier,
        }),
      });

      const data = await res.json();
      if (data.ok && data.candidate) {
        setSession({
          ...session,
          candidates: session.candidates.map((c) => (c.id === candidate.id ? data.candidate : c)),
        });
      } else {
        alert(data.error || 'Gagal mensintesis video via Flow MCP');
      }
    } catch (err: any) {
      alert(`Error sintesis: ${err.message}`);
    } finally {
      setSynthesizingId(null);
    }
  };

  const handleStartEdit = (candidate: HookCandidate) => {
    setEditingCandidateId(candidate.id);
    setEditText(candidate.hookText);
    setEditKeyword(candidate.topGiantKeyword);
  };

  const handleSaveAndRescore = async (candidate: HookCandidate) => {
    if (!session) return;
    try {
      const res = await fetch('/api/hook-engine/rescore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          newHookText: editText,
          newGiantKeyword: editKeyword,
          dossier: session.dossier,
        }),
      });

      const data = await res.json();
      if (data.ok && data.candidate) {
        setSession({
          ...session,
          candidates: session.candidates.map((c) => (c.id === candidate.id ? data.candidate : c)),
        });
        setEditingCandidateId(null);
      } else {
        alert(data.error || 'Gagal menghitung ulang skor hook');
      }
    } catch (err: any) {
      alert(`Error rescore: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090A] text-[#F7F8F8] font-sans antialiased selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Navigation Bar (Linear Header) */}
      <header className="border-b border-white/[0.07] bg-[#08090A]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-amber-500 to-amber-200 flex items-center justify-center text-[#08090A] font-black text-xs shadow-sm">
              ⚡
            </div>
            <span className="font-semibold text-sm tracking-tight text-[#F7F8F8]">Hook Successor Engine</span>
            <span className="text-[11px] font-mono text-[#8A8F98] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
              v3.0 • Linear Mode
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#8A8F98]">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Charon Klenik EQ
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              Neo-Noir 1080x1920
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Control Card (Linear Recessed Surface) */}
        <section className="bg-[#121316] border border-white/[0.07] rounded-2xl p-6 shadow-xl shadow-black/40 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[#F7F8F8]">Simulasi & Evaluasi 3 Opsi Hook</h1>
              <p className="text-xs text-[#8A8F98] mt-1">
                Formulasikan 3 variasi hook terkuat dengan preview video 9:16 instan, voiceover Charon, dan prinsip viral cmlabs.
              </p>
            </div>

            {/* Linear Segmented Switch */}
            <div className="bg-[#0B0C0E] border border-white/[0.07] p-1 rounded-xl flex items-center gap-1 self-start md:self-auto">
              <button
                onClick={() => setActiveTab('benchmark')}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === 'benchmark'
                    ? 'bg-white/[0.08] text-[#F7F8F8] shadow-sm shadow-black/50'
                    : 'text-[#8A8F98] hover:text-white'
                }`}
              >
                {selectedSegment === 'commerce_ugc' ? 'Preset Produk UGC' : 'Benchmark Kasus'}
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === 'url'
                    ? 'bg-white/[0.08] text-[#F7F8F8] shadow-sm shadow-black/50'
                    : 'text-[#8A8F98] hover:text-white'
                }`}
              >
                {selectedSegment === 'commerce_ugc' ? 'Link Produk / Toko' : 'Input URL Berita'}
              </button>
              <button
                onClick={() => setActiveTab('brief')}
                className={`text-xs font-medium px-3.5 py-1.5 rounded-lg transition-all ${
                  activeTab === 'brief'
                    ? 'bg-white/[0.08] text-[#F7F8F8] shadow-sm shadow-black/50'
                    : 'text-[#8A8F98] hover:text-white'
                }`}
              >
                {selectedSegment === 'commerce_ugc' ? 'Form Produk' : 'Custom Brief'}
              </button>
            </div>
          </div>

          {/* Target Content Segment Selector */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#8A8F98] uppercase tracking-wider">
                Target Format / Segmen Konten:
              </span>
              <span className="text-[11px] text-amber-400 font-mono">
                {SEGMENT_OPTIONS.find((s) => s.key === selectedSegment)?.shortBadge}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {SEGMENT_OPTIONS.map((seg) => {
                const isSelected = selectedSegment === seg.key;
                return (
                  <button
                    key={seg.key}
                    type="button"
                    onClick={() => handleSelectSegment(seg.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left border ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-200 border-amber-500/40 shadow-sm shadow-amber-500/10'
                        : 'bg-[#0E1013] text-[#8A8F98] border-white/[0.06] hover:text-white hover:border-white/[0.12]'
                    }`}
                  >
                    <span className="text-sm">{seg.icon}</span>
                    <span className="truncate">{seg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Controls */}
          {activeTab === 'brief' && selectedSegment === 'commerce_ugc' ? (
            <div className="space-y-3 bg-[#0B0C0E] border border-white/[0.06] p-4 rounded-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-1">
                  <label className="text-[11px] font-mono text-[#8A8F98] block mb-1">NAMA PRODUK</label>
                  <input
                    type="text"
                    value={productForm.productName}
                    onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
                    className="w-full bg-[#121316] border border-white/[0.08] focus:border-amber-400/50 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    placeholder="misal: Tas Obermain / Serum Retinol..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[#8A8F98] block mb-1">NICHE / KATEGORI</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                    className="w-full bg-[#121316] border border-white/[0.08] focus:border-amber-400/50 rounded-lg px-3 py-2 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="fashion_apparel">Fashion & Apparel</option>
                    <option value="beauty_skincare">Beauty & Skincare</option>
                    <option value="gadget_tech">Gadget & Tech</option>
                    <option value="fnb_culinary">Food & Beverage</option>
                    <option value="home_living">Home & Living</option>
                    <option value="general">General / Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[#8A8F98] block mb-1">VOICE PERSONA CREATOR</label>
                  <select
                    value={productForm.voicePersona || 'auto'}
                    onChange={(e) => setProductForm({ ...productForm, voicePersona: e.target.value as any })}
                    className="w-full bg-[#121316] border border-white/[0.08] focus:border-amber-400/50 rounded-lg px-3 py-2 text-xs text-amber-300 outline-none cursor-pointer"
                  >
                    <option value="auto">Auto-Detect (Cewek untuk Beauty/Tas Cewek)</option>
                    <option value="female_creator">👩 Suara Cewek (Aoede - Hangat & Natural)</option>
                    <option value="male_creator">👨 Suara Cowok (Puck - Enerjik & Santai)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[#8A8F98] block mb-1">PENAWARAN / HARGA PROMO</label>
                  <input
                    type="text"
                    value={productForm.offerPrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, offerPrice: e.target.value })}
                    className="w-full bg-[#121316] border border-white/[0.08] focus:border-amber-400/50 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    placeholder="misal: Diskon 45% + Gratis Ongkir..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-[#8A8F98] block mb-1">MASALAH UTAMA KONSUMEN (PAIN POINT)</label>
                  <input
                    type="text"
                    value={productForm.painPoint}
                    onChange={(e) => setProductForm({ ...productForm, painPoint: e.target.value })}
                    className="w-full bg-[#121316] border border-white/[0.08] focus:border-amber-400/50 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    placeholder="misal: Bekas jerawat hitam gak hilang meski udah facial jutaan..."
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-[#8A8F98] block mb-1">SOLUSI UNIK / BENEFIT (USP)</label>
                  <input
                    type="text"
                    value={productForm.uspBenefit}
                    onChange={(e) => setProductForm({ ...productForm, uspBenefit: e.target.value })}
                    className="w-full bg-[#121316] border border-white/[0.08] focus:border-amber-400/50 rounded-lg px-3 py-2 text-xs text-white outline-none"
                    placeholder="misal: Retinol encapsulated slow-release aman tanpa purging..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-[#F7F8F8] hover:bg-white text-[#08090A] font-semibold text-xs px-6 py-2.5 rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                      <span>Mensintesis 3 Hook UGC...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Formulasikan 3 Hook UGC</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-3">
              {activeTab === 'benchmark' && (
                <div className="flex-1 bg-[#0E1013] border border-white/[0.07] focus-within:border-white/[0.2] rounded-xl px-3 py-2 flex items-center transition-colors">
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="bg-transparent text-xs text-[#F7F8F8] outline-none w-full cursor-pointer"
                  >
                    {benchmarkCases.map((b) => (
                      <option key={b.caseId} value={b.caseId} className="bg-[#121316] text-[#F7F8F8]">
                        {b.title} (Benchmark HSI: {b.benchmarkHSI})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'url' && (
                <div className="flex-1 bg-[#0E1013] border border-white/[0.07] focus-within:border-white/[0.2] rounded-xl px-3.5 py-2 flex items-center transition-colors">
                  <input
                    type="url"
                    placeholder={
                      selectedSegment === 'commerce_ugc'
                        ? 'Paste Link Produk (Shopee / TikTok Shop / Tokopedia / Web)...'
                        : 'Paste URL artikel investigasi / berita (misal: kumparan.com / radar)...'
                    }
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="bg-transparent text-xs text-[#F7F8F8] placeholder:text-[#62666D] outline-none w-full"
                  />
                </div>
              )}

              {activeTab === 'brief' && (
                <div className="flex-1 bg-[#0E1013] border border-white/[0.07] focus-within:border-white/[0.2] rounded-xl px-3.5 py-2 flex items-center transition-colors">
                  <input
                    type="text"
                    placeholder="Tuliskan pokok konflik atau barang bukti kunci perkara..."
                    value={rawBrief}
                    onChange={(e) => setRawBrief(e.target.value)}
                    className="bg-transparent text-xs text-[#F7F8F8] placeholder:text-[#62666D] outline-none w-full"
                  />
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-[#F7F8F8] hover:bg-white text-[#08090A] font-semibold text-xs px-5 py-2 rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                    <span>Mensintesis 3 Opsi...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Formulasikan 3 Hook</span>
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* 3-Column Candidates Grid */}
        {session && (
          <div className="space-y-6">
            {/* Session Info Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1 text-xs text-[#8A8F98]">
              <div>
                <span className="text-slate-500 font-mono text-[11px]">DOSSIER:</span>{' '}
                <span className="text-[#F7F8F8] font-medium">{session.dossier.title}</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>3 Opsi Siap Putar</span>
                <span>•</span>
                <span className="text-amber-300">
                  {session.dossier.segment
                    ? SEGMENT_OPTIONS.find((s) => s.key === session.dossier.segment)?.label || 'Format 1080x1920 Vertikal'
                    : 'Format 1080x1920 Vertikal'}
                </span>
              </div>
            </div>

            {/* The 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {session.candidates.slice(0, 3).map((c) => {
                const isWinner = c.id === (promotedWinner?.id || session.recommendedWinnerId);
                const isSynthesizing = synthesizingId === c.id;
                const isEditing = editingCandidateId === c.id;

                return (
                  <div
                    key={c.id}
                    className={`bg-[#121316] hover:bg-[#14161A] transition-all duration-200 border rounded-2xl p-5 flex flex-col justify-between shadow-xl shadow-black/40 relative overflow-hidden ${
                      isWinner
                        ? 'border-amber-500/40 bg-gradient-to-b from-[#181A20] via-[#121316] to-[#121316]'
                        : 'border-white/[0.07] hover:border-white/[0.14]'
                    }`}
                  >
                    {/* Header Row */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold tracking-wider text-[#8A8F98] uppercase flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isWinner ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                            {c.id}
                          </span>
                          {isWinner && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold tracking-wide">
                              ★ Top Performer
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-white">
                            HSI {c.hookSuccessIndex}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 block mt-1">
                            Retensi 3s: {c.predictedRetention3s}%
                          </span>
                        </div>
                      </div>

                      <h3 className="font-semibold text-sm text-[#F7F8F8] mt-2 line-clamp-1">{c.archetypeName}</h3>
                    </div>

                    {/* Hero Phone Simulator Frame (Linear Hardware Bezel) */}
                    <div className="w-full max-w-[250px] mx-auto aspect-[9/16] bg-[#0A0B0D] border border-white/[0.12] rounded-[22px] p-2 relative shadow-2xl shadow-black/80 my-4 overflow-hidden">
                      {/* Top Sensor Notch */}
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-2.5 bg-white/10 rounded-full z-30 pointer-events-none"></div>

                      <div className="relative w-full h-full rounded-[16px] overflow-hidden bg-black flex items-center justify-center">
                        {c.media?.videoSnippetUrl ? (
                          <video
                            src={c.media.videoSnippetUrl}
                            controls
                            playsInline
                            loop
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#121316] to-[#0A0B0D]">
                            <span className="text-2xl mb-1">🎬</span>
                            <span className="text-[11px] font-semibold text-white uppercase tracking-wider">Video Cuplikan 5s</span>
                            <p className="text-[10px] text-[#8A8F98] mt-1 max-w-[150px]">
                              {session?.dossier.segment === 'commerce_ugc'
                                ? 'Native TikTok 9:16 + Creator Voice'
                                : 'Neo-Noir Graphic Novel + Charon Klenik EQ'}
                            </p>
                            <button
                              onClick={() => handleSynthesizeMedia(c)}
                              disabled={isSynthesizing}
                              className="mt-3 px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-[11px] active:scale-[0.98] transition-all"
                            >
                              {isSynthesizing ? 'Menghasilkan...' : '🎙️ Sintesis Video'}
                            </button>
                          </div>
                        )}

                        {/* Minimalist Overlay Badges */}
                        <div className="absolute right-2 bottom-8 flex flex-col items-center gap-2.5 z-20 pointer-events-none opacity-80 text-white">
                          <div className="text-center">
                            <span className="text-xs">❤️</span>
                            <span className="text-[8px] font-mono block">128K</span>
                          </div>
                          <div className="text-center">
                            <span className="text-xs">💬</span>
                            <span className="text-[8px] font-mono block">1.4K</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Giant Keyword & Naskah */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold tracking-widest text-[#FCD34D] uppercase block">
                          ⚡ {c.topGiantKeyword}
                        </span>
                        {isEditing ? (
                          <div className="space-y-2 mt-2">
                            <input
                              type="text"
                              value={editKeyword}
                              onChange={(e) => setEditKeyword(e.target.value)}
                              className="w-full text-xs font-mono bg-[#0E1013] border border-white/10 rounded-lg p-2 text-white"
                            />
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={3}
                              className="w-full text-xs bg-[#0E1013] border border-white/10 rounded-lg p-2 text-white"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveAndRescore(c)}
                                className="px-3 py-1 rounded-md bg-emerald-500 text-black text-xs font-bold"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => setEditingCandidateId(null)}
                                className="px-3 py-1 rounded-md bg-white/10 text-white text-xs"
                              >
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs leading-relaxed text-[#D0D6E0] italic font-serif bg-black/40 p-3 rounded-xl border border-white/[0.04] mt-1.5">
                            &ldquo;{c.hookText}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Ringkasan Penjelasan Padat (Linear Note Style) */}
                      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 space-y-1.5 text-xs">
                        <div className="flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">🎯</span>
                          <span className="text-[#8A8F98] leading-tight">
                            <strong className="text-white/90 font-medium">Psikologis:</strong> {c.psychologicalReason}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-emerald-400 mt-0.5">🚀</span>
                          <span className="text-[#8A8F98] leading-tight">
                            <strong className="text-white/90 font-medium">Algoritma:</strong> {c.algorithmicReason}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/[0.06]">
                        <button
                          onClick={() => handleSynthesizeMedia(c)}
                          disabled={isSynthesizing}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-[#8A8F98] hover:text-white border border-white/[0.06] text-[11px] font-medium transition-all active:scale-[0.98]"
                        >
                          {isSynthesizing ? 'Rendering...' : '🎙️ Re-render'}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEdit(c)}
                            className="text-[11px] text-[#8A8F98] hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setPromotedWinner(c)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-[0.98] ${
                              isWinner
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                : 'bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/[0.08]'
                            }`}
                          >
                            {isWinner ? '★ Pemenang' : 'Pilih'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
