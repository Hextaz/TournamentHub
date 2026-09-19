# Commande `/resolve-issue` - Rituel de Résolution d'Issue

Exécute le rituel structuré de résolution pour l'issue spécifiée : `$ARGUMENTS`.

## Instructions pour Claude / Antigravity :

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
     - 🧪 Stratégie de tests TDD prévue.
   * **STOP** : Demande explicitement validation à l'utilisateur avant d'écrire la moindre ligne de code. Ne commence à coder qu'après son accord.

4. **Phase 3 : Implémentation & TDD Strict** :
   * Ordre : `DB ➜ @hub/shared (rebuild obligatoire !) ➜ Services Bot ➜ Routes API ➜ Web UI ➜ Tests`.
   * **TDD strict avec Verify RED** : écrire le test Vitest d'abord, exécuter et **constater l'échec pour la raison attendue**, puis implémenter le code pour passer au vert.
   * **Loi d'Airain Anti-Band-Aids** : interdiction formelle de poser des rustines (`?.` sauvages, `as any`, `as unknown as`, `try/catch` vides) pour faire taire les erreurs. Trouver la cause racine.
   * **Règles Front React 19** : 3 états obligatoires (Skeleton, Error toast, Empty state) et nettoyage strict des abonnements/listeners dans `useEffect`.

5. **Phase 4 : Porte de Vérification (Evidence Before Claims)** :
   * Interdiction formelle d'affirmer que c'est résolu sans **preuve terminale fraîche** :
     - `make test` : 100% de succès.
     - `make lint` : 0 erreur de typage / linting.
     - `make build` : compilation globale réussie.

6. **Phase 5 : Clôture & Mini-Rapport (PAS D'AUTO-COMMIT)** :
   * Vérifie la propreté du `git diff` (aucun `console.log` de debug résiduel, aucun `any`).
   * **N'exécute JAMAIS de `git commit` automatiquement.**
   * Affiche le mini-rapport en 5 lignes max (fichiers modifiés, preuves terminales, cas limites testés, URL locale de test, commande de commit prête à copier).
