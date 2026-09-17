// Pointer-event drag-to-reorder for vertical lists.
// Extracted from website/src/scripts/onboardingPreview.ts so the same machinery can be
// reused by the admin layout editor and any future list. Uses pointer events rather than
// the native HTML5 drag API, which is hijacked by <a>/<img> children inside blocks.
//
// Usage:
//   const cleanup = initPointerDragReorder(container, {
//     itemSelector: ".layout-row",
//     handleSelector: ".drag-handle",
//     onReorder: (ordered) => updateOrderInputs(ordered),
//   });

export interface PointerDragOptions {
  itemSelector: string;
  handleSelector: string;
  draggingClass?: string;
  bodyDraggingClass?: string;
  onReorder?: (ordered: HTMLElement[]) => void;
}

export function initPointerDragReorder(
  container: HTMLElement,
  opts: PointerDragOptions,
): () => void {
  const draggingClass = opts.draggingClass ?? "is-dragging";
  const bodyClass = opts.bodyDraggingClass ?? "is-dragging-active";
  let dragged: HTMLElement | null = null;

  function items(): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(opts.itemSelector));
  }

  function onMove(e: PointerEvent) {
    if (!dragged) return;
    e.preventDefault();
    let target: HTMLElement | null = null;
    for (const b of items()) {
      if (b === dragged) continue;
      const rect = b.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        target = b;
        break;
      }
    }
    if (!target) return;
    const targetIsBelow = !!(dragged.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING);
    target.parentNode!.insertBefore(dragged, targetIsBelow ? target.nextSibling : target);
  }

  function onUp() {
    if (!dragged) return;
    dragged.classList.remove(draggingClass);
    document.body.classList.remove(bodyClass);
    const ordered = items();
    dragged = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    opts.onReorder?.(ordered);
  }

  const handles = container.querySelectorAll<HTMLElement>(opts.handleSelector);

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const handle = e.currentTarget as HTMLElement;
    const item = handle.closest<HTMLElement>(opts.itemSelector);
    // For the onboarding preview the handle is the overlay which is a direct child of the block,
    // so closest works. Also handle the case where handleSelector matches descendants.
    const resolved = item ?? handle.closest<HTMLElement>(opts.itemSelector);
    if (!resolved) return;
    // Ensure the resolved item is inside the container
    if (!container.contains(resolved)) return;
    dragged = resolved;
    dragged.classList.add(draggingClass);
    document.body.classList.add(bodyClass);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  handles.forEach((h) => h.addEventListener("pointerdown", onPointerDown as EventListener));

  return () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    handles.forEach((h) => h.removeEventListener("pointerdown", onPointerDown as EventListener));
    document.body.classList.remove(bodyClass);
    items().forEach((el) => el.classList.remove(draggingClass));
    dragged = null;
  };
}
