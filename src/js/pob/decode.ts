/* El código de exportación de Path of Building → su XML. */

/** Código de PoB → XML: base64 "url-safe" comprimido con zlib. */
export async function decode(code: string): Promise<string> {
  let b64 = code.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  b64 += "=".repeat((4 - b64.length % 4) % 4);
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Response(stream).text();
}
