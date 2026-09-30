# Commande `/test-audit` - Audit Approfondi des Tests & Fiabilité

Exécute un audit rigoureux de la suite de tests Vitest selon le standard Staff QA / Test Architect.

## Argument : `$ARGUMENTS` (Facultatif : `--all`, chemin vers un service ou vers un fichier de test)

## Instructions pour Claude / Antigravity :

1. **Identification du Périmètre** :
   * Si `$ARGUMENTS` est vide ou `--all`, analyse l'ensemble des suites sous `apps/bot/src/__tests__/`.
   * Si un service ou composant est ciblé (ex: `apps/bot/src/services/BracketGeneratorService.ts`), évalue la complétude des tests associés.
   * Si un fichier de test est fourni (ex: `apps/bot/src/__tests__/NomDuTest.test.ts`), audite la qualité des assertions et des mocks.

2. **Évaluation selon les 5 Piliers** :
   * **Couverture Métier Critique (/20)** : présence de tests sur les générateurs d'arbres, schedulers et gestion des scores.
   * **Chasse aux Tests Creux (/20)** : traquer les tests qui ne mockent que des mocks sans tester le vrai calcul.
   * **Cas Limites & e-Sport (/20)** : tester les BYE (nombres impairs), forfaits (FF), égalités, scores négatifs.
   * **Déterminisme & Fake Timers (/20)** : pas de `setTimeout` réel, utilisation de `vi.useFakeTimers()`, tests hermétiques.
   * **Structure AAA (/20)** : Arrange-Act-Assert, nommage descriptif, pas de logique complexe dans le test.

3. **Restitution du Rapport** :
   * Affiche la **Scorecard d'Excellence des Tests** (/100) avec verdict global.
   * Liste le **Répertoire des Anomalies de Test** classées (`🔴 CRITIQUE`, `🟠 IMPORTANT`, `🟡 MOYEN`, `🟢 FAIBLE`).
   * Génère les **Prompts de Création de Tests Prêts à l'Emploi** par scope pour implémenter les tests manquants.
