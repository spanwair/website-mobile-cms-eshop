export function initBugReportWidget() {
  const widget = document.querySelector<HTMLElement>("[data-bug-widget]");
  if (!widget) return;

  const openBtn = widget.querySelector<HTMLButtonElement>("[data-bug-open]")!;
  const closeBtn = widget.querySelector<HTMLButtonElement>("[data-bug-close]")!;
  const panel = widget.querySelector<HTMLElement>("[data-bug-panel]")!;
  const descriptionEl = widget.querySelector<HTMLTextAreaElement>("[data-bug-description]")!;
  const statusEl = widget.querySelector<HTMLElement>("[data-bug-status]")!;
  const submitBtn = widget.querySelector<HTMLButtonElement>("[data-bug-submit]")!;
  const toastEl = widget.querySelector<HTMLElement>("[data-bug-toast]")!;
  const toastTextEl = widget.querySelector<HTMLElement>("[data-bug-toast-text]")!;

  const captureScreenshotBtn = widget.querySelector<HTMLButtonElement>("[data-bug-capture-screenshot]")!;
  const screenshotPreview = widget.querySelector<HTMLElement>("[data-bug-screenshot-preview]")!;
  const screenshotImg = widget.querySelector<HTMLImageElement>("[data-bug-screenshot-img]")!;
  const expandScreenshotBtn = widget.querySelector<HTMLButtonElement>("[data-bug-expand-screenshot]")!;
  const removeScreenshotBtn = widget.querySelector<HTMLButtonElement>("[data-bug-remove-screenshot]")!;

  const startVideoBtn = widget.querySelector<HTMLButtonElement>("[data-bug-start-video]")!;
  const recordingHint = widget.querySelector<HTMLElement>("[data-bug-recording-hint]")!;
  const videoPreview = widget.querySelector<HTMLElement>("[data-bug-video-preview]")!;
  const videoEl = widget.querySelector<HTMLVideoElement>("[data-bug-video-el]")!;
  const expandVideoBtn = widget.querySelector<HTMLButtonElement>("[data-bug-expand-video]")!;
  const removeVideoBtn = widget.querySelector<HTMLButtonElement>("[data-bug-remove-video]")!;

  const i18n = (window as any).__bugReportI18n as Record<string, string>;

  let screenshotFile: File | null = null;
  let videoFile: File | null = null;
  let recorderPopup: Window | null = null;
  let popupWatcher: number | null = null;

  function setStatus(msg: string, isError: boolean) {
    if (!msg) { statusEl.hidden = true; return; }
    statusEl.hidden = false;
    statusEl.textContent = msg;
    statusEl.classList.toggle("is-error", isError);
    statusEl.classList.toggle("is-success", !isError);
  }

  function openPanel() {
    panel.hidden = false;
    document.addEventListener("mousedown", onOutsideClick);
  }

  function closePanel() {
    panel.hidden = true;
    document.removeEventListener("mousedown", onOutsideClick);
  }

  function onOutsideClick(e: MouseEvent) {
    if (!widget!.contains(e.target as Node)) closePanel();
  }

  openBtn.addEventListener("click", () => (panel.hidden ? openPanel() : closePanel()));
  closeBtn.addEventListener("click", closePanel);

  function stopStreamTracks(stream: MediaStream | null) {
    stream?.getTracks().forEach((track) => track.stop());
  }

  // `preferCurrentTab` + the `displaySurface: "browser"` hint are Chrome-only (ignored
  // harmlessly elsewhere) and bias the native picker toward "this tab" instead of asking
  // the reporter to choose between their whole screen, a window, or a tab. Only correct for
  // a same-tab, one-shot capture like this screenshot — see the recorder popup below for why
  // screen *recording* can't use `preferCurrentTab`.
  async function captureScreenshot() {
    let stream: MediaStream | null = null;
    // Hide our own floating button + panel so the screenshot shows the actual bug, not this
    // widget sitting on top of it — only for screenshots, the video recording (a separate
    // popup window) never has this widget in its own frame to begin with.
    widget!.hidden = true;
    try {
      const options = {
        video: { displaySurface: "browser" },
        preferCurrentTab: true,
        selfBrowserSurface: "include",
      } as DisplayMediaStreamOptions;
      stream = await navigator.mediaDevices.getDisplayMedia(options);
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("capture_failed");

      screenshotFile = new File([blob], "screenshot.png", { type: "image/png" });
      screenshotImg.src = URL.createObjectURL(blob);
      screenshotPreview.hidden = false;
      captureScreenshotBtn.hidden = true;
      setStatus("", false);
    } catch {
      setStatus(i18n.captureError, true);
    } finally {
      stopStreamTracks(stream);
      widget!.hidden = false;
    }
  }

  function removeScreenshot() {
    screenshotFile = null;
    screenshotImg.src = "";
    screenshotPreview.hidden = true;
    captureScreenshotBtn.hidden = false;
  }

  // Any admin sidebar click is a full page navigation that tears this script down along with
  // any in-page MediaRecorder — there is no way to keep a recording alive across a real
  // document unload. Instead, recording happens in a separate popup window: popups are
  // independent top-level browsing contexts, so the opener tab navigating around the admin
  // panel does not affect them. `window.opener` stays a live reference to whatever page is
  // CURRENTLY loaded in the tab that opened it, so when the popup finishes it can postMessage
  // the finished Blob back to this script — even if a different /admin/* page (and thus a
  // fresh instance of this same script) is loaded by then.
  function openRecorderPopup() {
    if (recorderPopup && !recorderPopup.closed) {
      recorderPopup.focus();
      return;
    }
    const popup = window.open("/admin/bug-recorder", "bugReportRecorder", "width=460,height=420,popup=1");
    if (!popup) {
      setStatus(i18n.recordingBlocked, true);
      return;
    }
    recorderPopup = popup;
    startVideoBtn.hidden = true;
    recordingHint.hidden = false;
    setStatus("", false);

    if (popupWatcher !== null) window.clearInterval(popupWatcher);
    popupWatcher = window.setInterval(() => {
      if (!recorderPopup?.closed) return;
      window.clearInterval(popupWatcher!);
      popupWatcher = null;
      // Only reset back to the "start recording" state if the popup closed without ever
      // attaching a video — if it already posted one back, the UI has moved on past this.
      if (!videoFile) {
        startVideoBtn.hidden = false;
        recordingHint.hidden = true;
      }
    }, 1000);
  }

  function onRecorderMessage(e: MessageEvent) {
    if (e.origin !== window.location.origin) return;
    const data = e.data as { source?: string; blob?: Blob; mimeType?: string } | null;
    if (!data || data.source !== "bug-recorder" || !(data.blob instanceof Blob)) return;

    videoFile = new File([data.blob], "recording.webm", { type: data.mimeType || "video/webm" });
    videoEl.src = URL.createObjectURL(data.blob);
    videoPreview.hidden = false;
    startVideoBtn.hidden = true;
    recordingHint.hidden = true;
    if (panel.hidden) openPanel();
    setStatus(i18n.videoAttached, false);
  }
  window.addEventListener("message", onRecorderMessage);

  function removeVideo() {
    videoFile = null;
    videoEl.src = "";
    videoPreview.hidden = true;
    startVideoBtn.hidden = false;
    recordingHint.hidden = true;
  }

  function openInNewTab(src: string) {
    if (src) window.open(src, "_blank", "noopener");
  }

  captureScreenshotBtn.addEventListener("click", captureScreenshot);
  removeScreenshotBtn.addEventListener("click", removeScreenshot);
  expandScreenshotBtn.addEventListener("click", () => openInNewTab(screenshotImg.src));
  screenshotImg.addEventListener("click", () => openInNewTab(screenshotImg.src));
  startVideoBtn.addEventListener("click", openRecorderPopup);
  removeVideoBtn.addEventListener("click", removeVideo);
  expandVideoBtn.addEventListener("click", () => openInNewTab(videoEl.currentSrc || videoEl.src));

  function resetForm() {
    descriptionEl.value = "";
    removeScreenshot();
    removeVideo();
  }

  let toastTimer: number | null = null;
  function showToast(msg: string) {
    toastTextEl.textContent = msg;
    toastEl.hidden = false;
    if (toastTimer !== null) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toastEl.hidden = true; }, 3500);
  }

  async function submit() {
    submitBtn.disabled = true;
    submitBtn.textContent = i18n.submitting;
    setStatus("", false);

    const fd = new FormData();
    const description = descriptionEl.value.trim();
    if (description) fd.append("description", description);
    fd.append("pageUrl", window.location.href);
    fd.append("userAgent", navigator.userAgent);
    if (screenshotFile) fd.append("screenshot", screenshotFile);
    if (videoFile) fd.append("video", videoFile);

    try {
      const res = await fetch("/api/admin/bug-reports", { method: "POST", body: fd });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error) throw new Error(result.error || "request_failed");
      resetForm();
      closePanel();
      showToast(i18n.success);
    } catch {
      setStatus(i18n.error, true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = i18n.submit;
    }
  }

  submitBtn.addEventListener("click", submit);
}
