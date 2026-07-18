"use client";

import { useState, useEffect, useRef } from "react";

export interface RecipientOption {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: "broker" | "customer";
}

interface RecipientPickerProps {
  recipientType: "broker" | "customer";
  value: string;
  onChange: (value: string, option: RecipientOption | null) => void;
  options: RecipientOption[];
  loading: boolean;
}

export function RecipientPicker({ recipientType, value, onChange, options, loading }: RecipientPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.email && o.email.toLowerCase().includes(search.toLowerCase())) ||
    (o.phone && o.phone.includes(search))
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="hover-gold w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-left text-sm outline-none focus:border-[var(--zcanopy-primary)]"
      >
        {selected ? (
          <span>
            <span className="font-medium">{selected.name}</span>
            <span className="ml-2 text-xs text-gray-400">
              ({selected.email || selected.phone})
            </span>
          </span>
        ) : (
          <span className="text-gray-400">
            {recipientType === "broker" ? "Select a broker..." : "Select a customer..."}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${recipientType}...`}
            className="w-full rounded-t-xl border-b border-gray-100 px-3 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)]"
          />
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">No results found.</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id, opt);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-[#D1A054]/5"
                >
                  <div>
                    <p className="font-medium text-gray-800">{opt.name}</p>
                    <p className="text-xs text-gray-400">{opt.email || opt.phone}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                    {opt.type}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
