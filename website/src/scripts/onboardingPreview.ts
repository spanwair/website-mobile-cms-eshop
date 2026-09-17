import { initPointerDragReorder } from "@shared/utils/dragReorder";

// Runs inside the onboarding preview iframe. Handles drag-to-reorder + delete of homepage
// sections and reports the new order to the parent editor (which autosaves). Also applies live
// theme/font updates pushed from the parent so palette changes show instantly without a reload.
//
// Reordering uses pointer events driven by the overlay rather than the native HTML5 drag API.
// Native drag is unreliable here: section markup contains <a>/<img> children that are drag sources
// by default and hijack the block drag, so only link-free blocks could be picked up. Pointer events
// on the overlay never touch that machinery, so every block drags regardless of its contents.

function reorderables(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.pb-block[data-reorder="1"]'));
}

function currentOrder(): string[] {
  return reorderables().map((b) => b.dataset.key!).filter(Boolean);
}

function postLayout() {
  parent.postMessage({ source: "pb", type: "layout", order: currentOrder() }, "*");
}

function initDragReorder() {
  const container = document.body;
  initPointerDragReorder(container, {
    itemSelector: '.pb-block[data-reorder="1"]',
    handleSelector: '.pb-block[data-reorder="1"] > .pb-overlay',
    draggingClass: "pb-dragging",
    bodyDraggingClass: "pb-dragging-active",
    onReorder: () => {
      document.querySelectorAll(".pb-drag-over").forEach((b) => b.classList.remove("pb-drag-over"));
      postLayout();
    },
  });
}

export function initOnboardingPreview() {
  // Delete buttons
  document.querySelectorAll<HTMLButtonElement>(".pb-del").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.closest<HTMLElement>('.pb-block[data-reorder="1"]')?.remove();
      postLayout();
    });
  });

  initDragReorder();

  // Live theme/font updates from the parent editor
  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || d.type !== "vars" || !d.vars) return;
    Object.entries(d.vars as Record<string, string>).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v, "important");
    });
  });

  postLayout();
}
