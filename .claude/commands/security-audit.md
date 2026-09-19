# Commande `/security-audit` - Audit de Sécurité Multi-Tenant & AppSec

Exécute un audit de sécurité intransigeant selon le standard Staff AppSec Engineer.

## Argument : `$ARGUMENTS` (Facultatif : `--full`, chemin vers une route, service ou migration SQL)

## Instructions pour Claude / Antigravity :

1. **Identification du Périmètre** :
   * Si `$ARGUMENTS` est vide ou `--full`, audite l'ensemble du monorepo (routes Express, migrations Supabase, NextAuth middlewares, variables d'environnement).
   * Si un dossier de routes est ciblé (ex: `apps/bot/src/routes/`), vérifie le cloisonnement multi-tenant et la prévention IDOR.
   * Si un dossier de migrations SQL est ciblé (ex: `supabase/migrations/`), vérifie les politiques RLS et les clauses `SET search_path` des fonctions RPC `SECURITY DEFINER`.

2. **Évaluation selon les 5 Piliers** :
   * **Cloisonnement Multi-Tenant (IDOR) (/20)** : présence obligatoire de `verifyTournamentGuild` / `verifyPhaseGuild` et restriction par `guild_id`.
   * **Supabase RLS & RPC (/20)** : RLS activé sur toutes les tables, `search_path = public, pg_temp` sur toute RPC `SECURITY DEFINER`.
   * **Contrôle d'Accès RBAC (/20)** : vérification des rôles d'organisation sur Discord et des permissions de session sur `/admin/[guildId]/*`.
   * **Validation Zod à la Frontière (/20)** : validation Zod stricte sur 100% des inputs, chasse au shotgun parsing, anti-injection SQL.
   * **Gestion des Secrets & Fuite d'Infos (/20)** : zéro secret privé préfixé par `NEXT_PUBLIC_`, sanitization des erreurs API.

3. **Restitution du Rapport** :
   * Affiche la **Scorecard de Posture de Sécurité** (/100) avec verdict global.
   * Liste le **Répertoire des Vulnérabilités** classées (`🔴 CRITIQUE`, `🟠 IMPORTANT`, `🟡 MOYEN`, `🟢 FAIBLE`).
   * Fournit les **Prompts de Remédiation Clé en Main** pour corriger immédiatement toute faille détectée.
