/**
 * Calcule la progression d'un utilisateur sur un parcours.
 */
export function calculateParcoursProgress(
  moduleIds: string[],
  completedModuleIds: Set<string>
): { completed: number; total: number; percentage: number } {
  const total = moduleIds.length
  const completed = moduleIds.filter((id) => completedModuleIds.has(id)).length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, percentage }
}

/**
 * Calcule la progression globale sur plusieurs parcours.
 */
export function calculateGlobalProgress(
  parcoursModules: { moduleIds: string[] }[],
  completedModuleIds: Set<string>
): { completed: number; total: number; percentage: number } {
  let total = 0
  let completed = 0

  for (const parcours of parcoursModules) {
    total += parcours.moduleIds.length
    completed += parcours.moduleIds.filter((id) => completedModuleIds.has(id)).length
  }

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  return { completed, total, percentage }
}
