// Shared HTML shell for all templated emails, matching supabase/templates/*.html
// (indigo→violet gradient header, 600px card, muted footer). Kept as the single
// source of the layout so auth-hook emails render identically to the rest.
import type { AppLanguage } from "@shared/i18n/getT";

export interface ShellOpts {
  lang: AppLanguage;
  headerTitle?: string;
  subtitle: string;
  bodyHtml: string;
  siteUrl: string;
}

export function emailShell({ lang, headerTitle, subtitle, bodyHtml, siteUrl }: ShellOpts): string {
  const signIn = lang === "en" ? "Sign in" : "Přihlásit se";
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 48px">
    <div style="color:#fff;font-size:26px;font-weight:700">${headerTitle || "Mamtodoma"}</div>
    <div style="color:rgba(255,255,255,0.8);font-size:15px;margin-top:8px">${subtitle}</div>
  </td></tr>
  <tr><td style="padding:40px 48px">${bodyHtml}</td></tr>
  <tr><td style="background:#f9fafb;padding:20px 48px;border-top:1px solid #e5e7eb">
    <div style="font-size:12px;color:#9ca3af">
      <a href="${siteUrl}/login" style="color:#4f46e5;text-decoration:none">${signIn}</a> &nbsp;·&nbsp;
      <a href="${siteUrl}/shop" style="color:#4f46e5;text-decoration:none">Shop</a> &nbsp;·&nbsp;
      <a href="${siteUrl}/profile" style="color:#4f46e5;text-decoration:none">Profile</a>
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export function ctaBlock(href: string, label: string, note: string): string {
  return `<div style="text-align:center;margin:32px 0">
      <a href="${href}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600">${label}</a>
      <div style="font-size:11px;color:#9ca3af;margin-top:12px">${note}</div>
    </div>`;
}
