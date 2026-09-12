# Commande `/resolve-issue` - Rituel de Résolution d'Issue

Exécute le rituel structuré de résolution pour l'issue spécifiée : `$ARGUMENTS`.

## Instructions pour Claude :

1. **Vérification de l'argument** :
   * L'argument `$ARGUMENTS` doit être un numéro d'issue GitHub (ex: `20` ou `#20`).
   * Si aucun numéro n'est fourni, demande poliment à l'utilisateur de préciser l'issue à traiter.

2. **Phase 1 : Cadrage, Contexte Git & Récolte d'informations** :
   * **Contexte Git** : Vérifie la branche active (`git branch --show-current`), les commits déjà existants sur la branche (`git log main..HEAD --oneline`), et les modifications non commitées en cours (`git status --short`). Alerte si on est sur `main` sans branche de feature dédiée.
   * Exécute `gh issue view $ARGUMENTS --json number,title,body,labels` pour lire le ticket.
   * Recherche les fichiers et types concernés avec `rg` ou `fd`.
   * Vérifie la vérité de la DB dans `supabase/migrations/` et les types dans `packages/shared/src/index.ts`.

3. **Phase 2 : 🛑 RÉCAPITULATIF & PLAN D'IMPLÉMENTATION (Point d'arrêt obligatoire)** :
   * Présente à l'utilisateur :
     - 🌿 État Git : Branche courante, travail déjà amorcé/commits existants, fichiers modifiés locaux.
     - 🎯 Résumé de l'objectif.
     - 📂 Fichiers exacts à modifier ou créer.
     - 🗄️ Impact base de données (migration nécessaire ?).
     - ⚠️ Cas limites et pièges identifiés.
     - 🧪 Stratégie de tests prévue.
   * **STOP** : Demande explicitement validation à l'utilisateur avant d'écrire la moindre ligne de code. Ne commence à coder qu'après son accord.

4. **Phase 3 : Implémentation selon l'ordre strict** :
   * Ordre : `DB ➜ @hub/shared (rebuild obligatoire !) ➜ Services Bot ➜ Routes API ➜ Web UI ➜ Tests`.
   * Respecte le typage strict du bot (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
   * Respecte Next.js 16 / React 19 (`await params`, `"use client";`, `<Link>`, pas de `setState` synchrone dans `useEffect`).

5. **Phase 4 : Validation Tests & Build (sans watch)** :
   * `make test` : vérifie que 100% des tests unitaires passent.
   * `make lint` : valide 0 erreur TypeScript et ESLint.
   * `make build` : valide la chaîne de compilation complète.

6. **Phase 5 : Bilan Final & Livraison (PAS D'AUTO-COMMIT)** :
   * Vérifie la propreté du `git diff` (aucun `console.log` de debug résiduel).
   * **N'exécute JAMAIS de `git commit` automatiquement.**
   * Affiche le bilan des modifications et les résultats de tests.
   * Donne les instructions précises pour tester manuellement en local (`make dev`, URLs à visiter).
   * Fournit la commande de commit prête à l'emploi pour l'utilisateur :
     `git commit -m "<type>(<scope>): <message> (#$ARGUMENTS)"`
