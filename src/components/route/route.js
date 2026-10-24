/* La ruta de campaña: un desplegable por acto con sus pasos, notas y gemas. */

/** La ruta, un desplegable por acto; sin "actividades de zona" solo quedan los pasos con gemas. */
function routeSections(steps, start, showZones) {
  const sections = [];
  let act = 0, list = null;
  for (const s of steps) {
    if (s.act !== act) {
      act = s.act;
      const n = steps.filter(x => x.act === act && x.gems.length).length;
      const det = section(`Acto ${act} <span>· ${n ? n + (n === 1 ? " paso con gemas" : " pasos con gemas") : "sin gemas"}</span>`, "act", act === 1, { id: "acto-" + act, label: String(act), group: "Ruta" });
      det.insertAdjacentHTML("beforeend", `<ol class="route"></ol>`);
      sections.push(det);
      list = det.querySelector("ol");
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
    list.append(li);
  }
  return sections;
}
