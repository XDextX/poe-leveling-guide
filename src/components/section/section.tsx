/* Sección desplegable de la guía y sus subtítulos, la base de las demás secciones. */

import "./section.css";

interface SectionProps {
  /** Título del desplegable. */
  title: JSX.Child;
  className: string;
  /** Desplegada al empezar; por defecto sí. */
  open?: boolean;
  /** Destino del índice: { id, label, group } (group agrupa entradas, como los actos bajo "Ruta"). */
  toc?: TocTarget;
  children?: JSX.Child;
}

/** Sección desplegable: <Section title="Equipo" className="act gear" toc={…}>…</Section>. */
export const Section: Component<SectionProps, HTMLDetailsElement> = ({ title, className, open = true, toc, children }) => (
  <details class={className} open={open} id={toc?.id} data-toc={toc?.label} data-toc-group={toc?.group}>
    <summary>{title}</summary>
    {children}
  </details>
) as HTMLDetailsElement;

interface SubheadProps { children: JSX.Child }

/** Subtítulo de una sección: <Subhead>Únicos</Subhead>. */
export const Subhead: Component<SubheadProps, HTMLHeadingElement> = ({ children }) => <h3 class="sub">{children}</h3> as HTMLHeadingElement;
