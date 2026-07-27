"use client";
// app/(admin)/review_feedback/page.tsx
// Terhubung ke: GET /api/admin/feedbacks?status=...
//               POST /api/admin/feedbacks/:id/approve
//               POST /api/admin/feedbacks/:id/reject
import { useState, useEffect, useCallback } from "react";
import { useNotification } from "@/components/ui/notification";
import { Eye, X, Check, ChevronDown } from "lucide-react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

// ── Types ──────────────────────────────────────────────────────────────────────
type StatusFilter = "pending" | "approved" | "rejected";

interface FeedbackItem {
  id: number;
  user_name: string;
  user_nim: string;
  company_name: string;
  division_name: string;
  suitability: number;
  rating_reason: string;
  skills_used: string[];
  jobdesk: string[];
  experience: string;
  duration: string;
  location: string;
  status: StatusFilter;
  reject_reason: string | null;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getToken() {
  return typeof window !== "undefined"
    ? localStorage.getItem("access_token")
    : null;
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: StatusFilter }) {
  const cfg = {
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
    rejected: "bg-red-50 text-red-500 border-red-200",
  };
  const label = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg[status]}`}
    >
      {label[status]}
    </span>
  );
}

// ── Star rating ───────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i <= rating ? "text-amber-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({
  item,
  onClose,
  onApprove,
  onReject,
  isActing,
}: {
  item: FeedbackItem;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  isActing: boolean;
}) {
  const { notify } = useNotification();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleReject = () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      notify("Alasan penolakan minimal 5 karakter.", { variant: "error" });
      return;
    }
    onReject(item.id, rejectReason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Detail Feedback #{item.id}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {item.user_name} · {item.user_nim}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Perusahaan & Divisi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">
                Perusahaan
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {item.company_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">
                Divisi
              </p>
              <p className="text-sm font-semibold text-slate-800">
                {item.division_name}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">
                Lokasi
              </p>
              <p className="text-sm text-slate-700">{item.location}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">
                Durasi
              </p>
              <p className="text-sm text-slate-700">{item.duration}</p>
            </div>
          </div>

          {/* Rating */}
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
              Tingkat Kesesuaian
            </p>
            <Stars rating={item.suitability} />
            <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-xl p-3 leading-relaxed">
              {item.rating_reason}
            </p>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
              Skill yang Digunakan
            </p>
            <div className="flex flex-wrap gap-2">
              {item.skills_used.map((s) => (
                <span
                  key={s}
                  className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Jobdesk */}
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
              Jobdesk / Project
            </p>
            <div className="flex flex-wrap gap-2">
              {item.jobdesk.map((j) => (
                <span
                  key={j}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium"
                >
                  {j}
                </span>
              ))}
            </div>
          </div>

          {/* Pengalaman */}
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
              Ringkasan Pengalaman
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed">
              {item.experience}
            </p>
          </div>

          {/* Reject reason kalau sudah ditolak */}
          {item.status === "rejected" && item.reject_reason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">
                Alasan Penolakan:
              </p>
              <p className="text-sm text-red-700">{item.reject_reason}</p>
            </div>
          )}

          {/* Reject input */}
          {showRejectInput && (
            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1 block">
                Alasan Penolakan *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Tulis alasan penolakan (minimal 5 karakter)..."
                rows={3}
                className="w-full text-sm border border-red-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer actions — hanya tampil kalau status pending */}
        {item.status === "pending" && (
          <div className="p-6 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
            {!showRejectInput ? (
              <>
                <button
                  onClick={() => setShowRejectInput(true)}
                  disabled={isActing}
                  className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
                >
                  Tolak
                </button>
                <button
                  onClick={() => onApprove(item.id)}
                  disabled={isActing}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                >
                  <Check size={15} />
                  {isActing ? "Memproses..." : "Setujui"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowRejectInput(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleReject}
                  disabled={isActing}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {isActing ? "Memproses..." : "Konfirmasi Tolak"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS: { label: string; value: StatusFilter }[] = [
  { label: "Menunggu", value: "pending" },
  { label: "Disetujui", value: "approved" },
  { label: "Ditolak", value: "rejected" },
];

export default function ReviewFeedbackPage() {
  const [activeTab, setActiveTab] = useState<StatusFilter>("pending");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [counts, setCounts] = useState<Record<StatusFilter, number>>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const { notify } = useNotification();

  const fetchFeedbacks = useCallback(async (status: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/admin/feedbacks?status=${status}`,
        { headers: authHeaders() }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const json = await res.json();
      setFeedbacks(json.data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch counts untuk semua tab (badge notif)
  const fetchCounts = useCallback(async () => {
    const statuses: StatusFilter[] = ["pending", "approved", "rejected"];
    const results = await Promise.allSettled(
      statuses.map((s) =>
        fetch(`${API_BASE}/admin/feedbacks?status=${s}`, {
          headers: authHeaders(),
        }).then((r) => r.json())
      )
    );
    const newCounts = { pending: 0, approved: 0, rejected: 0 };
    statuses.forEach((s, i) => {
      const r = results[i];
      if (r.status === "fulfilled") {
        newCounts[s] = r.value?.data?.length ?? 0;
      }
    });
    setCounts(newCounts);
  }, []);

  useEffect(() => {
    fetchFeedbacks(activeTab);
  }, [activeTab, fetchFeedbacks]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleApprove = async (id: number) => {
    setIsActing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/feedbacks/${id}/approve`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Gagal menyetujui feedback.");
      setSelected(null);
      await fetchFeedbacks(activeTab);
      await fetchCounts();
      notify("Feedback berhasil disetujui.", { variant: "success" });
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Terjadi kesalahan.", { variant: "error" });
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async (id: number, reason: string) => {
    setIsActing(true);
    try {
      const res = await fetch(`${API_BASE}/admin/feedbacks/${id}/reject`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reject_reason: reason }),
      });
      if (!res.ok) throw new Error("Gagal menolak feedback.");
      setSelected(null);
      await fetchFeedbacks(activeTab);
      await fetchCounts();
      notify("Feedback berhasil ditolak.", { variant: "success" });
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Terjadi kesalahan.", { variant: "error" });
    } finally {
      setIsActing(false);
    }
  };

  return (
    <>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Review Feedback Alumni</h1>
            <p className="mt-1 text-sm text-slate-500">
              Feedback yang disetujui akan otomatis memperbarui data divisi untuk sistem rekomendasi.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === tab.value
                    ? "border-indigo-300 bg-indigo-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {tab.label}
                {counts[tab.value] > 0 && (
                  <span
                    className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                      activeTab === tab.value
                        ? "bg-white/20 text-white"
                        : tab.value === "pending"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {counts[tab.value]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-50 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Tidak ada feedback dengan status ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="pb-3 text-left text-xs font-semibold text-slate-500 pl-2">
                      No
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold text-slate-500">
                      Mahasiswa
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold text-slate-500">
                      Perusahaan / Divisi
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold text-slate-500">
                      Rating
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold text-slate-500">
                      Tanggal
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold text-slate-500">
                      Status
                    </th>
                    <th className="pb-3 text-left text-xs font-semibold text-slate-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {feedbacks.map((fb, idx) => (
                    <tr key={fb.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 pl-2 text-slate-400 text-xs">
                        {String(idx + 1).padStart(2, "0")}
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-slate-800">{fb.user_name}</p>
                        <p className="text-xs text-slate-400">{fb.user_nim}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="font-semibold text-slate-800">{fb.company_name}</p>
                        <p className="text-xs text-slate-400">{fb.division_name}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <Stars rating={fb.suitability} />
                      </td>
                      <td className="py-4 pr-4 text-slate-500 text-xs">
                        {fb.created_at}
                      </td>
                      <td className="py-4 pr-4">
                        <StatusBadge status={fb.status} />
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelected(fb)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition"
                            title="Lihat detail"
                          >
                            <Eye size={15} />
                          </button>
                          {fb.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(fb.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition"
                                title="Setujui"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                onClick={() => setSelected(fb)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                                title="Tolak"
                              >
                                <X size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      {/* Modal */}
      {selected && (
        <DetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          isActing={isActing}
        />
      )}
    </>
  );
}