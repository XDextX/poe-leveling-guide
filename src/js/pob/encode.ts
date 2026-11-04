/* El XML de Path of Building → su código de exportación (lo contrario de decode). */

/** XML → código de PoB: zlib y base64 "url-safe". */
export async function encode(xml: string): Promise<string> {
  const stream = new Blob([xml]).stream().pipeThrough(new CompressionStream("deflate"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_");
}
