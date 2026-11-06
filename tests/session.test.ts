// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startSession } from "../src/app/session";
import type { FormControls } from "../src/app/session";

const KEY = "poe-gemas:sesion";

function setup() {
  const check = () => Object.assign(document.createElement("input"), { type: "checkbox" });
  const form: FormControls = { code: document.createElement("textarea"), cls: document.createElement("select"), league: check(), zones: check(), suggested: check() };
  const guide = document.createElement("div");
  guide.hidden = false;
  return { form, guide, start: () => startSession({ form, guide, run: async () => {}, rerender: () => {} }) };
}
const leave = () => dispatchEvent(new Event("pagehide"));

// startSession engancha oyentes a la ventana y al documento sin quitarlos nunca (vive lo que la página): para que unas pruebas no
// oigan los de otras, se anotan y se quitan al acabar cada una.
const hooked: [EventTarget, string, EventListener][] = [];
beforeEach(() => {
  localStorage.clear(); history.scrollRestoration = "auto";
  for (const target of [window, document]) {
    const add = target.addEventListener.bind(target);
    vi.spyOn(target, "addEventListener").mockImplementation((type: string, listener: EventListenerOrEventListenerObject, opts?: boolean | AddEventListenerOptions) => {
      hooked.push([target, type, listener as EventListener]); add(type, listener, opts);
    });
  }
});
afterEach(() => {
  vi.restoreAllMocks();
  for (const [target, type, listener] of hooked.splice(0)) target.removeEventListener(type, listener);
});

describe("sesión", () => {
  it("guarda la build al salir de la página y al pedirlo, y la casilla del leveling sugerido con ella", async () => {
    const { form, start } = setup();
    form.code.value = "codigo"; form.suggested.checked = true;
    const saveNow = await start();
    leave();
    expect(JSON.parse(localStorage.getItem(KEY)!)).toMatchObject({ code: "codigo", suggested: true });
    localStorage.clear();
    saveNow();
    expect(localStorage.getItem(KEY)).not.toBeNull();
  });

  it("si alguien limpia el almacenamiento con la guía abierta, al recargar no se vuelve a guardar la build", async () => {
    const { form, start } = setup();
    form.code.value = "codigo";
    const saveNow = await start();
    saveNow();
    expect(localStorage.getItem(KEY)).not.toBeNull();
    localStorage.clear();
    leave();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("lo mismo con una sesión restaurada al abrir la página", async () => {
    localStorage.setItem(KEY, JSON.stringify({ code: "guardado", cls: "", league: true, zones: true, open: [], stage: "-1", mode: "both", scroll: 0 }));
    const { form, start } = setup();
    await start();
    expect(form.code.value).toBe("guardado");
    localStorage.clear();
    leave();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("una guía nueva después de limpiar sí se guarda, y vaciar el campo quita la sesión", async () => {
    const { form, start } = setup();
    form.code.value = "uno";
    const saveNow = await start();
    saveNow(); localStorage.clear(); leave();
    expect(localStorage.getItem(KEY)).toBeNull();
    form.code.value = "dos";
    saveNow();
    expect(JSON.parse(localStorage.getItem(KEY)!).code).toBe("dos");
    form.code.value = "";
    leave();
    expect(localStorage.getItem(KEY)).toBeNull();
    form.code.value = "tres";
    leave();
    expect(localStorage.getItem(KEY)).not.toBeNull();
  });

  it("sin haber guardado antes, salir de la página sí guarda (primera vez)", async () => {
    const { form, start } = setup();
    form.code.value = "codigo";
    await start();
    leave();
    expect(localStorage.getItem(KEY)).not.toBeNull();
  });

  it("una sesión guardada cuyo código ya no se lee se puede borrar: al salir se quita", async () => {
    localStorage.setItem(KEY, JSON.stringify({ code: "ya no vale", cls: "", league: true, zones: true, open: [], stage: "-1", mode: "both", scroll: 0 }));
    const { form, guide } = setup();
    // run() no consigue componer la guía: la deja oculta.
    await startSession({ form, guide, run: async () => { guide.hidden = true; }, rerender: () => {} });
    expect(localStorage.getItem(KEY)).not.toBeNull();
    leave();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it("una segunda pestaña sin guía que se cierra no borra la sesión de la primera, y la primera sigue escribiendo", async () => {
    // La segunda pestaña se abrió vacía (no había nada guardado): sin código y con la guía oculta.
    const second = setup();
    second.guide.hidden = true;
    await second.start();
    const first = setup();
    first.form.code.value = "primera";
    const saveFirst = await first.start();
    saveFirst();
    leave();
    expect(JSON.parse(localStorage.getItem(KEY)!).code).toBe("primera");
    first.form.code.value = "primera cambiada";
    leave();
    expect(JSON.parse(localStorage.getItem(KEY)!).code).toBe("primera cambiada");
  });
});
