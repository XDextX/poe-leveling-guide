/* El código de exportación de Path of Building → su XML. */

import { userError } from "../errors";

// Lo que puede ocupar el XML descomprimido: una build real pesa unos cientos de KB; un código pequeño que se expande a cientos de MB (zip bomb) colgaría la pestaña.
const MAX_BYTES = 20 * 1024 * 1024;

/** Código de PoB → XML: base64 "url-safe" comprimido con zlib. */
export async function decode(code: string): Promise<string> {
  let b64 = code.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  b64 += "=".repeat((4 - b64.length % 4) % 4);
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate")).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (let r = await reader.read(); !r.done; r = await reader.read()) {
    total += r.value.length;
    if (total > MAX_BYTES) { void reader.cancel(); throw userError("es demasiado grande para ser una build"); }
    chunks.push(r.value);
  }
  return new TextDecoder().decode(await new Blob(chunks as BlobPart[]).arrayBuffer());
}
