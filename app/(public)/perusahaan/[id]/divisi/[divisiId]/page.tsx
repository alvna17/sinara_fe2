"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Feedback {
  id: number;
  user_name: string;
  user_role: string;
  angkatan: number;
  durasi: string;
  rating: number;
  komentar: string;
  skills_dibutuhkan: string[];
}

interface DivisionDetail {
  id: number;
  name: string;
  company_id: number;
  company_name: string;
  total_review: number;
  avg_rating: number;
  top_skill: string;
  top_skill_detail: string;
  feedbacks: Feedback[];
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

function FeedbackCard({ fb }: { fb: Feedback }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col md:flex-row">
      {/* Left: Skill */}
      <div className="md:w-52 flex-shrink-0 bg-indigo-50 p-5">
        <p className="text-xs font-semibold text-indigo-700 mb-3">Skill yang dibutuhkan</p>
        <div className="flex flex-col gap-2">
          {fb.skills_dibutuhkan.map((skill) => (
            <span key={skill} className="text-xs text-gray-700 bg-white border border-gray-200 rounded-full px-3 py-1 w-fit">
              {skill}
            </span>
          ))}
        </div>
      </div>
      {/* Right: Review */}
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
              {fb.user_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{fb.user_name}</p>
              <p className="text-xs text-gray-400">{fb.user_role} · {fb.angkatan}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-indigo-600 font-medium text-xs">Durasi {fb.durasi}</span>
            <StarRating rating={fb.rating} />
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{fb.komentar}</p>
      </div>
    </div>
  );
}

function SkeletonDivision() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-white rounded-2xl p-6 space-y-3">
        <div className="h-6 bg-gray-100 rounded w-1/3" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="grid grid-cols-3 gap-4 pt-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
      {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-40" />)}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DetailDivisiPage() {
  const params    = useParams();
  const companyId = params.id as string;
  const divisiId  = params.divisiId as string;

  const [division, setDivision] = useState<DivisionDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showAll, setShowAll]   = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/companies/${companyId}/divisions/${divisiId}`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((json) => setDivision(json.data ?? json))
      .catch(() => setError("Gagal memuat data divisi."))
      .finally(() => setLoading(false));
  }, [companyId, divisiId]);

  if (loading) return <div className="min-h-screen bg-[#F0F2FA] p-8"><SkeletonDivision /></div>;
  if (error)   return <div className="min-h-screen bg-[#F0F2FA] flex items-center justify-center"><p className="text-red-500 text-sm">{error}</p></div>;
  if (!division) return null;

  const displayed = showAll ? division.feedbacks : division.feedbacks.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F0F2FA]">
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-8">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-indigo-600 transition">Beranda</Link>
          <span>/</span>
          <Link href="/perusahaan" className="hover:text-indigo-600 transition">Perusahaan</Link>
          <span>/</span>
          <Link href={`/perusahaan/${division.company_id}`} className="hover:text-indigo-600 transition">
            {division.company_name}
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{division.name}</span>
        </nav>

        {/* ── Header ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{division.name}</h1>
              <p className="text-sm text-gray-500 max-w-xl">
                Ringkasan ini menampilkan gambaran umum kualitas review pada divisi {division.name}, mulai dari total
                ulasan mahasiswa hingga rata-rata penilaian divisi.
              </p>
            </div>
            <button onClick={() => setSaved(!saved)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition flex-shrink-0">
              <svg className={`w-4 h-4 ${saved ? "fill-white" : "fill-none"}`} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Simpan ke wishlist
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">Jumlah review</p>
              <p className="text-3xl font-bold text-gray-900">{division.total_review}</p>
              <p className="text-xs text-gray-400 mt-0.5">Review dari mahasiswa yang sudah magang</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Rating divisi</p>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={division.avg_rating} />
                <span className="text-2xl font-bold text-gray-900">{division.avg_rating.toFixed(1)}/5</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Penilaian rata-rata berdasarkan pengalaman magang</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Skill yang paling sering muncul</p>
              <p className="text-2xl font-bold text-gray-900">{division.top_skill}</p>
              <p className="text-xs text-gray-400 mt-0.5">{division.top_skill_detail}</p>
            </div>
          </div>
        </div>

        {/* ── Feedback List ── */}
        <h2 className="text-lg font-bold text-gray-900 mb-1">List review pengalaman</h2>
        <p className="text-sm text-gray-500 mb-5">
          Setiap kotak menampilkan skill yang dibutuhkan di sisi kiri dan pengalaman mahasiswa di sisi kanan agar
          lebih mudah membandingkan isi review tiap alumni.
        </p>

        <div className="flex flex-col gap-4">
          {displayed.map((fb) => <FeedbackCard key={fb.id} fb={fb} />)}
        </div>

        {division.feedbacks.length > 3 && (
          <div className="flex justify-center mt-6">
            <button onClick={() => setShowAll(!showAll)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-8 py-3 rounded-full transition">
              {showAll ? "Sembunyikan" : "Lihat lainnya"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}