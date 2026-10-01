"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/app/components/admin/ui/page-header";
import { TableSkeleton } from "@/app/components/admin/ui/skeleton";
import { useSettings } from "@/lib/admin/use-settings";

export default function SettingsPage() {
  const { settings, loading, error, fetchSettings, updateSettings } = useSettings();
  const [deliveryFee, setDeliveryFee] = useState<string>("");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const feeValue = deliveryFee !== "" ? deliveryFee : settings.deliveryFee.toString();
  const thresholdValue = freeDeliveryThreshold !== "" ? freeDeliveryThreshold : settings.freeDeliveryThreshold.toString();

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        deliveryFee: parseFloat(feeValue) || 0,
        freeDeliveryThreshold: parseFloat(thresholdValue) || 0,
      });
      toast.success("Settings saved");
      setDeliveryFee("");
      setFreeDeliveryThreshold("");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-fade-in">
      <PageHeader
        title="Settings"
        description="Set delivery values for the business. These values are saved but checkout does not apply them yet."
      />

      <div className="max-w-2xl">
        {error ? (
          <p role="alert" className="rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
            {error}
          </p>
        ) : loading ? <TableSkeleton rows={3} /> : <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-6 font-display text-xl tracking-wide text-white">
            Delivery Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="delivery-fee" className="mb-1 block text-sm text-white/70">
                Delivery Fee (£)
              </label>
              <input
                id="delivery-fee"
                type="number"
                min="0"
                step="0.01"
                value={feeValue}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-red/50"
              />
              <p className="mt-1 text-xs text-white/30">
                Saved delivery fee. Checkout does not apply this value yet.
              </p>
            </div>
            <div>
              <label htmlFor="free-delivery-threshold" className="mb-1 block text-sm text-white/70">
                Free Delivery Threshold (£)
              </label>
              <input
                id="free-delivery-threshold"
                type="number"
                min="0"
                step="0.01"
                value={thresholdValue}
                onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-red/50"
              />
              <p className="mt-1 text-xs text-white/30">
                Saved threshold for future checkout pricing.
              </p>
            </div>
          </div>

        {/* Save Button */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-press rounded-lg bg-brand-red px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
        </div>}

      </div>
    </div>
  );
}
