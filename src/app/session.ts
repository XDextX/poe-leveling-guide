/* Sesión: guarda la build, las opciones y lo que se está viendo en este navegador, para que recargar la página no lo pierda. */

const SESSION_KEY = "poe-gemas:sesion";

/** Los controles del formulario (BuildForm), con su tipo exacto. */
export interface FormControls {
  code: HTMLTextAreaElement;
  cls: HTMLSelectElement;
  league: HTMLInputElement;
  zones: HTMLInputElement;
}

/** Lo que la sesión necesita de la app: el formulario, el contenedor de la guía y cómo leer el código y recomponer. */
export interface SessionTarget {
  form: FormControls;
  guide: HTMLElement;
  run: () => Promise<void>;
  rerender: () => void;
}

/** Lo que se guarda: la build, las opciones y la vista. */
interface Saved { code: string; cls: string; league: boolean; zones: boolean; open: string[]; stage: string; mode: string; scroll: number }

/**
 * Engancha el guardado (al recargar, cerrar o pasar a segundo plano) y restaura la sesión anterior si la hay.
 * La llama <App> una vez, con la página ya en el documento.
 */
export async function startSession({ form, guide, run, rerender }: SessionTarget): Promise<void> {
  // La guía se compone después de cargar la página: si el navegador restaurase el desplazamiento por su cuenta,
  // lo haría sobre una página aún vacía y luego saltaría. Lo restauramos nosotros, ya con la guía puesta.
  history.scrollRestoration = "manual";

  /** Valor del botón pulsado en una botonera del mapa de calor (.stages las etapas, .kinds daño/defensa). */
  const pressedValue = (selector: string): string | undefined => guide.querySelector<HTMLElement>(`${selector} [aria-pressed="true"]`)?.dataset.value;

  /** Guarda el estado actual; sin guía a la vista (campo vacío o código inválido) no hay nada que conservar. */
  const save = (): void => {
    try {
      if (!form.code.value.trim() || guide.hidden) { localStorage.removeItem(SESSION_KEY); return; }
      const saved: Saved = {
        code: form.code.value, cls: form.cls.value, league: form.league.checked, zones: form.zones.checked,
        open: [...guide.querySelectorAll<HTMLDetailsElement>("details[id]")].filter(d => d.open).map(d => d.id),
        stage: pressedValue(".stages") ?? "-1", mode: pressedValue(".kinds") ?? "both",
        scroll: scrollY,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(saved));
    } catch {}
  };
  // "pagehide" cubre recargar y cerrar; "visibilitychange" el celular, que puede matar la pestaña en segundo plano sin avisar.
  addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(); });

  // Si había una guía guardada, se vuelve a componer y se deja la vista como estaba.
  let saved: Saved | null = null;
  try { saved = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null"); } catch {}
  // index.html marca <html class="restoring"> si hay sesión: styles.css oculta la página hasta que la guía está puesta.
  const done = () => document.documentElement.classList.remove("restoring");
  if (!saved?.code) return done();
  form.code.value = saved.code;
  form.league.checked = saved.league;
  form.zones.checked = saved.zones;
  await run();
  if (guide.hidden) return done();
  // run() pone la clase de la build; si se estaba viendo otra, se recompone con ella.
  if (saved.cls && form.cls.value !== saved.cls) { form.cls.value = saved.cls; rerender(); }
  for (const d of guide.querySelectorAll<HTMLDetailsElement>("details[id]")) d.open = saved.open.includes(d.id);
  guide.querySelector<HTMLElement>(`.stages [data-value="${saved.stage}"]`)?.click();
  guide.querySelector<HTMLElement>(`.kinds [data-value="${saved.mode}"]`)?.click();
  // Dos fotogramas: el primero pinta el mapa de calor (que fija su alto), el segundo ya puede desplazarse.
  const top = saved.scroll;
  requestAnimationFrame(() => requestAnimationFrame(() => { scrollTo({ top, behavior: "instant" }); done(); }));
  // En una pestaña en segundo plano no hay fotogramas: la página no debe quedarse oculta esperando uno.
  setTimeout(done, 1000);
}
