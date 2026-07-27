"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useNotification } from "@/components/ui/notification";
import Pagination from "@/components/ui/pagination";
import {
  Search,
  Users,
  UserCheck,
  UserSearch,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  ArrowLeftRight,
} from "lucide-react";
// NOTE: SidebarAdmin & DashboardNavbar/Header TIDAK di-import lagi di sini.
// app/(admin)/layout.tsx sudah render SidebarAdmin + DashboardHeader + DashboardMain
// buat semua halaman di grup admin. Kalau di-render lagi di sini, sidebar & header
// jadi dobel dan padding/margin numpuk (pt-16 + pt-16, md:ml-60 + md:ml-60).

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;
const PER_PAGE = 30;

interface Student {
  id: number;
  name: string;
  email: string;
  nim: string;
  role: "alumni" | "calon";
  program_studi: string;
  semester: string;
  feedback_count: number;
  status_aktivitas: "Aktif" | "Pasif";
}

interface Summary {
  total_mahasiswa: number;
  total_alumni: number;
  total_calon: number;
  total_feedback: number;
}

function FeedbackBar({ count, max = 12 }: { count: number; max?: number }) {
  const totalDots = 10;
  const filled = Math.min(totalDots, Math.round((count / max) * totalDots));
  const color = count >= 10 ? "#3b5bdb" : "#2f9e44";
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: totalDots }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 6,
            borderRadius: 3,
            backgroundColor: i < filled ? color : "#e2e8f0",
          }}
        />
      ))}
    </div>
  );
}

export default function DataMahasiswaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<"name" | null>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<number | null>(null);
  const { notify, confirm } = useNotification();

  // NOTE: endpoint ini saat ini selalu balikin SEMUA mahasiswa sekaligus
  // (page/per_page belum beneran didukung di backend), jadi kita fetch
  // sekali aja terus paging & search-nya dikerjain client-side di bawah --
  // pola yang sama kayak tab Perusahaan/Divisi di halaman Kelola Perusahaan.
  // Kalau nanti backend-nya beneran dibikin paginated, tinggal balikin lagi
  // jadi fetch per-page (kirim `page`/`per_page`/`search` ke query param).
  const fetchStudents = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Sesi tidak ditemukan. Silakan login ulang sebagai admin.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/data-mahasiswa`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error(
          "Sesi habis atau akses ditolak. Silakan login ulang sebagai admin.",
        );
      }
      if (!res.ok) {
        throw new Error(`Gagal mengambil data (status ${res.status}).`);
      }

      const json = await res.json();
      setStudents(json.data ?? []);
      setSummary(json.summary ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil data mahasiswa.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.nim.toLowerCase().includes(q),
    );
  }, [students, search]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    const list = [...filtered];
    if (sortField === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    }
    if (sortOrder === "desc") list.reverse();
    return list;
  }, [filtered, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const pageData = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, sortField, sortOrder]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  const handleSwitchRole = async (student: Student) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const nextRole = student.role === "alumni" ? "calon" : "alumni";
    const confirmMsg =
      nextRole === "alumni"
        ? `Set "${student.name}" jadi Alumni (sudah magang)? Dia akan bisa submit feedback baru & akses riwayat feedback.`
        : `Set "${student.name}" jadi Calon (belum magang)? Dia akan kehilangan akses submit feedback, tapi dapat akses cari rekomendasi.`;

    const confirmed = await confirm({
      title: "Ubah Role Mahasiswa",
      description: confirmMsg,
      confirmLabel: "Ya, ubah",
      cancelLabel: "Batal",
    });
    if (!confirmed) return;

    setSwitchingId(student.id);
    try {
      const res = await fetch(
        `${API_BASE}/admin/data-mahasiswa/${student.id}/role`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: nextRole }),
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          err?.message ?? `Gagal update role (status ${res.status}).`,
        );
      }

      await fetchStudents(); // refresh list biar sinkron
      notify("Role mahasiswa berhasil diperbarui.", { variant: "success" });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengubah status magang.";
      setError(message);
      notify(message, { variant: "error" });
    } finally {
      setSwitchingId(null);
    }
  };

  const stats = [
    {
      label: "Total Mahasiswa",
      value: summary?.total_mahasiswa ?? 0,
      icon: Users,
    },
    {
      label: "Alumni (Pemberi Feedback)",
      value: summary?.total_alumni ?? 0,
      icon: UserCheck,
    },
    {
      label: "Calon (Pencari Magang)",
      value: summary?.total_calon ?? 0,
      icon: UserSearch,
    },
    {
      label: "Total Feedback",
      value: summary?.total_feedback ?? 0,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
          <AlertCircle
            size={16}
            className="text-red-500 mt-0.5 flex-shrink-0"
          />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={fetchStudents}
            className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
          >
            <RefreshCw size={12} /> Coba lagi
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl px-5 py-5 border border-slate-100 shadow-sm flex items-start justify-between"
          >
            <div>
              <p className="text-xs text-slate-500 leading-snug">{s.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {s.value}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <s.icon size={18} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="relative flex items-center w-full max-w-[420px]">
            <Search size={14} className="absolute left-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, atau NIM..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3b5bdb]/20 focus:border-[#3b5bdb]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 w-12">
                  NO
                </th>
                {[
                  "MAHASISWA",
                  "ROLE USER",
                  "PROGRAM STUDI",
                  "STATUS AKTIVITAS",
                  "KONTRIBUSI FEEDBACK",
                  "AKSI",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold tracking-wide text-slate-500"
                  >
                    {h === "MAHASISWA" ? (
                      <div className="flex items-center gap-2">
                        <span>MAHASISWA</span>
                        <div className="flex flex-col ml-1">
                          <button
                            onClick={() => {
                              setSortField("name");
                              setSortOrder("asc");
                              setPage(1);
                            }}
                            aria-label="Urutkan naik"
                            className={`p-0 leading-none -mb-0.5 ${sortField === "name" && sortOrder === "asc" ? "text-indigo-600" : "text-slate-400"}`}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
                          </button>
                          <button
                            onClick={() => {
                              setSortField("name");
                              setSortOrder("desc");
                              setPage(1);
                            }}
                            aria-label="Urutkan turun"
                            className={`p-0 leading-none ${sortField === "name" && sortOrder === "desc" ? "text-indigo-600" : "text-slate-400"}`}
                          >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      h
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-slate-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-slate-400"
                  >
                    Tidak ada mahasiswa yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                pageData.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {String((page - 1) * PER_PAGE + idx + 1).padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{s.name}</div>
                      <span className="mt-0.5 block text-xs text-slate-400">
                        {s.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          s.role === "alumni"
                            ? "bg-[#eef1ff] text-[#3b5bdb]"
                            : "bg-[#e8f5e9] text-[#2e7d32]"
                        }`}
                      >
                        {s.role === "alumni"
                          ? "Sudah Magang (Alumni)"
                          : "Belum Magang (Calon)"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">
                        {s.program_studi}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Semester {s.semester}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          s.status_aktivitas === "Aktif"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {s.status_aktivitas}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <FeedbackBar count={s.feedback_count} />
                      <div className="mt-1.5 text-xs font-semibold text-slate-700">
                        {s.feedback_count > 0
                          ? `${s.feedback_count} Feedback`
                          : "Belum ada kontribusi"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSwitchRole(s)}
                        disabled={switchingId === s.id}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        <ArrowLeftRight size={12} />
                        {switchingId === s.id
                          ? "Memproses..."
                          : s.role === "alumni"
                            ? "Jadikan Calon"
                            : "Jadikan Alumni"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && sorted.length > PER_PAGE && (
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
