const GOOGLE_TRANSLATE = "https://translate.googleapis.com/translate_a/single";
const MYMEMORY_TRANSLATE = "https://api.mymemory.translated.net/get";

async function googleTranslate(text) {
  const url = new URL(GOOGLE_TRANSLATE);
  url.search = new URLSearchParams({ client: "gtx", sl: "en", tl: "fr", dt: "t", q: text });
  const response = await fetch(url, { signal: AbortSignal.timeout(7000), cache: "no-store" });
  if (!response.ok) throw new Error("Google Translate unavailable");
  const result = await response.json();
  return (result?.[0] || []).map(part => part?.[0] || "").join("");
}

async function myMemoryTranslate(text) {
  const url = new URL(MYMEMORY_TRANSLATE);
  url.search = new URLSearchParams({ q: text, langpair: "en|fr" });
  const response = await fetch(url, { signal: AbortSignal.timeout(9000), cache: "no-store" });
  if (!response.ok) throw new Error("MyMemory unavailable");
  const result = await response.json();
  if (result.responseStatus !== 200 || !result.responseData?.translatedText) throw new Error("Translation failed");
  return result.responseData.translatedText
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Requête invalide." }, { status: 400 }); }
  const lines = body?.lines;
  if (!Array.isArray(lines) || lines.length > 120 || lines.some(line => typeof line !== "string" || line.length > 500)) {
    return Response.json({ error: "Les paroles à traduire sont invalides." }, { status: 400 });
  }
  const separator = " AUDIVAQXZLINEBREAKQXZ ";
  const source = lines.join(separator);
  if (!source.trim()) return Response.json({ translations: lines });
  try {
    let translated;
    try { translated = await googleTranslate(source); }
    catch { translated = await myMemoryTranslate(source); }
    let translations = translated.split(/\s*AUDIVAQXZLINEBREAKQXZ\s*/i).map(line => line.trim());
    if (translations.length !== lines.length) {
      // Some providers remove separators while translating a long passage. Translate
      // each lyric line in small batches so timing remains attached to its original line.
      translations = Array(lines.length);
      let cursor = 0;
      const workers = Array.from({ length: Math.min(4, lines.length) }, async () => {
        while (cursor < lines.length) {
          const index = cursor++;
          if (!lines[index].trim()) { translations[index] = ""; continue; }
          translations[index] = await myMemoryTranslate(lines[index]);
        }
      });
      await Promise.all(workers);
    }
    return Response.json({ translations });
  } catch {
    return Response.json({ error: "Les services de traduction sont momentanément indisponibles." }, { status: 502 });
  }
}
