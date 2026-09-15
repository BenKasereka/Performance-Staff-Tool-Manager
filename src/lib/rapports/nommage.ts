/**
 * Nom de fichier sûr pour l'en-tête Content-Disposition.
 *
 * Les accents et les guillemets casseraient l'en-tête ou le téléchargement
 * selon le navigateur ; on translittère plutôt que de laisser passer.
 */
export function nomFichier(libelle: string) {
  return libelle
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 _-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 90);
}
