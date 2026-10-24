/* La ruta de campaña: un desplegable por acto con sus pasos, notas y gemas. */

/** La ruta, un desplegable por acto; sin "actividades de zona" solo quedan los pasos con gemas. */
const routeSections: Component<[steps: PlannedStep[], start: string[], showZones: boolean], DocumentFragment> = (steps, start, showZones) => {
  const sections = document.createDocumentFragment();
  let act = 0, list: HTMLOListElement | null = null;
  for (const s of steps) {
    if (s.act !== act) {
      act = s.act;
      const n = steps.filter(x => x.act === act && x.gems.length).length;
      const det = section(`Acto ${act} <span>· ${n ? n + (n === 1 ? " paso con gemas" : " pasos con gemas") : "sin gemas"}</span>`, "act", act === 1, { id: "acto-" + act, label: String(act), group: "Ruta" });
      det.insertAdjacentHTML("beforeend", `<ol class="route"></ol>`);
      sections.append(det);
      list = det.querySelector("ol")!;
      if (act === 1 && start.length) {
        const li = document.createElement("li");
        li.className = "has-gems";
        li.innerHTML = `<div class="text">Al empezar</div>`;
        li.append(gemsBlock([{ how: "Ya la tienes", ids: start }]));
        list.append(li);
      }
    }
    if (!showZones && !s.gems.length) continue;
    const li = document.createElement("li");
    if (s.gems.length) li.className = "has-gems";
    li.innerHTML = `<div class="text">${s.text}</div>`;
    if (s.notes.length) {
      const ul = document.createElement("ul");
      ul.className = "notes";
      s.notes.forEach(n => { const it = document.createElement("li"); it.innerHTML = renderNote(n); ul.append(it); });
      li.append(ul);
    }
    if (s.gems.length) li.append(gemsBlock(s.gems));
    list!.append(li);
  }
  return sections;
};
