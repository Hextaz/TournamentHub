# TournamentHub - Directives pour Claude Code

## 📌 Vue d'ensemble du Projet

**TournamentHub** est une plateforme e-sport multi-jeux de gestion de tournois combinant un Bot Discord (Node.js/Express) et une Application Web (Next.js 16 Back-office & Portail public).

### Architecture du Monorepo
* **`apps/bot`** : Backend Node.js / Express 5 + Discord.js 14 + Supabase Client (`@hub/bot`).
  * Gère les commandes Discord, les interactions (boutons, modales, select menus), la synchronisation des salons/rôles et les planifications de tournois (`SchedulerService`).
* **`apps/web`** : Frontend Next.js 16 (React 19) App Router + Tailwind CSS v4 + NextAuth v4 (`@hub/web`).
  * Espace public spectateurs/joueurs (`/[guildId]`) et Back-office organisateurs (`/admin/[guildId]`).
* **`packages/shared`** : Types TypeScript de domaine, interfaces et schémas Zod partagés (`@hub/shared`).
* **`supabase`** : Configuration PostgreSQL locale, migrations SQL (`supabase/migrations/*.sql`), fonctions RPC et politiques RLS.

---

## 🥋 Rituel Obligatoire pour Résoudre une Issue

> [!IMPORTANT]
> **Avant de toucher au code pour résoudre une issue, appliquer OBLIGATOIREMENT le Skill de rituel :**
> * **Skill complet** : `.claude/skills/issue-ritual/SKILL.md`
> * **Commande rapide Claude Code** : `/resolve-issue <NUMERO>`

### Le Cycle en 5 Phases Systématiques :
1. **Phase 1 : Cadrage & Contexte Git (`gh issue view <NUMERO>`)** :
   * Vérifier la branche active (`git branch --show-current`), les commits de la branche (`git log main..HEAD --oneline`) et les modifs locales en cours (`git status --short`). Alerter si sur `main`.
   * Lire le ticket complet, cartographier les fichiers cibles et inspecter le schéma DB réel (`supabase/migrations/`).
2. **Phase 2 : 🛑 RÉCAPITULATIF & PLAN D'IMPLÉMENTATION (Point d'arrêt obligatoire)** :
   * Présenter un récapitulatif clair : État Git, Objectif, Fichiers impactés, Migration DB éventuelle, Cas limites et Stratégie de tests TDD.
   * **STOP** : Attendre la validation explicite de l'utilisateur avant d'écrire la moindre ligne de code.
3. **Phase 3 : Implémentation Rigoureuse & Discipline d'Ingénierie** :
   * Ordre : `1. SQL/Migrations` ➔ `2. @hub/shared` ➔ `3. Services Bot` ➔ `4. Routes API` ➔ `5. Web UI` ➔ `6. Tests`.
   * ⚡ **Après modification de `packages/shared`** : exécuter `npm run build --workspace=@hub/shared`.
   * 🔴 **TDD strict avec Verify RED** : pour tout service métier ou utilitaire (`BracketGeneratorService`, `SchedulerService`), écrire le test Vitest d'abord, **constater l'échec terminal pour la raison attendue**, puis implémenter le code minimal pour passer au vert.
   * 🛡️ **Loi d'airain Anti-Symptôme (Anti-Band-Aids)** : interdiction formelle de poser une rustine pour faire taire le compilateur ou masquer une erreur (`?.` sauvage, `as any`, `as unknown as`, `try/catch` vide qui étouffe l'erreur). Identifier et corriger la cause racine.
   * 🎨 **Règles Front React 19 / Next.js 16** :
     - 3 états obligatoires : Loading Skeleton, Error toast/alerte avec retry, Empty state accueillant.
     - Nettoyage strict des ressources dans `useEffect` (timers, event listeners, channels Supabase Realtime).
     - `await params`, `"use client";`, `<Link>`, pas de `setState` synchrone dans `useEffect`.
4. **Phase 4 : Porte de Vérification (« Evidence Before Claims »)** :
   * Interdiction d'affirmer qu'une tâche est résolue sans **preuve terminale fraîche** :
     - `make test` : tests unitaires Vitest (100% de succès).
     - `make lint` : 0 erreur de typage / linting sur l'ensemble du monorepo.
     - `make build` : compilation globale réussie.
5. **Phase 5 : Clôture & Mini-Rapport (PAS D'AUTO-COMMIT)** :
   * `git diff` audité sans console.log ou fichiers parasites. Zéro `any`.
   * Interdiction formelle d'exécuter `git commit` automatiquement.
   * Mini-rapport en 5 lignes max (fichiers modifiés, preuves terminales, cas limites testés, instructions de test local `make dev`, commande de commit suggérée).

---

## 🧐 Code Reviewer Intransigeant (Skill d'Audit Staff Engineer)

Le monorepo intègre un skill d'audit complet pour évaluer le code avec un niveau d'exigence maximal (Architecture, Sécurité, Perf, Clean Code, Typage, Tests) :
* **Skill complet** : `.agents/skills/code-reviewer/SKILL.md` (accessible aussi via `.claude/skills/code-reviewer`)
* **Commande rapide Claude Code** :
  * `/code-review` : Audite le diff de la branche courante.
  * `/code-review --full` : Audite l'architecture globale du monorepo.
  * `/code-review <chemin/vers/fichier>` : Audite un fichier spécifique.
* **Format de sortie** :
  1. Scorecard tabulaire avec Note Globale /100 et Verdict.
  2. Traque le **Shotgun parsing**, les **Band-aids**, le **Tell, Don't Ask**, et les **Tests creux**.
  3. Répertoire exhaustif des anomalies classées (`🔴 CRITIQUE`, `🟠 IMPORTANT`, `🟡 MOYEN`, `🟢 FAIBLE`).
  4. Matrice Effort vs Impact et **Prompts prêts à copier-coller** découpés par scope.

---

## 🧪 Test Auditor (Audit Approfondi de Testabilité & Fiabilité)

Skill d'audit dédié à l'évaluation impitoyable de la suite de tests Vitest (Staff QA / Test Architect) :
* **Skill complet** : `.agents/skills/test-auditor/SKILL.md`
* **Commande rapide Claude Code** : `/test-audit [--all | <service> | <fichier_test>]`
* **Piliers d'audit** :
  1. Couverture du domaine métier critique (générateurs d'arbres, schedulers, seeding).
  2. Chasse aux **tests creux (hollow tests)** et au mocking abusif.
  3. Couverture des **cas limites e-sport** (nombres impairs/BYE, forfaits, égalités).
  4. Déterminisme, isolation et usage de `vi.useFakeTimers()`.
  5. Structure Arrange-Act-Assert (AAA) et expressivité.
* **Sortie** : Scorecard /100, anomalies classées, prompts prêts à copier pour implémenter les tests manquants.

---

## 🔒 Security Auditor (Audit de Sécurité Multi-Tenant & AppSec)

Skill d'audit dédié à la sécurité applicative et au cloisonnement strict (Staff AppSec Engineer) :
* **Skill complet** : `.agents/skills/security-auditor/SKILL.md`
* **Commande rapide Claude Code** : `/security-audit [--full | <routes> | <migrations>]`
* **Piliers d'audit** :
  1. **Cloisonnement multi-tenant & Prévention IDOR** (`guild_id` systématique sur toutes les requêtes/routes).
  2. **Supabase RLS & Sécurité RPC** (`SET search_path = public, pg_temp` sur les fonctions `SECURITY DEFINER`).
  3. **Contrôle d'accès RBAC** (Discord permissions côté bot, sessions NextAuth côté web).
  4. **Validation Zod à la frontière** (schémas stricts, anti-injection, chasse au shotgun parsing).
  5. **Gestion des secrets** (zéro fuite sous `NEXT_PUBLIC_`, sanitization des erreurs API).
* **Sortie** : Scorecard /100, répertoire des vulnérabilités, prompts de remédiation immédiate.

---

## 💡 Issue Crafter (Atelier d'Idéation, Qualification & Triage)

Permet de transformer une idée brute en spécification "Agent-Ready" après un échange critique, et de la publier/trier sur GitHub Project #2 :
* **Skill complet** : `.agents/skills/issue-crafter/SKILL.md`
* **Commande rapide Claude Code** : `/create-issue [description ou idée]`
* **Rôle** : Lead Product Manager & Staff Engineer (challenger le besoin, détecter les doublons, grounding dans le codebase, rédiger la spec et trier automatiquement via `scripts/triage-issue.js`).

---

## 🛠️ Commandes Makefile & Scripts Essentiels (Sans Watch)

Le projet utilise un `Makefile` pour orchestrer les tâches monorepo. **Toujours exécuter les commandes sans mode interactif/watch.**

### 1. Tests Unitaires
```bash
# Via Makefile (exécute Vitest en mode 'run' sur tout le monorepo)
make test

# Ou via npm
npm run test

# Exécuter un fichier de test spécifique
npx vitest run apps/bot/src/__tests__/BracketGeneratorService.test.ts

# Filtrer les tests par nom de suite
npx vitest run apps/bot -t "BracketGenerator"
```

### 2. Linting & Validation de Types
```bash
# Via Makefile (valide le typage bot avec tsc --noEmit + eslint sur web)
make lint

# Typecheck granulaire par package
npx tsc --noEmit --project packages/shared/tsconfig.json
npx tsc --noEmit --project apps/bot/tsconfig.json
npx tsc --noEmit --project apps/web/tsconfig.json
```

### 3. Compilation & Build
```bash
# Compiler le monorepo complet dans l'ordre de dépendance (Shared -> Bot -> Web)
make build

# Important : Si vous modifiez uniquement packages/shared, recompilez-le avec :
npm run build --workspace=@hub/shared
```

### 4. Environnement Local & Docker
```bash
make supabase-start   # Démarre la stack Supabase locale (Docker)
make supabase-stop    # Arrête la stack Supabase locale
make db-init          # Applique les migrations SQL sur la base locale
make dev              # Démarre Next.js et le Bot Discord en arrière-plan
make dev-logs         # Affiche les logs en direct des conteneurs
make dev-stop         # Arrête les conteneurs de dev
```

---

## 📐 Conventions TypeScript & Monorepo

### 1. Gestion des Types Partagés (`packages/shared`)
* Toute structure de données partagée (`Tournament`, `Phase`, `Match`, `Team`, `User`) et tout schéma Zod commun doit résider dans `packages/shared/src/index.ts`.
* **Règle absolue** : Après chaque modification dans `packages/shared`, lancer `npm run build --workspace=@hub/shared` pour régénérer les fichiers `dist/index.d.ts` et `dist/index.js`.
* Importer dans `apps/bot` et `apps/web` exclusivement via `@hub/shared`.

### 2. Typage Strict (`apps/bot`)
Le `tsconfig.json` du bot applique un typage strict renforcé :
* `noUncheckedIndexedAccess: true` : L'accès aux tableaux ou clés d'objets (`arr[i]`, `dict[key]`) renvoie `T | undefined`. Toujours vérifier l'existence avec des guards (`if (!item) return;`) ou l'opérateur de coalescence nulle `??`.
* `exactOptionalPropertyTypes: true` : Ne jamais assigner la valeur `undefined` à une clé optionnelle (`foo?: string`), sauf si son type autorise explicitement `string | undefined`.

### 3. Spécificités Next.js 16 & React 19 (`apps/web`)
* **Paramètres asynchrones** : Dans Next.js App Router (versions récentes), `params` et `searchParams` sont des Promises.
  ```tsx
  export default async function Page({ params }: { params: Promise<{ guildId: string }> }) {
    const { guildId } = await params;
    // ...
  }
  ```
* **Composants Client** : Placer obligatoirement `"use client";` au tout début des fichiers utilisant l'interactivité ou des hooks React (`useState`, `useEffect`, `useRouter`, etc.).
* **Composant Link** : Utiliser impérativement `<Link href="...">` de `next/link` pour la navigation interne (éviter les balises `<a>`).
* **Effets React** : Ne pas appeler de `setState` synchrone directement dans le corps d'un `useEffect` (privilégier les initialiseurs d'état ou callbacks asynchrones).

### 4. Base de Données & Supabase
* **Enums PostgreSQL** :
  * `tournament_status` : `'DRAFT'`, `'REGISTRATION'`, `'ACTIVE'`, `'COMPLETED'`, `'ARCHIVED'` (ne jamais utiliser `'in_progress'`).
  * `phase_type` : `'ROUND_ROBIN'`, `'SINGLE_ELIM'`, `'SWISS'`, `'DOUBLE_ELIM'`.
* **Cloisonnement Multi-Tenant** :
  * Toute requête SQL ou mutation API doit être vérifiée et restreinte par `guild_id` ou via `verifyTournamentGuild` / `verifyPhaseGuild` (`apps/bot/src/utils/tenant.ts`).
* **Migrations** : Tout changement de schéma SQL doit être formalisé dans un nouveau fichier timestampé sous `supabase/migrations/`.

---

## 🐙 Conventions de Commits & PR

* Appliquer rigoureusement la convention **Conventional Commits** :
  * `feat(scope): description` (Nouvelle fonctionnalité)
  * `fix(scope): description` (Correction de bug)
  * `ux(scope): description` (Amélioration UI / Toast / Dialogue)
  * `refactor(scope): description` (Refactoring interne)
  * `test(scope): description` (Tests unitaires)
* Toujours mentionner le numéro de ticket GitHub associé (ex: `#20`).
