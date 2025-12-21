"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "./modal";
import { Button } from "./button";
import { toast } from "sonner";
import { api } from "../services/api";
import { useStore } from "../store/onboardingStore";
import { Link2, ShieldCheck, Sparkles } from "lucide-react";

interface KucoinUidModalProps {
  open: boolean;
  onClose: () => void;
}

const KUCOIN_UID_REGEX = /^[0-9]{6,20}$/;

const QUICK_STEPS = [
  { title: "Open Profile", description: "Go to KuCoin > Profile and tap UID." },
  { title: "Copy Digits", description: "Grab the numeric identifier only." },
  { title: "Link & Secure", description: "Keep rewards attribution seamless." },
];

const HELPER_TIPS = [
  "We never request API keys or passwords - only the UID.",
  "You can update your UID anytime from your Helios profile.",
];

const KucoinUidModal: React.FC<KucoinUidModalProps> = ({ open, onClose }) => {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const fetchUser = useStore((state) => state.fetchUser);
  const [uid, setUid] = useState(user?.kucoinUID || "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setUid(user?.kucoinUID || "");
      setError(null);
    }
  }, [open, user?.kucoinUID]);

  const handleUidChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 20);
    if (user?.kucoinUID && digitsOnly.length === 0) {
      return;
    }
    setUid(digitsOnly);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUid = uid.trim();

    if (trimmedUid.length === 0) {
      setError("KuCoin UID cannot be empty.");
      return;
    }

    if (!KUCOIN_UID_REGEX.test(trimmedUid)) {
      setError("Enter a valid KuCoin UID (6 to 20 digits).");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await api.linkKucoinUID(trimmedUid);
      toast.success(
        result?.message || "KuCoin UID linked successfully."
      );

      if (user?.wallet) {
        try {
          await fetchUser();
        } catch (refreshError) {
          console.error("Failed to refresh user after linking KuCoin UID:", refreshError);
          setUser({ ...user, kucoinUID: trimmedUid });
        }
      }

      onClose();
    } catch (err: any) {
      const message = err?.message || "Could not link this KuCoin UID.";
      toast.error(message);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Connect Your KuCoin UID" onClose={onClose} open={open}>
      <form onSubmit={handleSubmit} className="space-y-5 text-[#060F32]">
        <div className="rounded-2xl border border-[#E1E6FF] bg-white/95 p-5 shadow-[0_12px_40px_-25px_rgba(6,15,50,0.45)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D9E0FF] bg-[#EEF2FF] text-[#0F3ADB]">
              <Link2 className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#0C1F67] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  KuCoin linking
                </span>
                {user?.kucoinUID && (
                  <span className="rounded-full border border-[#D7DEFF] bg-[#F6F8FF] px-3 py-1 text-[11px] font-medium text-[#3A4375]">
                    Current UID: {user.kucoinUID}
                  </span>
                )}
              </div>
              <h3 className="text-base font-semibold">Keep your KuCoin identity synced with Helios</h3>
              <p className="text-sm text-[#4A5275]">
                We store the numeric UID only to align rewards and protect your bridge experience.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {QUICK_STEPS.map((step) => (
              <div
                key={step.title}
                className="rounded-xl border border-[#E5E9FF] bg-[#F8F9FF] px-3 py-3 text-xs text-[#3A4375]"
              >
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[#7C84B8]">
                  {step.title}
                </div>
                <p className="mt-1 font-medium leading-relaxed text-[#1E2754]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[#E1E6FF] bg-white p-5 shadow-[0_8px_32px_-22px_rgba(6,15,50,0.5)]">
          <label className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1B2453]">
                KuCoin UID
              </span>
              <span className="flex items-center gap-1 rounded-full bg-[#EEF2FF] px-2 py-1 text-[11px] text-[#4A5B8F]">
                <ShieldCheck className="h-4 w-4 text-[#1FA971]" />
                Secure & encrypted
              </span>
              <span className="text-[11px] text-[#8A94C1]">6 to 20 digits</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[#D5DBFF] bg-[#F7F8FF] px-4 py-2.5 transition focus-within:border-[#7788FF] focus-within:ring-2 focus-within:ring-[#E3E7FF]">
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                maxLength={20}
                value={uid}
                onChange={(e) => handleUidChange(e.target.value)}
                placeholder="123456789"
                className="w-full bg-transparent text-base font-semibold tracking-[0.08em] text-[#060F32] placeholder:font-normal placeholder:tracking-normal focus:outline-none"
              />
              <span className="ml-auto text-[11px] text-[#7C8EC3]">UID</span>
            </div>
          </label>

          <div className="mt-4 space-y-3 rounded-xl border border-[#E8ECFF] bg-[#F6F8FF] px-4 py-3 text-sm text-[#46517C]">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-[#1F2CA6]" />
              <p>Open KuCoin &gt; Profile &gt; UID and copy the digits only.</p>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-[#5A638E]">
              {HELPER_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            variant="secondary"
            border
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            hovering
            disabled={submitting || uid.trim().length === 0}
            className="w-full sm:w-auto"
          >
            {submitting ? "Saving..." : user?.kucoinUID ? "Update my UID" : "Link my UID"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default KucoinUidModal;
