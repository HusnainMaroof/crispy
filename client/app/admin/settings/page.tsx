"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/ui/page-header";
import { useSettings } from "@/lib/admin/use-settings";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [deliveryFee, setDeliveryFee] = useState(settings.deliveryFee.toString());
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(
    settings.freeDeliveryThreshold.toString()
  );
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({
      deliveryFee: parseFloat(deliveryFee) || 0,
      freeDeliveryThreshold: parseFloat(freeDeliveryThreshold) || 0,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your business settings and delivery options."
      />

      <div className="max-w-2xl">
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
                value={deliveryFee}
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
                value={freeDeliveryThreshold}
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
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            className="rounded-lg bg-brand-red px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Save Changes
          </button>
          {saved && (
            <span className="text-sm text-green-400">Settings saved successfully!</span>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          <h2 className="mb-4 font-display text-xl tracking-wide text-white">
            About
          </h2>
          <div className="space-y-2 text-sm text-white/50">
            <p>Crispies Admin Dashboard v0.1.0</p>
            <p>Built with Next.js 16, React 19, and Tailwind CSS v4.</p>
            <p className="mt-4 text-xs text-white/30">
              Note: This is a mock admin interface. Data is stored locally and will
              reset on page refresh. A backend API will be added in a future update.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
