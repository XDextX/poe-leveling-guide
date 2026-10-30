/*
 * Prerender: lo que el build (vite.config.ts) ejecuta en Node para escribir index.html con el <head> y la página ya dentro,
 * así los buscadores, las previsualizaciones y quien no tiene JavaScript ven el contenido. En Node, el runtime del JSX
 * escribe HTML en vez de crear nodos (src/jsx/jsx-runtime.ts). En el navegador, app.tsx vuelve a crear <Page> con sus eventos.
 */

import { Page } from "../components/page/page";
import type { PageProps } from "../components/page/page";
import type { Html } from "../jsx/jsx-runtime";

export interface HeadProps {
  site: { url: string; name: string; description: string };
  /** JSON-LD (schema.org) ya serializado. */
  jsonLd: string;
  /** Icono en SVG como data: URL. */
  icon: string;
}

/** Metadatos, iconos y fuentes del <head>. Los estilos y el JS de la app los añade Vite. */
export const Head: Component<HeadProps, DocumentFragment> = ({ site, jsonLd, icon }) => {
  const title = `${site.name} · Guía de leveling para Path of Exile`;
  return (
    <>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <meta name="description" content={site.description} />
      <link rel="canonical" href={site.url} />
      <meta name="theme-color" content="#f4f2ee" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#0f0d0a" media="(prefers-color-scheme: dark)" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:locale" content="es_ES" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={site.description} />
      <meta property="og:url" content={site.url} />
      <meta property="og:image" content={site.url + "social-card.png"} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`${site.name}: guía de leveling para Path of Exile`} />
      <meta name="twitter:card" content="summary_large_image" />
      <link rel="icon" href={icon} type="image/svg+xml" />
      <link rel="icon" href="favicon.ico" sizes="any" />
      <link rel="apple-touch-icon" href="apple-touch-icon.png" />
      <link rel="manifest" href="manifest.webmanifest" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap" />
      <script type="application/ld+json" html={jsonLd} />
    </>
  ) as DocumentFragment;
};

/** HTML del <head> y de la página, para los huecos <!--app-head--> y <!--app-page--> de index.html. Solo funciona en Node. */
export function prerender(props: HeadProps & PageProps): { head: string; page: string } {
  const html = (node: JSX.Element) => (node as unknown as Html).html;
  return { head: html(<Head {...props} />), page: html(<Page {...props} />) };
}
