module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat',     // Nouvelle fonctionnalité
      'fix',      // Correction de bug
      'docs',     // Documentation
      'style',    // Formatage (pas de changement de code)
      'refactor', // Refactoring
      'perf',     // Performance
      'test',     // Tests
      'chore',    // Maintenance (deps, CI, etc.)
      'revert',   // Revert d'un commit
    ]],
    'subject-case': [0], // Pas de contrainte sur la casse
  },
}
