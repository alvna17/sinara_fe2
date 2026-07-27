"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Bookmark,
  ArrowLeft,
} from "lucide-react";
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;
interface ReviewItem {
  id: number;
  user_name: string;
  rating: number;
  komentar: string | null;
  duration: string | null;
  period: string;
}
interface DetailData {
  id: number;
  division_id: number;
  company_id: number;
  session_id: number;
  division_name: string;
  company_name: string;
  location: string;
  similarity_score: number;
  suitability_avg: number;
  experience_summary: string | null;
  matched_skills: string[];
  missing_skills: string[];
  total_skills: number;
  area_project: string[];
  reviews: ReviewItem[];
  duration: string | null;
}
function pct(score: number) {
  return `${Math.round(score * 100)}`;
}
function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
        />
      ))}
    </div>
  );
}
export default function DetailRekomendasiPage() {
  const router = useRouter();
  const params = useParams();
  const sessionKey = params?.sessionId as string;
  const rekId = params?.rekId as string;
  const [data, setData] = useState<DetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedWishlist, setSavedWishlist] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  useEffect(() => {
    if (!rekId) return;
    const fetch_ = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/recommendations/${rekId}`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.message ?? `Error ${res.status}`);
        }
        const json = await res.json();
        setData(json.data);

        // Cek status wishlist divisi ini (biar tombolnya langsung akurat, bukan selalu reset)
        if (json.data?.division_id && token) {
          try {
            const checkRes = await fetch(
              `${API_BASE}/wishlist/check/division/${json.data.division_id}`,
              {
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${token}`,
                },
              },
            );
            if (checkRes.ok) {
              const checkJson = await checkRes.json();
              setSavedWishlist(Boolean(checkJson?.data?.saved));
            }
          } catch {
            // gagal cek status wishlist bukan error fatal, biarin default false
          }
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Gagal memuat detail rekomendasi.",
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetch_();
  }, [rekId]);

  // Toggle simpan/hapus wishlist — POST buat nyimpen, DELETE buat ngapus
  const handleToggleWishlist = async () => {
    if (!data) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setIsTogglingWishlist(true);
    setWishlistError(null);
    try {
      if (savedWishlist) {
        const res = await fetch(`${API_BASE}/wishlist/division/${data.division_id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            err?.message ??
              `Gagal menghapus dari wishlist (status ${res.status}).`,
          );
        }
        setSavedWishlist(false);
      } else {
        const res = await fetch(`${API_BASE}/wishlist`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ division_id: data.division_id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(
            err?.message ??
              `Gagal menyimpan ke wishlist (status ${res.status}).`,
          );
        }
        setSavedWishlist(true);
      }
    } catch (err) {
      console.error(err);
      setWishlistError(
        err instanceof Error ? err.message : "Gagal memproses wishlist.",
      );
    } finally {
      setIsTogglingWishlist(false);
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#EEF2FF]">
        <div className="max-w-5xl mx-auto py-6 animate-pulse space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-1/4 mb-6" />
            <div className="h-24 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#EEF2FF]">
        <div className="max-w-5xl mx-auto py-6">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <p className="text-sm font-semibold text-red-700 mb-2">
              Gagal memuat data
            </p>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-300 rounded-xl hover:bg-red-100 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }
  const score = Math.round(data.similarity_score * 100);
  return (
    <div className="min-h-screen bg-[#EEF2FF]">
      <div className="max-w-5xl mx-auto py-6">
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* ── MAIN COLUMN ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Hero card */}
            <div className="bg-white rounded-2xl shadow-sm p-7">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {data.division_name}
                  </h1>
                  <p className="text-gray-500 text-sm mb-3">
                    {data.company_name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.location && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
                        <MapPin className="w-3.5 h-3.5" />
                        {data.location}
                      </span>
                    )}
                    {data.duration && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        {data.duration}
                      </span>
                    )}
                  </div>
                </div>
                {/* Score box */}
                <div className="shrink-0 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center min-w-[130px]">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    Tingkat Kecocokan
                  </p>
                  <p className="text-4xl font-extrabold text-gray-900">
                    {score}
                    <span className="text-2xl">%</span>
                  </p>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Kenapa cocok */}
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <h2 className="font-bold text-gray-900 mb-1">
                Kenapa divisi ini cocok untukmu?
              </h2>
              <p className="text-sm text-indigo-600 font-medium mb-3">
                {data.matched_skills.length} dari {data.total_skills} skill
                utama divisi ini sesuai profilmu.
              </p>
              <div className="flex flex-wrap gap-2">
                {data.matched_skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-teal-200 text-teal-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {s}
                  </span>
                ))}
                {data.missing_skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-amber-200 text-amber-700"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {s}
                  </span>
                ))}
              </div>
            </div>
            {/* Ringkasan pengalaman */}
            {data.experience_summary && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-3">
                  Ringkasan pengalaman magang disini
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {data.experience_summary}
                </p>
                <p className="text-xs text-gray-400 mt-4 italic">
                  Data bersumber dari mahasiswa yang selesai magang dan sudah
                  diverifikasi.
                </p>
              </div>
            )}
            {/* Area project */}
            {data.area_project.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-3">
                  Area Project yang Mungkin Dikerjakan
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.area_project.map((p) => (
                    <span
                      key={p}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {/* Review alumni */}
            {data.reviews.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-4">
                  Review Magang dari Mahasiswa
                </h2>
                <div className="flex flex-col gap-4">
                  {data.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border border-gray-100 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold shrink-0">
                            {review.user_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {review.user_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              Magang: {review.period}
                              {review.duration ? ` • ${review.duration}` : ""}
                            </p>
                          </div>
                        </div>
                        <StarRow rating={review.rating} />
                      </div>
                      {review.komentar && (
                        <p className="text-sm text-gray-600 leading-relaxed mt-1">
                          "{review.komentar}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
          <div className="lg:w-72 shrink-0 flex flex-col gap-4">
            {/* Simpan wishlist */}
            <button
              onClick={handleToggleWishlist}
              disabled={isTogglingWishlist}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
                savedWishlist
                  ? "bg-amber-100 text-amber-700 border border-amber-200"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
              }`}
            >
              <Bookmark
                className={`w-4 h-4 ${savedWishlist ? "fill-amber-500" : ""}`}
              />
              {isTogglingWishlist
                ? "Memproses..."
                : savedWishlist
                  ? "Tersimpan di Wishlist"
                  : "Simpan ke Wishlist"}
            </button>
            {wishlistError && (
              <p className="text-xs text-red-600 font-medium text-center -mt-2">
                {wishlistError}
              </p>
            )}
            {/* Kembali */}
            <button
              onClick={() => router.push(`/riwayat_rekomendasi/${sessionKey}`)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke rekomendasi
            </button>
            {/* Catatan */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold">Perhatian:</span> Sinara tidak
                memproses lamaran. Gunakan info ini untuk mendaftar langsung ke
                perusahaan terkait.
              </p>
            </div>
            {/* Skill gap */}
            {data.missing_skills.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Skill yang perlu ditingkatkan
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {data.missing_skills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Tingkatkan skill ini untuk meningkatkan kecocokanmu dengan
                  divisi serupa di masa depan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}