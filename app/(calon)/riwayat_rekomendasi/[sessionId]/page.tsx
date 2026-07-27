"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Building2, MapPin, CheckCircle2, AlertCircle, Clock } from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

interface RekItem {
  id?: number;
  session_key: string;
  rank: number;
  division_name: string;
  company_name: string;
  company_session_key: string;
  location: string;
  similarity_score: number;
  suitability_avg: number;
  matched_skills: string[];
  missing_skills: string[];
  duration: string | null;
}

interface Session {
  session_key: string;
  label: string;
  created_at: string;
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

function pct(score: number) {
  return `${Math.round(score * 100)}%`;
}

function scoreColor(score: number) {
  if (score >= 0.75) return "text-indigo-600";
  if (score >= 0.5) return "text-teal-600";
  if (score >= 0.3) return "text-amber-600";
  return "text-gray-500";
}

function barColor(score: number) {
  if (score >= 0.75) return "from-indigo-500 to-indigo-400";
  if (score >= 0.5) return "from-teal-500 to-teal-400";
  if (score >= 0.3) return "from-amber-400 to-amber-300";
  return "from-gray-300 to-gray-200";
}

function RekCard({ item, onDetail }: { item: RekItem; onDetail: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-indigo-100 transition-all duration-200">
      {/* Header row */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
          #{item.rank}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base leading-tight">{item.division_name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{item.company_name}</span>
            {item.location && (
              <>
                <span className="text-gray-300">•</span>
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.location}</span>
              </>
            )}
            {item.duration && (
              <>
                <span className="text-gray-300">•</span>
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.duration}</span>
              </>
            )}
          </div>
        </div>
        {/* Score */}
        <span className={`text-2xl font-extrabold shrink-0 ${scoreColor(item.similarity_score)}`}>
          {pct(item.similarity_score)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor(item.similarity_score)} transition-all duration-700`}
          style={{ width: pct(item.similarity_score) }}
        />
      </div>

      {/* Skills row + button */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          {item.matched_skills.slice(0, 3).map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100"
            >
              <CheckCircle2 className="w-3 h-3" />
              {s}
            </span>
          ))}
          {item.missing_skills.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
              <AlertCircle className="w-3 h-3" />
              Kekurangan: {item.missing_skills.join(" · ")}
            </span>
          )}
        </div>
        <button
          onClick={onDetail}
          className="shrink-0 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-sm font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors"
        >
          Lihat detail lengkap
        </button>
      </div>
    </div>
  );
}

export default function HasilRekomendasiSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionKey = params?.sessionId as string; // folder tetap [sessionId], tapi variabel kita rename

  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<RekItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionKey) return;
    const fetchSession = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/recommendations/sessions/${sessionKey}`, {
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
        setSession(json.session);
        setItems(json.data ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Gagal memuat hasil rekomendasi.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, [sessionKey]);

  return (
    <div className="min-h-screen bg-[#EEF2FF]">
      <div className="max-w-4xl mx-auto space-y-5 py-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hasil Rekomendasi Magang Untukmu</h1>
            <p className="text-sm text-gray-500 mt-1">
              Divisi magang yang paling sesuai dengan profil, skill, dan minatmu.
            </p>
            {session && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-500 mt-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Diperbarui {formatDate(session.created_at)}</span>
              </div>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full w-full mb-4" />
                  <div className="flex gap-2">
                    <div className="h-7 bg-gray-100 rounded-full w-20" />
                    <div className="h-7 bg-gray-100 rounded-full w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-sm font-semibold text-red-700 mb-1">Gagal memuat data</p>
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 text-sm font-semibold text-red-600 border border-red-300 rounded-xl hover:bg-red-100 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <RekCard
                  key={String(item.id ?? item.company_session_key)}
                  item={item}
                  onDetail={() => router.push(`/riwayat_rekomendasi/${sessionKey}/${String(item.id ?? item.company_session_key)}`)}
                />
              ))}
            </div>
          )}

          {/* Back */}
          <button
            onClick={() => router.push("/riwayat_rekomendasi")}
            className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            ← Kembali ke Riwayat
          </button>

        </div>
    </div>
  );
}