import { InternalServerException } from "../utils/app-error.js";
import { logger } from "../middleware/logger.js";

/** MyMemory allows short requests; chunk longer copy so descriptions still translate. */
const CHUNK_SIZE = 400;

/**
 * English → Arabic through the keyless MyMemory API, so the admin "Auto-translate"
 * button works without API keys. Swap the body of this function to change provider.
 */
export async function translateToArabic(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const parts: string[] = [];
  for (const piece of chunkText(trimmed)) {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", piece);
    url.searchParams.set("langpair", "en|ar");

    let payload: { responseData?: { translatedText?: string }; responseStatus?: number };
    try {
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) throw new Error(`Translation service replied ${response.status}`);
      payload = (await response.json()) as typeof payload;
    } catch (error) {
      logger.error({ err: error }, "Translation request failed");
      throw new InternalServerException("Could not translate right now. Please type the Arabic text yourself.");
    }

    const translated = payload.responseData?.translatedText?.trim();
    if (payload.responseStatus !== 200 || !translated) {
      throw new InternalServerException("Could not translate right now. Please type the Arabic text yourself.");
    }
    parts.push(translated);
  }

  return parts.join(" ");
}

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > CHUNK_SIZE) {
    let cut = rest.lastIndexOf(" ", CHUNK_SIZE);
    if (cut < CHUNK_SIZE / 2) cut = CHUNK_SIZE;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}
