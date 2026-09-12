# Commande `/create-issue` - Atelier Interactif de Cadrage & Création d'Issue

Lance un atelier de cadrage interactif pour concevoir, spécifier et publier une issue selon le standard TournamentHub.

## Argument : `$ARGUMENTS` (Idée brute, besoin ou description sommaire facultative)

## Instructions pour Claude :

1. **Phase 1 : Interview & Cadrage Métier** :
   * Si `$ARGUMENTS` est vide, demande à l'utilisateur d'exprimer son idée, son besoin ou le problème constaté.
   * Si une idée est fournie :
     - Vérifie immédiatement les doublons potentiels avec `gh issue list --state all --search "..."`.
     - Analyse le persona visé (Organisateur, Joueur, Caster, Développeur).
     - Pose 2 ou 3 questions ciblées si le besoin nécessite des clarifications (périmètre MVP vs Nice-to-have, cas limites).

2. **Phase 2 : Grounding Technique dans le Codebase** :
   * Inspecte les migrations existantes dans `supabase/migrations/*.sql`.
   * Vérifie les types dans `packages/shared/src/index.ts`.
   * Identifie les services d'impact dans `apps/bot/src/` et les pages dans `apps/web/src/`.
   * Vérifie où cette issue s'insère dans l'arbre de dépendances (dépend-elle d'un ticket P0 existant ?).

3. **Phase 3 : Rédaction Haute Définition ("Agent-Ready")** :
   * Rédige la spécification complète (Contexte, Spécifications Fonctionnelles, Spécifications Techniques, Fichiers Cibles, Sécurité & Multi-tenant, Critères d'Acceptation cochables).
   * Propose un titre normalisé : `feat(scope): ...` / `fix(...)` / `refactor(...)`.
   * Propose le triage :
     - **Priorité** : `P0` (fondations), `P1` (moteur cœur), `P2` (finitions/UI).
     - **Taille** : `XS`, `S`, `M`, `L`, `XL`.
     - **Statut** : `Ready` (si actionable de suite) ou `Backlog`.
     - **Labels GitHub**.

4. **Phase 4 : Point d'arrêt obligatoire (Validation utilisateur)** :
   * Affiche le brouillon complet du ticket et le triage proposé.
   * **STOP** : Demande confirmation explicite à l'utilisateur avant d'appeler `gh issue create`.

5. **Phase 5 : Publication Automatique & Triage GitHub Project** :
   * Exécute `gh issue create --title "..." --body "..." --label "..."`.
   * Exécute `node scripts/triage-issue.js <NUMERO_OU_URL> --priority <P> --size <S> --status <STATUS>`.
   * Fournit à l'utilisateur le lien GitHub direct et la commande `/resolve-issue <NUMERO>` pour la future implémentation.
