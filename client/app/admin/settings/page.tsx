"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "@/components/admin/ui/page-header";
import { useSettings } from "@/lib/admin/use-settings";

export default function SettingsPage() {
  const { settings, loading, fetchSettings, updateSettings } = useSettings();
  const [deliveryFee, setDeliveryFee] = useState<string>("");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
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
        description="Configure your business settings and delivery options."
      />

      <div className="max-w-2xl">
        {loading && (
          <p className="mb-4 text-sm text-white/50">Loading settings...</p>
        )}

        {/* Delivery Settings */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-6 font-display text-xl tracking-wide text-white">
            Delivery Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-white/50">
                Delivery Fee (£)
              </label>
              <input
                type="number"
                step="0.01"
                value={feeValue}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-red/50"
              />
              <p className="mt-1 text-xs text-white/30">
                The fee charged for delivery orders.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/50">
                Free Delivery Threshold (£)
              </label>
              <input
                type="number"
                step="0.01"
                value={thresholdValue}
                onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-red/50"
              />
              <p className="mt-1 text-xs text-white/30">
                Orders above this amount get free delivery.
              </p>
            </div>
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

        {/* Info */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 font-display text-xl tracking-wide text-white">
            About
          </h2>
          <div className="space-y-2 text-sm text-white/50">
            <p>Crispies Admin Dashboard v0.1.0</p>
            <p>Built with Next.js 16, React 19, and Tailwind CSS v4.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
