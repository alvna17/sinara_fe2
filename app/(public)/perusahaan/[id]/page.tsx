"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Division {
  id: number;
  name: string;
  description: string;
  total_mahasiswa: number;
  avg_rating: number;
  total_testimoni: number;
  highlight_quote: string;
}

interface CompanyDetail {
  id: number;
  name: string;
  full_name: string;
  logo_url: string | null;
  industri: string;
  kota: string;
  total_mahasiswa: number;
  avg_rating: number;
  total_review: number;
  total_divisi: number;
  divisions: Division[];
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "w-5 h-5" : "w-4 h-4";
  // Persentase pengisian total (0-100), dipakai buat clip overlay bintang kuning
  // di atas bintang abu-abu -- ini yang bikin bintang ke-5 misalnya cuma
  // "keisi separuh" kalau rating 4.5, bukan langsung dibulatin jadi penuh.
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
 
  const StarPath = () => (
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  );
 
  return (
    <div className="flex items-center gap-1">
      <div className="relative inline-flex">
        {/* Layer bawah: 5 bintang abu-abu, selalu penuh sebagai "wadah" */}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className={`${cls} text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
              <StarPath />
            </svg>
          ))}
        </div>
        {/* Layer atas: 5 bintang kuning, di-clip lebar sesuai persentase rating */}
        <div className="absolute inset-0 flex gap-0.5 overflow-hidden" style={{ width: `${pct}%` }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className={`${cls} text-yellow-400 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
              <StarPath />
            </svg>
          ))}
        </div>
      </div>
      <span className={`ml-1 font-semibold ${size === "md" ? "text-base" : "text-sm"} text-gray-700`}>
        {rating.toFixed(1)}/5
      </span>
    </div>
  );
}

function CompanyLogo({ company }: { company: CompanyDetail }) {
  if (company.logo_url) {
    return <img src={company.logo_url} alt={company.name} className="w-20 h-20 rounded-2xl object-contain bg-gray-50 border border-gray-100 flex-shrink-0" />;
  }
  return (
    <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-lg flex items-center justify-center flex-shrink-0">
      {company.name.slice(0, 5)}
    </div>
  );
}

function DivisionCard({ div, companyId }: { div: Division; companyId: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <h3 className="font-bold text-gray-900 text-sm leading-tight">{div.name}</h3>
        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full flex-shrink-0 ml-2">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {div.total_testimoni} testimoni
        </span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">{div.description}</p>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {div.total_mahasiswa} mahasiswa
        </span>
        <StarRating rating={div.avg_rating} />
      </div>

      {div.highlight_quote && (
        <blockquote className="bg-indigo-50 rounded-xl px-4 py-3 text-xs text-gray-700 leading-relaxed italic">
          "{div.highlight_quote}"
        </blockquote>
      )}

      <Link href={`/perusahaan/${companyId}/divisi/${div.id}`}>
        <button className="w-full mt-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2.5 rounded-xl transition">
          Lihat review divisi
        </button>
      </Link>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-white rounded-2xl p-6 flex gap-5">
        <div className="w-20 h-20 bg-gray-100 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-100 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-48" />)}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DetailPerusahaanPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // ── Wishlist perusahaan ──
  const [saved, setSaved]                     = useState(false);
  const [isTogglingSaved, setIsTogglingSaved] = useState(false);
  const [savedError, setSavedError]           = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/companies/${companyId}`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((json) => setCompany(json.data ?? json))
      .catch(() => setError("Gagal memuat data perusahaan."))
      .finally(() => setLoading(false));
  }, [companyId]);

  // Cek status wishlist perusahaan ini (biar tombolnya langsung akurat)
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !companyId) return;

    fetch(`${API_BASE}/wishlist/check/company/${companyId}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setSaved(Boolean(json?.data?.saved)))
      .catch(() => {
        // gagal cek status wishlist bukan error fatal, biarin default false
      });
  }, [companyId]);

  // Toggle simpan/hapus wishlist perusahaan — POST buat nyimpen, DELETE buat ngapus
  const handleToggleSaved = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setIsTogglingSaved(true);
    setSavedError(null);

    try {
      if (saved) {
        const res = await fetch(`${API_BASE}/wishlist/company/${companyId}`, {
          method: "DELETE",
          headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message ?? `Gagal menghapus dari wishlist (status ${res.status}).`);
        }

        setSaved(false);
      } else {
        const res = await fetch(`${API_BASE}/wishlist`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ company_id: Number(companyId) }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message ?? `Gagal menyimpan ke wishlist (status ${res.status}).`);
        }

        setSaved(true);
      }
    } catch (err) {
      console.error(err);
      setSavedError(err instanceof Error ? err.message : "Gagal memproses wishlist.");
    } finally {
      setIsTogglingSaved(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F0F2FA] p-8"><SkeletonDetail /></div>;
  if (error)   return <div className="min-h-screen bg-[#F0F2FA] flex items-center justify-center"><p className="text-red-500 text-sm">{error}</p></div>;
  if (!company) return null;

  const displayed = showAll ? company.divisions : company.divisions.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F0F2FA]">
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-8">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-indigo-600 transition">Beranda</Link>
          <span>/</span>
          <Link href="/perusahaan" className="hover:text-indigo-600 transition">Perusahaan</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{company.full_name}</span>
        </nav>

        {/* ── Header Card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex gap-5 items-start">
              <CompanyLogo company={company} />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{company.full_name}</h1>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed max-w-lg">
                  Halaman ini menampilkan ringkasan review mahasiswa yang pernah magang serta daftar divisi yang
                  sudah pernah menerima mahasiswa magang.
                </p>
                <div className="flex items-center gap-4 mt-2 flex-wrap text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                    {company.kota}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {company.total_mahasiswa} mahasiswa
                  </span>
                  <StarRating rating={company.avg_rating} size="md" />
                </div>

                <button
                  onClick={handleToggleSaved}
                  disabled={isTogglingSaved}
                  className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 ${saved ? "fill-indigo-600 text-indigo-600" : "fill-none"}`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  {isTogglingSaved ? "Memproses..." : saved ? "Tersimpan" : "Simpan"}
                </button>
                {savedError && (
                  <p className="text-xs text-red-500 mt-1">{savedError}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:w-44 flex-shrink-0">
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Total review</p>
                <p className="text-3xl font-bold text-gray-900">{company.total_review}</p>
              </div>
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Divisi magang</p>
                <p className="text-3xl font-bold text-gray-900">{company.total_divisi}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Divisions ── */}
        <h2 className="text-lg font-bold text-gray-900 mb-1">Divisi yang pernah membuka magang</h2>
        <p className="text-sm text-gray-500 mb-5">
          Di bawah ini ditampilkan divisi yang sudah pernah diisi mahasiswa magang beserta ringkasan pengalaman dari masing-masing divisi.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((div) => <DivisionCard key={div.id} div={div} companyId={company.id} />)}
        </div>

        {company.divisions.length > 4 && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setShowAll(!showAll)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-8 py-3 rounded-full transition"
            >
              {showAll ? "Sembunyikan" : "Lihat lainnya"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}