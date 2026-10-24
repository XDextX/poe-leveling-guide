/* Acceso a la página desde el arranque: elementos por id y los controles del formulario (BuildForm). */

/** Elemento de la página por id. Todos los que se piden existen en la página; T afina el tipo (textarea, input…). */
export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

/** Los controles del formulario, con su tipo exacto. Se buscan al usarlos: el arranque cambia la página prerenderizada por una nueva. */
export const form = {
  get code() { return $<HTMLTextAreaElement>("code"); }, get cls() { return $<HTMLSelectElement>("cls"); },
  get league() { return $<HTMLInputElement>("league"); }, get zones() { return $<HTMLInputElement>("zones"); },
};
