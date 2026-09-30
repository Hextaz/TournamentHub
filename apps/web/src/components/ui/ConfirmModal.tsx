"use client";

import React, { useId, useState } from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { Dialog } from "./Dialog";

type ConfirmVariant = "danger" | "warning" | "primary" | "success";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  isLoading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  /** Phrase à retaper à l'identique pour débloquer la confirmation (actions destructives irréversibles). */
  confirmPhrase?: string;
}

const VARIANT_STYLES: Record<ConfirmVariant, { icon: React.ComponentType<{ className?: string }>; iconBg: string; button: string }> = {
  primary: {
    icon: Info,
    iconBg: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    button: "bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500",
  },
  danger: {
    icon: AlertCircle,
    iconBg: "bg-red-500/10 text-red-400 border border-red-500/20",
    button: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    button: "bg-amber-600 hover:bg-amber-500 text-white focus:ring-amber-500",
  },
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    button: "bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500",
  },
};

export function ConfirmModal({ isOpen, onClose, isLoading = false, ...contentProps }: ConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog isOpen={isOpen} onClose={onClose} isLoading={isLoading} labelledBy={titleId} describedBy={descriptionId}>
      {/* Monté uniquement à l'ouverture : la saisie de confirmation repart de zéro à chaque ouverture. */}
      <ConfirmModalContent
        {...contentProps}
        onClose={onClose}
        isLoading={isLoading}
        titleId={titleId}
        descriptionId={descriptionId}
      />
    </Dialog>
  );
}

function ConfirmModalContent({
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = "primary",
  isLoading,
  icon: CustomIcon,
  confirmPhrase,
  titleId,
  descriptionId,
}: Omit<ConfirmModalProps, "isOpen" | "isLoading"> & { isLoading: boolean; titleId: string; descriptionId: string }) {
  const { t } = useTranslation();
  const [typedPhrase, setTypedPhrase] = useState("");
  const phraseId = useId();

  const styles = VARIANT_STYLES[variant];
  const IconComponent = CustomIcon ?? styles.icon;
  const phraseMatches = confirmPhrase === undefined || typedPhrase.trim() === confirmPhrase;

  return (
    <>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl shrink-0 ${styles.iconBg}`}>
          <IconComponent className="w-6 h-6" />
        </div>

        <div className="flex-1 pr-4">
          <h3 id={titleId} className="text-lg font-bold text-white mb-2 leading-tight">
            {title}
          </h3>
          <div id={descriptionId} className="text-slate-300 text-sm leading-relaxed space-y-2">
            {typeof description === "string" ? <p>{description}</p> : description}
          </div>
        </div>
      </div>

      {confirmPhrase !== undefined && (
        <div className="mt-4 space-y-2">
          <label htmlFor={phraseId} className="block text-sm text-slate-300">
            {t("common.typeToConfirm", { phrase: confirmPhrase })}
          </label>
          <input
            id={phraseId}
            type="text"
            value={typedPhrase}
            onChange={(e) => setTypedPhrase(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
            data-autofocus
            className="w-full bg-slate-950/80 border border-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-all"
          />
        </div>
      )}

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          data-autofocus={confirmPhrase === undefined ? true : undefined}
          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {cancelText ?? t("common.cancel")}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading || !phraseMatches}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${styles.button}`}
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {confirmText ?? t("common.confirm")}
        </button>
      </div>
    </>
  );
}
