// Progressive enhancement for POST forms (cart qty/remove, coupon, add-to-cart, wishlist toggle):
// submits via fetch instead of a real navigation, so the page never reloads or jumps to the top.
// Pages must branch on the same Accept header to return JSON instead of redirecting/rendering.
export async function submitAjax<T = any>(form: HTMLFormElement, extraFields?: Record<string, string>): Promise<T> {
  const formData = new FormData(form);
  if (extraFields) for (const [k, v] of Object.entries(extraFields)) formData.set(k, v);
  const res = await fetch(form.action || location.href, {
    method: form.method || "POST",
    body: formData,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ajax form submit failed: ${res.status}`);
  return res.json();
}
