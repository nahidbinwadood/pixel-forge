"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import QRCode from "qrcode";
import { type FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

/** Runs a form handler with a pending flag; returns [pending, wrapped handler]. */
function useSubmit(fn: (data: FormData, form: HTMLFormElement) => Promise<void>) {
  const [pending, setPending] = useState(false);
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    try {
      await fn(new FormData(e.currentTarget), e.currentTarget);
    } finally {
      setPending(false);
    }
  };
  return [pending, onSubmit] as const;
}

export function VerifyEmailNotice({ email }: { email: string }) {
  const t = useTranslations("settings");
  return (
    <Alert>
      <AlertDescription className="flex flex-wrap items-center gap-2">
        {t("emailUnverified")}
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await authClient.sendVerificationEmail({ email, callbackURL: "/settings" });
            toast.success(t("verificationSent"));
          }}
        >
          {t("resendVerification")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function ProfileForm({ name }: { name: string }) {
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const [pending, onSubmit] = useSubmit(async (data) => {
    const res = await fetch("/api/v1/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.get("name") }),
    });
    if (res.ok) toast.success(tc("saved"));
    else toast.error(tc("error"));
  });
  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="grid flex-1 gap-1.5">
        <Label htmlFor="name">{ta("name")}</Label>
        <Input id="name" name="name" defaultValue={name} required maxLength={80} />
      </div>
      <Button type="submit" disabled={pending}>
        {tc("save")}
      </Button>
    </form>
  );
}

const noop = () => () => {};

export function AppearanceForm() {
  const t = useTranslations("nav");
  const { theme, setTheme } = useTheme();
  // Theme is only known on the client; render a placeholder on the server to avoid a hydration mismatch.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  if (!mounted) return <div className="h-14 max-w-xs" />;
  return (
    <div className="grid max-w-xs gap-1.5">
      <Label htmlFor="theme">{t("theme")}</Label>
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger id="theme">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="system">{t("system")}</SelectItem>
          <SelectItem value="light">{t("light")}</SelectItem>
          <SelectItem value="dark">{t("dark")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function PasswordForm() {
  const t = useTranslations("settings");
  const ta = useTranslations("auth");
  const [pending, onSubmit] = useSubmit(async (data, form) => {
    const { error } = await authClient.changePassword({
      currentPassword: String(data.get("currentPassword")),
      newPassword: String(data.get("newPassword")),
      revokeOtherSessions: true,
    });
    if (error) toast.error(error.message ?? ta("invalidCredentials"));
    else {
      toast.success(t("passwordChanged"));
      form.reset();
    }
  });
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <h3 className="font-medium">{t("changePassword")}</h3>
      <div className="grid gap-1.5">
        <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="newPassword">{t("newPassword")}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
      </div>
      <Button type="submit" variant="outline" className="self-start" disabled={pending}>
        {t("changePassword")}
      </Button>
    </form>
  );
}

export function TwoFactorForm({ enabled }: { enabled: boolean }) {
  const t = useTranslations("settings");
  const ta = useTranslations("auth");
  const [on, setOn] = useState(enabled);
  const [setup, setSetup] = useState<{ totpURI: string; backupCodes: string[] } | null>(null);

  const [pending, onSubmit] = useSubmit(async (data, form) => {
    const password = String(data.get("password"));
    if (on) {
      const { error } = await authClient.twoFactor.disable({ password });
      if (error) return void toast.error(error.message ?? ta("invalidCredentials"));
      setOn(false);
      form.reset();
      return;
    }
    const { data: res, error } = await authClient.twoFactor.enable({ password });
    if (error || !res || !("totpURI" in res)) return void toast.error(error?.message ?? ta("invalidCredentials"));
    setSetup(res);
    form.reset();
  });

  const [verifying, onVerify] = useSubmit(async (data) => {
    const { error } = await authClient.twoFactor.verifyTotp({ code: String(data.get("code")).trim() });
    if (error) return void toast.error(error.message ?? ta("invalidCredentials"));
    setSetup(null);
    setOn(true);
  });

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-medium">
        {t("twoFactor")}: <span className="text-muted-foreground">{on ? t("twoFactorOn") : t("twoFactorOff")}</span>
      </h3>
      {setup ? (
        <form onSubmit={onVerify} className="flex flex-col gap-3">
          <p className="text-sm">{t("scanQr")}</p>
          <TotpQr uri={setup.totpURI} />
          <code className="break-all text-xs text-muted-foreground">{setup.totpURI}</code>
          <p className="text-sm">{t("backupCodes")}</p>
          <pre className="rounded-md bg-muted p-3 text-sm">{setup.backupCodes.join("\n")}</pre>
          <div className="grid gap-1.5">
            <Label htmlFor="totp">{ta("twoFactorCode")}</Label>
            <Input id="totp" name="code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required />
          </div>
          <Button type="submit" className="self-start" disabled={verifying}>
            {ta("verify")}
          </Button>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="flex items-end gap-2">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="2fa-password">{t("confirmPassword")}</Label>
            <Input id="2fa-password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <Button type="submit" variant="outline" disabled={pending}>
            {on ? t("disable2fa") : t("enable2fa")}
          </Button>
        </form>
      )}
    </div>
  );
}

/** Rendered locally: the TOTP secret must never be sent to a third-party QR service. */
function TotpQr({ uri }: { uri: string }) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    void QRCode.toDataURL(uri, { width: 180, margin: 1 }).then(setSrc);
  }, [uri]);
  if (!src) return <div className="size-[180px] rounded-md border bg-muted" />;
  return (
    // biome-ignore lint/performance/noImgElement: local data URL
    <img src={src} alt="QR code for your authenticator app" width={180} height={180} className="rounded-md border" />
  );
}

export function DangerZone() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [confirm, setConfirm] = useState("");

  async function deleteAccount() {
    const res = await fetch("/api/v1/me", { method: "DELETE" });
    if (!res.ok) return void toast.error(tc("error"));
    window.location.assign("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{t("exportDesc")}</p>
        <Button asChild variant="outline" className="self-start">
          <a href="/api/v1/me/export" download>
            {t("export")}
          </a>
        </Button>
      </div>
      <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 p-4">
        <h3 className="font-medium text-destructive">{t("deleteAccount")}</h3>
        <p className="text-sm text-muted-foreground">{t("deleteDesc")}</p>
        <div className="flex items-end gap-2">
          <div className="grid flex-1 gap-1.5">
            <Label htmlFor="confirm-delete">{t("deleteConfirm")}</Label>
            <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button variant="destructive" disabled={confirm !== "DELETE"} onClick={deleteAccount}>
            {t("deleteAccount")}
          </Button>
        </div>
      </div>
    </div>
  );
}
