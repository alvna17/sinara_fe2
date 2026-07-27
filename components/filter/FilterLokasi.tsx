"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

interface FilterLokasiProps {
  /** "" artinya semua kota (belum ada filter) */
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}

// Combobox lokasi: bisa ngetik bebas kota apa saja (mirip search general),
// plus dropdown saran yang diambil dari GET /companies/cities (distinct kota
// dari company aktif), bukan 5 opsi hardcode.
export default function FilterLokasi({
  value,
  onChange,
  className = "",
  placeholder = "Lokasi",
}: FilterLokasiProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/companies/cities`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setCities(json.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = value
    ? cities.filter((c) => c.toLowerCase().includes(value.toLowerCase()))
    : cities;

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder-gray-400 cursor-text"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          aria-label="Hapus filter lokasi"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      ) : (
        <svg
          className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1">
          {suggestions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
