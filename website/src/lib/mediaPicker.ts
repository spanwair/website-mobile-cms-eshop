type MediaItem = { id: string; slug: string; media_type: "image" | "video"; url: string; alt: string | null; category_ids: string[] };
type MediaCategory = { id: string; name: string };
type OpenOpts = { multiple?: boolean; accept?: "image" | "video" | "any" };

export function initMediaPicker() {
  const overlay = document.querySelector<HTMLElement>("[data-mp-overlay]");
  if (!overlay) return;

  const grid = overlay.querySelector<HTMLElement>("[data-mp-grid]")!;
  const closeBtn = overlay.querySelector<HTMLButtonElement>("[data-mp-close]")!;
  const cancelBtn = overlay.querySelector<HTMLButtonElement>("[data-mp-cancel]")!;
  const confirmBtn = overlay.querySelector<HTMLButtonElement>("[data-mp-confirm]")!;
  const countEl = overlay.querySelector<HTMLElement>("[data-mp-count]")!;
  const dropzone = overlay.querySelector<HTMLElement>("[data-mp-dropzone]")!;
  const fileInput = overlay.querySelector<HTMLInputElement>("[data-mp-file-input]")!;
  const statusEl = overlay.querySelector<HTMLElement>("[data-mp-status]")!;
  const categoryBar = overlay.querySelector<HTMLElement>("[data-mp-category-bar]")!;
  const categoryPanel = overlay.querySelector<HTMLElement>("[data-mp-category-panel]")!;
  const categoryPanelClose = overlay.querySelector<HTMLButtonElement>("[data-mp-category-panel-close]")!;
  const checklist = overlay.querySelector<HTMLElement>("[data-mp-category-checklist]")!;
  const newCategoryInput = overlay.querySelector<HTMLInputElement>("[data-mp-new-category-input]")!;
  const newCategoryAdd = overlay.querySelector<HTMLButtonElement>("[data-mp-new-category-add]")!;
  const i18n = (window as any).__mediaPickerI18n as Record<string, string>;

  let media: MediaItem[] = [];
  let categories: MediaCategory[] = [];
  let multiple = false;
  let accept: "image" | "video" | "any" = "any";
  let selected = new Set<string>();
  let activeCategoryFilter: string | null = null;
  let editingMediaId: string | null = null;
  let resolvePromise: ((v: MediaItem[] | null) => void) | null = null;

  function setStatus(msg: string, isError = false) {
    if (!msg) { statusEl.hidden = true; return; }
    statusEl.hidden = false;
    statusEl.textContent = msg;
    statusEl.classList.toggle("is-error", isError);
  }

  function visibleMedia(): MediaItem[] {
    let items = accept === "any" ? media : media.filter((m) => m.media_type === accept);
    if (activeCategoryFilter) items = items.filter((m) => m.category_ids.includes(activeCategoryFilter!));
    return items;
  }

  function updateFooter() {
    confirmBtn.hidden = !multiple || selected.size === 0;
    countEl.hidden = !multiple || selected.size === 0;
    countEl.textContent = `${selected.size} ${i18n.selected}`;
  }

  function renderCategoryBar() {
    categoryBar.innerHTML = "";
    categoryBar.hidden = categories.length === 0;
    const allChip = document.createElement("button");
    allChip.type = "button";
    allChip.className = "mp-chip" + (activeCategoryFilter === null ? " is-active" : "");
    allChip.textContent = i18n.allCategories;
    allChip.addEventListener("click", () => { activeCategoryFilter = null; renderCategoryBar(); renderGrid(); });
    categoryBar.appendChild(allChip);
    categories.forEach((c) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "mp-chip" + (activeCategoryFilter === c.id ? " is-active" : "");
      chip.textContent = c.name;
      chip.addEventListener("click", () => {
        activeCategoryFilter = activeCategoryFilter === c.id ? null : c.id;
        renderCategoryBar();
        renderGrid();
      });
      categoryBar.appendChild(chip);
    });
  }

  function renderCategoryChecklist() {
    checklist.innerHTML = "";
    const item = media.find((m) => m.id === editingMediaId);
    categories.forEach((c) => {
      const label = document.createElement("label");
      label.className = "mp-category-check";
      const checked = !!item?.category_ids.includes(c.id);
      label.innerHTML = `<input type="checkbox" ${checked ? "checked" : ""} /> <span></span>`;
      label.querySelector("span")!.textContent = c.name;
      label.querySelector("input")!.addEventListener("change", (e) => {
        toggleCategoryForMedia(c.id, (e.target as HTMLInputElement).checked);
      });
      checklist.appendChild(label);
    });
  }

  async function toggleCategoryForMedia(categoryId: string, checked: boolean) {
    const item = media.find((m) => m.id === editingMediaId);
    if (!item) return;
    item.category_ids = checked
      ? [...item.category_ids, categoryId]
      : item.category_ids.filter((id) => id !== categoryId);
    await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, categoryIds: item.category_ids }),
    });
    renderCategoryChecklist();
    renderGrid();
  }

  function openCategoryPanel(m: MediaItem) {
    editingMediaId = m.id;
    categoryPanel.hidden = false;
    renderCategoryChecklist();
  }

  function renderGrid() {
    grid.innerHTML = "";
    const items = visibleMedia();
    if (items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "mp-empty";
      empty.textContent = i18n.noImagesYet;
      grid.appendChild(empty);
    }
    items.forEach((m) => {
      const item = document.createElement("div");
      item.className = "mp-item" + (selected.has(m.id) ? " is-selected" : "");
      item.innerHTML = m.media_type === "video"
        ? `<video src="${m.url}" muted></video>`
        : `<img src="${m.url}" alt="${m.alt ?? ""}" />`;
      item.addEventListener("click", () => toggleSelect(m));

      const tagBtn = document.createElement("button");
      tagBtn.type = "button";
      tagBtn.className = "mp-tag";
      tagBtn.title = i18n.editCategories;
      tagBtn.textContent = "#";
      tagBtn.addEventListener("click", (e) => { e.stopPropagation(); openCategoryPanel(m); });
      item.appendChild(tagBtn);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "mp-remove";
      removeBtn.title = i18n.delete;
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (!confirm(i18n.deleteMediaConfirm)) return;
        const res = await fetch(`/api/admin/media?id=${m.id}`, { method: "DELETE" });
        if (res.ok) {
          media = media.filter((x) => x.id !== m.id);
          selected.delete(m.id);
          renderGrid();
        } else {
          const body = await res.json().catch(() => ({}));
          setStatus(body.error || i18n.error, true);
        }
      });
      item.appendChild(removeBtn);
      grid.appendChild(item);
    });
    updateFooter();
  }

  function toggleSelect(m: MediaItem) {
    if (!multiple) { finish([m]); return; }
    if (selected.has(m.id)) selected.delete(m.id); else selected.add(m.id);
    renderGrid();
  }

  async function loadAll() {
    setStatus(i18n.loading);
    const [mediaRes, catRes] = await Promise.all([
      fetch("/api/admin/media"),
      fetch("/api/admin/media-categories"),
    ]);
    const mediaBody = await mediaRes.json().catch(() => ({ media: [] }));
    const catBody = await catRes.json().catch(() => ({ categories: [] }));
    media = mediaBody.media ?? [];
    categories = catBody.categories ?? [];
    setStatus("");
    renderCategoryBar();
    renderGrid();
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const accepted = Array.from(files).filter((f) => accept === "any" || f.type.startsWith(`${accept}/`));
    if (accepted.length === 0) { setStatus(i18n.wrongFileType, true); return; }
    setStatus(i18n.uploading);
    const form = new FormData();
    accepted.forEach((f) => form.append("files", f));
    const res = await fetch("/api/admin/media", { method: "POST", body: form });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { setStatus(body.error || i18n.error, true); return; }
    media = [...(body.media ?? []).map((m: MediaItem) => ({ ...m, category_ids: [] })), ...media];
    setStatus("");
    renderGrid();
  }

  function finish(result: MediaItem[] | null) {
    overlay!.hidden = true;
    categoryPanel.hidden = true;
    editingMediaId = null;
    const resolve = resolvePromise;
    resolvePromise = null;
    resolve?.(result);
  }

  function openPicker(opts?: OpenOpts): Promise<MediaItem[] | null> {
    multiple = !!opts?.multiple;
    accept = opts?.accept ?? "any";
    fileInput.accept = accept === "any" ? "image/*,video/*" : `${accept}/*`;
    selected = new Set();
    activeCategoryFilter = null;
    overlay!.hidden = false;
    loadAll();
    return new Promise((resolve) => { resolvePromise = resolve; });
  }

  closeBtn.addEventListener("click", () => finish(null));
  cancelBtn.addEventListener("click", () => finish(null));
  overlay.addEventListener("click", (e) => { if (e.target === overlay) finish(null); });
  confirmBtn.addEventListener("click", () => finish(media.filter((m) => selected.has(m.id))));
  categoryPanelClose.addEventListener("click", () => { categoryPanel.hidden = true; editingMediaId = null; });

  newCategoryAdd.addEventListener("click", async () => {
    const name = newCategoryInput.value.trim();
    if (!name) return;
    const res = await fetch("/api/admin/media-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { setStatus(body.error || i18n.error, true); return; }
    categories.push(body.category);
    newCategoryInput.value = "";
    renderCategoryBar();
    renderCategoryChecklist();
    if (editingMediaId) toggleCategoryForMedia(body.category.id, true);
  });

  fileInput.addEventListener("change", () => { uploadFiles(fileInput.files); fileInput.value = ""; });
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("is-dragover"); });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-dragover"));
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");
    uploadFiles(e.dataTransfer?.files ?? null);
  });

  (window as any).openMediaPicker = openPicker;
}
