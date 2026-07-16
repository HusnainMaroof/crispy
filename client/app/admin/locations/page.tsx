"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/ui/page-header";
import { useLocations } from "@/lib/admin/use-locations";

export default function LocationsPage() {
  const { locations, updateLocation } = useLocations();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSave = (index: number, data: { hours: string; phone: string }) => {
    updateLocation(index, data);
    setEditingIndex(null);
  };

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Manage your restaurant locations and operating hours."
      />

      {/* Locations Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locations.map((location, index) => (
          <div
            key={index}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl tracking-wide text-white">
                  {location.name}
                </h3>
                <p className="mt-1 text-sm text-white/50">{location.address}</p>
              </div>
              <button
                onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>

            {editingIndex === index ? (
              <LocationEditForm
                location={location}
                onSave={(data) => handleSave(index, data)}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <svg className="h-4 w-4 shrink-0 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white/70">{location.hours}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <svg className="h-4 w-4 shrink-0 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-white/70">{location.phone}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LocationEditForm({
  location,
  onSave,
  onCancel,
}: {
  location: { hours: string; phone: string };
  onSave: (data: { hours: string; phone: string }) => void;
  onCancel: () => void;
}) {
  const [hours, setHours] = useState(location.hours);
  const [phone, setPhone] = useState(location.phone);

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-white/50">Hours</label>
        <input
          type="text"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-red/50"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-white/50">Phone</label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-red/50"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ hours, phone })}
          className="rounded-lg bg-brand-red px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/5 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
