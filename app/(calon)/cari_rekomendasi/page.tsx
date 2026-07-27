"use client";
// ─── app/(calon)/cari_rekomendasi/page.tsx
// Halaman 3-step form rekomendasi tempat magang untuk calon mahasiswa magang
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotification } from "@/components/ui/notification";
import { Step1SkillDivisi } from "@/components/rekomendasi/Step1skilldivisi";
import { Step2DetailMagang } from "@/components/rekomendasi/Step2detailmagang";
import { Step3Review } from "@/components/rekomendasi/Step3review";
import { StepIndicatorRekom } from "@/components/rekomendasi/Stepindicatorrekom";
import type { Step1Data } from "@/components/rekomendasi/Step1skilldivisi";
import type { Step2Data } from "@/components/rekomendasi/Step2detailmagang";

// ── Constants ──────────────────────────────────────────────────────────────────
const USER_NAME = "Arjuna";

const INITIAL_STEP1: Step1Data = {
  divisions: [],
  skills: [],
};
const INITIAL_STEP2: Step2Data = {
  locations: [],
  durasi: "",
};

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

// ── Page ───────────────────────────────────────────────────────────────────────
export default function CariRekomendasiPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Data>(INITIAL_STEP1);
  const [step2Data, setStep2Data] = useState<Step2Data>(INITIAL_STEP2);
  const { notify } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    fetch(`${API_BASE}/skills/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        // Response: { data: [{id, name, created_at, ...}] }
        const skills: string[] = (json?.data ?? [])
          .map((s: any) => s.name)
          .filter(Boolean);
        if (skills.length > 0) {
          setStep1Data((prev) => ({ ...prev, skills }));
        }
      })
      .catch(() => {});
  }, []);
  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const skillRes = await fetch(`${API_BASE}/skills/user`, {
        method: "POST",
        headers,
        body: JSON.stringify({ skills: step1Data.skills }),
      });
      if (!skillRes.ok) {
        const err = await skillRes.json().catch(() => ({}));
        throw new Error(err?.message ?? `Gagal menyimpan skill (${skillRes.status})`);
      }

      const rekomRes = await fetch(`${API_BASE}/recommendations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          passion_divisions: step1Data.divisions,
          preferred_locations: step2Data.locations,
          preferred_duration: step2Data.durasi,
        }),
      });
      if (!rekomRes.ok) {
        const err = await rekomRes.json().catch(() => ({}));
        throw new Error(err?.message ?? `Gagal generate rekomendasi (${rekomRes.status})`);
      }

      router.push("/riwayat_rekomendasi");
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Gagal generate rekomendasi.", {
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
        <div className="max-w-3xl mx-auto space-y-5 py-6">
          <div className="bg-white rounded-2xl shadow-sm p-8">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="text-center mb-6">
              <p className="text-indigo-600 text-sm font-semibold mb-1">
                Step {currentStep} dari 3
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Rekomendasi Tempat Magang
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Isi data divisi, dan skill yang benar-benar kamu miliki dan
                kuasai. Informasi ini akan membantu sistem memberikan
                rekomendasi yang lebih akurat.
              </p>
            </div>

            {/* ── Step Indicator ──────────────────────────────────────────── */}
            <StepIndicatorRekom currentStep={currentStep} />

            {/* ── Step Content ────────────────────────────────────────────── */}
            {currentStep === 1 && (
              <Step1SkillDivisi
                data={step1Data}
                onChange={setStep1Data}
                onNext={() => setCurrentStep(2)}
              />
            )}
            {currentStep === 2 && (
              <Step2DetailMagang
                data={step2Data}
                onChange={setStep2Data}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            )}
            {currentStep === 3 && (
              <Step3Review
                step1={step1Data}
                step2={step2Data}
                onSubmit={handleGenerate}
                onBack={() => setCurrentStep(2)}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
    </>
  );
}