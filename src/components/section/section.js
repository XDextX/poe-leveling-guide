/* Sección desplegable y lista nombre/texto, la base de las demás secciones. */

/** Sección desplegable con su título (HTML) ya puesto. */
function section(summaryHtml, className, open = true) {
  const sec = document.createElement("details");
  sec.className = className;
  sec.open = open;
  sec.innerHTML = `<summary>${summaryHtml}</summary>`;
  return sec;
}

/** Lista de pares [nombre, texto] como <li><b>nombre</b><p>texto</p></li>, sin interpretar HTML. */
function fillNamed(ul, pairs) {
  for (const [name, text] of pairs) {
    const li = document.createElement("li");
    li.innerHTML = "<b></b><p></p>";
    li.querySelector("b").textContent = name;
    li.querySelector("p").textContent = text;
    ul.append(li);
  }
}
