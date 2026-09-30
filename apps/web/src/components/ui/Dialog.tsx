"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/** Maintient la navigation clavier (Tab / Maj+Tab) à l'intérieur du panneau de la modale. */
function trapFocus(event: KeyboardEvent, container: HTMLElement) {
  const focusable = getFocusableElements(container);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (!first || !last) {
    event.preventDefault();
    container.focus();
    return;
  }

  const active = document.activeElement;
  if (!container.contains(active)) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Bloque la fermeture (Échap, clic extérieur, bouton ✕) pendant une action en cours. */
  isLoading?: boolean;
  labelledBy: string;
  describedBy?: string;
  children: React.ReactNode;
}

/**
 * Socle accessible des modales : fond, fermeture (Échap / clic extérieur / ✕), focus initial
 * (élément `[data-autofocus]` sinon premier focusable), focus piégé et restitué à la fermeture.
 */
export function Dialog({ isOpen, onClose, isLoading = false, labelledBy, describedBy, children }: DialogProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const initial = panel.querySelector<HTMLElement>("[data-autofocus]") ?? getFocusableElements(panel)[0] ?? panel;
    initial.focus();

    return () => previouslyFocused?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      } else if (e.key === "Tab" && panelRef.current) {
        trapFocus(e, panelRef.current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full relative transform transition-all animate-in zoom-in-95 duration-200 outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label={t("common.close")}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}
