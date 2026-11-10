export function initBugRecorderPopup() {
  const startBtn = document.querySelector<HTMLButtonElement>("[data-rec-start]")!;
  const liveRow = document.querySelector<HTMLElement>("[data-rec-live]")!;
  const stopBtn = document.querySelector<HTMLButtonElement>("[data-rec-stop]")!;
  const timerEl = document.querySelector<HTMLElement>("[data-rec-timer]")!;
  const statusEl = document.querySelector<HTMLElement>("[data-rec-status]")!;
  const downloadLink = document.querySelector<HTMLAnchorElement>("[data-rec-download]")!;

  const i18n = (window as any).__bugRecorderI18n as Record<string, string>;

  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: BlobPart[] = [];
  let stream: MediaStream | null = null;
  let timer: number | null = null;
  let startedAt = 0;
  let endedByBrowser = false;

  function setStatus(msg: string) {
    statusEl.hidden = !msg;
    statusEl.textContent = msg;
  }

  function pickMimeType(): string {
    const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
    for (const type of candidates) {
      if (window.MediaRecorder?.isTypeSupported?.(type)) return type;
    }
    return "video/webm";
  }

  function startTimer() {
    startedAt = Date.now();
    timer = window.setInterval(() => {
      const secs = Math.floor((Date.now() - startedAt) / 1000);
      const m = String(Math.floor(secs / 60)).padStart(2, "0");
      const s = String(secs % 60).padStart(2, "0");
      timerEl.textContent = `${m}:${s}`;
    }, 500);
  }

  function stopTimer() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  }

  function warnBeforeUnload(e: BeforeUnloadEvent) {
    e.preventDefault();
    e.returnValue = "";
  }

  async function start() {
    try {
      // No `preferCurrentTab` here on purpose: "current tab" from this popup's own
      // perspective is the popup itself, not the admin tab the reporter wants to record.
      // And deliberately `displaySurface: "window"`, not "browser" (tab): Chrome's tab
      // capture is bound to the specific document being shared — a full page navigation in
      // the admin tab (which every sidebar click does, this isn't an SPA) can tear the
      // capture down with it. Window capture just records whatever's visually in that
      // window regardless of which page is loaded, so it survives navigation. The reporter
      // still has to actively confirm which window in the native picker.
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "window" } as MediaTrackConstraints,
        audio: false,
      });
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType: pickMimeType() });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };
      mediaRecorder.onstop = finish;
      stream.getVideoTracks()[0].addEventListener("ended", onTrackEnded);
      mediaRecorder.start();
      startBtn.hidden = true;
      liveRow.hidden = false;
      startTimer();
      window.addEventListener("beforeunload", warnBeforeUnload);
    } catch {
      setStatus(i18n.popupPermissionError);
    }
  }

  function stop() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
    stopTimer();
    window.removeEventListener("beforeunload", warnBeforeUnload);
  }

  // The browser itself ended the capture (reporter clicked Chrome's own "Stop sharing"
  // control, or the shared source went away) rather than the reporter clicking our Stop
  // button — still finish and keep whatever was captured, but say why it's short.
  function onTrackEnded() {
    endedByBrowser = true;
    stop();
  }

  function finish() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    const blob = new Blob(recordedChunks, { type: mediaRecorder?.mimeType || "video/webm" });
    const attachedMsg = endedByBrowser ? i18n.popupEndedEarly : i18n.popupAttached;

    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ source: "bug-recorder", blob, mimeType: blob.type }, window.location.origin);
        setStatus(attachedMsg);
        liveRow.hidden = true;
        window.setTimeout(() => window.close(), endedByBrowser ? 2500 : 900);
        return;
      } catch {
        // Fall through to the manual-download fallback below.
      }
    }

    // Opener tab is gone (closed, logged out, navigated cross-origin) — don't just lose the
    // recording, offer it as a direct download instead.
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.hidden = false;
    liveRow.hidden = true;
    setStatus(i18n.popupOpenerGone);
  }

  startBtn.addEventListener("click", start);
  stopBtn.addEventListener("click", stop);
}
