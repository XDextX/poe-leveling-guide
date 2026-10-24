/* Puntos indispensables: las keystones y los notables cogidos, numerados como en el mapa de calor. */

/** Lista numerada de los puntos indispensables, en el orden de `key`. */
const keyNodes: Component<[key: string[]], HTMLOListElement> = key =>
  el("ol", "key", "", ...key.map((id, i) => {
    const n = NODES[id], kind = nodeKind(id);
    const label = el("span", `kind ${kind === "keystone" ? "key" : kind}`, kind === "keystone" ? "Keystone" : KIND_ES[kind]);
    return el("li", "", "", el("span", "num", String(i + 1)), nodeIcon(n, 28) ?? el("span"),
      el("div", "", "", el("b", "", n.name), " ", label, el("p", "", n.stats.join(" · "))));
  }));
