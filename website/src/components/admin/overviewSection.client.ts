type Cell = { text: string; badge?: string };
type Row = { href: string | null; cells: Cell[] };
type Payload = { total: number; page: number; pageSize: number; columns: string[]; rows: Row[] };

interface Labels {
  range1d: string; range7d: string; range1m: string; rangeAll: string;
  viewAll: string; exportCsv: string; prev: string; next: string;
  pageOf: string; loading: string; empty: string; error: string; total: string;
}

const RANGES: Array<{ key: string; labelKey: keyof Labels }> = [
  { key: "1d", labelKey: "range1d" },
  { key: "7d", labelKey: "range7d" },
  { key: "1m", labelKey: "range1m" },
  { key: "all", labelKey: "rangeAll" },
];

class OverviewSection extends HTMLElement {
  private section = "";
  private sectionTitle = "";
  private pageSize = 5;
  private modalPageSize = 20;
  private labels!: Labels;
  private inlineRange = "all";
  private modalRange = "all";
  private modalPage = 1;
  private modal: HTMLElement | null = null;

  connectedCallback() {
    const cfg = JSON.parse(this.querySelector("script.os-config")!.textContent!);
    this.section = cfg.section;
    this.sectionTitle = cfg.title;
    this.pageSize = cfg.pageSize ?? 5;
    this.modalPageSize = cfg.modalPageSize ?? 20;
    this.labels = cfg.labels;
    this.renderShell();
    this.loadInline();
  }

  private async fetchData(range: string, page: number, pageSize: number): Promise<Payload> {
    const params = new URLSearchParams({ section: this.section, range, page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`/api/admin/overview-section?${params}`, { credentials: "same-origin" });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }

  private rangeButtons(active: string, onClick: (key: string) => void): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "os-ranges";
    for (const r of RANGES) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "os-range" + (r.key === active ? " is-active" : "");
      b.textContent = this.labels[r.labelKey];
      b.addEventListener("click", () => onClick(r.key));
      wrap.appendChild(b);
    }
    return wrap;
  }

  private renderTable(target: HTMLElement, data: Payload) {
    if (data.rows.length === 0) {
      target.innerHTML = `<p class="os-empty">${this.labels.empty}</p>`;
      return;
    }
    const table = document.createElement("table");
    table.className = "data-table os-table";
    table.innerHTML = `<thead><tr>${data.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>`;
    const body = document.createElement("tbody");
    for (const row of data.rows) {
      const tr = document.createElement("tr");
      if (row.href) {
        tr.className = "os-clickable";
        tr.tabIndex = 0;
        tr.setAttribute("role", "link");
        const go = () => { window.location.href = row.href!; };
        tr.addEventListener("click", go);
        tr.addEventListener("keydown", (e) => { if ((e as KeyboardEvent).key === "Enter") go(); });
      }
      for (const cell of row.cells) {
        const td = document.createElement("td");
        if (cell.badge) td.innerHTML = `<span class="badge ${esc(cell.badge)}">${esc(cell.text)}</span>`;
        else td.textContent = cell.text;
        tr.appendChild(td);
      }
      body.appendChild(tr);
    }
    table.appendChild(body);
    target.innerHTML = "";
    target.appendChild(table);
  }

  private renderShell() {
    this.innerHTML = "";
    const card = document.createElement("div");
    card.className = "card os-card";
    const header = document.createElement("div");
    header.className = "os-header";
    const h = document.createElement("h2");
    h.className = "section-title";
    h.textContent = this.sectionTitle;
    const controls = document.createElement("div");
    controls.className = "os-controls";
    controls.appendChild(this.rangeButtons(this.inlineRange, (key) => { this.inlineRange = key; this.loadInline(); }));
    const viewAll = document.createElement("button");
    viewAll.type = "button";
    viewAll.className = "btn btn-ghost os-viewall";
    viewAll.textContent = this.labels.viewAll;
    viewAll.addEventListener("click", () => this.openModal());
    controls.appendChild(viewAll);
    header.append(h, controls);
    const bodyEl = document.createElement("div");
    bodyEl.className = "os-body";
    bodyEl.innerHTML = `<p class="os-empty">${this.labels.loading}</p>`;
    card.append(header, bodyEl);
    this.appendChild(card);
  }

  private async loadInline() {
    const body = this.querySelector(".os-body") as HTMLElement;
    const ranges = this.querySelector(".os-header .os-ranges") as HTMLElement;
    ranges.replaceWith(this.rangeButtons(this.inlineRange, (key) => { this.inlineRange = key; this.loadInline(); }));
    body.innerHTML = `<p class="os-empty">${this.labels.loading}</p>`;
    try {
      const data = await this.fetchData(this.inlineRange, 1, this.pageSize);
      this.renderTable(body, data);
    } catch {
      body.innerHTML = `<p class="os-empty">${this.labels.error}</p>`;
    }
  }

  private openModal() {
    this.modalRange = this.inlineRange;
    this.modalPage = 1;
    if (!this.modal) this.buildModal();
    this.modal!.style.display = "flex";
    document.body.style.overflow = "hidden";
    this.loadModal();
  }

  private closeModal() {
    if (this.modal) this.modal.style.display = "none";
    document.body.style.overflow = "";
  }

  private buildModal() {
    const overlay = document.createElement("div");
    overlay.className = "os-modal-overlay";
    overlay.innerHTML = `
      <div class="os-modal" role="dialog" aria-modal="true">
        <div class="os-modal-head">
          <h2 class="section-title">${esc(this.sectionTitle)}</h2>
          <button type="button" class="os-close" aria-label="Close">&times;</button>
        </div>
        <div class="os-modal-controls">
          <div class="os-modal-ranges"></div>
          <button type="button" class="btn btn-ghost os-export">${esc(this.labels.exportCsv)}</button>
        </div>
        <div class="os-modal-body"><p class="os-empty">${this.labels.loading}</p></div>
        <div class="os-modal-foot"></div>
      </div>`;
    overlay.addEventListener("click", (e) => { if (e.target === overlay) this.closeModal(); });
    overlay.querySelector(".os-close")!.addEventListener("click", () => this.closeModal());
    overlay.querySelector(".os-export")!.addEventListener("click", () => this.exportCsv());
    document.body.appendChild(overlay);
    this.modal = overlay;
  }

  private async loadModal() {
    const body = this.modal!.querySelector(".os-modal-body") as HTMLElement;
    const rangesHost = this.modal!.querySelector(".os-modal-ranges") as HTMLElement;
    rangesHost.innerHTML = "";
    rangesHost.appendChild(this.rangeButtons(this.modalRange, (key) => { this.modalRange = key; this.modalPage = 1; this.loadModal(); }));
    body.innerHTML = `<p class="os-empty">${this.labels.loading}</p>`;
    try {
      const data = await this.fetchData(this.modalRange, this.modalPage, this.modalPageSize);
      this.renderTable(body, data);
      this.renderFoot(data);
    } catch {
      body.innerHTML = `<p class="os-empty">${this.labels.error}</p>`;
    }
  }

  private renderFoot(data: Payload) {
    const foot = this.modal!.querySelector(".os-modal-foot") as HTMLElement;
    const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
    const info = this.labels.pageOf.replace("{{page}}", String(data.page)).replace("{{pages}}", String(totalPages)).replace("{{total}}", String(data.total));
    foot.innerHTML = "";
    const prev = document.createElement("button");
    prev.type = "button"; prev.className = "btn btn-ghost"; prev.textContent = this.labels.prev; prev.disabled = data.page <= 1;
    prev.addEventListener("click", () => { this.modalPage = data.page - 1; this.loadModal(); });
    const next = document.createElement("button");
    next.type = "button"; next.className = "btn btn-ghost"; next.textContent = this.labels.next; next.disabled = data.page >= totalPages;
    next.addEventListener("click", () => { this.modalPage = data.page + 1; this.loadModal(); });
    const span = document.createElement("span");
    span.className = "os-pageinfo"; span.textContent = info;
    foot.append(prev, span, next);
  }

  private async exportCsv() {
    const first = await this.fetchData(this.modalRange, 1, 100);
    const all: Row[] = [...first.rows];
    const totalPages = Math.ceil(first.total / 100);
    for (let p = 2; p <= totalPages; p++) {
      const next = await this.fetchData(this.modalRange, p, 100);
      all.push(...next.rows);
    }
    const lines = [first.columns.map(csvCell).join(",")];
    for (const row of all) lines.push(row.cells.map((c) => csvCell(c.text)).join(","));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${this.section}-${this.modalRange}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}
function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

if (!customElements.get("overview-section")) customElements.define("overview-section", OverviewSection);
