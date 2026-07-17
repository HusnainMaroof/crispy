"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/admin/ui/page-header";
import Modal from "@/components/admin/ui/modal";
import { useLocations } from "@/lib/admin/use-locations";

export default function LocationsPage() {
  const { locations, loading, fetchLocations, addLocation, updateLocation, deleteLocation } = useLocations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleSave = async (id: string, data: { hours: string; phone: string }) => {
    try {
      await updateLocation(id, data);
      toast.success("Location updated");
      setEditingId(null);
    } catch {
      toast.error("Failed to update location");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      await deleteLocation(id);
      toast.success("Location deleted");
    } catch {
      toast.error("Failed to delete location");
    }
  };

  const handleAdd = async (data: { name: string; address: string; hours: string; phone: string }) => {
    try {
      await addLocation(data);
      toast.success("Location added");
      setShowForm(false);
    } catch {
      toast.error("Failed to add location");
    }
  };

  return (
    <div className="admin-fade-in">
      <PageHeader
        title="Locations"
        description="Manage your restaurant locations and operating hours."
        action={
          <button
            onClick={() => setShowForm(true)}
            className="btn-press rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Add Location
          </button>
        }
      />

      {loading && (
        <p className="mb-4 text-sm text-white/50">Loading locations...</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locations.map((location) => (
          <div
            key={location.id}
            className="group rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl tracking-wide text-white">
                  {location.name}
                </h3>
                <p className="mt-1 text-sm text-white/50">{location.address}</p>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setEditingId(editingId === location.id ? null : location.id)}
                  className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  className="rounded-lg p-2 text-white/50 hover:bg-brand-red/20 hover:text-brand-red"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {editingId === location.id ? (
              <LocationEditForm
                location={location}
                onSave={(data) => handleSave(location.id, data)}
                onCancel={() => setEditingId(null)}
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

      {locations.length === 0 && !loading && (
        <div className="rounded-xl border border-white/10 bg-white/5 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="mt-4 text-sm font-medium text-white">No locations yet</h3>
          <p className="mt-1 text-sm text-white/50">Add your first restaurant location to get started.</p>
          <button
            onClick={() => setShowForm(true)}
            className="btn-press mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Location
          </button>
        </div>
      )}

      {showForm && (
        <LocationForm
          onSave={handleAdd}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function LocationForm({
  onSave,
  onClose,
}: {
  onSave: (data: { name: string; address: string; hours: string; phone: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, address, hours, phone });
  };

  return (
    <Modal onClose={onClose} title="Add Location">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-white/50">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Brixton"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-red/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/50">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder="123 Main St, London"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-red/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/50">Hours</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
            placeholder="Mon-Sun 11:00 - 22:00"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-red/50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-white/50">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="020 1234 5678"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-brand-red/50"
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-press rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-press rounded-lg bg-brand-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Add Location
          </button>
        </div>
      </form>
    </Modal>
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
