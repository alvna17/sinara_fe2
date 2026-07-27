"use client";
// hooks/useProfile.ts
// Hook shared untuk profil calon & alumni — sync ke BE
// Endpoint: GET /api/me, GET /api/profile, POST /api/profile

import { useState, useEffect, useCallback } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

export interface UserProfile {
  id: number;
  name: string;
  nim: string;
  email: string;
  role: string;
  phone: string;
  program_studi: string;
  semester: string;
  kelas?: string;
  tahun_angkatan?: number;
  status_magang?: "Belum Magang" | "Sedang Magang" | "Selesai Magang";
  photo: string | null;
  kelengkapan_profil: number;
}

const DEFAULT: UserProfile = {
  id: 0,
  name: "",
  nim: "",
  email: "",
  role: "",
  phone: "",
  program_studi: "",
  semester: "",
  kelas: "",
  tahun_angkatan: undefined,
  status_magang: "Belum Magang",
  photo: null,
  kelengkapan_profil: 0,
};

// ✅ FIX: sebelumnya formula ini SAMA untuk semua role (selalu ngecek
// program_studi & semester), padahal:
//   - Calon  : ngisi program_studi & semester (bukan kelas/tahun_angkatan)
//   - Alumni : ngisi kelas & tahun_angkatan (form edit-nya nggak ada field
//              program_studi/semester sama sekali)
// Akibatnya alumni kejegal maksimal ~71% walau semua yang RELEVAN buat dia
// sudah lengkap, karena 2 dari 7 field yang dicek gak pernah bisa diisi.
// Sekarang field yang dicek disesuaikan per role.
function calcKelengkapan(
  user: Record<string, unknown>,
  profile: Record<string, unknown>,
): number {
  const role = user?.role as string | undefined;

  const baseFields = [
    user?.name,
    user?.email,
    user?.nim,
    profile?.phone,
    profile?.photo,
  ];

  const roleFields =
    role === "alumni"
      ? [profile?.kelas, profile?.tahun_angkatan]
      : [profile?.program_studi, profile?.semester]; // default: calon

  const fields = [...baseFields, ...roleFields];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [resMe, resProfile] = await Promise.all([
        fetch(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
        fetch(`${API_BASE}/profile`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
      ]);
      if (!resMe.ok) throw new Error("Sesi berakhir. Silakan login ulang.");
      const user = await resMe.json();
      const profileJson = resProfile.ok ? await resProfile.json() : { data: {} };
      const profileData =
        profileJson?.data?.profile ?? profileJson?.data ?? {};
      const photoUrl = profileData?.photo
        ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/storage/${profileData.photo}`
        : null;
      setProfile({
        id: user.id ?? 0,
        name: user.name ?? "",
        nim: user.nim ?? "",
        email: user.email ?? "",
        role: user.role ?? "",
        phone: profileData?.phone ?? "",
        program_studi: profileData?.program_studi ?? "",
        semester: profileData?.semester ?? "",
        kelas: profileData?.kelas ?? "",
        tahun_angkatan: profileData?.tahun_angkatan ?? undefined,
        photo: photoUrl,
        kelengkapan_profil: calcKelengkapan(user, profileData),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat profil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Simpan perubahan profil ke BE
  const saveProfile = async (data: {
    phone?: string;
    program_studi?: string;
    semester?: string;
    kelas?: string;
    tahun_angkatan?: string | number;
    photoFile?: File | null;
  }): Promise<void> => {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("Token tidak ditemukan.");
    setIsSaving(true);
    try {
      const body = new FormData();
      if (data.phone !== undefined) body.append("phone", data.phone);
      if (data.program_studi !== undefined)
        body.append("program_studi", data.program_studi);
      if (data.semester !== undefined) body.append("semester", data.semester);
      if (data.kelas !== undefined) body.append("kelas", data.kelas);
      if (data.tahun_angkatan !== undefined)
        body.append("tahun_angkatan", String(data.tahun_angkatan));
      if (data.photoFile) body.append("photo", data.photoFile);
      const res = await fetch(`${API_BASE}/profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? `Error ${res.status}`);
      }
      await fetchProfile(); // re-fetch supaya data terbaru
    } finally {
      setIsSaving(false);
    }
  };

  // Simpan perubahan akun (nama & email) ke BE
  const saveAccount = async (data: { name?: string; email?: string }): Promise<void> => {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("Token tidak ditemukan.");
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/account`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? `Error ${res.status}`);
      }
      await fetchProfile();
    } finally {
      setIsSaving(false);
    }
  };

  return { profile, loading, error, isSaving, fetchProfile, saveProfile, saveAccount };
}