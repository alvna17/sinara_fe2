"use client";

import { useEffect, useState } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;
const ALL_LABEL = "Semua Lowongan";

interface FilterDivisiProps {
  /** "" artinya semua divisi (belum ada filter) */
  value: string;
  onChange: (v: string) => void;
  className?: string;
}

export default function FilterDivisi({ value, onChange, className = "" }: FilterDivisiProps) {
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;
    fetch(`${API_BASE}/divisions/categories`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        if (ignore) return;
        const names: string[] = json.data ?? [];
        setOptions(names);
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <select
        value={value === "" ? ALL_LABEL : value}
        onChange={(e) => onChange(e.target.value === ALL_LABEL ? "" : e.target.value)}
        className="appearance-none w-full text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
      >
        <option value={ALL_LABEL}>{ALL_LABEL}</option>
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <svg
        className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}