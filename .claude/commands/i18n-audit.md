# Commande `/i18n-audit` - Audit de l'Internationalisation (FR / EN)

Exécute un audit rigoureux des traductions web et bot selon le standard Staff Localization Engineer.

## Argument : `$ARGUMENTS` (Facultatif : `--all`, `--diff`, ou chemin vers un fichier / dossier)

## Instructions pour Claude / Antigravity :

1. **Charger le skill** `.agents/skills/i18n-auditor/SKILL.md` et suivre sa méthode.

2. **Preuve mécanique d'abord** :
   ```bash
   node .agents/skills/i18n-auditor/scripts/check-i18n.mjs
   ```
   Afficher le résumé (nombre de clés par locale, anomalies bloquantes, code de sortie).

3. **Identification du Périmètre** :
   * Vide ou `--all` : web (`apps/web/src`) + bot (`apps/bot/src`) + migrations touchant `language`.
   * `--diff` : restreindre l'analyse humaine aux fichiers de `git diff --name-only main...HEAD`.
   * Chemin fourni : restreindre l'analyse humaine à ce chemin (le script reste global pour la parité).

4. **Confirmer ou écarter** chaque 🟠/🟡 du script en lisant le code (faux positifs exclus du rapport), puis évaluer les 5 piliers (Dictionnaires, Surfaces, Résolution & Fallbacks, Formatage & Grammaire, Qualité du code).

5. **Restitution** : Scorecard /100, Répertoire des anomalies `I18N-XX` classées (`🔴 CRITIQUE`, `🟠 IMPORTANT`, `🟡 MOYEN`, `🟢 FAIBLE`), matrice effort/impact et prompts de correction par scope.
