import { initPointerDragReorder } from "@shared/utils/dragReorder";

export function initLayoutReorder() {
  const form = document.getElementById("layout-list") as HTMLElement | null;
  if (!form) return;

  function updateOrderInputs() {
    const rows = Array.from(form!.querySelectorAll<HTMLElement>(".layout-row"));
    rows.forEach((row, idx) => {
      const input = row.querySelector<HTMLInputElement>(".order-input");
      if (input) input.value = String(idx);
    });
  }

  function sortRowsByOrderValue() {
    const rows = Array.from(form!.querySelectorAll<HTMLElement>(".layout-row"));
    rows.sort((a, b) => {
      const av = Number(a.querySelector<HTMLInputElement>(".order-input")?.value ?? 0);
      const bv = Number(b.querySelector<HTMLInputElement>(".order-input")?.value ?? 0);
      return av - bv;
    });
    rows.forEach((r) => form!.appendChild(r));
  }

  // Keep DOM sorted when the user edits a number manually.
  form.querySelectorAll<HTMLInputElement>(".order-input").forEach((input) => {
    input.addEventListener("change", () => {
      sortRowsByOrderValue();
    });
    input.addEventListener("blur", () => {
      sortRowsByOrderValue();
    });
  });

  // Ensure the initial render respects the numeric order even if the server
  // seeded values out of order (e.g. after a manual edit without save).
  sortRowsByOrderValue();

  initPointerDragReorder(form, {
    itemSelector: ".layout-row",
    handleSelector: ".drag-handle",
    draggingClass: "is-dragging",
    bodyDraggingClass: "is-dragging-active",
    onReorder: () => updateOrderInputs(),
  });
}
