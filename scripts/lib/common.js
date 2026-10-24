// Utilidades compartidas por los reductores de datos.
const fs = require("fs"), path = require("path");

const CLASSES = ["Marauder", "Duelist", "Ranger", "Shadow", "Witch", "Templar", "Scion"];
/** Lista de clases → máscara de bits en el orden de CLASSES; lista vacía = todas. */
const classMask = classes => classes.length ? classes.reduce((m, c) => m | 1 << CLASSES.indexOf(c), 0) : 127;
/** Id largo de una gema ("Metadata/Items/Gems/SkillGemFireball") → corto ("SkillGemFireball"). */
const shortGemId = id => id.replace("Metadata/Items/Gems/", "");
const readJson = (dir, file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));

module.exports = { CLASSES, classMask, shortGemId, readJson };
