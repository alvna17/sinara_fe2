"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Calendar, ChevronRight, Search, Star, MapPin, Users, X } from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

interface Session {
  session_key: string;
  label: string;
  passion_division: string;
  created_at: string;
  total_divisi: number;
  sangat_cocok: number;
  top_division: string | null;
}

interface WishlistItem {
  id: number;
  type: "division" | "company";
  division_id: number | null;
  division_name: string | null;
  company_id: number;
  company_name: string;
  industri: string;
  location: string;
  rating: number;
  total_mahasiswa: number;
  saved_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) +
    " • " +
    d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) +
    " WIB"
  );
}

function SessionCard({ session, onClick }: { session: Session; onClick: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-indigo-100 transition-all duration-200">
      <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
        <Bot className="w-6 h-6 text-indigo-500" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 truncate">{session.label}</h3>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(session.created_at)}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {session.sangat_cocok > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              {session.sangat_cocok} Divisi Sangat Cocok
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
            {session.total_divisi} Total Divisi Ditemukan
          </span>
        </div>
      </div>

      <button
        onClick={onClick}
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors"
      >
        Lihat Detail Rekomendasi
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function WishlistCard({ item, onRemove }: { item: WishlistItem; onRemove: () => void }) {
  const isDivision = item.type === "division";
  const title = isDivision ? item.division_name : item.company_name;
  const subtitle = isDivision ? item.company_name : item.industri;
  const href = isDivision
    ? `/perusahaan/${item.company_id}/divisi/${item.division_id}`
    : `/perusahaan/${item.company_id}`;

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-200">
      <button
        onClick={onRemove}
        title="Hapus dari wishlist"
        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center justify-between mb-4 pr-8">
        <span className="text-xs font-bold text-gray-900 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
          {isDivision ? "Divisi" : "Perusahaan"}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          {item.rating.toFixed(1)}
        </span>
      </div>

      <h3 className="font-bold text-gray-900 text-base mb-0.5 truncate">{title}</h3>
      <p className="text-xs text-gray-400 mb-3 truncate">{subtitle}</p>

      <div className="flex flex-col gap-1.5 mb-4">
        {item.location && (
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            {item.location}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {item.total_mahasiswa} mahasiswa telah magang
        </span>
      </div>

      <Link href={href}>
        <button className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
          Lihat detail
        </button>
      </Link>
    </div>
  );
}

function EmptyState({
  onCari,
  title = "Belum ada riwayat rekomendasi yang kamu lakukan.",
  description = 'Coba lakukan "Cari Rekomendasi" terlebih dahulu.',
  buttonLabel = "Cari Rekomendasi",
}: {
  onCari: () => void;
  title?: string;
  description?: string;
  buttonLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
        <Bot className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">{description}</p>
      <button
        onClick={onCari}
        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-200"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export default function RiwayatRekomendasiPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"riwayat" | "wishlist">("riwayat");
  const [wishlistFilter, setWishlistFilter] = useState<"semua" | "perusahaan" | "divisi">("semua");

  const fetchWishlist = async () => {
    setIsLoadingWishlist(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_BASE}/wishlist`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Gagal memuat wishlist.");
      const json = await res.json();
      setWishlist(json.data ?? []);
    } catch {
      setWishlist([]);
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  const handleRemoveWishlist = async (item: WishlistItem) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const endpoint =
      item.type === "division"
        ? `${API_BASE}/wishlist/division/${item.division_id}`
        : `${API_BASE}/wishlist/company/${item.company_id}`;

    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (!res.ok) throw new Error("Gagal menghapus dari wishlist.");

      setWishlist((prev) => prev.filter((w) => w.id !== item.id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/recommendations/sessions`, {
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
        setSessions(json.data ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal memuat riwayat.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const filteredWishlist = wishlist.filter((item) => {
    if (wishlistFilter === "semua") return true;
    if (wishlistFilter === "perusahaan") return item.type === "company";
    return item.type === "division";
  });

  return (
    <div className="min-h-screen bg-[#EEF2FF]">
      <div className="max-w-5xl mx-auto space-y-5 py-6">
        {/* Tab switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("riwayat")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "riwayat"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Riwayat
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === "riwayat" ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {sessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("wishlist")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "wishlist"
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Wishlist
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === "wishlist" ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {wishlist.length}
            </span>
          </button>
        </div>

        {activeTab === "riwayat" && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Riwayat Hasil Rekomendasi</h1>
              <p className="text-sm text-gray-500 mt-1">
                Daftar hasil rekomendasi divisi magang yang pernah di-generate oleh AI untuk profilmu.
              </p>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-100 rounded-full w-32" />
                        <div className="h-6 bg-gray-100 rounded-full w-40" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <EmptyState
                onCari={() => router.push("/cari_rekomendasi")}
                title="Belum ada riwayat rekomendasi yang kamu lakukan."
                description='Coba lakukan "Cari Rekomendasi" terlebih dahulu.'
                buttonLabel="Cari Rekomendasi"
              />
            ) : sessions.length === 0 ? (
              <EmptyState onCari={() => router.push("/cari_rekomendasi")} />
            ) : (
              <div className="flex flex-col gap-4">
                {sessions.map((session) => (
                  <SessionCard
                    key={session.session_key}
                    session={session}
                    onClick={() => router.push(`/riwayat_rekomendasi/${session.session_key}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "wishlist" && (
          <>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wishlist Tersimpan</h1>
              <p className="text-sm text-gray-500 mt-1">
                Daftar perusahaan dan divisi magang favoritmu
              </p>
            </div>

            {/* Filter */}
            <div className="inline-flex bg-gray-100 rounded-2xl p-1 gap-1">
              {[
                { key: "semua", label: "Semua Data" },
                { key: "perusahaan", label: "Perusahaan" },
                { key: "divisi", label: "Divisi" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setWishlistFilter(f.key as typeof wishlistFilter)}
                  className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    wishlistFilter === f.key
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {isLoadingWishlist ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                    <div className="h-5 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
                    <div className="h-9 bg-gray-100 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredWishlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">Wishlist Kosong</h3>
                <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                  Belum ada perusahaan atau divisi yang kamu simpan. Klik tombol &quot;Simpan&quot; di halaman
                  perusahaan atau divisi untuk menyimpannya di sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWishlist.map((item) => (
                  <WishlistCard key={item.id} item={item} onRemove={() => handleRemoveWishlist(item)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}