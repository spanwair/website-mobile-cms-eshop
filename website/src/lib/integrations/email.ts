// Transactional email via Resend (resend.com).
// Set RESEND_API_KEY in .env.production
// Install: pnpm add resend (in website/)
// Configure your sending domain at resend.com/domains (free tier: 100 emails/day)

import { Resend } from "resend";
import { getT, type AppLanguage } from "@shared/i18n/getT";
import { PERMISSIONS, ROLE } from "@shared/constants/permissions";
import { formatPrice } from "@shared/utils/format";

function getResend() {
  const key = import.meta.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set — add it to .env.production");
  return new Resend(key);
}

// resend.emails.send() resolves with { error } instead of throwing — surface it.
async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const resend = getResend();
  const { error } = await resend.emails.send({ from: FROM, ...opts });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
}

const FROM = import.meta.env.EMAIL_FROM ?? "noreply@yourdomain.cz";

function makeRoleNames(lang: AppLanguage): Record<number, string> {
  const t = getT(lang);
  return {
    [ROLE.ESHOP_ADMIN]: t.profile.role.eshop_admin,
    [ROLE.ADMIN]:       t.profile.role.admin,
    [ROLE.OWNER]:       t.profile.role.owner,
  };
}

function makePermLabels(lang: AppLanguage): Record<number, string> {
  const t = getT(lang);
  return {
    [PERMISSIONS.VIEW_DASHBOARD]:    t.admin.roles.permDashboard,
    [PERMISSIONS.MANAGE_USERS]:      t.admin.roles.permUsers,
    [PERMISSIONS.MANAGE_ROLES]:      t.admin.roles.permRoles,
    [PERMISSIONS.MANAGE_PRODUCTS]:   t.admin.roles.permProducts,
    [PERMISSIONS.MANAGE_CATEGORIES]: t.admin.roles.permCategories,
    [PERMISSIONS.MANAGE_ORDERS]:     t.admin.roles.permOrders,
    [PERMISSIONS.MANAGE_INVENTORY]:  t.admin.roles.permInventory,
    [PERMISSIONS.MANAGE_PRICING]:    t.admin.roles.permPricing,
    [PERMISSIONS.MANAGE_CUSTOMERS]:  t.admin.roles.permCustomers,
    [PERMISSIONS.MANAGE_REPORTS]:    t.admin.roles.permReports,
    [PERMISSIONS.MANAGE_AUDIT]:      t.admin.roles.permAudit,
  };
}

function activePermNames(lang: AppLanguage, systemRole: number | null, rolePermissions: number): string[] {
  if (systemRole !== ROLE.ESHOP_ADMIN || rolePermissions === 0) return [];
  const labels = makePermLabels(lang);
  return Object.entries(PERMISSIONS)
    .filter(([, bit]) => (rolePermissions & bit) !== 0)
    .map(([, bit]) => labels[bit])
    .filter(Boolean) as string[];
}

// Returns metadata to embed in inviteUserByEmail data for GoTrue template rendering (dev only).
export function buildDevInviteMetadata(opts: {
  lang: AppLanguage;
  partyName: string;
  roleName: string;
  systemRole: number | null;
  rolePermissions: number;
}): Record<string, string> {
  const roleNames = makeRoleNames(opts.lang);
  const perms = activePermNames(opts.lang, opts.systemRole, opts.rolePermissions);
  return {
    party_name:        opts.partyName,
    role_name:         opts.roleName,
    system_role_label: opts.systemRole ? (roleNames[opts.systemRole] ?? '') : '',
    permissions_text:  perms.join(', '),
    lang:              opts.lang,
    is_admin_only:     String(opts.systemRole === ROLE.ADMIN),
  };
}

export async function sendPartyInvitation(opts: {
  to: string;
  lang: AppLanguage;
  partyName: string;
  roleName: string;
  systemRole: number | null;
  rolePermissions: number;
  inviteLink: string | null;
  userOrganizations: string[];
  siteUrl: string;
}): Promise<void> {
  const { lang, partyName, roleName, systemRole, rolePermissions, inviteLink, userOrganizations, siteUrl } = opts;
  const isCz = lang === 'cs';
  const t = getT(lang);

  const roleNames = makeRoleNames(lang);
  const isNew = inviteLink !== null;
  const adminOnly = systemRole === ROLE.ADMIN;
  const sysLabel = systemRole ? (roleNames[systemRole] ?? null) : null;

  const subject = isCz
    ? (isNew ? `Pozvánka do ${partyName}` : `Byli jste přidáni do ${partyName}`)
    : (isNew ? `You've been invited to ${partyName}` : `You've been added to ${partyName}`);

  const heading   = isCz ? (isNew ? 'Obdrželi jste pozvánku' : 'Byli jste přidáni') : (isNew ? "You've been invited" : "You've been added");
  const bodyText  = isCz
    ? (isNew ? `Byli jste pozváni, abyste se připojili k organizaci <strong>${partyName}</strong>. Klikněte na tlačítko níže pro vytvoření účtu.` : `Byli jste přidáni do organizace <strong>${partyName}</strong>. Přihlaste se pro přístup.`)
    : (isNew ? `You've been invited to join <strong>${partyName}</strong>. Click the button below to create your account and accept the invitation.` : `You've been added to <strong>${partyName}</strong>. Sign in to your account to access it.`);

  const roleLabel = isCz ? 'Vaše role' : 'Your role';
  const sysLabel2 = isCz ? 'Systémová role' : 'System role';
  const permLabel = isCz ? 'Vaše oprávnění' : 'Your permissions';
  const orgsLabel = isCz ? 'Organizace' : 'Organizations';
  const ctaText   = isCz ? 'Přijmout pozvánku' : 'Accept invitation';
  const loginText = isCz ? 'Přihlásit se' : 'Sign in';

  const roleBlock = adminOnly
    ? `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin-bottom:24px">
         <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#6b7280;margin-bottom:8px">${sysLabel2}</div>
         <div style="font-size:18px;font-weight:700;color:#0284c7">${sysLabel ?? ''}</div>
         <div style="font-size:13px;color:#6b7280;margin-top:6px">${isCz ? 'Plný přístup ke všem organizacím.' : 'Full access to all organizations.'}</div>
       </div>`
    : `<div style="background:#f8f7ff;border:1px solid #e0ddff;border-radius:8px;padding:20px;margin-bottom:24px">
         <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#6b7280;margin-bottom:8px">${roleLabel}</div>
         <div style="font-size:18px;font-weight:700;color:#4f46e5">${roleName || (sysLabel ?? '')}</div>
         ${sysLabel && roleName ? `<div style="font-size:12px;color:#6b7280;margin-top:6px">${sysLabel2}: <strong>${sysLabel}</strong></div>` : ''}
       </div>`;

  const activePerms = activePermNames(lang, systemRole, rolePermissions);
  const permsBlock = activePerms.length
    ? `<div style="margin-bottom:24px">
         <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:10px">${permLabel}:</div>
         <div>${activePerms.map(p => `<span style="display:inline-block;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:3px 10px;font-size:12px;color:#374151;margin:2px 4px 2px 0">${p}</span>`).join('')}</div>
       </div>`
    : '';

  const orgsBlock = userOrganizations.length
    ? `<div style="margin-bottom:24px">
         <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px">${orgsLabel}:</div>
         ${userOrganizations.map(o => `<div style="font-size:14px;color:#4b5563;padding:5px 0;border-bottom:1px solid #f3f4f6">• ${o}</div>`).join('')}
       </div>`
    : '';

  const ctaBlock = inviteLink
    ? `<div style="text-align:center;margin:32px 0">
         <a href="${inviteLink}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600">${ctaText}</a>
         <div style="font-size:11px;color:#9ca3af;margin-top:12px">${isCz ? 'Odkaz je platný 24 hodin.' : 'Link expires in 24 hours.'}</div>
       </div>`
    : `<div style="text-align:center;margin:32px 0">
         <a href="${siteUrl}/login" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:600">${loginText}</a>
       </div>`;

  const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f8">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 48px">
    <div style="color:#fff;font-size:26px;font-weight:700">${partyName}</div>
    <div style="color:rgba(255,255,255,0.8);font-size:15px;margin-top:8px">${heading}</div>
  </td></tr>
  <tr><td style="padding:40px 48px">
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7">${bodyText}</p>
    ${roleBlock}${permsBlock}${orgsBlock}${ctaBlock}
  </td></tr>
  <tr><td style="background:#f9fafb;padding:20px 48px;border-top:1px solid #e5e7eb">
    <div style="font-size:12px;color:#9ca3af">
      <a href="${siteUrl}/admin" style="color:#4f46e5;text-decoration:none">Admin</a> &nbsp;·&nbsp;
      <a href="${siteUrl}/login" style="color:#4f46e5;text-decoration:none">${loginText}</a> &nbsp;·&nbsp;
      <a href="${siteUrl}/shop" style="color:#4f46e5;text-decoration:none">Shop</a> &nbsp;·&nbsp;
      <a href="${siteUrl}/profile" style="color:#4f46e5;text-decoration:none">Profile</a>
    </div>
    <div style="font-size:11px;color:#d1d5db;margin-top:8px">&copy; ${new Date().getFullYear()} ${partyName}</div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  if (!import.meta.env.RESEND_API_KEY) {
    // Dev fallback for existing-user notifications (new users go via GoTrue → Mailpit)
    console.log(`\n[email:dev] TO: ${opts.to} | SUBJECT: ${subject}${inviteLink ? `\n[email:dev] LINK: ${inviteLink}` : ''}\n`);
    return;
  }
  await sendEmail({ to: opts.to, subject, html });
}

export async function sendOrderConfirmation(opts: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderTotal: number;
  items: Array<{ title: string; quantity: number; price: number }>;
  currency?: string;
  lang?: AppLanguage;
  // Present only for smalljobs_commission orders — Smalljobs is the contracting seller
  // toward the consumer (§2455 ObčZ), so it must be named as such on this document.
  sellerOfRecord?: { name: string; ico: string; address: string; vatNote: string };
}): Promise<void> {
  const lang = opts.lang ?? 'cs';
  const itemsHtml = opts.items
    .map(i => `<tr><td>${i.title}</td><td>${i.quantity}×</td><td>${formatPrice(i.price, lang, opts.currency)}</td></tr>`)
    .join("");
  const sellerHtml = opts.sellerOfRecord
    ? `<p style="color:#555;font-size:13px">
        ${lang === 'cs' ? 'Prodávající' : 'Seller'}: <strong>${opts.sellerOfRecord.name}</strong>, IČO ${opts.sellerOfRecord.ico}<br/>
        ${opts.sellerOfRecord.address}<br/>${opts.sellerOfRecord.vatNote}
      </p>`
    : "";

  await sendEmail({
    to: opts.to,
    subject: `Order Confirmation — ${opts.orderNumber}`,
    html: `
      <h1>Thank you for your order, ${opts.customerName}!</h1>
      <p>Your order <strong>${opts.orderNumber}</strong> has been received and is being processed.</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:500px">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot><tr><td colspan="2"><strong>Total</strong></td><td><strong>${formatPrice(opts.orderTotal, lang, opts.currency)}</strong></td></tr></tfoot>
      </table>
      ${sellerHtml}
      <p>We will notify you when your order ships.</p>
    `,
  });
}

export async function sendShippingNotification(opts: {
  to: string;
  customerName: string;
  orderNumber: string;
  trackingNumber: string;
  carrier?: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `Your order ${opts.orderNumber} has shipped!`,
    html: `
      <h1>Your order is on its way, ${opts.customerName}!</h1>
      <p>Order <strong>${opts.orderNumber}</strong> has been shipped.</p>
      <p>Tracking number: <strong>${opts.trackingNumber}</strong>${opts.carrier ? ` via ${opts.carrier}` : ""}</p>
      <p>Estimated delivery: 2-5 business days.</p>
    `,
  });
}

export async function sendPasswordReset(opts: {
  to: string;
  resetLink: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: "Reset your password",
    html: `
      <h1>Reset your password</h1>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${opts.resetLink}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Reset Password</a></p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });
}

export async function sendReviewRequest(opts: {
  to: string;
  customerName: string;
  orderNumber: string;
  products: Array<{ title: string; slug: string }>;
  shopBaseUrl: string;
}): Promise<void> {
  const linksHtml = opts.products
    .map(p => `<li><a href="${opts.shopBaseUrl}/shop/${p.slug}?reviewed=0">${p.title}</a></li>`)
    .join("");

  await sendEmail({
    to: opts.to,
    subject: `How was your order ${opts.orderNumber}?`,
    html: `
      <h1>How did we do, ${opts.customerName}?</h1>
      <p>We hope you're enjoying your recent purchase. Please leave a review:</p>
      <ul>${linksHtml}</ul>
      <p>Your feedback helps other customers make better decisions!</p>
    `,
  });
}

export async function sendAbandonedCartRecovery(opts: {
  to: string;
  customerName: string;
  items: Array<{ title: string; price: number }>;
  cartUrl: string;
  couponCode?: string;
  currency?: string;
  lang?: AppLanguage;
}): Promise<void> {
  const lang = opts.lang ?? 'cs';
  const itemsHtml = opts.items
    .map(i => `<li>${i.title} — ${formatPrice(i.price, lang, opts.currency)}</li>`)
    .join("");

  await sendEmail({
    to: opts.to,
    subject: opts.couponCode
      ? `${opts.customerName}, use ${opts.couponCode} to complete your order!`
      : `${opts.customerName}, you left something behind!`,
    html: `
      <h1>You left something in your cart!</h1>
      <p>Hi ${opts.customerName}, these items are waiting for you:</p>
      <ul>${itemsHtml}</ul>
      ${opts.couponCode ? `<p>Use code <strong>${opts.couponCode}</strong> for 10% off!</p>` : ""}
      <p><a href="${opts.cartUrl}" style="background:#4f46e5;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none">Complete Your Order</a></p>
    `,
  });
}
