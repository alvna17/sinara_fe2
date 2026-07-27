"use client";
// app/(alumni)/riwayat_feedback/page.tsx
// Terhubung ke: GET /api/feedbacks/my
import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

// ── Types ──────────────────────────────────────────────────────────────────────
type StatusType = "approved" | "pending" | "rejected";

interface FeedbackItem {
  id: number;
  company_name: string;
  division_name: string;
  suitability: number;
  status: StatusType;
  reject_reason: string | null;
  skills_used: string[];
  jobdesk: string[];
  experience: string;
  rating_reason: string;
  duration: string;
  location: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusConfig: Record<
  StatusType,
  { label: string; className: string }
> = {
  approved: {
    label: "Disetujui",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  pending: {
    label: "Menunggu Review",
    className: "bg-amber-50 text-amber-600 border border-amber-200",
  },
  rejected: {
    label: "Ditolak",
    className: "bg-red-50 text-red-600 border border-red-200",
  },
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({
  item,
  onClose,
}: {
  item: FeedbackItem;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {item.company_name}
            </h2>
            <p className="text-sm text-gray-500">{item.division_name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition"
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig[item.status].className}`}
            >
              {statusConfig[item.status].label}
            </span>
            <span className="text-xs text-gray-400">{item.created_at}</span>
          </div>

          {/* Reject reason */}
          {item.status === "rejected" && item.reject_reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">
                Alasan Penolakan:
              </p>
              <p className="text-sm text-red-700">{item.reject_reason}</p>
            </div>
          )}

          {/* Detail info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">
                Lokasi
              </p>
              <p className="text-gray-800">{item.location}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">
                Durasi
              </p>
              <p className="text-gray-800">{item.duration}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">
                Kesesuaian
              </p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i <= item.suitability ? "text-amber-400" : "text-gray-200"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
              Skill yang Digunakan
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.skills_used.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Jobdesk */}
          {item.jobdesk.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
                Jobdesk
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.jobdesk.map((j) => (
                  <span
                    key={j}
                    className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
                  >
                    {j}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Alasan rating */}
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
              Alasan Penilaian
            </p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
              {item.rating_reason}
            </p>
          </div>

          {/* Pengalaman */}
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">
              Ringkasan Pengalaman
            </p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
              {item.experience}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RiwayatFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/feedbacks/my`, {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const json = await res.json();
        setFeedbacks(json.data ?? []);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat riwayat feedback."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-50 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      );
    }
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      );
    }
    if (feedbacks.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm mb-3">
            Kamu belum pernah submit feedback.
          </p>
          <Link
            href="/input_feedback"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
          >
            Tambah Pengalaman Magang
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        {feedbacks.map((item) => {
          const status = statusConfig[item.status];
          return (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              {/* Left */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 text-sm font-bold">
                  {item.company_name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {item.company_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.division_name} · {item.created_at}
                  </p>
                </div>
              </div>
              {/* Right */}
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                >
                  {status.label}
                </span>
                <button
                  onClick={() => setSelected(item)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
        <div className="max-w-5xl mx-auto space-y-5 py-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Riwayat Feedback Saya
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Pantau status feedback pengalaman magang yang sudah kamu
                  submit.
                </p>
              </div>
              <Link
                href="/input_feedback"
                className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
              >
                + Tambah
              </Link>
            </div>
            {renderContent()}
          </div>
        </div>

      {selected && (
        <DetailModal item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}