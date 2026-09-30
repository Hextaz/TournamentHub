const ERROR_MAP: Record<string, string> = {
  "22P02": "Format de données invalide.",
  "23505": "Cet enregistrement existe déjà (doublon).",
  "23503": "Impossible de supprimer : d'autres éléments dépendent de cette ressource.",
  "23502": "Un champ obligatoire est manquant.",
  "42501": "Vous n'avez pas la permission d'effectuer cette action.",
  "PGRST116": "Ressource introuvable.",
};

export function formatSupabaseError(error: any): string {
  if (!error) return "Une erreur inconnue est survenue.";

  const code = error.code || error.status;
  if (code && ERROR_MAP[code]) return ERROR_MAP[code];

  const msg = error.message || error.msg || String(error);

  if (msg.includes("JWT expired") || msg.includes("token is expired"))
    return "Votre session a expiré. Veuillez vous reconnecter.";
  if (msg.includes("insufficient permissions") || msg.includes("permission denied"))
    return "Vous n'avez pas la permission d'effectuer cette action.";
  if (msg.includes("network") || msg.includes("Failed to fetch"))
    return "Problème de connexion réseau. Vérifiez votre connexion internet.";
  if (msg.includes("rate limit"))
    return "Trop de requêtes. Veuillez patienter quelques instants.";
  if (msg.includes("row-level security") || msg.includes("RLS"))
    return "Accès refusé par les règles de sécurité.";

  return `Erreur : ${msg}`;
}

/** Extrait un message exploitable d'une valeur capturée par un `catch`, ou `null` s'il n'y en a pas. */
export function getErrorMessage(error: unknown): string | null {
  if (error instanceof Error) return error.message || null;
  if (typeof error === "string") return error || null;
  return null;
}

/** Lit le motif d'échec d'une réponse HTTP en erreur (`{ error }` JSON ou texte brut), ou `null` si le corps est vide. */
export async function readApiError(res: Response): Promise<string | null> {
  const body = (await res.text()).trim();
  if (!body) return null;
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string") {
      return parsed.error || null;
    }
    return null;
  } catch {
    return body;
  }
}
