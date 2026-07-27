"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Pagination from "@/components/ui/pagination";
import { FilterDivisi, FilterLokasi, FilterDurasi, FilterRating } from "@/components/filter";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Division {
  id: number;
  name: string;
}
interface Company {
  id: number;
  name: string;
  full_name: string;
  logo_url: string | null;
  industri: string;
  kota: string;
  total_mahasiswa: number;
  avg_rating: number;
  divisions: Division[];
}
interface ApiMeta {
  current_page: number;
  last_page: number;
  total: number;
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function CompanyLogo({ company, size = "md" }: { company: Company; size?: "md" | "lg" }) {
  const dim = size === "lg" ? "w-20 h-20 text-base" : "w-14 h-14 text-sm";
  if (company.logo_url) {
    return <img src={company.logo_url} alt={company.name} className={`${dim} rounded-xl object-contain bg-gray-50 border border-gray-100 flex-shrink-0`} />;
  }
  return (
    <div className={`${dim} rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center flex-shrink-0`}>
      {company.name.slice(0, 5)}
    </div>
  );
}
function GridCard({ company }: { company: Company }) {
  return (
    <Link href={`/perusahaan/${company.id}`}>
      <div className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-3 h-full cursor-pointer">
        <div className="flex items-start justify-between">
          <CompanyLogo company={company} />
          <StarRating rating={company.avg_rating} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm leading-tight">{company.full_name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{company.industri}</p>
        </div>
        <div className="flex flex-col gap-1 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            {company.kota}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {company.total_mahasiswa} mahasiswa telah magang
          </span>
        </div>
        <div className="mt-auto pt-3 border-t border-gray-100">
          <span className="text-xs font-semibold text-indigo-600 w-full text-center block py-1.5 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition">
            Lihat detail
          </span>
        </div>
      </div>
    </Link>
  );
}
function ListCard({ company }: { company: Company }) {
  return (
    <Link href={`/perusahaan/${company.id}`}>
      <div className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all duration-200 p-5 flex items-center gap-5 cursor-pointer">
        <CompanyLogo company={company} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm">{company.full_name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{company.industri}</p>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              {company.kota}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {company.total_mahasiswa} mahasiswa telah magang
            </span>
            <StarRating rating={company.avg_rating} />
          </div>
        </div>
        <span className="text-sm font-semibold text-indigo-600 hover:underline flex-shrink-0">Lihat lebih</span>
      </div>
    </Link>
  );
}
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-48 animate-pulse">
          <div className="flex gap-3 mb-3">
            <div className="w-14 h-14 bg-gray-100 rounded-xl" />
            <div className="flex-1"><div className="h-3 bg-gray-100 rounded mb-2 w-3/4" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
          </div>
          <div className="h-3 bg-gray-100 rounded mb-2 w-full" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function PerusahaanPage() {
  const [search, setSearch] = useState("");
  // ✅ Sekarang value filter LANGSUNG berupa value backend ("" = semua),
  // bukan label tampilan lagi. Mapping label -> value hidup di masing-masing
  // component filter (components/filter/*), jadi gak ada lagi celah lupa mapping.
  const [divisi, setDivisi] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [durasi, setDurasi] = useState("");
  const [rating, setRating] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [meta, setMeta] = useState<ApiMeta>({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [search, divisi, lokasi, durasi, rating]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const perPage = 30;
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (search) params.set("search", search);
    if (lokasi) params.set("kota", lokasi);
    if (divisi) params.set("divisi", divisi);
    if (durasi) params.set("durasi", durasi);
    if (rating) params.set("min_rating", rating);

    fetch(`${API_BASE}/companies?${params}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((json) => {
        const list = json.data ?? [];
        if (json.meta || json.current_page || json.last_page || json.total) {
          setCompanies(list);
          setMeta({
            current_page: json.meta?.current_page ?? json.current_page ?? page,
            last_page: json.meta?.last_page ?? json.last_page ?? 1,
            total: json.meta?.total ?? json.total ?? list.length,
          });
          return;
        }
        const total = list.length;
        const last_page = Math.max(1, Math.ceil(total / perPage));
        const start = (page - 1) * perPage;
        const paged = list.slice(start, start + perPage);
        setCompanies(paged);
        setMeta({ current_page: page, last_page, total });
      })
      .catch((err) => { if (err.name !== "AbortError") setError("Gagal memuat data. Coba lagi."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [search, divisi, lokasi, durasi, rating, page]);

  return (
    <div className="min-h-screen bg-[#F0F2FA]">
      <div className="bg-[#E8EAF6] px-6 md:px-12 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-indigo-700 mb-2">Perusahaan</h1>
          <p className="text-gray-500 text-sm max-w-lg leading-relaxed">
            Temukan perusahaan yang dapat menjadi tujuan magang. Halaman ini menampilkan informasi
            alamat, rating, jumlah mahasiswa yang pernah magang, dan lihat detail perusahaan yang menarik untukmu.
          </p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-8">
        {/* Filter box */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="relative mb-3">
            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Cari perusahaan..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 text-sm text-gray-800 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-400" />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-700 transition">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FilterDivisi value={divisi} onChange={setDivisi} />
            <FilterLokasi value={lokasi} onChange={setLokasi} />
            <FilterDurasi value={durasi} onChange={setDurasi} />
            <FilterRating value={rating} onChange={setRating} />
          </div>
        </div>
        {/* Toggle & count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{loading ? "Memuat..." : `${meta.total} perusahaan ditemukan`}</p>
          <div className="flex gap-2">
            <button onClick={() => setViewMode("list")} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${viewMode === "list" ? "bg-indigo-600 text-white" : "bg-white text-gray-400 border border-gray-200"}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <button onClick={() => setViewMode("grid")} className={`w-9 h-9 rounded-full flex items-center justify-center transition ${viewMode === "grid" ? "bg-indigo-600 text-white" : "bg-white text-gray-400 border border-gray-200"}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" /></svg>
            </button>
          </div>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        {loading ? <SkeletonGrid /> : companies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">Perusahaan tidak ditemukan.</p>
            <button onClick={() => { setSearch(""); setDivisi(""); setLokasi(""); setDurasi(""); setRating(""); }}
              className="mt-3 text-indigo-600 text-sm hover:underline">Reset filter</button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => <GridCard key={c.id} company={c} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {companies.map((c) => <ListCard key={c.id} company={c} />)}
          </div>
        )}
        {!loading && companies.length > 0 && (
          <div className="mt-8">
            <Pagination currentPage={meta.current_page} totalPages={meta.last_page} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}