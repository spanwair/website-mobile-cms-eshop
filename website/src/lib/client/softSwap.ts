// Progressive enhancement for filter/sort/pagination links: intercepts navigation, fetches the
// target URL, swaps the id-tagged container's innerHTML with the fetched page's version of it,
// and pushes the URL — no full page load, so scroll position and focus never move. Falls back to
// a real navigation on any fetch/parse failure so the feature degrades to plain links with JS off.
function executeScripts(container: HTMLElement) {
  container.querySelectorAll("script").forEach((old) => {
    const replacement = document.createElement("script");
    for (const attr of Array.from(old.attributes)) replacement.setAttribute(attr.name, attr.value);
    replacement.textContent = old.textContent;
    old.replaceWith(replacement);
  });
}

export function initFilterSwap(containerId: string) {
  async function swap(url: string) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.setAttribute("aria-busy", "true");
    try {
      const res = await fetch(url, { headers: { "X-Soft-Nav": "1" } });
      if (!res.ok) throw new Error(`soft-nav fetch failed: ${res.status}`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const next = doc.getElementById(containerId);
      if (!next) throw new Error("soft-nav target container missing in response");
      container.innerHTML = next.innerHTML;
      executeScripts(container);
      document.title = doc.title;
      history.pushState({ softNav: true }, "", url);
    } catch {
      window.location.href = url;
    } finally {
      container.removeAttribute("aria-busy");
    }
  }

  document.addEventListener("click", (e) => {
    const container = document.getElementById(containerId);
    const link = (e.target as HTMLElement).closest?.("a[data-filter-link]");
    if (!link || !container?.contains(link)) return;
    const href = link.getAttribute("href");
    if (!href) return;
    e.preventDefault();
    swap(href);
  });

  document.addEventListener("change", (e) => {
    const select = e.target as HTMLSelectElement;
    if (!select || select.tagName !== "SELECT" || !select.dataset.sortUrl) return;
    const container = document.getElementById(containerId);
    if (!container?.contains(select)) return;
    swap(select.dataset.sortUrl.replace("__SORT__", encodeURIComponent(select.value)));
  });

  window.addEventListener("popstate", () => swap(location.href));
}
