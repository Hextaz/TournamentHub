---
name: issue-ritual
description: Rituel d'exécution obligatoire pour Claude Code lors de la résolution de toute issue sur TournamentHub. Comprend le cadrage initial, la présentation d'un plan d'implémentation à valider avant de coder, le respect strict de l'architecture, le protocole de tests du Makefile, et un bilan final sans commit automatique.
---

# 🥋 Rituel de Résolution d'Issue - TournamentHub

Ce rituel structure le travail de Claude Code en **5 phases rigoureuses**. Il impose un **point d'arrêt obligatoire (Gate d'approbation)** après la récolte d'informations pour valider le plan avec l'utilisateur, et **interdit tout commit automatique** en fin de tâche.

---

## 🧭 Vue d'ensemble du Déroulement

```
┌─────────────────────────────────────────┐
│ PHASE 1 : Cadrage & Récolte d'Infos    │ ➜ gh issue view, inspection DB, ripgrep
└────────────────────┬────────────────────┘
                     ▼
┌─────────────────────────────────────────┐
│ PHASE 2 : 🛑 RÉCAPITULATIF & PLAN       │ ➜ Présenter le plan et attendre le feu vert !
└────────────────────┬────────────────────┘
                     ▼ (Validation utilisateur)
┌─────────────────────────────────────────┐
│ PHASE 3 : Implémentation Rigoureuse     │ ➜ DB ➜ Shared (build!) ➜ Services ➜ UI
└────────────────────┬────────────────────┘
                     ▼
┌─────────────────────────────────────────┐
│ PHASE 4 : Validation Tests & Build      │ ➜ make test, make lint, make build
└────────────────────┬────────────────────┘
                     ▼
┌─────────────────────────────────────────┐
│ PHASE 5 : Bilan Final (Zéro Auto-Commit)│ ➜ Diff propre, commande de commit suggérée, tests locaux
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
Exécuter immédiatement :
```bash
gh issue view <NUMERO> --json number,title,body,labels
```
* Extraire les spécifications fonctionnelles, les fichiers cibles et les critères d'acceptation.
* Identifier la complexité (Haiku / Sonnet / Opus) et la priorité (P0, P1, P2).

### 1.3 Inspecter l'état réel du codebase
1. **Recherche de symboles existants** :
   ```bash
   rg "nomDuSymboleOuModele" packages/shared/ apps/bot/src/ apps/web/src/
   ```
2. **Vérification de la vérité Base de Données** :
   * Inspecter `supabase/migrations/*.sql` pour connaître les colonnes et types réels.
   * ⚠️ **Piège classique** : `tournament_status` en DB vaut `'DRAFT'`, `'REGISTRATION'`, `'ACTIVE'`, `'COMPLETED'`, `'ARCHIVED'` (ne JAMAIS chercher `'in_progress'`).
3. **Vérification des types `@hub/shared`** :
   * Inspecter `packages/shared/src/index.ts` pour identifier les interfaces et schémas Zod à réutiliser ou étendre.

---

## 🛑 PHASE 2 : Récapitulatif & Validation du Plan (POINT D'ARRÊT OBLIGATOIRE)

> [!IMPORTANT]
> **Ne modifier AUCUN fichier de code avant d'avoir présenté ce récapitulatif et obtenu la confirmation de l'utilisateur.**

Claude doit produire un bilan clair structuré comme suit :
1. **🌿 Contexte Git** : Branche active, commits déjà existants pris en compte, statut des modifications locales en cours.
2. **🎯 Objectif & Périmètre** : Résumé en 2-3 phrases de ce que le ticket accomplit.
3. **📂 Fichiers impactés** : Liste ordonnée des fichiers à modifier ou créer.
4. **🗄️ Impact Base de Données** : Nouvelle migration SQL nécessaire (oui/non) avec schéma succinct.
5. **⚠️ Cas limites & Pièges identifiés** : Ex: gestion des valeurs nulles, `undefined` TypeScript, rétrocompatibilité.
6. **🧪 Stratégie de tests** : Tests unitaires prévus (`apps/bot/src/__tests__/...`) et validations à exécuter.
7. **❓ Questions / Arbitrages éventuels** (si ambiguïté subsistante).
8. **Demande explicite** : *"Ce plan te convient-il ? Dois-je commencer l'implémentation ?"*

---

## 💻 PHASE 3 : Implémentation Rigoureuse (Après accord utilisateur)

Appliquer les modifications dans l'ordre strict des dépendances du monorepo :

```
1. supabase/migrations/     ➜ Nouveau fichier SQL si la DB évolue
2. packages/shared/src/     ➜ Types TypeScript & Schémas Zod
   └── ⚡ REBUILD OBLIGATOIRE : npm run build --workspace=@hub/shared
3. apps/bot/src/services/   ➜ Logique métier, générateurs de brackets/poules
4. apps/bot/src/routes/     ➜ Endpoints Express & Middlewares
5. apps/bot/src/commands/   ➜ Commandes Discord (si applicable)
6. apps/web/src/app/        ➜ Pages Next.js, Layouts, Composants
7. apps/bot/src/__tests__/  ➜ Tests unitaires Vitest
```

### Règles de Code & Garde-Fous :
* **La Règle d'Or `@hub/shared`** : Dès que `packages/shared/src/index.ts` est modifié, lancer immédiatement `npm run build --workspace=@hub/shared`.
* **TypeScript strict (`apps/bot`)** :
  * `noUncheckedIndexedAccess: true` : Tout accès `arr[i]` est `T | undefined`. Toujours prévoir un guard (`if (!item) return;`) ou une valeur de repli `??`.
  * `exactOptionalPropertyTypes: true` : Ne jamais assigner `{ key: undefined }` sur une clé optionnelle.
* **Next.js 16 / React 19 (`apps/web`)** :
  * `params` et `searchParams` sont des Promises : `const { guildId } = await params;`.
  * Directive `"use client";` obligatoire dès qu'un hook est utilisé.
  * Utiliser `<Link>` de `next/link` (bannir `<a href="...">`).
  * Pas de `setState` synchrone dans un `useEffect`.
  * Pas de `window.alert()` / `window.confirm()` ➜ utiliser Toasts (`sonner`) et modales.
* **Sécurité Multi-Tenant** :
  * Cloisonnement par `guild_id` et validation par `verifyTournamentGuild` ou `verifyPhaseGuild`.

---

## 🧪 PHASE 4 : Validation Complète Sans Watch (Makefile)

Chaque commande doit réussir avec **0 erreur**. Si une erreur survient, la corriger immédiatement avant de continuer.

```bash
# 1. Tests unitaires (Vitest en mode 'run' direct, pas de watch)
make test
# (ou test ciblé : npx vitest run apps/bot/src/__tests__/NomDuTest.test.ts)

# 2. Validation TypeScript et ESLint (0 erreur tolérée)
make lint

# 3. Compilation complète de production (Shared ➜ Bot ➜ Web)
make build
```

---

## 📦 PHASE 5 : Bilan Final & Livraison (PAS D'AUTO-COMMIT)

> [!CAUTION]
> **Interdiction formelle d'exécuter `git commit` automatiquement.**
> Le commit appartient à l'utilisateur. Claude doit préparer le terrain, inspecter la propreté du diff, et fournir les commandes prêtes à l'emploi.

### 5.1 Audit de propreté du Diff
```bash
git status
git diff
```
* **Nettoyage strict** : Aucun `console.log("DEBUG", ...)` résiduel, aucun fichier temporaire, aucun code mort.

### 5.2 Restitution Finale pour l'Utilisateur
Produire un rapport de clôture comprenant :
1. **✅ Bilan des modifications** : Résumé clair de ce qui a été fait composant par composant.
2. **🧪 Résultats des validations** :
   * Tests unitaires : `X/X passés`
   * Lint & Types : `0 erreur`
   * Build : `Succès`
3. **🖥️ Comment tester manuellement en local** :
   * Commandes pour lancer l'environnement : `make dev` (ou `make dev-web` / `make dev-bot`).
   * URL locale exacte à ouvrir (ex: `http://localhost:3000/admin/[guildId]/tournaments/...`).
   * Parcours utilisateur à tester pour constater le résultat.
4. **💡 Commande de commit suggérée (à disposition de l'utilisateur)** :
   ```bash
   git add <fichiers concernés>
   git commit -m "<type>(<scope>): <description claire> (#<NUMERO>)"
   ```
