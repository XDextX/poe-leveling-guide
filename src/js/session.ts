/* Sesión: guarda la build, las opciones y lo que se está viendo en este navegador, para que recargar la página no lo pierda. */

const SESSION_KEY = "poe-gemas:sesion";
// La guía se compone después de cargar la página: si el navegador restaurase el desplazamiento por su cuenta,
// lo haría sobre una página aún vacía y luego saltaría. Lo restauramos nosotros, ya con la guía puesta.
history.scrollRestoration = "manual";

/** Valor del botón pulsado en una botonera del mapa de calor (data-s de las etapas, data-m de los modos). */
const pressedValue = (selector: string, key: string): string | undefined => document.querySelector<HTMLElement>(`${selector} [aria-pressed="true"]`)?.dataset[key];

/** Guarda el estado actual; sin guía a la vista (campo vacío o código inválido) no hay nada que conservar. */
function saveSession(): void {
  try {
    if (!form.code.value.trim() || $("out").hidden) { localStorage.removeItem(SESSION_KEY); return; }
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      code: form.code.value, cls: form.cls.value, league: form.league.checked, zones: form.zones.checked,
      open: [...$("out").querySelectorAll<HTMLDetailsElement>("details[id]")].filter(d => d.open).map(d => d.id),
      stage: pressedValue(".stages", "s") ?? "-1", mode: pressedValue(".kinds", "m") ?? "both",
      scroll: scrollY,
    }));
  } catch {}
}

/** Si había una guía guardada, la vuelve a componer y deja la vista como estaba. */
async function restoreSession(): Promise<void> {
  /** Lo que se guarda: la build, las opciones y la vista. */
  let saved: { code: string; cls: string; league: boolean; zones: boolean; open: string[]; stage: string; mode: string; scroll: number } | null = null;
  try { saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null"); } catch {}
  if (!saved?.code) return;
  form.code.value = saved.code;
  form.league.checked = saved.league;
  form.zones.checked = saved.zones;
  await run();
  if ($("out").hidden) return;
  // run() pone la clase de la build; si se estaba viendo otra, se recompone con ella.
  if (saved.cls && form.cls.value !== saved.cls) { form.cls.value = saved.cls; rerender(); }
  for (const d of $("out").querySelectorAll<HTMLDetailsElement>("details[id]")) d.open = saved.open.includes(d.id);
  document.querySelector<HTMLElement>(`.stages [data-s="${saved.stage}"]`)?.click();
  document.querySelector<HTMLElement>(`.kinds [data-m="${saved.mode}"]`)?.click();
  // Dos fotogramas: el primero pinta el mapa de calor (que fija su alto), el segundo ya puede desplazarse.
  requestAnimationFrame(() => requestAnimationFrame(() => scrollTo({ top: saved.scroll, behavior: "instant" })));
}

// "pagehide" cubre recargar y cerrar; "visibilitychange" el celular, que puede matar la pestaña en segundo plano sin avisar.
addEventListener("pagehide", saveSession);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") saveSession(); });
