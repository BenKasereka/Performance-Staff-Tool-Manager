import { Resend } from "resend";

const EXPEDITEUR =
  process.env.EMAIL_FROM ?? "Suivi Performance <onboarding@resend.dev>";

/**
 * Envoi d'email, sans clé API l'application fonctionne quand même.
 *
 * Les notifications in-app restent la source de vérité ; l'email n'est qu'un
 * relais. Faire échouer une création de tâche parce que Resend n'est pas
 * configuré serait disproportionné.
 */
export async function envoyerEmail(options: {
  destinataire: string;
  sujet: string;
  titre: string;
  corps: string[];
  lien?: { url: string; libelle: string };
}) {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) return { envoye: false, raison: "RESEND_API_KEY absente" };

  try {
    const resend = new Resend(cle);
    const { error } = await resend.emails.send({
      from: EXPEDITEUR,
      to: options.destinataire,
      subject: options.sujet,
      html: gabarit(options),
    });

    if (error) return { envoye: false, raison: error.message };
    return { envoye: true };
  } catch (erreur) {
    return {
      envoye: false,
      raison: erreur instanceof Error ? erreur.message : "erreur inconnue",
    };
  }
}

function echapper(texte: string) {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function gabarit({
  titre,
  corps,
  lien,
}: {
  titre: string;
  corps: string[];
  lien?: { url: string; libelle: string };
}) {
  const paragraphes = corps
    .map(
      (p) =>
        `<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#0b0b0b">${echapper(p)}</p>`,
    )
    .join("");

  const bouton = lien
    ? `<p style="margin:24px 0 0"><a href="${echapper(lien.url)}" style="display:inline-block;background:#0b0b0b;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:500">${echapper(lien.libelle)}</a></p>`
    : "";

  return `<!doctype html>
<html lang="fr"><body style="margin:0;padding:24px;background:#f9f9f7;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e1e0d9">
    <p style="margin:0 0 4px;font-size:13px;color:#898781">Suivi de Performance d'Équipe</p>
    <h1 style="margin:0 0 18px;font-size:19px;line-height:1.3;color:#0b0b0b">${echapper(titre)}</h1>
    ${paragraphes}
    ${bouton}
  </div>
  <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#898781">Message automatique, envoyé depuis votre outil de suivi d'équipe.</p>
</body></html>`;
}
