"use client";

import React, { useId, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { Dialog } from "./Dialog";
import { validatePromptValue } from "./promptValidation";

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void | Promise<void>;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: "text" | "number";
  min?: number;
  max?: number;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function PromptModal({ isOpen, onClose, isLoading = false, description, ...contentProps }: PromptModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      isLoading={isLoading}
      labelledBy={titleId}
      {...(description ? { describedBy: descriptionId } : {})}
    >
      {/* Monté uniquement à l'ouverture : la saisie repart de `defaultValue` à chaque ouverture. */}
      <PromptModalContent
        {...contentProps}
        {...(description ? { description } : {})}
        onClose={onClose}
        isLoading={isLoading}
        titleId={titleId}
        descriptionId={descriptionId}
      />
    </Dialog>
  );
}

function PromptModalContent({
  onClose,
  onSubmit,
  title,
  description,
  placeholder = "",
  defaultValue = "",
  inputType = "text",
  min,
  max,
  confirmText,
  cancelText,
  isLoading,
  titleId,
  descriptionId,
}: Omit<PromptModalProps, "isOpen" | "isLoading"> & { isLoading: boolean; titleId: string; descriptionId: string }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue);

  const rules = {
    inputType,
    ...(min !== undefined ? { min } : {}),
    ...(max !== undefined ? { max } : {}),
  };
  const isValid = validatePromptValue(value, rules);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;
    onSubmit(value.trim());
  };

  return (
    <>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl shrink-0 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="flex-1 pr-4">
          <h3 id={titleId} className="text-lg font-bold text-white mb-1.5 leading-tight">
            {title}
          </h3>
          {description && (
            <p id={descriptionId} className="text-slate-400 text-sm leading-relaxed mb-4">
              {description}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-5">
        <div>
          <input
            type={inputType}
            min={min}
            max={max}
            step={inputType === "number" ? 1 : undefined}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-labelledby={titleId}
            aria-invalid={!isValid}
            data-autofocus
            className="w-full bg-slate-950/80 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText ?? t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={isLoading || !isValid}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText ?? t("common.validate")}
          </button>
        </div>
      </form>
    </>
  );
}
