---
name: issue-ritual
description: Rituel d'exécution obligatoire pour Claude Code et Antigravity lors de la résolution de toute issue sur TournamentHub. Comprend le cadrage Git initial, la présentation d'un plan d'implémentation à valider avant de coder, le TDD strict avec Verify RED, la loi d'airain anti-bandaids, les règles React 19, le protocole Evidence Before Claims du Makefile, et un bilan final sans commit automatique.
---

# 🥋 Rituel de Résolution d'Issue - TournamentHub

Ce rituel structure le travail de l'agent en **5 phases rigoureuses**. Il impose un **point d'arrêt obligatoire (Gate d'approbation)** après la récolte d'informations pour valider le plan avec l'utilisateur, applique une **discipline d'ingénierie d'élite (TDD, Anti-Band-Aids, Evidence Before Claims)**, et **interdit formellement tout commit automatique**.

---

## 🧭 Vue d'ensemble du Déroulement

```
┌─────────────────────────────────────────┐
│ PHASE 1 : Cadrage & Récolte d'Infos    │ ➜ Git context, gh issue view, DB inspection, shared types
└────────────────────┬────────────────────┘
                     ▼
┌─────────────────────────────────────────┐
│ PHASE 2 : 🛑 RÉCAPITULATIF & PLAN       │ ➜ Présenter le plan et attendre le feu vert explicite !
└────────────────────┬────────────────────┘
                     ▼ (Validation utilisateur)
┌─────────────────────────────────────────┐
│ PHASE 3 : Implémentation & TDD Strict   │ ➜ TDD Verify RED ➜ Anti-Band-Aids ➜ DB ➜ Shared ➜ Bot ➜ Web
└────────────────────┬────────────────────┘
                     ▼
┌─────────────────────────────────────────┐
│ PHASE 4 : 🧪 Porte de Vérification      │ ➜ Evidence Before Claims : make test, make lint, make build
└────────────────────┬────────────────────┘
                     ▼
┌─────────────────────────────────────────┐
│ PHASE 5 : Bilan Final (Zéro Auto-Commit)│ ➜ Diff propre, mini-rapport 5 lignes, commande commit prête
└─────────────────────────────────────────┘
```

---

## 📍 PHASE 1 : Cadrage & Collecte d'Informations (Ne jamais coder à l'aveugle)

### 1.1 Contexte Git & État de la Branche (CRUCIAL)
Avant toute analyse, vérifier où l'on se trouve pour ne pas écraser de travail ou polluer l'historique :
```bash
# 1. Quelle est la branche active ?
git branch --show-current

# 2. Quels sont les commits déjà présents sur cette branche par rapport à main ?
git log main..HEAD --oneline

# 3. Y a-t-il des modifications en cours non commitées ?
git status --short
git diff
```
* **Vérifications clés** :
  * Si la branche est `main`, alerter l'utilisateur et recommander la création d'une branche dédiée : `git checkout -b feature/issue-<NUMERO>`.
  * Si des commits existent déjà sur la branche (`git log main..HEAD`), en prendre connaissance pour **ne pas réécrire ou réinventer ce qui a déjà été fait**.
  * Si des fichiers sont déjà modifiés/non commités (`git status`), les analyser pour distinguer ce qui relève du ticket en cours d'éventuels résidus d'une autre session.

### 1.2 Lire le ticket complet
```bash
gh issue view <NUMERO> --json number,title,body,labels
```
* Extraire les spécifications fonctionnelles, les fichiers cibles et les critères d'acceptation.
* Identifier la complexité et la priorité (P0, P1, P2).

### 1.3 Inspecter l'état réel du codebase
1. **Recherche de symboles existants** :
   ```bash
   rg "nomDuSymboleOuModele" packages/shared/ apps/bot/src/ apps/web/src/
   ```
2. **Vérité Base de Données** :
   * Inspecter `supabase/migrations/*.sql` pour connaître les colonnes et types réels.
   * ⚠️ **Piège classique** : `tournament_status` en DB vaut `'DRAFT'`, `'REGISTRATION'`, `'ACTIVE'`, `'COMPLETED'`, `'ARCHIVED'` (ne JAMAIS chercher `'in_progress'`).
3. **Vérité Types `@hub/shared`** :
   * Inspecter `packages/shared/src/index.ts` pour identifier les interfaces et schémas Zod à réutiliser ou étendre.

---

## 🛑 PHASE 2 : Récapitulatif & Validation du Plan (POINT D'ARRÊT OBLIGATOIRE)

> [!IMPORTANT]
> **Ne modifier AUCUN fichier de code avant d'avoir présenté ce récapitulatif et obtenu la confirmation explicite de l'utilisateur.**

L'agent doit produire un bilan clair structuré comme suit :
1. **🌿 Contexte Git** : Branche active, commits déjà existants pris en compte, statut des modifications locales en cours.
2. **🎯 Objectif & Périmètre** : Résumé en 2-3 phrases de ce que le ticket accomplit.
3. **📂 Fichiers impactés** : Liste ordonnée des fichiers à modifier ou créer.
4. **🗄️ Impact Base de Données** : Nouvelle migration SQL nécessaire (oui/non) avec schéma succinct.
5. **⚠️ Cas limites & Pièges identifiés** : Gestion des valeurs nulles, `undefined` TypeScript, gestion des BYE, forfaits.
6. **🧪 Stratégie de tests & TDD** : Tests Vitest prévus (`apps/bot/src/__tests__/...`) et cas d'erreur ciblés.
7. **❓ Questions / Arbitrages éventuels** (si ambiguïté subsistante).
8. **Demande explicite** : *"Ce plan te convient-il ? Dois-je commencer l'implémentation ?"*

---

## 💻 PHASE 3 : Implémentation Rigoureuse & Discipline d'Ingénierie

Appliquer les modifications dans l'ordre strict des dépendances du monorepo :

```
1. supabase/migrations/     ➜ Nouveau fichier SQL si la DB évolue
2. packages/shared/src/     ➜ Types TypeScript & Schémas Zod
   └── ⚡ REBUILD OBLIGATOIRE : npm run build --workspace=@hub/shared
3. apps/bot/src/services/   ➜ Logique métier, générateurs de brackets/poules (TDD strict !)
4. apps/bot/src/routes/     ➜ Endpoints Express & Middlewares
5. apps/bot/src/commands/   ➜ Commandes Discord (si applicable)
6. apps/web/src/app/        ➜ Pages Next.js, Layouts, Composants
7. apps/bot/src/__tests__/  ➜ Tests unitaires Vitest
```

### 3.0 — Discipline d'Ingénierie & TDD Strict (Inspirée de Superpowers)

- **TDD strict pour la logique métier, les services et utilitaires** (`BracketGeneratorService`, `SchedulerService`, gestion des scores, seeding) :
  1. *RED* : Écrire le test Vitest minimal décrivant le comportement attendu avant le code métier.
  2. *VERIFY RED (Obligatoire)* : Exécuter `npx vitest run apps/bot/src/__tests__/NomDuTest.test.ts` et **constater l'échec pour la raison attendue**. Un test qui passe immédiatement est un test qui ne prouve rien.
  3. *GREEN* : Écrire le code minimal strict pour satisfaire le test.
  4. *VERIFY GREEN* : Ré-exécuter et vérifier que le test passe au vert.
  5. *REFACTOR* : Factoriser et nettoyer en restant vert.

- **Loi d'Airain Anti-Symptôme (Anti-Band-Aids & Anti-`any`)** :
  - **Aucune modification de code sans avoir formellement identifié et prouvé la cause racine.**
  - **Interdiction formelle de poser une rustine pour faire taire le compilateur ou masquer une erreur console** : pas de `?.` (optional chaining) sauvage, pas de `try/catch` vide qui étouffe les erreurs en silence, pas de fallback magique (`?? null`) pour masquer un état corrompu.
  - **Interdiction formelle d'utiliser `any`** ou des assertions abusives (`as any`, `as unknown as ...`). Les types doivent provenir de `@hub/shared` ou d'un narrowing Zod explicite.

### 3.1 — Règles de Code & Garde-Fous Techniques :

- **La Règle d'Or `@hub/shared`** : Dès que `packages/shared/src/index.ts` est modifié, lancer immédiatement `npm run build --workspace=@hub/shared`.
- **TypeScript strict (`apps/bot`)** :
  - `noUncheckedIndexedAccess: true` : Tout accès `arr[i]` est `T | undefined`. Toujours vérifier l'existence avec un guard (`if (!item) return;`) ou une valeur de repli `??`.
  - `exactOptionalPropertyTypes: true` : Ne jamais assigner `{ key: undefined }` sur une clé optionnelle.
- **Règles Non Négociables Front Next.js 16 / React 19 (`apps/web`)** :
  - **Gestion des 3 états obligatoires** : Tout écran ou bloc chargeant des données doit gérer :
    1. L'état de chargement (**Skeleton**, pas de spinner plein écran instable).
    2. L'état d'erreur (**Toast / Alerte** claire avec possibilité de réessayer).
    3. L'état vide (**Empty State** accueillant avec CTA d'action).
  - **Nettoyage strict des ressources (`useEffect`)** : Tout écouteur, timer ou souscription Supabase Realtime channel (`supabase.channel()`) DOIT impérativement être nettoyé dans la fonction de retour du `useEffect` (`supabase.removeChannel(channel)`).
  - **Paramètres asynchrones** : `params` et `searchParams` sont des Promises : `const { guildId } = await params;`.
  - **Composants Client** : Directive `"use client";` obligatoire dès qu'un hook (`useState`, `useEffect`, `useRouter`) est utilisé.
  - **Composant Link** : Utiliser impérativement `<Link href="...">` de `next/link`.
  - **Pas de `setState` synchrone** directement dans le corps d'un `useEffect`.
  - **Pas de `window.alert()` / `window.confirm()`** ➜ utiliser Toasts (`sonner`) et modales.
- **Sécurité Multi-Tenant** :
  - Cloisonnement par `guild_id` et validation par `verifyTournamentGuild` ou `verifyPhaseGuild`.

---

## 🧪 PHASE 4 : Porte de Vérification (« Evidence Before Claims »)

> [!CAUTION]
> **Interdiction formelle d'affirmer qu'une tâche est terminée, qu'un bug est résolu ou que le code compile sans en apporter la preuve terminale fraîche.**

Exécuter et afficher les résultats des 3 commandes sans watch :

```bash
# 1. Tests unitaires Vitest (0 échec, code de sortie 0)
make test

# 2. Validation TypeScript et ESLint (0 erreur tolérée sur tout le monorepo)
make lint

# 3. Compilation complète de production (Shared ➜ Bot ➜ Web)
make build
```

Si l'une des commandes échoue, corriger immédiatement à la racine avant de continuer.

---

## 📦 PHASE 5 : Bilan Final & Clôture (PAS D'AUTO-COMMIT)

> [!CAUTION]
> **Interdiction formelle d'exécuter `git commit` automatiquement.**
> Le commit appartient à l'utilisateur. L'agent prépare le terrain, audite la propreté du diff, et fournit la commande de commit prête à copier.

### 5.1 Audit de propreté du Diff
```bash
git status
git diff
```
* **Nettoyage strict** : Aucun `console.log("DEBUG", ...)` résiduel, aucun fichier temporaire, aucun code mort, aucun `any` introduit.

### 5.2 Mini-Rapport de Clôture (5 lignes max)
Terminer systématiquement par un rapport dense et percutant :
1. **Fichiers modifiés** : Liste synthétique des fichiers code et schémas touchés.
2. **Preuves terminales validées** : `make test` (X/X passés), `make lint` (0 erreur), `make build` (Succès).
3. **Cas limites vérifiés** : Égalités, forfaits, gestion des BYE, états d'erreur validés.
4. **Test local** : Commande pour lancer (`make dev`) et URL locale à visiter (`http://localhost:3000/...`).
5. **Commande de commit suggérée** :
   ```bash
   git add <fichiers concernés>
   git commit -m "<type>(<scope>): <description claire> (#<NUMERO>)"
   ```
