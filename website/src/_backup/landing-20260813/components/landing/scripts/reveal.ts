const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initReveal() {
  const groups = document.querySelectorAll<HTMLElement>("[data-reveal-group]");

  groups.forEach((group) => {
    const items = Array.from(group.querySelectorAll<HTMLElement>("[data-reveal]"));
    items.forEach((el, i) => {
      el.style.transitionDelay = REDUCED_MOTION ? "0ms" : `${i * 80}ms`;
    });
  });

  if (REDUCED_MOTION) {
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
  );

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => observer.observe(el));
}
