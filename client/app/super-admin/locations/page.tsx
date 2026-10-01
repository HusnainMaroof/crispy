"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/app/components/admin/ui/page-header";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import Modal from "@/app/components/admin/ui/modal";
import Dropdown from "@/app/components/admin/ui/dropdown";
import { TimePicker } from "@/app/components/ui/time-picker";
import { useLocations, type AdminLocation } from "@/lib/admin/use-locations";
import { WEEKDAYS, formatWeekHours, parseWeekHours, type DayHours } from "@/lib/admin/shop-hours";

export default function LocationsPage() {
  const { locations, loading, error, fetchLocations, addLocation, updateLocation } = useLocations();
  const [editing, setEditing] = useState<AdminLocation | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  const setStatus = async (location: AdminLocation, status: "active" | "inactive") => {
    if (location.status === status) return;
    try {
      await updateLocation(location.id, { status });
      toast.success(status === "active" ? `${location.name} is active` : `${location.name} is disabled`);
    } catch {
      toast.error("Could not update branch status");
    }
  };

  const saveExisting = async (data: { name: string; address: string; hours: string; phone: string }) => {
    if (!editing) return;
    try {
      await updateLocation(editing.id, data);
      toast.success("Branch updated");
      setEditing(null);
    } catch {
      toast.error("Could not update this branch");
    }
  };

  const saveNew = async (data: { name: string; address: string; hours: string; phone: string }) => {
    try {
      await addLocation(data);
      toast.success("Branch added");
      setAdding(false);
    } catch {
      toast.error("Could not add this branch");
    }
  };

  return (
    <div className="admin-fade-in">
      <PageHeader
        title="Branches"
        description="Address, opening hours, and whether the branch is taking orders. Disabled is for maintenance and is separate from the hours."
        action={
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-press h-11 rounded-full bg-[#FF0931] px-5 text-sm font-medium text-white"
          >
            Add branch
          </button>
        }
      />

      {error ? (
        <p role="alert" className="rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
          {error}
        </p>
      ) : loading ? <TableSkeleton /> : locations.length === 0 ? (
        <p className="rounded-2xl border border-white/10 px-5 py-10 text-center text-sm text-white/50">No branches yet. Add one to set its address and hours.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Opening hours</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {locations.map((location) => {
                const active = location.status !== "inactive";
                return (
                  <tr key={location.id} className="text-sm">
                    <td className="px-4 py-3 font-medium text-white">{location.name}</td>
                    <td className="px-4 py-3 text-white/70">{location.address}</td>
                    <td className="px-4 py-3 text-white/70">{location.hours}</td>
                    <td className="px-4 py-3 text-white/70">{location.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${active ? "bg-green-400" : "bg-white/30"}`} aria-hidden="true" />
                        <Dropdown
                          value={active ? "active" : "inactive"}
                          onChange={(value) => {
                            const next = value === "inactive" ? "inactive" : "active";
                            if (next === location.status) return;
                            void setStatus(location, next);
                          }}
                          options={[
                            { value: "active", label: "Active" },
                            { value: "inactive", label: "Disabled" },
                          ]}
                          className="h-11 min-w-32"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setEditing(location)}
                        className="h-11 cursor-pointer rounded-lg border border-white/10 px-4 text-sm text-white/80 hover:bg-white/10"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {adding && <ShopForm title="Add branch" onClose={() => setAdding(false)} onSave={saveNew} />}
      {editing && (
        <ShopForm
          title={`Edit ${editing.name}`}
          shop={editing}
          onClose={() => setEditing(null)}
          onSave={saveExisting}
        />
      )}
    </div>
  );
}

function ShopForm({
  title,
  shop,
  onSave,
  onClose,
}: {
  title: string;
  shop?: AdminLocation;
  onSave: (data: { name: string; address: string; hours: string; phone: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(shop?.name ?? "");
  const [address, setAddress] = useState(shop?.address ?? "");
  const [phone, setPhone] = useState(shop?.phone ?? "");
  const [week, setWeek] = useState<DayHours[]>(() => parseWeekHours(shop?.hours ?? ""));

  const setDay = (day: number, next: DayHours) => {
    setWeek((current) => current.map((hours, index) => index === day ? next : hours));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (week.every((hours) => hours === null)) {
      toast.error("Open at least one weekday");
      return;
    }
    onSave({ name, address, phone, hours: formatWeekHours(week) });
  };

  return (
    <Modal onClose={onClose} title={title}>
      <form onSubmit={submit} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        <label className="block text-sm text-white/50">Name
          <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#FF0931]" />
        </label>
        <label className="block text-sm text-white/50">Address
          <input required value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#FF0931]" />
        </label>
        <label className="block text-sm text-white/50">Phone
          <input required value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#FF0931]" />
        </label>
        <fieldset>
          <legend className="text-sm text-white">Opening hours</legend>
          <p className="mt-1 text-xs text-white/45">Set each weekday, the same way a map lists hours. Matching days are saved as a range, such as Fri–Sat. This does not disable the branch.</p>
          {shop?.hours && <p className="mt-2 text-xs text-white/40">Saved now: {shop.hours}</p>}
          <ul className="mt-3 divide-y divide-white/10 rounded-xl border border-white/10">
            {WEEKDAYS.map(({ day, label }) => {
              const hours = week[day];
              return (
                <li key={label} className="flex flex-wrap items-center gap-3 px-3 py-3">
                  <span className="w-28 text-sm text-white">{label}</span>
                  {hours ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <TimePicker compact labelText={`${label} opens`} value={hours.open} onChange={(open) => setDay(day, { ...hours, open })} />
                      <span className="text-white/40" aria-hidden="true">–</span>
                      <TimePicker compact labelText={`${label} closes`} value={hours.close} onChange={(close) => setDay(day, { ...hours, close })} />
                    </div>
                  ) : (
                    <span className="flex-1 text-sm text-white/45">Closed</span>
                  )}
                  <button
                    type="button"
                    aria-pressed={Boolean(hours)}
                    onClick={() => setDay(day, hours ? null : { open: "11:00", close: "23:00" })}
                    className={`h-11 cursor-pointer rounded-full px-3 text-xs ${hours ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/55"}`}
                  >
                    {hours ? "Open" : "Closed"}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="h-11 rounded-full border border-white/10 px-4 text-sm text-white/60">Cancel</button>
          <button type="submit" className="h-11 rounded-full bg-[#FF0931] px-4 text-sm text-white">{shop ? "Save branch" : "Add branch"}</button>
        </div>
      </form>
    </Modal>
  );
}
