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
