import test from "node:test";
import assert from "node:assert/strict";
import { parseRelease, fetchLatestRelease, showDownloads, downloadInstaller, startInstaller, LATEST_RELEASE_API, LATEST_RELEASE_URL } from "../assets/score-tracker/downloads.mjs";

function release(version = "1.0.2") {
  const root = "https://github.com/domecose96/ScoreTracker-Downloads/releases";
  return {
    tag_name: `v${version}`, draft: false, prerelease: false, html_url: `${root}/tag/v${version}`,
    assets: ["ScoreTracker-Setup", "ScoreTracker-macOS"].map((prefix, index) => {
      const name = `${prefix}-v${version}.${index ? "dmg" : "exe"}`;
      return { name, state: "uploaded", size: 100, digest: `sha256:${"a".repeat(64)}`,
        browser_download_url: `${root}/download/v${version}/${name}` };
    }),
  };
}

test("latest: Windows e Mac della stessa release ufficiale", () => {
  const result = parseRelease(release());
  assert.equal(result.version, "1.0.2");
  assert.match(result.installers.windows, /v1\.0\.2\/ScoreTracker-Setup-v1\.0\.2\.exe$/);
  assert.match(result.installers.macos, /v1\.0\.2\/ScoreTracker-macOS-v1\.0\.2\.dmg$/);
});

test("latest: una nuova versione non richiede modifiche ai link del sito", () => {
  for (const version of ["1.0.3", "2.5.10", "2.0.0+build.7"]) {
    const result = parseRelease(release(version));
    assert.equal(result.version, version);
    assert.ok(result.installers.windows.endsWith(`v${version}.exe`));
    assert.ok(result.installers.macos.endsWith(`v${version}.dmg`));
  }
});

test("latest: bozze, prerelease e tag malformati non attivano download", () => {
  for (const change of [{draft: true}, {prerelease: true}, {tag_name: "v../other"},
    {tag_name: "v01.0.2"}, {tag_name: "<script>"}, {assets: null},
    {html_url: "https://example.com/release"}]) {
    assert.throws(() => parseRelease({...release(), ...change}));
  }
});

test("latest: niente redirect aperti o installer di repository estranei", () => {
  for (const url of ["http://github.com/domecose96/ScoreTracker-Downloads/file.exe",
    "https://evil.example/file.exe", "https://github.com.evil.example/file.exe",
    "https://user@github.com/domecose96/ScoreTracker-Downloads/file.exe",
    "https://github.com:444/file.exe", release().assets[0].browser_download_url + "?x=1",
    release().assets[0].browser_download_url + "#x",
    release().assets[0].browser_download_url.replace("domecose96", "another-owner"),
    release().assets[0].browser_download_url.replaceAll("1.0.2", "1.0.1")]) {
    const data = release();
    data.assets[0].browser_download_url = url;
    assert.throws(() => parseRelease(data));
  }
});

test("latest: asset incompleti, digest mancanti e doppioni vengono respinti", () => {
  for (const change of [{state: "new"}, {size: 0}, {size: 1.5}, {digest: null}, {digest: "sha256:invalid"}]) {
    const data = release();
    Object.assign(data.assets[0], change);
    assert.throws(() => parseRelease(data));
  }
  const data = release();
  data.assets.push({...data.assets[0]});
  assert.throws(() => parseRelease(data));
});

test("latest: piattaforma mancante resta assente senza scegliere ZIP o file vicini", () => {
  const data = release();
  data.assets.pop();
  data.assets.push({name: "ScoreTracker-Windows-v1.0.2.zip"});
  const result = parseRelease(data);
  assert.ok(result.installers.windows);
  assert.equal(result.installers.macos, undefined);
  assert.throws(() => parseRelease({...data, assets: []}));
});

test("fetch: API pubblica fissa, senza cookie e senza seguire redirect", async () => {
  const result = await fetchLatestRelease({fetcher: async (url, options) => {
    assert.equal(url, LATEST_RELEASE_API);
    assert.equal(options.credentials, "omit");
    assert.equal(options.redirect, "error");
    assert.equal(options.cache, "no-cache");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.equal(options.headers.Accept, "application/vnd.github.html+json");
    return {ok: true, json: async () => release()};
  }});
  assert.equal(result.version, "1.0.2");
});

test("fetch: rate limit e JSON non valido non producono un link di download", async () => {
  await assert.rejects(fetchLatestRelease({fetcher: async () => ({ok: false, status: 403})}));
  await assert.rejects(fetchLatestRelease({fetcher: async () => ({ok: true, json: async () => {throw Error("Invalid JSON");}})}));
});

test("fetch: timeout interrompe la richiesta", async () => {
  await assert.rejects(fetchLatestRelease({timeout: 5, fetcher: (_url, {signal}) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(Error("Timeout")), {once:true});
  })}));
});

function documentFixture() {
  const ids = Object.fromEntries(["release-status", "release-notes-title", "release-notes-content", "download-feedback",
    "installer-status", "installer-link"].map(id => [id, {textContent: "", href: LATEST_RELEASE_URL, hidden: true}]));
  const platforms = ["windows", "macos"].map(platform => ({dataset: {releasePlatform: platform}, textContent: ""}));
  const buttons = Object.fromEntries(["windows", "macos"].map(platform => [platform, {
    dataset: {downloadPlatform: platform}, disabled: false, attributes: {},
    setAttribute(name, value) {this.attributes[name] = value;},
    removeAttribute(name) {delete this.attributes[name];},
  }]));
  return {ids, platforms, buttons, getElementById: id => ids[id],
    querySelectorAll: selector => selector === "[data-release-platform]" ? platforms : Object.values(buttons),
    querySelector: selector => buttons[selector.includes('"windows"') ? "windows" : "macos"]};
}

test("pagina: versione e note cambiano automaticamente al prossimo rilascio", async () => {
  const document = documentFixture();
  for (const version of ["1.0.2", "1.0.3"]) {
    await showDownloads(document, async () => parseRelease(release(version)));
    assert.equal(document.ids["release-status"].textContent, `Versione ${version}`);
    assert.equal(document.ids["release-notes-title"].textContent, `ScoreTracker ${version}`);
    assert.equal(document.ids["release-notes-content"].textContent, "Non sono state pubblicate note per questa versione.");
    for (const element of document.platforms) assert.ok(element.textContent.includes(version));
  }
});

test("gateway: gli stessi URL permanenti risolvono Windows e Mac anche per la versione successiva", async () => {
  for (const platform of ["windows", "macos"]) {
    for (const version of ["1.0.2", "1.0.3"]) {
      const document = documentFixture();
      let destination;
      const location = {href: `https://example.com/score-tracker-installer.html?platform=${platform}`, replace: url => {destination=url;}};
      const metadata = parseRelease(release(version));
      await startInstaller(document, location, async () => metadata);
      assert.equal(destination, metadata.installers[platform]);
      assert.equal(document.ids["installer-link"].href, destination);
      assert.ok(document.ids["installer-status"].textContent.includes(version));
    }
  }
});

test("gateway: piattaforme e query malevole non avviano richieste o download", async () => {
  for (const query of ["", "?platform=linux", "?platform=__proto__", "?platform=constructor", "?platform=https://evil.example"]) {
    const document = documentFixture();
    let calls = 0;
    await startInstaller(document, {href: `https://example.com/score-tracker-installer.html${query}`,
      replace: () => calls++}, async () => {calls++; return parseRelease(release());});
    assert.equal(calls, 0);
    assert.equal(document.ids["installer-link"].href, LATEST_RELEASE_URL);
  }
});

test("pagina e gateway: API indisponibile mantiene il ripiego ufficiale, senza versioni obsolete", async () => {
  const document = documentFixture();
  const unavailable = async () => {throw Error("API offline");};
  await showDownloads(document, unavailable);
  assert.equal(document.ids["release-status"].textContent, "Disponibilità da verificare");
  let destination;
  await startInstaller(document, {href: "https://example.com/get?platform=macos", replace: url => {destination=url;}}, unavailable);
  assert.equal(destination, undefined);
  assert.equal(document.ids["installer-link"].href, LATEST_RELEASE_URL);
  assert.ok(document.ids["installer-status"].textContent.includes("non disponibile"));
});

test("gateway: installer mancante non viene sostituito con quello dell'altra piattaforma", async () => {
  const document = documentFixture();
  const data = release();
  data.assets.pop();
  let destination;
  await startInstaller(document, {href: "https://example.com/get?platform=macos", replace: url => {destination=url;}},
    async () => parseRelease(data));
  assert.equal(destination, undefined);
  assert.equal(document.ids["installer-link"].href, LATEST_RELEASE_URL);
});

test("note: il formato HTML della release e' disponibile per la visualizzazione locale", () => {
  const data = release();
  data.body_html = "<h2>Novita</h2><ul><li>Nuova funzione</li></ul>";
  assert.equal(parseRelease(data).notesHtml, data.body_html);
  assert.equal(parseRelease({...data, body_html: "x".repeat(128001)}).notesHtml, "");
  assert.equal(parseRelease({...data, body_html: {html: "invalid"}}).notesHtml, "");
});

test("pulsanti: download diretto dei due installer senza pagina intermedia", async () => {
  for (const platform of ["windows", "macos"]) {
    for (const version of ["1.0.2", "1.0.3"]) {
      const document = documentFixture();
      let destination;
      const location = {href: "https://example.com/score-tracker-download.html", assign: url => {destination=url;}};
      const metadata = parseRelease(release(version));
      assert.equal(await downloadInstaller(platform, document, location, async () => metadata), true);
      assert.equal(destination, metadata.installers[platform]);
      assert.equal(location.href, "https://example.com/score-tracker-download.html");
      assert.equal(document.buttons[platform].disabled, false);
      assert.equal(document.buttons[platform].attributes["aria-busy"], undefined);
      assert.equal(document.ids["download-feedback"].hidden, true);
    }
  }
});

test("pulsanti: un errore resta sul sito e permette di riprovare", async () => {
  const document = documentFixture();
  let navigations = 0;
  assert.equal(await downloadInstaller("windows", document, {assign: () => navigations++},
    async () => {throw Error("API offline");}), false);
  assert.equal(navigations, 0);
  assert.equal(document.ids["download-feedback"].hidden, false);
  assert.ok(document.ids["download-feedback"].textContent.includes("Riprova"));
  assert.equal(document.buttons.windows.disabled, false);
});

test("pulsanti: nessun download doppio mentre si risolve la release", async () => {
  const document = documentFixture();
  let calls = 0;
  let resolve;
  const response = new Promise(done => {resolve=done;});
  const loader = () => {calls++; return response;};
  const location = {assign: () => {}};
  const first = downloadInstaller("windows", document, location, loader);
  assert.equal(await downloadInstaller("windows", document, location, loader), false);
  assert.equal(calls, 1);
  resolve(parseRelease(release()));
  assert.equal(await first, true);
});

test("pagina: piattaforma mancante disabilitata, errore iniziale riprovabile", async () => {
  const document = documentFixture();
  const data = release();
  data.assets.pop();
  await showDownloads(document, async () => parseRelease(data));
  assert.equal(document.buttons.macos.disabled, true);
  assert.equal(document.buttons.windows.disabled, false);
  await showDownloads(document, async () => {throw Error("Offline");});
  assert.equal(document.buttons.macos.disabled, false);
  assert.equal(document.buttons.windows.disabled, false);
});
