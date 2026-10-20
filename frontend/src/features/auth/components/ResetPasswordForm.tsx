"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, ArrowLeft } from "lucide-react";

import { resetPasswordSchema } from "../auth.schema";
import { authService } from "../auth.service";
import useAuthStore from "../store";
import { getErrorMessage } from "@/src/shared/api/get-error-message";
import { translateNow } from "@/src/shared/i18n/translate";
import type { MessageKey } from "@/src/shared/i18n/messages";
import { Button } from "@/src/shared/ui/button";
import { AuthInput } from "./AuthInput";
import { useI18n, useUrlLocalePath } from "@/src/shared/i18n/use-i18n";

export const ResetPasswordForm: React.FC = () => {
  const { t } = useI18n();
  const up = useUrlLocalePath();
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [form, setForm] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmNewPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (token) return;

    // Wait until initial session check completes
    if (status === "checking") return;

    const isAuthorized = status === "authenticated" || Boolean(accessToken);
    if (isAuthorized) {
      router.replace(up("/account"));
    } else {
      router.replace(up("/request-password-reset"));
    }
  }, [token, status, accessToken, router, up]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const result = resetPasswordSchema.safeParse({
      token: token ?? "",
      newPassword: form.newPassword,
      confirmNewPassword: form.confirmNewPassword,
    });

    if (result.success) {
      setErrors({});
      return true;
    }

    const nextErrors: { newPassword?: string; confirmNewPassword?: string } =
      {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as "newPassword" | "confirmNewPassword";
      if (field && !nextErrors[field]) {
        nextErrors[field] = translateNow(issue.message as MessageKey);
      }
    }
    setErrors(nextErrors);
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error(t("auth.err.tokenRequired"));
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      setIsLoading(true);
      await authService.resetPassword({
        token,
        newPassword: form.newPassword,
        confirmNewPassword: form.confirmNewPassword,
      });
      setIsSuccess(true);
      toast.success(t("auth.resetPassword.success"));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = status === "authenticated" || Boolean(accessToken);

  if (!token) {
    return (
      <main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center justify-center px-4">
        <p className="text-sm text-[var(--m)]">{t("auth.wait")}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md flex-col justify-center px-4 py-8 md:py-16">
      <h1 className="text-2xl font-medium md:text-4xl">
        {t("auth.resetPassword.title")}
      </h1>
      <p className="mt-1 text-[var(--m)]">{t("auth.resetPassword.subtitle")}</p>
      {isSuccess ? (
        <div className="mt-6 space-y-5 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-6 md:p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-medium text-[var(--t)]">
              {t("auth.resetPassword.success")}
            </h2>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href={up("/login")}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--t)] bg-[var(--t)] px-5 py-2 font-medium text-[var(--bg)] hover:opacity-90 transition-opacity"
            >
              {t("auth.signIn")}
            </Link>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="mt-6 space-y-4 rounded-2xl border border-[var(--l)] bg-[var(--s)] p-4 md:p-6"
        >
          <AuthInput
            name="newPassword"
            label={t("auth.resetPassword.newPassword")}
            type="password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="••••••••"
            error={errors.newPassword}
          />

          <AuthInput
            name="confirmNewPassword"
            label={t("auth.resetPassword.confirmNewPassword")}
            type="password"
            autoComplete="new-password"
            value={form.confirmNewPassword}
            onChange={handleChange}
            placeholder="••••••••"
            error={errors.confirmNewPassword}
          />

          <Button
            type="submit"
            className="min-h-11 w-full"
            disabled={isLoading}
          >
            {isLoading ? t("auth.wait") : t("auth.resetPassword.submit")}
          </Button>
        </form>
      )}
      {isAuthenticated ? (
        <Link
          href={up("/account")}
          className="mt-4 inline-flex min-h-11 items-center justify-center text-[var(--m)] hover:text-[var(--t)] transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t("auth.requestPasswordReset.backToAccount")}
        </Link>
      ) : (
        <Link
          href={up("/login")}
          className="mt-4 inline-flex min-h-11 items-center justify-center text-[var(--m)] hover:text-[var(--t)] transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t("auth.requestPasswordReset.backToLogin")}
        </Link>
      )}
    </main>
  );
};
