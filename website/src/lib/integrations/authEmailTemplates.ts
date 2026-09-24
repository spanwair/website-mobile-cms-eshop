// Bilingual (CS/EN) renderers for Supabase Auth emails, sent via the Send Email Hook
// (see api/auth/send-email-hook.ts) through OCI Email Delivery. Copy mirrors the original
// supabase/templates/*.html so nothing changes visually for the recipient.
import type { AppLanguage } from "@shared/i18n/getT";
import { emailShell, ctaBlock } from "./emailLayout";

export type AuthEmailAction = "signup" | "magiclink" | "recovery" | "invite" | "email_change";

interface Copy {
  subtitle: string; intro: string; cta: string; expiry: string; ignore: string; subject: string;
}

const en: Record<AuthEmailAction, Copy> = {
  signup: {
    subtitle: "Confirm your email address",
    intro: "Thanks for signing up! Click the button below to confirm your email address and finish creating your account.",
    cta: "Confirm email address", expiry: "Link expires in 24 hours.",
    ignore: "If you didn't create this account, you can safely ignore this email.",
    subject: "Confirm your email",
  },
  magiclink: {
    subtitle: "Your sign-in link",
    intro: "Click the button below to sign in. This link expires in 1 hour and can only be used once.",
    cta: "Sign in", expiry: "Link expires in 1 hour.",
    ignore: "If you didn't request this link, you can safely ignore this email.",
    subject: "Your sign-in link",
  },
  recovery: {
    subtitle: "Reset your password",
    intro: "We received a request to reset your password. Click the button below to choose a new one.",
    cta: "Reset password", expiry: "Link expires in 1 hour.",
    ignore: "If you didn't request a password reset, you can safely ignore this email.",
    subject: "Reset your password",
  },
  invite: {
    subtitle: "You've been invited",
    intro: "You've been invited to join. Click the button below to accept the invitation and set up your account.",
    cta: "Accept invitation", expiry: "Link expires in 24 hours.",
    ignore: "If you weren't expecting this invitation, you can safely ignore this email.",
    subject: "You've been invited",
  },
  email_change: {
    subtitle: "Confirm your new email",
    intro: "Click the button below to confirm your new email address.",
    cta: "Confirm email address", expiry: "Link expires in 24 hours.",
    ignore: "If you didn't request this change, you can safely ignore this email.",
    subject: "Confirm your new email",
  },
};

const cs: Record<AuthEmailAction, Copy> = {
  signup: {
    subtitle: "Potvrďte svou e-mailovou adresu",
    intro: "Děkujeme za registraci! Klikněte na tlačítko níže pro potvrzení e-mailové adresy a dokončení registrace.",
    cta: "Potvrdit e-mail", expiry: "Odkaz je platný 24 hodin.",
    ignore: "Pokud jste tento účet nevytvářeli, tento e-mail ignorujte.",
    subject: "Potvrďte svůj e-mail",
  },
  magiclink: {
    subtitle: "Váš přihlašovací odkaz",
    intro: "Klikněte na tlačítko níže pro přihlášení. Odkaz je platný 1 hodinu a lze jej použít pouze jednou.",
    cta: "Přihlásit se", expiry: "Odkaz vyprší za 1 hodinu.",
    ignore: "Pokud jste tento odkaz nepožadovali, tento e-mail ignorujte.",
    subject: "Váš přihlašovací odkaz",
  },
  recovery: {
    subtitle: "Obnovení hesla",
    intro: "Obdrželi jsme žádost o obnovení vašeho hesla. Klikněte na tlačítko níže pro nastavení nového hesla.",
    cta: "Obnovit heslo", expiry: "Odkaz vyprší za 1 hodinu.",
    ignore: "Pokud jste obnovení hesla nepožadovali, tento e-mail ignorujte.",
    subject: "Obnovení hesla",
  },
  invite: {
    subtitle: "Byli jste pozváni",
    intro: "Byli jste pozváni ke spolupráci. Klikněte na tlačítko níže pro přijetí pozvánky a nastavení účtu.",
    cta: "Přijmout pozvánku", expiry: "Odkaz je platný 24 hodin.",
    ignore: "Pokud jste tuto pozvánku neočekávali, tento e-mail ignorujte.",
    subject: "Byli jste pozváni",
  },
  email_change: {
    subtitle: "Potvrďte svou novou e-mailovou adresu",
    intro: "Klikněte na tlačítko níže pro potvrzení své nové e-mailové adresy.",
    cta: "Potvrdit e-mail", expiry: "Odkaz je platný 24 hodin.",
    ignore: "Pokud jste tuto změnu nepožadovali, tento e-mail ignorujte.",
    subject: "Potvrďte svůj nový e-mail",
  },
};

export function renderAuthEmail(opts: {
  action: AuthEmailAction;
  lang: AppLanguage;
  actionUrl: string;
  siteUrl: string;
  headerTitle?: string;
}): { subject: string; html: string } {
  const c = (opts.lang === "en" ? en : cs)[opts.action];
  const body = `
    <p style="margin:0 0 32px;color:#4b5563;font-size:15px;line-height:1.7">${c.intro}</p>
    ${ctaBlock(opts.actionUrl, c.cta, c.expiry)}
    <p style="margin:32px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;text-align:center">${c.ignore}</p>`;
  return {
    subject: c.subject,
    html: emailShell({ lang: opts.lang, headerTitle: opts.headerTitle, subtitle: c.subtitle, bodyHtml: body, siteUrl: opts.siteUrl }),
  };
}
