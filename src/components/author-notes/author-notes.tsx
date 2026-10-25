/* Las notas que el autor dejó en el código de PoB: instrucciones, alternativas y, a veces, una guía de leveling. Solo texto. */

import { Section } from "../section/section";
import "./author-notes.css";

// Por encima de este tamaño la sección sale plegada, para que unas notas largas no empujen la guía fuera de la pantalla.
const OPEN_BELOW = 1200;

interface AuthorNotesProps { notes: string }

/** Sección "Notas del autor". El texto va tal cual (nunca como HTML), con sus saltos de línea. */
export const AuthorNotes: Component<AuthorNotesProps, HTMLDetailsElement> = ({ notes }) => (
  <Section title="Notas del autor" className="act author-notes" open={notes.length <= OPEN_BELOW} toc={{ id: "notas", label: "Notas del autor" }}>
    <pre class="notes-text">{notes}</pre>
  </Section>
) as HTMLDetailsElement;
