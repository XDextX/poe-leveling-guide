// Datos del sitio para buscadores y redes: una sola fuente para la URL canónica, Open Graph, JSON-LD y el sitemap.

const SITE = {
  url: "https://xdextx.github.io/poe-leveling-guide/",
  name: "Gemas de la Build",
  // Menos de 160 caracteres, que es lo que suelen mostrar los buscadores antes de cortar.
  description: "Pega tu build de Path of Building y sigue la campaña de Path of Exile zona por zona: qué gema elegir en cada misión, qué comprar, equipo y árbol.",
  author: { name: "German Montero", url: "https://github.com/XDextX" },
};

/** JSON-LD (schema.org WebApplication) listo para ir dentro de <script type="application/ld+json">. */
function jsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE.name,
    alternateName: "PoE Leveling Guide",
    url: SITE.url,
    description: SITE.description,
    image: SITE.url + "social-card.png",
    applicationCategory: "GameApplication",
    operatingSystem: "Cualquiera con navegador web",
    inLanguage: "es",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Person", ...SITE.author },
  };
  // "</" cerraría el <script> antes de tiempo si apareciera en algún texto.
  return JSON.stringify(data).replace(/<\//g, "<\\/");
}

/** sitemap.xml con la única página, para enviarlo a Google Search Console. */
const sitemap = date => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE.url}</loc><lastmod>${date}</lastmod></url>
</urlset>
`;

const attr = s => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

module.exports = { SITE, jsonLd, sitemap, attr };
