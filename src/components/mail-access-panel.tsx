"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Copy, Eye, EyeOff, ExternalLink, LayoutTemplate, Lock } from "lucide-react";
import { usePreferences } from "@/context/preferences-provider";
import type { MessageKey } from "@/lib/i18n/messages";

type Credentials = {
  ionosUsername: string;
  companyEmail: string;
  ionosPassword: string;
};

type CopyKey = "ionosUsername" | "companyEmail" | "ionosPassword";

function mapUnlockError(code: string | undefined, t: (k: MessageKey) => string): string {
  switch (code) {
    case "mail_unlock_incorrect_password":
      return t("mail.errorIncorrect");
    case "mail_unlock_not_configured":
      return t("mail.errorNotConfigured");
    case "mail_unlock_invalid_body":
      return t("mail.errorInvalid");
    default:
      return t("mail.errorGeneric");
  }
}

function copyDoneKey(field: CopyKey): MessageKey {
  if (field === "ionosUsername") return "mail.copyDoneUsername";
  if (field === "companyEmail") return "mail.copyDoneEmail";
  return "mail.copyDonePassword";
}

export function MailAccessPanel({ webmailUrl }: { webmailUrl: string }) {
  const { t } = usePreferences();
  const modalTitleId = useId();
  const helperId = useId();

  const [modalOpen, setModalOpen] = useState(false);
  const [masterInput, setMasterInput] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<CopyKey | null>(null);

  const openWebmail = useCallback(() => {
    const url = webmailUrl.trim();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [webmailUrl]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setMasterInput("");
    setUnlockError(null);
  }, []);

  const unlock = useCallback(async () => {
    setUnlockError(null);
    setUnlocking(true);
    try {
      const res = await fetch("/api/mail/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: masterInput }),
      });
      const data = (await res.json().catch(() => null)) as
        | ({ code?: string } & Partial<Credentials>)
        | null;
      if (!res.ok) {
        setUnlockError(mapUnlockError(data?.code, t));
        return;
      }
      if (
        data &&
        typeof data.ionosUsername === "string" &&
        typeof data.companyEmail === "string" &&
        typeof data.ionosPassword === "string"
      ) {
        setCredentials({
          ionosUsername: data.ionosUsername,
          companyEmail: data.companyEmail,
          ionosPassword: data.ionosPassword,
        });
        setShowPassword(false);
        closeModal();
      }
    } finally {
      setUnlocking(false);
    }
  }, [closeModal, masterInput, t]);

  const copyValue = useCallback(async (key: CopyKey, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
    } catch {
      setCopiedKey(null);
    }
  }, []);

  useEffect(() => {
    if (!copiedKey) return;
    const timer = window.setTimeout(() => setCopiedKey(null), 2200);
    return () => window.clearTimeout(timer);
  }, [copiedKey]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, closeModal]);

  const lockPanel = useCallback(() => {
    setCredentials(null);
    setShowPassword(false);
  }, []);

  const cardShell =
    "group flex h-full flex-col rounded-[2rem] bg-gradient-to-br p-8 shadow-card ring-1 ring-brand-soft/80 transition duration-300 hover:-translate-y-0.5 hover:shadow-lift dark:ring-zinc-700/70";

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-fade-up px-0">
      <header className="space-y-2 text-center sm:text-left">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{t("mail.workspaceTitle")}</h1>
        <p className="mx-auto max-w-2xl text-sm text-ink-muted sm:mx-0">{t("mail.workspaceIntro")}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Open IONOS */}
        <div className={`${cardShell} from-brand-soft to-white dark:from-zinc-900 dark:to-zinc-950`}>
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/95 text-brand shadow-inner ring-1 ring-brand-soft transition group-hover:scale-[1.03] dark:bg-zinc-900/95 dark:ring-zinc-700">
            <ExternalLink className="h-11 w-11" strokeWidth={1.35} aria-hidden />
          </div>
          <h2 className="font-display text-2xl text-ink">{t("mail.cardIonosTitle")}</h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{t("mail.cardIonosDesc")}</p>
          <button
            type="button"
            onClick={openWebmail}
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-dark"
          >
            {t("mail.cardIonosCta")}
          </button>
        </div>

        {/* Card 2: Mail credentials */}
        <div className={`${cardShell} from-white to-brand-soft/90 dark:from-zinc-950 dark:to-zinc-900`}>
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/95 text-brand shadow-inner ring-1 ring-brand-soft transition group-hover:scale-[1.03] dark:bg-zinc-900/95 dark:ring-zinc-700">
            <Lock className="h-11 w-11" strokeWidth={1.35} aria-hidden />
          </div>
          <h2 className="font-display text-2xl text-ink">{t("mail.cardCredentialsTitle")}</h2>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{t("mail.cardCredentialsDesc")}</p>
          <button
            type="button"
            onClick={() => {
              setUnlockError(null);
              setModalOpen(true);
            }}
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl border-2 border-brand bg-white/90 px-5 py-3.5 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-brand-soft/50 dark:border-brand-light dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {t("mail.cardCredentialsCta")}
          </button>
        </div>

        {/* Card 3: Templates (placeholder) */}
        <div
          className={`${cardShell} cursor-default from-brand-muted/30 to-white opacity-90 dark:from-zinc-900 dark:to-zinc-950 dark:opacity-95 md:col-span-2 lg:col-span-1`}
        >
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/80 text-brand/70 shadow-inner ring-1 ring-brand-soft/70 dark:bg-zinc-900/80">
            <LayoutTemplate className="h-11 w-11" strokeWidth={1.35} aria-hidden />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl text-ink">{t("mail.cardTemplatesTitle")}</h2>
            <span className="rounded-full bg-brand-soft/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-dark dark:bg-zinc-800 dark:text-brand-light">
              {t("mail.cardTemplatesBadge")}
            </span>
          </div>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{t("mail.cardTemplatesDesc")}</p>
          <button
            type="button"
            disabled
            className="mt-8 inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border border-brand-soft/80 bg-white/60 px-5 py-3.5 text-sm font-semibold text-ink-muted dark:border-zinc-700 dark:bg-zinc-900/50"
          >
            {t("mail.cardTemplatesBadge")}
          </button>
        </div>
      </div>

      {credentials ? (
        <section
          className="animate-fade-up space-y-6 rounded-[2rem] border border-brand-soft/60 bg-[var(--surface-muted)] p-8 shadow-lift ring-1 ring-brand-soft/50 dark:border-zinc-700/80 dark:ring-zinc-800/80"
          aria-label={t("mail.credentialsPanelTitle")}
        >
          <div className="flex flex-col gap-2 border-b border-brand-soft/50 pb-4 dark:border-zinc-700/80 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl text-ink">{t("mail.credentialsPanelTitle")}</h2>
              <p className="mt-1 max-w-2xl text-xs text-ink-muted">{t("mail.credentialsDemoHint")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-soft bg-white px-3 py-1.5 text-xs font-medium text-brand-dark transition hover:bg-brand-soft/40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" aria-hidden /> : <Eye className="h-3.5 w-3.5" aria-hidden />}
                {showPassword ? t("mail.hidePassword") : t("mail.showPassword")}
              </button>
              <button
                type="button"
                onClick={lockPanel}
                className="rounded-full border border-brand-soft px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-brand-soft/30 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                {t("mail.lock")}
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-1">
            <CredentialRow
              label={t("mail.ionosUsername")}
              value={credentials.ionosUsername}
              masked={false}
              copied={copiedKey === "ionosUsername"}
              notSetLabel={t("mail.notSet")}
              copyLabel={t("mail.copy")}
              copiedLabel={t(copyDoneKey("ionosUsername"))}
              onCopy={() => void copyValue("ionosUsername", credentials.ionosUsername)}
            />
            <CredentialRow
              label={t("mail.companyEmail")}
              value={credentials.companyEmail}
              masked={false}
              copied={copiedKey === "companyEmail"}
              notSetLabel={t("mail.notSet")}
              copyLabel={t("mail.copy")}
              copiedLabel={t(copyDoneKey("companyEmail"))}
              onCopy={() => void copyValue("companyEmail", credentials.companyEmail)}
            />
            <CredentialRow
              label={t("mail.ionosPassword")}
              value={credentials.ionosPassword}
              masked={!showPassword}
              copied={copiedKey === "ionosPassword"}
              notSetLabel={t("mail.notSet")}
              copyLabel={t("mail.copy")}
              copiedLabel={t(copyDoneKey("ionosPassword"))}
              onCopy={() => void copyValue("ionosPassword", credentials.ionosPassword)}
            />
          </div>
        </section>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity dark:bg-black/70"
            aria-label={t("mail.cancel")}
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            aria-describedby={helperId}
            className="relative z-10 w-full max-w-xl animate-fade-up rounded-[2rem] border border-brand-soft/70 bg-[var(--surface-muted)] p-8 shadow-2xl ring-1 ring-black/5 dark:border-zinc-600/80 dark:bg-zinc-950 dark:ring-white/10 sm:p-10"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={modalTitleId} className="font-display text-2xl text-ink sm:text-[1.65rem]">
              {t("mail.modalTitle")}
            </h2>
            <p id={helperId} className="mt-3 text-sm leading-relaxed text-ink-muted">
              {t("mail.modalHelper")}
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                void unlock();
              }}
            >
              <div className="space-y-2">
                <label htmlFor="mail-master-password" className="block text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {t("mail.passwordLabel")}
                </label>
                <input
                  id="mail-master-password"
                  type="password"
                  autoComplete="off"
                  value={masterInput}
                  onChange={(e) => setMasterInput(e.target.value)}
                  className="w-full rounded-2xl border border-brand-soft/90 bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none ring-brand/0 transition focus:border-brand focus:ring-2 focus:ring-brand/25 dark:border-zinc-600 dark:bg-zinc-900 dark:focus:ring-brand/30"
                  autoFocus
                  aria-invalid={unlockError ? true : undefined}
                  aria-describedby={unlockError ? "mail-unlock-error" : undefined}
                />
                {unlockError ? (
                  <p
                    id="mail-unlock-error"
                    className="rounded-xl bg-red-500/[0.08] px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
                    role="alert"
                  >
                    {unlockError}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-brand-soft/40 pt-6 dark:border-zinc-700/80">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-brand-soft bg-white px-6 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-brand-soft/35 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {t("mail.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={unlocking || !masterInput}
                  className="rounded-full bg-brand px-7 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {unlocking ? t("mail.pleaseWait") : t("mail.unlock")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CredentialRow({
  label,
  value,
  masked,
  copied,
  notSetLabel,
  copyLabel,
  copiedLabel,
  onCopy,
}: {
  label: string;
  value: string;
  masked: boolean;
  copied: boolean;
  notSetLabel: string;
  copyLabel: string;
  copiedLabel: string;
  onCopy: () => void;
}) {
  const display = !value ? notSetLabel : masked ? "••••••••" : value;
  return (
    <div className="rounded-2xl border border-brand-soft/70 bg-white/90 p-5 shadow-sm dark:border-zinc-600/80 dark:bg-zinc-900/90">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
          <p className={`break-all text-sm font-medium text-ink ${masked ? "font-mono tracking-widest" : ""}`}>{display}</p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!value}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-brand-soft bg-white px-4 py-2 text-xs font-semibold text-brand-dark shadow-sm transition hover:border-brand-light hover:shadow-md disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}
