export function initBugsResolveModal(): void {
  const dialog = document.getElementById("bug-resolve-dialog") as HTMLDialogElement | null;
  if (!dialog) return;
  const idInput = dialog.querySelector("[data-bug-resolve-id]") as HTMLInputElement | null;
  const cancelBtn = dialog.querySelector("[data-bug-resolve-cancel]") as HTMLButtonElement | null;

  document.querySelectorAll<HTMLButtonElement>("[data-bug-resolve-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (idInput) idInput.value = btn.dataset.bugId ?? "";
      dialog.showModal();
    });
  });

  cancelBtn?.addEventListener("click", () => dialog.close());
}
