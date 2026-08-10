// Browsers never execute <script> tags inserted via innerHTML — recreating each one forces it
// to run, which soft-navigation swaps rely on to re-init the JS of whatever content just landed.
export function executeScripts(container: HTMLElement) {
  container.querySelectorAll("script").forEach((old) => {
    const replacement = document.createElement("script");
    for (const attr of Array.from(old.attributes)) replacement.setAttribute(attr.name, attr.value);
    replacement.textContent = old.textContent;
    old.replaceWith(replacement);
  });
}
