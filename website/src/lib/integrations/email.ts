// Transactional email via Resend (resend.com).
// Set RESEND_API_KEY in .env.production
// Install: pnpm add resend (in website/)
// Configure your sending domain at resend.com/domains (free tier: 100 emails/day)

function getResend() {
  const key = import.meta.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set — add it to .env.production");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Resend } = require("resend");
  return new Resend(key);
}

const FROM = import.meta.env.EMAIL_FROM ?? "noreply@yourdomain.cz";

export async function sendOrderConfirmation(opts: {
  to: string;
  customerName: string;
  orderNumber: string;
  orderTotal: number;
  items: Array<{ title: string; quantity: number; price: number }>;
  currency?: string;
}): Promise<void> {
  const resend = getResend();
  const itemsHtml = opts.items
    .map(i => `<tr><td>${i.title}</td><td>${i.quantity}×</td><td>${i.price.toFixed(2)} ${opts.currency ?? "Kč"}</td></tr>`)
    .join("");

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Order Confirmation — ${opts.orderNumber}`,
    html: `
      <h1>Thank you for your order, ${opts.customerName}!</h1>
      <p>Your order <strong>${opts.orderNumber}</strong> has been received and is being processed.</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:500px">
        <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot><tr><td colspan="2"><strong>Total</strong></td><td><strong>${opts.orderTotal.toFixed(2)} ${opts.currency ?? "Kč"}</strong></td></tr></tfoot>
      </table>
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
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
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
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
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
  const resend = getResend();
  const linksHtml = opts.products
    .map(p => `<li><a href="${opts.shopBaseUrl}/shop/${p.slug}?reviewed=0">${p.title}</a></li>`)
    .join("");

  await resend.emails.send({
    from: FROM,
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
}): Promise<void> {
  const resend = getResend();
  const itemsHtml = opts.items
    .map(i => `<li>${i.title} — ${i.price.toFixed(2)} Kč</li>`)
    .join("");

  await resend.emails.send({
    from: FROM,
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
