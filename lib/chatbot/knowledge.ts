// ─── Chatbot Knowledge Base ──────────────────────────────────────────────────

export interface QA {
  keywords: string[]
  question: string
  answer: string // supports simple markdown: **bold**, [link](url), \n for line breaks, - for lists
  category: string
  roles?: string[] // if set, only show for these roles
}

export interface CategorySuggestions {
  label: string
  questions: string[]
}

export const KNOWLEDGE_BASE: QA[] = [
  // ── Connexion & Compte ──
  {
    keywords: ['connexion', 'connecter', 'login', 'mot de passe', 'password', 'acceder', 'entrer'],
    question: 'Comment me connecter ?',
    answer: 'Rendez-vous sur la [page de connexion](/login) et entrez votre adresse email.\n\nVous recevrez un **lien magique** par email, valable **15 minutes**. Cliquez dessus pour accéder à votre espace.\n\n- Pas besoin de mot de passe\n- Un nouveau lien à chaque connexion\n- Fonctionne sur mobile et desktop',
    category: 'Connexion',
  },
  {
    keywords: ['email', 'mail', 'recu', 'spam', 'pas reçu', 'lien', 'expire', 'invalide'],
    question: "Je n'ai pas reçu l'email de connexion",
    answer: "Plusieurs choses à vérifier :\n\n- Regardez dans votre dossier **spam/courrier indésirable**\n- Vérifiez que vous utilisez **la bonne adresse email** (celle inscrite par votre formateur)\n- Le lien est valable **15 minutes** — si expiré, demandez-en un nouveau sur la [page de connexion](/login)\n- Attendez 1-2 minutes, la réception peut prendre un peu de temps\n\nSi le problème persiste, contactez votre formateur ou l'administrateur.",
    category: 'Connexion',
  },
  {
    keywords: ['profil', 'nom', 'modifier', 'changer', 'avatar', 'photo'],
    question: 'Comment modifier mon profil ?',
    answer: 'Cliquez sur votre **avatar en haut à droite**, puis **"Mon profil"**, ou accédez directement à la [page Profil](/profile).\n\nVous pouvez y modifier :\n- Votre **nom affiché**\n- Le **thème** (clair/sombre)\n- La **disposition** (barre latérale ou en-tête)\n- Vos [préférences de notification](/profile#notifications)',
    category: 'Mon compte',
  },
  {
    keywords: ['notification', 'email', 'desactiver', 'activer', 'preference', 'desabonner'],
    question: 'Comment gérer mes notifications ?',
    answer: "Allez dans vos [préférences de notification](/profile#notifications).\n\nVous pouvez activer/désactiver :\n- **Email de bienvenue** — à la création du compte\n- **Email d'assignation** — quand on vous attribue une formation\n- **Email de mise à jour** — quand le contenu d'un module change\n\nChaque toggle prend effet immédiatement.",
    category: 'Mon compte',
  },
  {
    keywords: ['theme', 'sombre', 'clair', 'dark', 'mode', 'apparence', 'couleur'],
    question: 'Comment changer le thème ?',
    answer: 'Allez dans [Mon profil](/profile) > section **"Préférences"**.\n\nCliquez sur le bouton pour basculer entre :\n- **Mode clair** — fond blanc\n- **Mode sombre** — fond foncé\n\nLe thème est sauvegardé automatiquement.',
    category: 'Mon compte',
  },
  {
    keywords: ['disposition', 'layout', 'sidebar', 'barre laterale', 'entete', 'header', 'menu'],
    question: 'Comment changer la disposition ?',
    answer: 'Dans [Mon profil](/profile) > **"Préférences"**, vous pouvez choisir entre :\n\n- **Barre latérale** — menu fixe à gauche (rétractable)\n- **En-tête** — navigation en haut de page\n\nLe changement est instantané et synchronisé entre vos onglets.',
    category: 'Mon compte',
  },
  {
    keywords: ['contacter', 'contact', 'joindre', 'ecrire', 'formateur', 'admin', 'administrateur', 'responsable', 'message', 'parler'],
    question: 'Comment contacter mon formateur ou admin ?',
    answer: "Vous pouvez contacter votre formateur ou administrateur directement depuis la plateforme !\n\nAllez dans [Mon profil > Aide / Support](/profile#help) :\n- Sélectionnez le **destinataire** (formateur ou admin)\n- Rédigez votre **sujet** et **message**\n- Cliquez sur **\"Envoyer\"**\n\nLe destinataire recevra votre message **par email** et pourra vous répondre directement.",
    category: 'Mon compte',
  },
  // ── Apprenant ──
  {
    keywords: ['parcours', 'formation', 'commencer', 'acceder', 'debut', 'lancer'],
    question: 'Comment accéder à ma formation ?',
    answer: 'Depuis votre [tableau de bord](/learner), vous voyez vos formations assignées avec leur progression.\n\n- Cliquez sur **"Commencer"** pour une nouvelle formation\n- Cliquez sur **"Continuer"** pour reprendre là où vous en étiez\n- Les modules se suivent dans l\'ordre défini par votre formateur',
    category: 'Formation',
    roles: ['LEARNER'],
  },
  {
    keywords: ['module', 'suivant', 'prochain', 'ordre', 'debloquer', 'verrouille'],
    question: 'Comment passer au module suivant ?',
    answer: 'Terminez le module en cours en le lisant entièrement, puis cliquez sur **"Marquer comme terminé"**.\n\n- Le module suivant se **débloque automatiquement**\n- Si un **quiz** est associé, vous devrez le compléter d\'abord\n- Votre progression est sauvegardée en temps réel',
    category: 'Formation',
    roles: ['LEARNER'],
  },
  {
    keywords: ['quiz', 'test', 'examen', 'score', 'resultat', 'reponse', 'question'],
    question: 'Comment fonctionnent les quiz ?',
    answer: 'Certains modules ont un **quiz à la fin** :\n\n- Répondez à **toutes les questions** (choix unique ou multiple)\n- Cliquez sur **"Valider"** pour soumettre\n- Votre **score** est calculé automatiquement\n- Vous pouvez voir vos résultats dans l\'historique de quiz\n- Un score élevé peut débloquer des **badges** !',
    category: 'Formation',
    roles: ['LEARNER'],
  },
  {
    keywords: ['badge', 'recompense', 'gagner', 'debloquer', 'trophee', 'medaille'],
    question: 'Comment débloquer des badges ?',
    answer: 'Les badges se débloquent **automatiquement** quand vous atteignez certains objectifs :\n\n- **Premier module** — terminez votre premier module\n- **5 / 10 modules** — progressez dans vos formations\n- **Quiz ace** — obtenez 80%+ à un quiz\n- **Quiz parfait** — 100% à un quiz !\n- **Parcours complet** — terminez tous les modules d\'un parcours\n- **Champion** — terminez tous vos parcours\n\nConsultez la section Badges sur votre [tableau de bord](/learner).',
    category: 'Formation',
    roles: ['LEARNER'],
  },
  {
    keywords: ['certificat', 'attestation', 'telecharger', 'diplome', 'pdf', 'preuve'],
    question: 'Comment obtenir mon certificat ?',
    answer: 'Une fois **tous les modules d\'un parcours** terminés :\n\n- Un bouton **"Télécharger le certificat"** apparaît sur votre [tableau de bord](/learner)\n- Le certificat est au format **PDF**\n- Il contient votre nom, le parcours complété et la date\n\nChaque parcours complété génère son propre certificat.',
    category: 'Formation',
    roles: ['LEARNER'],
  },
  {
    keywords: ['progression', 'avancement', 'pourcentage', 'statistique', 'stats'],
    question: 'Où voir ma progression ?',
    answer: 'Votre [tableau de bord](/learner) affiche :\n\n- **Progression globale** — pourcentage, modules complétés\n- **Score moyen** aux quiz\n- **Barre de progression** par parcours\n- **Badges** débloqués\n\nCliquez sur un parcours pour voir le détail module par module.',
    category: 'Formation',
    roles: ['LEARNER'],
  },
  {
    keywords: ['pas de parcours', 'aucun parcours', 'rien', 'vide', 'aucune formation'],
    question: "Je n'ai aucune formation assignée",
    answer: 'Votre compte est **actif** mais aucune formation ne vous a encore été attribuée.\n\n- Votre formateur vous assignera bientôt une formation\n- Vous recevrez un **email de notification** quand ce sera fait\n- En attendant, vous pouvez compléter votre [profil](/profile)',
    category: 'Formation',
    roles: ['LEARNER'],
  },
  {
    keywords: ['video', 'lire', 'charger', 'player', 'lecture', 'regarder'],
    question: 'La vidéo ne se charge pas',
    answer: 'Si une vidéo ne se charge pas :\n\n- Vérifiez votre **connexion internet**\n- Essayez de **recharger la page** (F5)\n- Testez avec un **autre navigateur** (Chrome, Firefox, Edge)\n- Désactivez les **extensions de blocage** (AdBlock, etc.)\n\nSi le problème persiste, contactez votre formateur.',
    category: 'Problèmes',
    roles: ['LEARNER'],
  },
  // ── Formateur ──
  {
    keywords: ['inviter', 'ajouter', 'apprenant', 'inscrire', 'nouvel', 'nouveau'],
    question: 'Comment ajouter un apprenant ?',
    answer: 'Allez dans [Apprenants](/trainer/learners) :\n\n- Cliquez sur **"Ajouter"**\n- **Recherchez un utilisateur existant** ou entrez un nouvel email\n- Sélectionnez le(s) **parcours** à assigner\n- L\'apprenant recevra un **email d\'invitation**\n\nVous pouvez aussi ajouter plusieurs apprenants d\'un coup.',
    category: 'Gestion',
    roles: ['TRAINER', 'ADMIN'],
  },
  {
    keywords: ['progression', 'suivi', 'suivre', 'apprenant', 'detail', 'activite'],
    question: 'Comment suivre la progression de mes apprenants ?',
    answer: 'Votre [tableau de bord formateur](/trainer) affiche :\n\n- **Statistiques globales** — taux de complétion, distribution\n- **Liste des apprenants** avec leur progression\n- **Apprenants à risque** — inactifs depuis 7+ jours\n\nCliquez sur un apprenant pour voir son **détail** : modules complétés, scores de quiz, dernière activité.',
    category: 'Gestion',
    roles: ['TRAINER', 'ADMIN'],
  },
  {
    keywords: ['parcours', 'assigner', 'attribuer', 'formation', 'affecter'],
    question: 'Comment assigner un parcours ?',
    answer: 'Dans la [liste de vos apprenants](/trainer/learners) :\n\n- Cliquez sur **"Attribuer un parcours"** à côté de l\'apprenant\n- Sélectionnez le parcours souhaité\n- Le nouveau parcours **s\'ajoute** aux formations existantes (pas de remplacement)\n- L\'apprenant est **notifié par email**',
    category: 'Gestion',
    roles: ['TRAINER', 'ADMIN'],
  },
  {
    keywords: ['risque', 'inactif', 'relancer', 'absent', 'retard'],
    question: "Comment identifier les apprenants en difficulté ?",
    answer: 'Sur votre [tableau de bord](/trainer), la section **"Apprenants à risque"** liste les apprenants :\n\n- Qui ont **commencé** leur formation\n- Mais n\'ont **aucune activité depuis 7 jours**\n\nVous pouvez les contacter directement pour les relancer et les accompagner.',
    category: 'Gestion',
    roles: ['TRAINER', 'ADMIN'],
  },
  {
    keywords: ['invitation', 'lien', 'envoyer', 'renvoyer', 'expirer'],
    question: "Comment renvoyer une invitation ?",
    answer: "Si un apprenant n'a pas reçu ou a perdu son invitation :\n\n- Allez dans [Apprenants](/trainer/learners) > cliquez sur l'apprenant\n- Vous pouvez **renvoyer l'invitation** par email\n- Le nouveau lien remplace l'ancien\n- L'apprenant peut aussi se connecter directement via la [page de connexion](/login) s'il est déjà inscrit",
    category: 'Gestion',
    roles: ['TRAINER', 'ADMIN'],
  },
  {
    keywords: ['contacter', 'contact', 'joindre', 'ecrire', 'admin', 'administrateur', 'responsable', 'message', 'parler'],
    question: 'Comment contacter mon administrateur ?',
    answer: "Vous pouvez contacter l'administrateur directement depuis la plateforme !\n\nAllez dans [Mon profil > Aide / Support](/profile#help) :\n- Sélectionnez l'**administrateur** comme destinataire\n- Rédigez votre **sujet** et **message**\n- Cliquez sur **\"Envoyer\"**\n\nL'admin recevra votre message **par email** et pourra vous répondre directement.",
    category: 'Gestion',
    roles: ['TRAINER'],
  },
  // ── Admin ──
  {
    keywords: ['formateur', 'ajouter', 'creer', 'nouveau', 'promouvoir'],
    question: 'Comment ajouter un formateur ?',
    answer: "Allez dans [Formateurs](/admin/trainers) :\n\n- Cliquez sur **\"Ajouter un formateur\"**\n- **Recherchez un utilisateur existant** pour le promouvoir\n- Ou entrez un **nouvel email** + nom\n- Il recevra un **email de bienvenue** avec lien de connexion\n\nLes admins apparaissent aussi dans la liste des formateurs.",
    category: 'Administration',
    roles: ['ADMIN'],
  },
  {
    keywords: ['module', 'creer', 'contenu', 'nouveau', 'rediger', 'ecrire'],
    question: 'Comment créer un module ?',
    answer: 'Allez dans [Parcours](/admin/parcours) > sélectionnez un parcours :\n\n- Cliquez sur **"Ajouter un module"**\n- Remplissez le **titre** et le **contenu** (éditeur riche)\n- Vous pouvez ajouter des **vidéos**, **images**, **liens**\n- Ajoutez un **quiz** avec des questions à choix unique ou multiple\n- **Réordonnez** les modules par glisser-déposer',
    category: 'Administration',
    roles: ['ADMIN'],
  },
  {
    keywords: ['parcours', 'creer', 'nouveau', 'formation', 'programme'],
    question: 'Comment créer un parcours ?',
    answer: "Allez dans [Parcours](/admin/parcours) :\n\n- Cliquez sur **\"Créer un parcours\"**\n- Donnez un **titre** et une **description**\n- Ajoutez ensuite des **modules** dans l'ordre souhaité\n- Le parcours est visible par les formateurs dès sa création",
    category: 'Administration',
    roles: ['ADMIN'],
  },
  {
    keywords: ['acces', 'whitelist', 'domaine', 'autoriser', 'email', 'bloquer'],
    question: 'Comment gérer les accès ?',
    answer: 'Dans la page [Accès](/admin/whitelist), vous pouvez :\n\n- Autoriser des **emails individuels**\n- Autoriser des **domaines entiers** (@entreprise.fr)\n- Définir le **rôle par défaut** de chaque email\n- Les utilisateurs d\'un domaine autorisé peuvent se connecter automatiquement\n\nLa modification du rôle dans Accès **synchronise** aussi le rôle du compte utilisateur.',
    category: 'Administration',
    roles: ['ADMIN'],
  },
  {
    keywords: ['role', 'changer', 'promouvoir', 'retrograder', 'hierarchie', 'permission'],
    question: "Comment changer le rôle d'un utilisateur ?",
    answer: 'Dans [Accès](/admin/whitelist) ou [Formateurs](/admin/trainers), utilisez le sélecteur de rôle.\n\nHiérarchie : **Admin** > **Formateur** > **Apprenant**\n\n- Un admin peut modifier **n\'importe quel rôle**\n- Un formateur ne peut gérer que ses apprenants\n- Les admins ne peuvent pas être rétrogradés depuis l\'espace Formateurs',
    category: 'Administration',
    roles: ['ADMIN'],
  },
  {
    keywords: ['supprimer', 'retirer', 'utilisateur', 'compte', 'effacer'],
    question: 'Comment supprimer un utilisateur ?',
    answer: "Dans la page [Accès](/admin/whitelist), supprimez l'email de l'utilisateur.\n\n**Attention** : cette action est **irréversible** et supprimera :\n- Le compte utilisateur\n- Toute sa **progression**\n- Ses **résultats de quiz**\n- Ses **badges**",
    category: 'Administration',
    roles: ['ADMIN'],
  },
  {
    keywords: ['statistique', 'dashboard', 'tableau', 'bord', 'nombre', 'chiffre'],
    question: 'Que montrent les statistiques admin ?',
    answer: 'Le [tableau de bord admin](/admin) affiche :\n\n- **Nombre total** d\'apprenants, formateurs, parcours, modules\n- **Taux de complétion** global\n- **Distribution** des scores aux quiz\n- **Activité récente** sur la plateforme\n\nChaque carte est cliquable pour accéder aux détails.',
    category: 'Administration',
    roles: ['ADMIN'],
  },
  // ── Problèmes courants ──
  {
    keywords: ['erreur', 'bug', 'plante', 'marche pas', 'probleme', 'bloque'],
    question: "J'ai une erreur ou un bug",
    answer: "Quelques étapes à essayer :\n\n- **Rechargez la page** (F5 ou Ctrl+R)\n- **Videz le cache** du navigateur (Ctrl+Shift+Suppr)\n- Essayez en **navigation privée**\n- Testez avec un **autre navigateur**\n\nSi le problème persiste, notez le **message d'erreur** et contactez l'administrateur.",
    category: 'Problèmes',
  },
  {
    keywords: ['lent', 'charge', 'chargement', 'longtemps', 'vitesse', 'performance'],
    question: 'La plateforme est lente',
    answer: 'Si la plateforme est lente :\n\n- Vérifiez votre **connexion internet**\n- Fermez les **onglets inutiles**\n- Essayez en **navigation privée** (extensions désactivées)\n- Videz le **cache** du navigateur\n\nSi le problème touche plusieurs utilisateurs, contactez l\'administrateur.',
    category: 'Problèmes',
  },
  {
    keywords: ['mobile', 'telephone', 'tablette', 'responsive', 'petit ecran'],
    question: 'Ça marche sur mobile ?',
    answer: 'Oui ! FormaCPV est **entièrement responsive** :\n\n- Fonctionne sur **smartphone** et **tablette**\n- Menu adapté avec **navigation mobile**\n- Vidéos et contenus **redimensionnés** automatiquement\n- Utilisez le navigateur de votre téléphone (Chrome, Safari)',
    category: 'Problèmes',
  },
  // ── Fallback ──
  {
    keywords: ['aide', 'help', 'support', 'probleme', 'bug', 'contact', 'autre'],
    question: "J'ai un autre problème",
    answer: "Si vous ne trouvez pas la réponse à votre question :\n\n- Essayez de **reformuler** votre question\n- Contactez votre **formateur** par email\n- Ou l'**administrateur** de la plateforme\n\nIls pourront vous aider directement.",
    category: 'Aide',
  },
]

// ─── Suggestions by role ────────────────────────────────────────────────────

export function getCategorySuggestions(role: string): CategorySuggestions[] {
  const categories: Record<string, string[]> = {}

  for (const qa of KNOWLEDGE_BASE) {
    if (qa.roles && !qa.roles.includes(role)) continue
    if (!categories[qa.category]) categories[qa.category] = []
    categories[qa.category].push(qa.question)
  }

  return Object.entries(categories).map(([label, questions]) => ({ label, questions }))
}

export function getTopSuggestions(role: string): string[] {
  switch (role) {
    case 'LEARNER':
      return [
        'Comment accéder à ma formation ?',
        'Comment fonctionnent les quiz ?',
        'Comment débloquer des badges ?',
        'Comment modifier mon profil ?',
      ]
    case 'TRAINER':
      return [
        'Comment ajouter un apprenant ?',
        'Comment suivre la progression de mes apprenants ?',
        'Comment assigner un parcours ?',
        'Comment me connecter ?',
      ]
    case 'ADMIN':
      return [
        'Comment créer un parcours ?',
        'Comment ajouter un formateur ?',
        'Comment gérer les accès ?',
        "Comment changer le rôle d'un utilisateur ?",
      ]
    default:
      return [
        'Comment me connecter ?',
        'Comment modifier mon profil ?',
      ]
  }
}
