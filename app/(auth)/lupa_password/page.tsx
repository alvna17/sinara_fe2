"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost } from "@/services/api";

export default function LupaPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await apiPost("/forgot-password", { email });
      setInfo(res.message || "Kode verifikasi sudah dikirim ke email kamu.");
      setStep("reset");
    } catch (err: unknown) {
      if (err instanceof TypeError) {
        setError("Tidak dapat terhubung ke server.");
      } else if (err && typeof err === "object" && "message" in err) {
        setError(String((err as { message?: string }).message) || "Gagal mengirim kode.");
      } else {
        setError("Tidak dapat terhubung ke server.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const res = await apiPost("/reset-password", {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      });
      setInfo(res.message || "Password berhasil direset.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: unknown) {
      if (err instanceof TypeError) {
        setError("Tidak dapat terhubung ke server.");
      } else if (err && typeof err === "object" && "message" in err) {
        setError(String((err as { message?: string }).message) || "Gagal reset password.");
      } else {
        setError("Tidak dapat terhubung ke server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl px-8 py-10 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Lupa Password</h1>
          <Link href="/login" className="text-xs font-medium text-gray-400 hover:text-indigo-600 transition">
            ← Kembali ke Login
          </Link>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          {step === "email"
            ? "Masukkan email yang terdaftar untuk menerima kode verifikasi."
            : "Masukkan kode verifikasi yang dikirim ke email kamu, lalu buat password baru."}
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {info}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">Email</label>
              <input
                type="email"
                placeholder="Masukkan email terdaftar"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {loading ? "Mengirim..." : "Kirim Kode Verifikasi"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">Kode Verifikasi</label>
              <input
                type="text"
                placeholder="6 digit kode dari email"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition tracking-widest"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">Password Baru</label>
              <input
                type="password"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-gray-800">Konfirmasi Password</label>
              <input
                type="password"
                placeholder="Ulangi password baru"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Reset Password"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="text-sm text-gray-400 hover:text-indigo-600 transition text-center"
            >
              Ganti email / kirim ulang kode
            </button>
          </form>
        )}
      </div>
    </div>
  );
}