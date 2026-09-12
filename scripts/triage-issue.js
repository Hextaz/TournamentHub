#!/usr/bin/env node

/**
 * Triage and link an issue to GitHub Project #2 (HubTournament)
 * 
 * Usage:
 *   node scripts/triage-issue.js <issue_number_or_url> [options]
 * 
 * Options:
 *   --priority <P0|P1|P2>
 *   --size <XS|S|M|L|XL>
 *   --status <Backlog|Ready|"In progress"|"In review"|Done>
 * 
 * Example:
 *   node scripts/triage-issue.js 41 --priority P1 --size M --status Backlog
 */

const { execSync } = require('child_process');

const PROJECT_ID = 'PVT_kwHOCDIMIs4BUsAD';
const FIELD_STATUS = 'PVTSSF_lAHOCDIMIs4BUsADzhCHw0w';
const FIELD_PRIORITY = 'PVTSSF_lAHOCDIMIs4BUsADzhCHxFY';
const FIELD_SIZE = 'PVTSSF_lAHOCDIMIs4BUsADzhCHxFc';

const STATUS_OPTIONS = {
  Backlog: 'f75ad846',
  Ready: '61e4505c',
  'In progress': '47fc9ee4',
  'In review': 'df73e18b',
  Done: '98236657',
};

const PRIORITY_OPTIONS = {
  P0: '79628723',
  P1: '0a877460',
  P2: 'da944a9c',
};

const SIZE_OPTIONS = {
  XS: '6c6483d2',
  S: 'f784b110',
  M: '7515a9f1',
  L: '817d0097',
  XL: 'db339eb2',
};

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    throw new Error(`Command failed: ${cmd}\nError: ${err.stderr || err.message}`);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: node scripts/triage-issue.js <issue_number_or_url> [options]
Options:
  --priority <P0|P1|P2>
  --size <XS|S|M|L|XL>
  --status <Backlog|Ready|"In progress"|"In review"|Done>`);
    process.exit(0);
  }

  let issueArg = args[0];
  let priority = null;
  let size = null;
  let status = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--priority' && args[i + 1]) {
      priority = args[i + 1].toUpperCase();
      i++;
    } else if (args[i] === '--size' && args[i + 1]) {
      size = args[i + 1].toUpperCase();
      i++;
    } else if (args[i] === '--status' && args[i + 1]) {
      status = args[i + 1];
      i++;
    }
  }

  let issueUrl = issueArg;
  if (!issueArg.startsWith('http')) {
    const num = issueArg.replace('#', '').trim();
    issueUrl = `https://github.com/Hextaz/TournamentHub/issues/${num}`;
  }

  return { issueUrl, priority, size, status };
}

function main() {
  const { issueUrl, priority, size, status } = parseArgs();
  console.log(`📌 Liaison de l'issue au GitHub Project #2...`);
  console.log(`🔗 URL : ${issueUrl}`);

  let itemId = null;

  // 1. Ajouter l'item au projet (ou récupérer son ID si déjà présent)
  try {
    const addOutput = runCommand(`gh project item-add 2 --owner Hextaz --url "${issueUrl}" --format json`);
    const parsed = JSON.parse(addOutput);
    itemId = parsed.id;
  } catch (err) {
    // Si l'item existe déjà, le chercher dans la liste
    console.log(`ℹ️ Recherche de l'item existant dans le projet...`);
    const listOutput = runCommand(`gh project item-list 2 --owner Hextaz --format json --limit 100`);
    const listData = JSON.parse(listOutput);
    const item = listData.items?.find((it) => it.content?.url === issueUrl);
    if (item) {
      itemId = item.id;
    } else {
      console.error(`❌ Impossible de récupérer l'ID de l'item dans le projet.`);
      console.error(err.message);
      process.exit(1);
    }
  }

  console.log(`✅ Item Project ID : ${itemId}`);

  // 2. Mettre à jour la Priorité
  if (priority && PRIORITY_OPTIONS[priority]) {
    const optionId = PRIORITY_OPTIONS[priority];
    runCommand(
      `gh project item-edit --project-id ${PROJECT_ID} --id ${itemId} --field-id ${FIELD_PRIORITY} --single-select-option-id ${optionId}`
    );
    console.log(`🎯 Priorité définie sur : ${priority}`);
  } else if (priority) {
    console.warn(`⚠️ Option de priorité inconnue : ${priority} (choix: P0, P1, P2)`);
  }

  // 3. Mettre à jour la Taille
  if (size && SIZE_OPTIONS[size]) {
    const optionId = SIZE_OPTIONS[size];
    runCommand(
      `gh project item-edit --project-id ${PROJECT_ID} --id ${itemId} --field-id ${FIELD_SIZE} --single-select-option-id ${optionId}`
    );
    console.log(`📏 Taille définie sur : ${size}`);
  } else if (size) {
    console.warn(`⚠️ Option de taille inconnue : ${size} (choix: XS, S, M, L, XL)`);
  }

  // 4. Mettre à jour le Statut
  if (status && STATUS_OPTIONS[status]) {
    const optionId = STATUS_OPTIONS[status];
    runCommand(
      `gh project item-edit --project-id ${PROJECT_ID} --id ${itemId} --field-id ${FIELD_STATUS} --single-select-option-id ${optionId}`
    );
    console.log(`📊 Statut défini sur : ${status}`);
  } else if (status) {
    console.warn(`⚠️ Option de statut inconnue : ${status} (choix: Backlog, Ready, "In progress", "In review", Done)`);
  }

  console.log(`🎉 Triage terminé avec succès sur le GitHub Project #2 (HubTournament) !`);
}

main();
