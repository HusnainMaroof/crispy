"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check, Info, Trash2 } from "lucide-react";
import PageHeader from "@/app/components/admin/ui/page-header";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import Modal from "@/app/components/admin/ui/modal";
import Dropdown from "@/app/components/admin/ui/dropdown";
import ActionButton from "@/app/components/admin/ui/action-button";
import ConfirmModal from "@/app/components/admin/ui/confirm-modal";
import { TimePicker } from "@/app/components/ui/time-picker";
import { useLocations, type AdminLocation } from "@/lib/admin/use-locations";
import { WEEKDAYS, formatWeekHours, isComingSoonHours, parseWeekHours, type DayHours } from "@/lib/admin/shop-hours";

export default function LocationsPage() {
  const { locations, loading, error, fetchLocations, addLocation, updateLocation, deleteLocation } = useLocations();
  const [editing, setEditing] = useState<AdminLocation | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<AdminLocation | null>(null);
  // Which branch is mid-update, so only that row locks instead of the whole page.
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  const setStatus = async (location: AdminLocation, status: "active" | "inactive") => {
    if (location.status === status || pendingId) return;
    setPendingId(location.id);
    try {
      await updateLocation(location.id, { status });
      toast.success(status === "active" ? `${location.name} is active` : `${location.name} is disabled`);
    } catch {
      toast.error("Could not update branch status");
    } finally {
      setPendingId(null);
    }
  };

  const setComingSoon = async (location: AdminLocation) => {
    if (pendingId) return;
    setPendingId(location.id);
    try {
      // A coming soon branch stays listed (status active), it just shows as
      // Coming Soon until real hours are set.
      await updateLocation(location.id, { hours: "Coming Soon", status: "active" });
      toast.success(`${location.name} is marked Coming Soon`);
    } catch {
      toast.error("Could not update branch status");
    } finally {
      setPendingId(null);
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
        description="Address, opening hours, and whether the branch is taking orders. Coming soon branches are listed but shown as Coming Soon. Disabled is for maintenance and is separate from the hours."
        action={
          <ActionButton type="button" onClick={() => setAdding(true)} className="rounded-full px-5">
            Add branch
          </ActionButton>
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
                <th className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {locations.map((location) => {
                const active = location.status !== "inactive";
                const comingSoon = active && isComingSoonHours(location.hours);
                return (
                  <tr key={location.id} className="text-sm">
                    <td className="px-4 py-3 font-medium text-white">{location.name}</td>
                    <td className="px-4 py-3 text-white/70">{location.address}</td>
                    <td className="px-4 py-3 text-white/70">{location.hours}</td>
                    <td className="px-4 py-3 text-white/70">{location.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            comingSoon ? "bg-amber-300" : active ? "bg-green-400" : "bg-white/30"
                          }`}
                          aria-hidden="true"
                        />
                        <Dropdown
                          value={active ? (comingSoon ? "coming_soon" : "active") : "inactive"}
                          disabled={pendingId === location.id}
                          onChange={(value) => {
                            if (value === "coming_soon") {
                              if (!comingSoon) void setComingSoon(location);
                              return;
                            }
                            if (value === "active" && comingSoon) {
                              // Opening a branch needs real hours, so finish in the edit form.
                              toast("Set the opening hours to open this branch");
                              setEditing(location);
                              return;
                            }
                            const next = value === "inactive" ? "inactive" : "active";
                            if (next === location.status) return;
                            void setStatus(location, next);
                          }}
                          options={[
                            { value: "active", label: "Active" },
                            { value: "coming_soon", label: "Coming soon" },
                            { value: "inactive", label: "Disabled" },
                          ]}
                          className="h-11 min-w-32"
                        />
                        {pendingId === location.id && (
                          <span
                            aria-label="Updating branch"
                            className="size-4 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(location)}
                          className="h-11 cursor-pointer rounded-lg border border-white/10 px-4 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(location)}
                          aria-label={`Delete ${location.name}`}
                          title="Delete branch"
                          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-brand-red/40 hover:bg-brand-red/10 hover:text-brand-red focus-visible:outline-2 focus-visible:outline-brand-red"
                        >
                          <Trash2 aria-hidden className="size-4" />
                        </button>
                      </div>
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
      {deleting && (
        <ConfirmModal
          title={`Delete ${deleting.name}?`}
          message={`This removes the branch and its saved menu and deals. Orders already placed against it are kept but lose the branch link. This cannot be undone.`}
          confirmLabel="Delete branch"
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteLocation(deleting.id);
            toast.success(`${deleting.name} deleted`);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}

const fieldCls =
  "h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 hover:border-white/20 focus:border-[#FF0931] focus:ring-2 focus:ring-[#FF0931]/25";

function ShopForm({
  title,
  shop,
  onSave,
  onClose,
}: {
  title: string;
  shop?: AdminLocation;
  onSave: (data: { name: string; address: string; hours: string; phone: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(shop?.name ?? "");
  const [address, setAddress] = useState(shop?.address ?? "");
  const [phone, setPhone] = useState(shop?.phone ?? "");
  const [week, setWeek] = useState<DayHours[]>(() => parseWeekHours(shop?.hours ?? ""));
  const [comingSoon, setComingSoon] = useState(() =>
    shop ? isComingSoonHours(shop.hours) : false,
  );
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const openDays = week.filter(Boolean).length;

  const setDay = (day: number, next: DayHours) => {
    setWeek((current) => current.map((hours, index) => index === day ? next : hours));
  };

  /** Copies one day's hours onto every other day. Saves setting seven rows by hand. */
  const applyToAll = (source: DayHours | null) => {
    setWeek((current) => current.map(() => (source ? { ...source } : null)));
    setFieldError("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    // Guards the double submit that would create the branch twice.
    if (saving) return;
    if (!comingSoon && week.every((hours) => hours === null)) {
      setFieldError("Open at least one weekday before saving this branch.");
      return;
    }
    setFieldError("");
    setSaving(true);
    try {
      await onSave({
        name,
        address,
        phone,
        hours: comingSoon ? "Coming Soon" : formatWeekHours(week),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={title} busy={saving} size="wide">
      <form onSubmit={submit} className="space-y-6">
        <fieldset disabled={saving} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="branch-name" className="mb-1.5 block text-sm text-white/60">
                Branch name
              </label>
              <input
                id="branch-name"
                required
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Crispy Wembley"
                className={fieldCls}
              />
            </div>
            <div>
              <label htmlFor="branch-phone" className="mb-1.5 block text-sm text-white/60">
                Phone
              </label>
              <input
                id="branch-phone"
                required
                type="tel"
                maxLength={40}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="020 7946 0000"
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label htmlFor="branch-address" className="mb-1.5 block text-sm text-white/60">
              Address
            </label>
            <input
              id="branch-address"
              required
              maxLength={300}
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="123 High Street, Wembley, HA9 7AA"
              className={fieldCls}
            />
          </div>
        </fieldset>

        <fieldset disabled={saving}>
          <legend className="text-sm font-medium text-white">Branch status</legend>
          <p className="mt-1 text-xs leading-relaxed text-white/45">
            Active branches are open and take orders. Coming soon branches stay on the site but show as
            Coming Soon until their hours are set.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={!comingSoon}
              onClick={() => setComingSoon(false)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors ${
                !comingSoon
                  ? "border-green-500/40 bg-green-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/25"
              }`}
            >
              <span
                aria-hidden
                className={`size-2.5 shrink-0 rounded-full ${!comingSoon ? "bg-green-400" : "bg-white/30"}`}
              />
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${!comingSoon ? "text-green-200" : "text-white/70"}`}>
                  Active
                </span>
                <span className="block text-xs text-white/45">Open and taking orders</span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={comingSoon}
              onClick={() => setComingSoon(true)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors ${
                comingSoon
                  ? "border-amber-400/40 bg-amber-400/10"
                  : "border-white/10 bg-white/5 hover:border-white/25"
              }`}
            >
              <span
                aria-hidden
                className={`size-2.5 shrink-0 rounded-full ${comingSoon ? "bg-amber-300" : "bg-white/30"}`}
              />
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${comingSoon ? "text-amber-200" : "text-white/70"}`}>
                  Coming soon
                </span>
                <span className="block text-xs text-white/45">Listed but not orderable</span>
              </span>
            </button>
          </div>
        </fieldset>

        {comingSoon ? (
          <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-white/40" />
            <p className="text-sm leading-relaxed text-white/60">
              This branch saves with the hours <span className="text-white">Coming Soon</span>. Set its real
              opening hours later to open it.
            </p>
          </div>
        ) : (
          <fieldset disabled={saving}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <legend className="text-sm font-medium text-white">Opening hours</legend>
              <p className="text-xs tabular-nums text-white/45">
                Open {openDays} of 7 days
              </p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-white/45">
              Tick a day and set when it opens and closes. Matching days are saved as a range, such as
              Fri–Sat. This does not disable the branch.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => applyToAll(week[0])}
                className="cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Copy Monday to all days
              </button>
              <button
                type="button"
                onClick={() => applyToAll(null)}
                className="cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Close the whole week
              </button>
            </div>

            <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
              <div className="hidden grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-wider text-white/40 sm:grid">
                <span>Day</span>
                <span>Opens</span>
                <span>Closes</span>
              </div>
              <ul className="divide-y divide-white/5">
                {WEEKDAYS.map(({ day, label }) => {
                  const hours = week[day];
                  return (
                    <li
                      key={label}
                      className="grid grid-cols-2 items-center gap-2 px-4 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)_minmax(0,1fr)] sm:gap-3"
                    >
                      <label className="col-span-2 flex cursor-pointer items-center gap-3 sm:col-span-1">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={Boolean(hours)}
                          onChange={() => {
                            setFieldError("");
                            setDay(day, hours ? null : { open: "11:00", close: "23:00" });
                          }}
                        />
                        <span
                          aria-hidden
                          className="flex size-5 shrink-0 items-center justify-center rounded border border-white/25 bg-white/5 transition-colors peer-checked:border-[#FF0931] peer-checked:bg-[#FF0931] peer-focus-visible:ring-2 peer-focus-visible:ring-[#FF0931] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0b0b0b]"
                        >
                          {hours && <Check className="size-3.5 text-white" />}
                        </span>
                        <span className={`text-sm ${hours ? "text-white" : "text-white/60"}`}>{label}</span>
                      </label>
                      {hours ? (
                        <>
                          <TimePicker
                            compact
                            labelText={`${label} opens`}
                            value={hours.open}
                            onChange={(open) => setDay(day, { ...hours, open })}
                          />
                          <TimePicker
                            compact
                            labelText={`${label} closes`}
                            value={hours.close}
                            onChange={(close) => setDay(day, { ...hours, close })}
                          />
                        </>
                      ) : (
                        <p className="col-span-2 text-sm text-white/35 sm:pl-8">
                          Closed all day
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            {shop?.hours && (
              <p className="mt-2 text-xs text-white/40">Currently saved: {shop.hours}</p>
            )}
          </fieldset>
        )}

        {fieldError && (
          <p role="alert" className="rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
            {fieldError}
          </p>
        )}

        {/* Sticky so Save stays reachable however long the hours list gets. */}
        <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap justify-end gap-3 border-t border-white/10 bg-[#0b0b0b]/95 px-6 py-4 backdrop-blur">
          <ActionButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            className="rounded-full"
          >
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            busy={saving}
            busyLabel={shop ? "Saving…" : "Adding…"}
            className="rounded-full"
          >
            {shop ? "Save branch" : "Add branch"}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}
