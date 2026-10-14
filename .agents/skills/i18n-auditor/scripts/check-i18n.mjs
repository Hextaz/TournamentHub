#!/usr/bin/env node
// Audit mécanique i18n TournamentHub (web + bot).
// Usage : node .agents/skills/i18n-auditor/scripts/check-i18n.mjs [--json]
// Code de sortie 1 si une anomalie bloquante (parité, clé manquante, placeholder) est détectée.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Les locales s'importent entre elles sans extension (`from "./fr"`), comme le résout TypeScript.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && context.parentURL?.endsWith(".ts")) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = resolve(import.meta.dirname, "../../../..");
const LOCALES = ["fr", "en"];
const REFERENCE = "fr";

const SCOPES = [
  {
    name: "web",
    localesDir: "apps/web/src/i18n/locales",
    srcDir: "apps/web/src",
    // t("key") côté client, t(locale, "key") côté serveur
    callRe: /\bt\(\s*(?:[A-Za-z_$][\w$.]*\s*,\s*)?(["'`])([^"'`$]+?)\1/g,
    anyCallRe: /\bt\(/g,
  },
  {
    name: "bot",
    localesDir: "apps/bot/src/i18n/locales",
    srcDir: "apps/bot/src",
    callRe: /\btBot\(\s*[^,]+,\s*(["'`])([^"'`$]+?)\1/g,
    anyCallRe: /\btBot\(/g,
  },
];

const PLACEHOLDER_RE = /\{\{?(\w+)\}?\}/g;
const FRENCH_HINT_RE = /[éèêàùçôîœÉÈÀÇ]|\b(le|la|les|des|du|une|un|vous|votre|pour|avec|aucun|aucune|équipe|tournoi|impossible|erreur|supprimer|enregistrer|annuler)\b/i;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "dist" || entry === ".next" || entry === "__tests__") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|mjs)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

function flatten(obj, prefix = "", out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out.set(key, v);
  }
  return out;
}

function placeholders(value) {
  return [...String(value).matchAll(PLACEHOLDER_RE)].map((m) => m[1]).sort().join(",");
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

// Chaînes visibles probablement non traduites : texte JSX brut et attributs d'UI littéraux.
function hardcodedCandidates(scope, file, text) {
  const hits = [];
  const patterns =
    scope.name === "web"
      ? [
          />\s*([^<>{}\n]*[A-Za-zÀ-ÿ]{3,}[^<>{}\n]*?)\s*</g,
          /\b(?:title|placeholder|aria-label|alt|label|confirmLabel|cancelLabel|message|description)=["']([^"']*[A-Za-zÀ-ÿ]{3,}[^"']*)["']/g,
          /\b(?:toast\.\w+|showToast|alert|confirm|prompt)\(\s*["'`]([^"'`]{3,})["'`]/g,
        ]
      : [
          /\.(?:setTitle|setDescription|setLabel|setPlaceholder|setName|setFooter)\(\s*["'`]([^"'`]{3,})["'`]/g,
          /\bcontent:\s*["'`]([^"'`]{3,})["'`]/g,
          /\b(?:name|value):\s*["'`]([^"'`]*[A-Za-zÀ-ÿ]{3,}[^"'`]*)["'`]/g,
        ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const s = m[1].trim();
      if (!s || /^[\w.-]+$/.test(s) && !FRENCH_HINT_RE.test(s)) continue; // identifiants, clés, classes
      if (/^(https?:|\/|#|[\w-]+\s[\w-]+\s[\w-]+$)/.test(s) && !FRENCH_HINT_RE.test(s)) continue;
      if (/className|=>|&&|\|\||===|^\)/.test(s)) continue; // fragments de code JSX, pas du texte
      if (/^[\w.<>\[\]]+(\s*\|\s*[\w.<>\[\]]+)+$/.test(s)) continue; // union de types TS (`void | Promise`)
      if (!FRENCH_HINT_RE.test(s) && !/\s/.test(s)) continue;
      hits.push({ file: relative(ROOT, file), line: lineOf(text, m.index), text: s.slice(0, 80) });
    }
  }
  // Côté web, le message d'une Error levée finit souvent dans un toast : on signale ceux rédigés en français.
  if (scope.name === "web") {
    for (const m of text.matchAll(/\bnew Error\([^;]*?["'`]([^"'`]{3,})["'`]/g)) {
      if (FRENCH_HINT_RE.test(m[1])) hits.push({ file: relative(ROOT, file), line: lineOf(text, m.index), text: m[1].slice(0, 80) });
    }
  }
  return hits;
}

async function auditScope(scope) {
  const dicts = {};
  for (const loc of LOCALES) {
    const mod = await import(pathToFileURL(join(ROOT, scope.localesDir, `${loc}.ts`)).href);
    dicts[loc] = flatten(mod[loc]);
  }
  const ref = dicts[REFERENCE];
  const report = {
    scope: scope.name,
    keyCount: Object.fromEntries(LOCALES.map((l) => [l, dicts[l].size])),
    missingInLocale: [],
    placeholderMismatch: [],
    emptyValues: [],
    identicalValues: [],
    usedButUndefined: [],
    unused: [],
    dynamicCalls: [],
    hardcoded: [],
  };

  const allKeys = new Set(LOCALES.flatMap((l) => [...dicts[l].keys()]));
  for (const key of allKeys) {
    for (const loc of LOCALES) {
      if (!dicts[loc].has(key)) report.missingInLocale.push({ key, locale: loc });
      else if (String(dicts[loc].get(key)).trim() === "") report.emptyValues.push({ key, locale: loc });
    }
    const values = LOCALES.map((l) => dicts[l].get(key)).filter((v) => v !== undefined);
    if (values.length === LOCALES.length) {
      const ph = values.map(placeholders);
      if (new Set(ph).size > 1) report.placeholderMismatch.push({ key, placeholders: Object.fromEntries(LOCALES.map((l, i) => [l, ph[i]])) });
      if (new Set(values).size === 1 && /[A-Za-z]{4,}\s+[A-Za-z]{2,}/.test(String(values[0]))) report.identicalValues.push({ key, value: values[0] });
    }
  }

  const used = new Set();
  for (const file of walk(join(ROOT, scope.srcDir))) {
    if (file.includes(`${scope.localesDir.split("/").slice(-2).join("/")}`)) continue;
    const text = readFileSync(file, "utf8");
    const literalCalls = new Set();
    for (const m of text.matchAll(scope.callRe)) {
      literalCalls.add(m.index);
      const key = m[2];
      if (!key.includes(".")) continue;
      used.add(key);
      if (!ref.has(key)) report.usedButUndefined.push({ key, file: relative(ROOT, file), line: lineOf(text, m.index) });
    }
    for (const m of text.matchAll(scope.anyCallRe)) {
      if (literalCalls.has(m.index) || file.includes("/i18n/")) continue;
      report.dynamicCalls.push({ file: relative(ROOT, file), line: lineOf(text, m.index), snippet: text.slice(m.index, m.index + 70).split("\n")[0] });
    }
    if (!file.includes("/i18n/")) report.hardcoded.push(...hardcodedCandidates(scope, file, text));
  }
  // Une clé dont un préfixe est construit dynamiquement n'est pas « morte » : on ne signale que les feuilles jamais référencées.
  for (const key of ref.keys()) if (!used.has(key)) report.unused.push(key);
  return report;
}

const reports = [];
for (const scope of SCOPES) reports.push(await auditScope(scope));

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(reports, null, 2));
} else {
  for (const r of reports) {
    console.log(`\n=== ${r.scope.toUpperCase()} — clés : ${LOCALES.map((l) => `${l}=${r.keyCount[l]}`).join(" ")}`);
    const section = (title, items, fmt, limit = 40) => {
      console.log(`\n[${items.length}] ${title}`);
      for (const it of items.slice(0, limit)) console.log(`  - ${fmt(it)}`);
      if (items.length > limit) console.log(`  … ${items.length - limit} de plus`);
    };
    section("🔴 Clés absentes d'une locale", r.missingInLocale, (i) => `${i.key} (manque en ${i.locale})`);
    section("🔴 Clés utilisées mais non définies", r.usedButUndefined, (i) => `${i.key} — ${i.file}:${i.line}`);
    section("🔴 Placeholders divergents", r.placeholderMismatch, (i) => `${i.key} ${JSON.stringify(i.placeholders)}`);
    section("🟠 Valeurs vides", r.emptyValues, (i) => `${i.key} (${i.locale})`);
    section("🟠 Textes en dur suspects", r.hardcoded, (i) => `${i.file}:${i.line} « ${i.text} »`, 80);
    section("🟡 Valeurs identiques fr/en (non traduites ?)", r.identicalValues, (i) => `${i.key} = « ${i.value} »`);
    section("🟡 Appels à clé dynamique (à vérifier à la main)", r.dynamicCalls, (i) => `${i.file}:${i.line} ${i.snippet}`);
    section("🟢 Clés jamais référencées littéralement", r.unused, (k) => k, 60);
  }
}

const blocking = reports.reduce((n, r) => n + r.missingInLocale.length + r.usedButUndefined.length + r.placeholderMismatch.length, 0);
console.log(`\n${blocking === 0 ? "✅" : "❌"} ${blocking} anomalie(s) bloquante(s)`);
process.exit(blocking === 0 ? 0 : 1);
