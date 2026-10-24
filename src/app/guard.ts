/*
 * Comprobación de los datos del juego antes de arrancar. main.tsx lo importa antes que la app: si alguien copia solo
 * index.html, sin la carpeta gamedata/, se dice qué falta en la página (la prerenderizada) en vez de dejarla rota en
 * silencio, y se para.
 */

const MISSING = ["CLASSES", "G", "K", "Q", "A", "START", "ROUTE", "T", "U"].filter(k => !(window.DATA && k in window.DATA));
if (MISSING.length) {
  const msg = document.getElementById("msg")!;
  msg.className = "error";
  msg.textContent = "Faltan los datos del juego: la carpeta gamedata/ tiene que estar junto a index.html. Copia la carpeta entera de la app.";
  (document.getElementById("go") as HTMLButtonElement).disabled = true;
  throw new Error("Faltan datos en window.DATA: " + MISSING.join(", "));
}
