// Barrel file — re-exports from split modules
// All existing imports from '@/lib/services/admin.service' continue to work

export {
  type ModuleWithDetails,
  type CreateModuleInput,
  type UpdateModuleInput,
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
} from './admin/modules'

export {
  type ParcoursWithStats,
  type CreateParcoursInput,
  type UpdateParcoursInput,
  getParcours,
  getParcoursById,
  createParcours,
  updateParcours,
  deleteParcours,
} from './admin/parcours'

export {
  type TrainerWithStats,
  getTrainers,
  getTrainerWithLearners,
  addTrainer,
  removeTrainer,
} from './admin/trainers'

export {
  type LearnerParcoursDetail,
  type LearnerWithDetails,
  type GetLearnersOptions,
  getLearners,
  getLearnerById,
  reassignLearner,
  deleteLearner,
} from './admin/learners'

export { getAdminStats } from './admin/stats'
