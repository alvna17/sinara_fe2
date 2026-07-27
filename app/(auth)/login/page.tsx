"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost } from "@/services/api";
import { TOKEN_KEY, ROLE_REDIRECT } from "@/app/constants/auth";
import { extractApiError, normalizeNim } from "@/services/errorHandler";

type UserRole = "alumni" | "calon" | "admin";

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: "alumni", label: "Sudah magang", desc: "Untuk melihat akun dan riwayat." },
  { value: "calon", label: "Akan magang", desc: "Untuk mulai mencari rekomendasi." },
  { value: "admin", label: "Admin", desc: "Untuk mengelola data dan sistem." },
];

const tips = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
      </svg>
    ),
    text: "Login menggunakan NIM mahasiswa",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    text: "Pilih mahasiswa sudah magang atau akan magang",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    text: "Daftar sekarang jika belum punya akun",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>("alumni");
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost("/login", {
        nim: normalizeNim(nim),
        password,
        role: selectedRole,
      });

      if (res.access_token) {
        const actualRole = res.user?.role ?? selectedRole;
        if (actualRole !== selectedRole) {
          const roleLabel: Record<string, string> = {
            alumni: "Sudah Magang",
            calon: "Akan Magang",
            admin: "Admin",
          };
          setError(
            `Akun ini terdaftar sebagai "${roleLabel[actualRole] ?? actualRole}". ` +
            `Silakan pilih role yang sesuai.`
          );
          return;
        }
        localStorage.setItem(TOKEN_KEY, res.access_token);
        localStorage.setItem("user", JSON.stringify(res.user));
        router.push(ROLE_REDIRECT[actualRole]);
      } else {
        setError(res.message || "Login gagal. Periksa NIM dan password.");
      }
    } catch (err: unknown) {
      // Semua kemungkinan error (401 NIM/password salah, 422 validasi,
      // 500 server error, network gagal total) ditangani satu tempat
      // lewat extractApiError, biar pesannya selalu sesuai apa yang
      // sebenernya dikirim backend.
      const { message } = extractApiError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl flex flex-col md:flex-row gap-5">
        {/* ===== LEFT PANEL ===== */}
        <div className="bg-indigo-600 text-white px-8 py-10 rounded-2xl md:w-[38%] flex flex-col justify-between gap-10">
          <div>
            <h1 className="text-3xl font-bold leading-tight mb-4">
              Masuk lebih cepat dengan tampilan yang sederhana.
            </h1>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Gunakan NIM dan password untuk melanjutkan.{" "}
              Pilih status mahasiswa sesuai kebutuhanmu sebelum masuk ke sistem.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3">
                <span className="text-indigo-200 flex-shrink-0">{tip.icon}</span>
                <p className="text-white text-sm">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== RIGHT PANEL ===== */}
        <div className="flex-1 bg-white rounded-2xl px-8 py-10 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold text-gray-900">Masuk</h2>
            <Link href="/" className="text-xs font-medium text-gray-400 hover:text-indigo-600 transition">
              ← Kembali ke Beranda
            </Link>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            Pilih jenis akun lalu isi data untuk melanjutkan.
          </p>

          <p className="text-sm font-semibold text-gray-800 mb-3">Masuk sebagai</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  selectedRole === role.value
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                }`}
              >
                <p className="font-semibold text-sm">{role.label}</p>
                <p className={`text-xs mt-1 leading-relaxed ${
                  selectedRole === role.value ? "text-indigo-200" : "text-gray-400"
                }`}>
                  {role.desc}
                </p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* NIM */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">NIM</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Masukkan NIM (Tanpa titik atau spasi)"
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
              {/* Peringatan real-time kalau NIM masih mengandung titik */}
              {nim.includes(".") && (
                <p className="text-xs text-amber-600">
                  Titik akan dihapus otomatis saat login. NIM terbaca:{" "}
                  <span className="font-semibold">{normalizeNim(nim)}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-800">Password</label>
                <Link href="/lupa_password" className="text-sm text-indigo-600 hover:underline font-medium">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span>{loading ? "Memproses..." : "Masuk sekarang"}</span>
            </button>
          </form>

          <div className="mt-5 bg-indigo-50 rounded-xl px-5 py-4">
            <p className="text-sm font-semibold text-gray-800 mb-0.5">Belum punya akun?</p>
            <p className="text-xs text-gray-400 mb-3">
              Daftar sekarang untuk mulai menggunakan sistem.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-400 hover:bg-white text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Daftar sekarang</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}