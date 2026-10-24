/* Lista de pares nombre/texto, como las notas de "Por otras vías" o las maestrías. */

interface NamedListProps {
  items: [name: string, text: string][];
  className?: string;
}

/** Lista con un <li><b>nombre</b><p>texto</p></li> por par. */
export const NamedList: Component<NamedListProps, HTMLUListElement> = ({ items, className }) => (
  <ul class={className}>
    {items.map(([name, text]) => <li><b>{name}</b><p>{text}</p></li>)}
  </ul>
) as HTMLUListElement;
