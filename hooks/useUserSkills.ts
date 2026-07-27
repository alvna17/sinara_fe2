"use client";
// hooks/useUserSkills.ts
// Hook untuk fetch skill milik user & semua skill master (untuk autocomplete)
import { useState, useEffect, useCallback } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

function authHeaders() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useUserSkills() {
  const [skills, setSkills] = useState<string[]>([]);       // skill milik user
  const [allSkills, setAllSkills] = useState<string[]>([]);  // semua skill master
  const [loadingSkills, setLoadingSkills] = useState(false);

  const fetchSkills = useCallback(async () => {
    setLoadingSkills(true);
    try {
      const [resUser, resAll] = await Promise.all([
        fetch(`${API_BASE}/skills/user`, { headers: authHeaders() }),
        fetch(`${API_BASE}/skills`, { headers: authHeaders() }),
      ]);
      if (resUser.ok) {
        const json = await resUser.json();
        // BE return { data: [ { id, name } ] }
        setSkills((json.data ?? []).map((s: { name: string }) => s.name));
      }
      if (resAll.ok) {
        const json = await resAll.json();
        setAllSkills((json.data ?? []).map((s: { name: string }) => s.name));
      }
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const saveSkills = async (skillNames: string[]) => {
    setLoadingSkills(true);
    try {
      const res = await fetch(`${API_BASE}/skills/user`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ skills: skillNames }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Gagal menyimpan skill.");
      }
      await fetchSkills(); // re-fetch supaya data fresh
    } finally {
      setLoadingSkills(false);
    }
  };

  return { skills, allSkills, loadingSkills, saveSkills, fetchSkills };
}