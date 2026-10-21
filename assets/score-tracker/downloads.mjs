const REPOSITORY = "https://github.com/domecose96/ScoreTracker-Downloads";
export const LATEST_RELEASE_URL = `${REPOSITORY}/releases/latest`;
export const LATEST_RELEASE_API = "https://api.github.com/repos/domecose96/ScoreTracker-Downloads/releases/latest";
const PLATFORMS = Object.freeze({
  windows: { prefix: "ScoreTracker-Setup", extension: "exe", label: "Windows x64" },
  macos: { prefix: "ScoreTracker-macOS", extension: "dmg", label: "macOS Apple Silicon" },
});
const VERSION = /^v((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$/;

function sameOfficialUrl(value, expected) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return !url.username && !url.password && !url.search && !url.hash
      && url.origin === "https://github.com"
      && decodeURIComponent(url.pathname) === new URL(expected).pathname;
  } catch { return false; }
}

export function parseRelease(data) {
  const match = typeof data?.tag_name === "string" && VERSION.exec(data.tag_name);
  if (!match || data.draft !== false || data.prerelease !== false || !Array.isArray(data.assets)) {
    throw new Error("Release non valida");
  }
  const version = match[1];
  const url = `${REPOSITORY}/releases/tag/v${version}`;
  if (!sameOfficialUrl(data.html_url, url)) throw new Error("Pagina release non valida");
  const installers = {};
  for (const [platform, format] of Object.entries(PLATFORMS)) {
    const name = `${format.prefix}-v${version}.${format.extension}`;
    const candidates = data.assets.filter(asset => asset?.name === name);
    if (candidates.length > 1) throw new Error("Installer duplicato");
    const asset = candidates[0];
    if (!asset) continue;
    const expected = `${REPOSITORY}/releases/download/v${version}/${name}`;
    if (asset.state !== "uploaded" || !Number.isSafeInteger(asset.size) || asset.size <= 0
        || !/^sha256:[a-f0-9]{64}$/.test(asset.digest)
        || !sameOfficialUrl(asset.browser_download_url, expected)) {
      throw new Error("Installer non valido");
    }
    installers[platform] = asset.browser_download_url;
  }
  if (!Object.keys(installers).length) throw new Error("Installer non disponibili");
  const notesHtml = typeof data.body_html === "string" && data.body_html.length <= 128000 ? data.body_html : "";
  return { version, url, installers, notesHtml };
}

export async function fetchLatestRelease({ fetcher = globalThis.fetch, timeout = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetcher(LATEST_RELEASE_API, {
      headers: { Accept: "application/vnd.github.html+json" },
      cache: "no-cache", credentials: "omit", referrerPolicy: "no-referrer",
      redirect: "error", signal: controller.signal,
    });
    if (!response.ok) throw new Error("Release non raggiungibile");
    return parseRelease(await response.json());
  } finally { clearTimeout(timer); }
}

export function renderReleaseNotes(document, html) {
  const target = document.getElementById("release-notes-content");
  if (!html) {
    target.textContent = "Non sono state pubblicate note per questa versione.";
    return;
  }
  // Parse in an inert template; only plain text reaches the visible document.
  const template = document.createElement("template");
  template.innerHTML = html;
  for (const element of template.content.querySelectorAll("script,style,iframe,object,embed,template")) element.remove();
  const list = template.content.querySelector("ul,ol");
  const entries = list ? [...list.children].filter(element => element.tagName === "LI")
    : [...template.content.querySelectorAll("p")];
  const notes = entries.map(element => element.textContent.trim()).filter(Boolean).slice(0, 12);
  if (!notes.length) {
    target.textContent = "Non sono state pubblicate note per questa versione.";
    return;
  }
  const container = document.createElement(list ? "ul" : "div");
  for (const note of notes) {
    const element = document.createElement(list ? "li" : "p");
    element.textContent = note.slice(0, 2000);
    container.append(element);
  }
  target.replaceChildren(container);
}

function renderRelease(document, release) {
  document.getElementById("release-status").textContent = `Versione ${release.version}`;
  document.getElementById("release-notes-title").textContent = `ScoreTracker ${release.version}`;
  renderReleaseNotes(document, release.notesHtml);
  for (const element of document.querySelectorAll("[data-release-platform]")) {
    const platform = element.dataset.releasePlatform;
    element.textContent = release.installers[platform]
      ? `Versione ${release.version} · File .${PLATFORMS[platform].extension}`
      : "Installer temporaneamente non disponibile";
  }
  for (const button of document.querySelectorAll("[data-download-platform]")) {
    button.disabled = !release.installers[button.dataset.downloadPlatform];
  }
}

export async function showDownloads(document, loadRelease = fetchLatestRelease) {
  try {
    const release = await loadRelease();
    renderRelease(document, release);
  } catch {
    document.getElementById("release-status").textContent = "Disponibilità da verificare";
    for (const button of document.querySelectorAll("[data-download-platform]")) button.disabled = false;
  }
}

export async function downloadInstaller(platform, document, location, loadRelease = fetchLatestRelease) {
  if (!Object.hasOwn(PLATFORMS, platform)) return false;
  const button = document.querySelector(`[data-download-platform="${platform}"]`);
  if (!button || button.disabled) return false;
  const feedback = document.getElementById("download-feedback");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  feedback.hidden = true;
  try {
    const release = await loadRelease();
    renderRelease(document, release);
    const installer = release.installers[platform];
    if (!installer) throw new Error("Installer non disponibile");
    location.assign(installer);
    return true;
  } catch {
    feedback.textContent = "Download temporaneamente non disponibile. Riprova tra poco o contattaci.";
    feedback.hidden = false;
    return false;
  } finally {
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

function bindDownloads(document, location) {
  for (const button of document.querySelectorAll("[data-download-platform]")) {
    button.addEventListener("click", () => {
      void downloadInstaller(button.dataset.downloadPlatform, document, location);
    });
  }
}

export async function startInstaller(document, location, loadRelease = fetchLatestRelease) {
  const platform = new URL(location.href).searchParams.get("platform");
  const status = document.getElementById("installer-status");
  const link = document.getElementById("installer-link");
  if (!Object.hasOwn(PLATFORMS, platform)) {
    status.textContent = "Seleziona Windows o macOS dalla pagina dei download.";
    return;
  }
  try {
    const release = await loadRelease();
    const installer = release.installers[platform];
    if (!installer) throw new Error("Installer non disponibile");
    status.textContent = `ScoreTracker ${release.version} per ${PLATFORMS[platform].label}`;
    link.href = installer;
    link.textContent = "Scarica il file";
    location.replace(installer);
  } catch {
    status.textContent = "Download automatico non disponibile. Gli installer ufficiali sono su GitHub.";
  }
}

if (typeof document !== "undefined") {
  if (document.body.hasAttribute("data-installer-gateway")) {
    void startInstaller(document, window.location);
  } else if (document.getElementById("release-status")) {
    bindDownloads(document, window.location);
    void showDownloads(document);
  }
}
