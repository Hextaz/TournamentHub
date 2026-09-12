# Commande `/code-review` - Revue de Code Intransigeante (Staff Engineer)

Déclenche un audit approfondi et intransigeant sur le code : `$ARGUMENTS`.

## Instructions pour Claude :

1. **Détection du Périmètre** :
   * Si `$ARGUMENTS` vaut `--full` : réalise un audit architectural global du monorepo.
   * Si `$ARGUMENTS` est un chemin de fichier (ex: `apps/bot/src/services/BracketGeneratorService.ts`) : audite spécifiquement ce fichier et ses dépendances directes.
   * Si `$ARGUMENTS` est vide ou vaut `--diff` : audite les modifications courantes (`git diff` ou comparaison avec la branche principale).

2. **Diagnostic Automatisé Préalable** :
   * Exécute `make lint` pour inspecter les erreurs de typage et avertissements ESLint.
   * Exécute `make test` pour vérifier le statut des tests unitaires.
   * Scanne les anti-patterns connus :
     - `rg "'in_progress'"` (valeur d'enum invalide)
     - `rg "alert\(|confirm\(" apps/web/src/` (pop-ups natives bloquantes)
     - `rg "console\.log\("` (logs de debug résiduels)

3. **Évaluation selon les 6 Piliers (/20 par pilier)** :
   * 🏛️ Architecture & Monorepo
   * 🔒 Sécurité & Multi-Tenant (IDOR, vérification de `guild_id`)
   * ⚡ Performance, Scalabilité & Realtime
   * 💎 Clean Code, SOLID & Lisibilité
   * 🛡️ Typage TypeScript & Schémas (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
   * 🧪 Testabilité & Fiabilité Opérationnelle

4. **Restitution du Rapport Complet** :
   * Tableau Scorecard avec Note Globale /100 et Verdict clair.
   * Tableau Répertoire des Anomalies avec IDs (`SEC-01`, `PERF-01`, etc.) et Sévérité (`🔴 CRITIQUE`, `🟠 IMPORTANT`, `🟡 MOYEN`, `🟢 FAIBLE`).
   * Analyse détaillée avec diffs correctifs suggérés (`Avant ➜ Après`).
   * Matrice Effort vs Impact (Quick Wins vs Projets de fond).
   * **Prompts prêts à l'emploi** découpés par scope pour déléguer les résolutions dans de nouvelles conversations Claude Code.
