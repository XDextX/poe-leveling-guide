/*
 * La página entera. El build la ejecuta también en Node (scripts/lib/prerender.mts) para escribirla ya en index.html,
 * así los buscadores y quien no tiene JavaScript ven el contenido; en el navegador se vuelve a crear con sus eventos.
 * Por eso Page y los componentes que usa no pueden tocar el DOM ni la ventana al crearse: solo devolver JSX.
 */

import { About } from "../about/about";
import { BuildForm } from "../build-form/build-form";
import { Header } from "../header/header";
import { Sources } from "../sources/sources";
import { TocNav } from "../toc-nav/toc-nav";

export interface PageProps {
  classes: string[];
  /** Fecha de descarga de los datos y licencia de exile-leveling, para Fuentes. */
  date: string;
  license: string;
  onBuild?: () => void;
  onOptionsChange?: () => void;
}

/** Cabecera, formulario, índice, guía (vacía hasta que se crea) y las secciones fijas. */
export const Page: Component<PageProps, HTMLElement> = ({ classes, date, license, onBuild, onOptionsChange }) => (
  <main>
    <Header />
    <BuildForm classes={classes} onBuild={onBuild} onOptionsChange={onOptionsChange} />
    <TocNav />
    <div id="out" class="panel" hidden />
    <About />
    <Sources date={date} license={license} />
  </main>
) as HTMLElement;
