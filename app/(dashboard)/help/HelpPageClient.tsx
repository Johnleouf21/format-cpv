'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  BookOpen,
  Building2,
  GraduationCap,
  HelpCircle,
  Route,
  Shield,
  Trophy,
  Users,
  Zap,
  Bell,
  Award,
} from 'lucide-react'

interface HelpPageClientProps {
  userRole: string
  userName: string
}

// ─── Sections de contenu ────────────────────────────────────────────────────

const learnerSections = [
  {
    id: 'getting-started',
    icon: BookOpen,
    title: 'Premiers pas',
    items: [
      {
        q: 'Comment me connecter ?',
        a: 'Rendez-vous sur la page de connexion et entrez votre adresse email. Vous recevrez un lien de connexion par email. Cliquez dessus depuis n\'importe quel appareil pour vous connecter. Si vous ouvrez le lien sur le même navigateur, vous serez redirigé automatiquement.',
      },
      {
        q: 'Je ne reçois pas l\'email de connexion',
        a: 'Vérifiez votre dossier spam/courrier indésirable. Le lien expire après 15 minutes. Si le problème persiste, contactez votre formateur via la section Profil > Contacter.',
      },
      {
        q: 'Comment accéder à mes formations ?',
        a: 'Une fois connecté, votre tableau de bord affiche vos parcours de formation. Cliquez sur un parcours pour voir ses modules, puis sur un module pour commencer.',
      },
    ],
  },
  {
    id: 'modules',
    icon: BookOpen,
    title: 'Suivre les modules',
    items: [
      {
        q: 'Comment valider un module ?',
        a: 'Lisez le contenu du module, puis cliquez sur "J\'ai terminé" en bas de page. Si un temps minimum est requis, un compteur vous indique le temps restant avant de pouvoir valider.',
      },
      {
        q: 'Que se passe-t-il après la validation ?',
        a: 'Si le module a un quiz, celui-ci apparaît après la validation. Répondez aux questions pour tester vos connaissances. Vous pouvez ensuite passer au module suivant.',
      },
      {
        q: 'Puis-je revoir un module déjà terminé ?',
        a: 'Oui, cliquez simplement sur le module dans la liste. Vous verrez le contenu et la correction du quiz si vous l\'avez passé.',
      },
    ],
  },
  {
    id: 'quizzes',
    icon: HelpCircle,
    title: 'Quiz',
    items: [
      {
        q: 'Comment fonctionnent les quiz ?',
        a: 'Les quiz apparaissent après la validation du module. Ils peuvent contenir 4 types de questions :\n- Choix unique : sélectionnez une seule réponse\n- Choix multiple : cochez toutes les bonnes réponses\n- Ordonnancement : glissez-déposez les éléments pour les remettre dans le bon ordre\n- Association : cliquez sur un élément à gauche puis sur sa correspondance à droite',
      },
      {
        q: 'Comment fonctionne l\'ordonnancement ?',
        a: 'Les éléments sont présentés dans un ordre aléatoire. Glissez-déposez les éléments pour les remettre dans le bon ordre (utilisez la poignée à gauche). La correction montre en vert les éléments bien placés et en rouge ceux mal placés.',
      },
      {
        q: 'Comment fonctionne l\'association ?',
        a: 'Glissez un élément de la colonne de gauche vers sa correspondance dans la colonne de droite. Vous pouvez aussi cliquer : sélectionnez un élément à gauche puis cliquez sur sa correspondance à droite. Les paires formées sont affichées avec un badge.',
      },
      {
        q: 'Où voir mes résultats ?',
        a: 'Allez dans Quiz dans la barre latérale. Vous y trouverez l\'historique de tous vos quiz avec les scores. Cliquez sur l\'icône oeil pour revoir les corrections (réponses vertes = correctes, rouges = incorrectes).',
      },
    ],
  },
  {
    id: 'gamification',
    icon: Trophy,
    title: 'Points XP, badges et classement',
    items: [
      {
        q: 'Comment gagner des XP ?',
        a: 'Vous gagnez des points d\'expérience en progressant :\n- 10 XP par module terminé\n- 20 XP par quiz réussi (80%+)\n- 30 XP bonus pour un quiz parfait (100%)\n- 15 XP par badge obtenu\n- 50 XP par parcours complété',
      },
      {
        q: 'Comment fonctionnent les niveaux ?',
        a: 'Vos XP déterminent votre niveau. Chaque niveau demande un peu plus d\'XP que le précédent. La barre de progression sur votre tableau de bord montre votre avancement vers le niveau suivant.',
      },
      {
        q: 'Comment obtenir des badges ?',
        a: 'Les badges sont attribués automatiquement quand vous atteignez certains objectifs : premier module, premier quiz, score parfait, parcours complété, etc. Retrouvez-les sur votre tableau de bord.',
      },
      {
        q: 'Le classement, c\'est quoi ?',
        a: 'Le classement compare votre progression avec les apprenants de votre centre. Allez dans Classement dans la barre latérale pour voir votre position.',
      },
    ],
  },
  {
    id: 'certificates',
    icon: Award,
    title: 'Certificats',
    items: [
      {
        q: 'Comment obtenir un certificat ?',
        a: 'Terminez tous les modules d\'un parcours. Un bouton de téléchargement du certificat apparaîtra sur votre tableau de bord et dans la section Certificats.',
      },
      {
        q: 'Le certificat est-il officiel ?',
        a: 'Le certificat est un document interne attestant de la complétion de votre parcours de formation. Il n\'a pas de valeur de certification officielle.',
      },
    ],
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Notifications et préférences',
    items: [
      {
        q: 'Comment fonctionnent les notifications ?',
        a: 'La cloche en haut de page affiche vos 5 dernières notifications. Cliquez sur "Voir toutes les notifications" pour accéder au centre de notifications complet.',
      },
      {
        q: 'Comment gérer mes notifications ?',
        a: 'Dans le centre de notifications vous pouvez :\n- Filtrer par statut : Toutes, Non lues, Lues\n- Supprimer une notification (icône poubelle au survol)\n- Tout marquer comme lu ou tout supprimer\n- Naviguer entre les pages',
      },
      {
        q: 'Comment gérer les emails ?',
        a: 'Allez dans Profil > Notifications pour activer ou désactiver les différents types d\'emails (bienvenue, assignation de parcours, mises à jour de contenu).',
      },
      {
        q: 'Comment changer le thème ?',
        a: 'Cliquez sur l\'icône lune/soleil dans la barre en haut, à côté de l\'aide et de la cloche. Le changement est instantané et sauvegardé.',
      },
    ],
  },
]

const trainerSections = [
  {
    id: 'manage-learners',
    icon: Users,
    title: 'Gérer mes apprenants',
    items: [
      {
        q: 'Comment ajouter un apprenant ?',
        a: 'Cliquez sur "Ajouter un apprenant" dans la page Mes apprenants. Vous pouvez uniquement ajouter des utilisateurs qui existent déjà dans la plateforme. Pour ajouter un nouvel email, contactez votre administrateur.',
      },
      {
        q: 'Pourquoi je ne peux pas ajouter un nouvel email ?',
        a: 'Par mesure de sécurité, seul l\'administrateur peut créer de nouveaux comptes et autoriser de nouvelles adresses email. Vous pouvez lui envoyer une demande via Profil > Contacter.',
      },
      {
        q: 'Comment assigner un parcours ?',
        a: 'Dans la page Mes apprenants, cliquez sur "Parcours" à côté de l\'apprenant concerné. Cochez les parcours à assigner et validez.',
      },
      {
        q: 'Puis-je voir la progression d\'un apprenant ?',
        a: 'Oui, cliquez sur "Voir" à côté de l\'apprenant. Vous verrez le détail de sa progression module par module, ses résultats de quiz avec les corrections (réponses correctes/incorrectes).',
      },
    ],
  },
  {
    id: 'trainer-stats',
    icon: Zap,
    title: 'Statistiques et classement',
    items: [
      {
        q: 'Que montrent les statistiques ?',
        a: 'Votre tableau de bord affiche : le nombre d\'apprenants invités vs connectés, la progression moyenne, la répartition par statut (non commencé, en cours, terminé) et les apprenants à risque (inactifs depuis 7 jours).',
      },
      {
        q: 'Comment fonctionne le classement formateur ?',
        a: 'Allez dans Classement. Vous y verrez le tableau détaillé de vos apprenants avec leur XP, niveau et breakdown par catégorie. Vous pouvez filtrer par centre en cochant les centres souhaités.',
      },
    ],
  },
  {
    id: 'trainer-parcours',
    icon: Route,
    title: 'Parcours',
    items: [
      {
        q: 'Puis-je créer des parcours ?',
        a: 'Non, la création de parcours et modules est réservée à l\'administrateur. Vous pouvez consulter les parcours existants et les assigner à vos apprenants.',
      },
      {
        q: 'Comment prévisualiser un module ?',
        a: 'Dans la section Parcours, cliquez sur un parcours puis sur un module pour voir son contenu tel que vos apprenants le verront.',
      },
    ],
  },
]

const adminSections = [
  {
    id: 'admin-parcours',
    icon: Route,
    title: 'Parcours et modules',
    items: [
      {
        q: 'Comment créer un parcours ?',
        a: 'Allez dans Parcours > Nouveau parcours. Donnez-lui un titre et une description. Ajoutez ensuite des modules au parcours.',
      },
      {
        q: 'Comment créer un module ?',
        a: 'Allez dans Modules > Nouveau module. Rédigez le contenu en Markdown (texte, images, vidéos). Vous pouvez insérer des images et vidéos via les boutons de la barre d\'outils. Activez le toggle "Publier" quand le module est prêt.',
      },
      {
        q: 'Qu\'est-ce que le mode brouillon ?',
        a: 'Les modules non publiés (toggle "Publier" désactivé) sont invisibles pour les apprenants. Utilisez-le pour préparer du contenu à l\'avance. Un badge orange "Brouillon" apparaît dans la liste admin.',
      },
      {
        q: 'Comment ajouter un quiz ?',
        a: 'Éditez un module, puis allez dans la section Quiz. 4 types de questions disponibles :\n- Choix unique / multiple : cochez les bonnes réponses\n- Ordonnancement : saisissez les éléments dans le bon ordre, glissez-déposez pour ajuster\n- Association : saisissez les paires gauche → droite\n\nLe quiz apparaîtra après la validation du module par l\'apprenant.',
      },
      {
        q: 'Comment intégrer des vidéos ?',
        a: 'Utilisez le bouton vidéo dans l\'éditeur. Collez un lien YouTube, Vimeo ou OneDrive/SharePoint. YouTube et Vimeo s\'affichent en iframe. SharePoint s\'affiche comme un lien cliquable (limitation SharePoint).',
      },
    ],
  },
  {
    id: 'admin-users',
    icon: Users,
    title: 'Gestion des utilisateurs',
    items: [
      {
        q: 'Comment ajouter un apprenant ?',
        a: 'Allez dans Apprenants > Ajouter. Vous pouvez chercher un utilisateur existant ou créer un nouveau compte avec un email. Assignez des parcours et des centres en même temps.',
      },
      {
        q: 'Comment ajouter un formateur ?',
        a: 'Allez dans Formateurs > Ajouter un formateur. Entrez l\'email de la personne. Elle recevra un email de bienvenue et pourra se connecter avec le rôle Formateur.',
      },
      {
        q: 'Comment gérer les accès (whitelist) ?',
        a: 'Allez dans Accès. Ajoutez des domaines autorisés (ex: @entreprise.com) pour permettre à tous les emails de ce domaine de se connecter. Ou ajoutez des emails individuels avec un rôle spécifique.',
      },
      {
        q: 'Qu\'est-ce que la réattribution ?',
        a: 'Dans la page Apprenants, cliquez sur "Réattribuer" pour changer le formateur d\'un apprenant. L\'apprenant conserve sa progression.',
      },
    ],
  },
  {
    id: 'admin-centers',
    icon: Building2,
    title: 'Centres',
    items: [
      {
        q: 'Comment créer un centre ?',
        a: 'Allez dans Centres > Ajouter. Donnez un nom, choisissez une région et optionnellement rattachez-le à une structure parente (ex: une SELAS peut contenir plusieurs centres).',
      },
      {
        q: 'Comment assigner un apprenant à un centre ?',
        a: 'Dans la page Apprenants, cliquez sur "Centre" à côté de l\'apprenant. Cochez les centres de rattachement (un apprenant peut être dans plusieurs centres).',
      },
      {
        q: 'À quoi servent les centres ?',
        a: 'Les centres organisent vos apprenants par site géographique. Le classement est filtré par centre : les apprenants ne voient que les collègues de leur(s) centre(s). Les formateurs peuvent aussi filtrer leur classement par centre.',
      },
    ],
  },
  {
    id: 'admin-superadmin',
    icon: Shield,
    title: 'Super Admin',
    items: [
      {
        q: 'Qu\'est-ce que le Super Admin ?',
        a: 'Le Super Admin est un administrateur avec des privilèges élevés. Il est le seul à pouvoir :\n- Promouvoir un utilisateur en administrateur\n- Rétrograder ou supprimer un administrateur\n- Supprimer un parcours ou un module\n\nLe badge "Super Admin" est visible dans le menu utilisateur.',
      },
      {
        q: 'Comment devenir Super Admin ?',
        a: 'Le statut Super Admin se configure directement en base de données. Il ne peut pas être attribué depuis l\'interface pour des raisons de sécurité.',
      },
      {
        q: 'Quelles actions sont réservées au Super Admin ?',
        a: 'Les actions suivantes nécessitent le Super Admin :\n- Supprimer un parcours\n- Supprimer un module\n- Promouvoir un utilisateur en Admin\n- Rétrograder un Admin\n- Supprimer un email Admin de la whitelist\n\nLes autres admins reçoivent un message "Vous n\'avez pas les droits nécessaires".',
      },
    ],
  },
  {
    id: 'admin-monitoring',
    icon: Shield,
    title: 'Suivi et exports',
    items: [
      {
        q: 'Comment exporter les données ?',
        a: 'Allez dans Apprenants et cliquez sur "Exporter CSV". Trois types d\'export disponibles :\n- Apprenants et progression\n- Détail des modules complétés\n- Résultats des quiz',
      },
      {
        q: 'Où voir l\'activité de la plateforme ?',
        a: 'Allez dans Journal. Vous y trouverez l\'historique de toutes les actions : création de parcours/modules, connexions, quiz soumis, badges obtenus, etc.',
      },
      {
        q: 'Comment voir les avis des apprenants ?',
        a: 'Allez dans Avis pour les commentaires détaillés. La note moyenne de chaque parcours est aussi visible directement sur les cards parcours (étoile + note). Les apprenants donnent leur avis à la fin de chaque parcours (1 à 5 étoiles + commentaire, nominatif ou anonyme).',
      },
      {
        q: 'Les rappels automatiques, comment ça marche ?',
        a: 'Un email de rappel est envoyé automatiquement aux apprenants inactifs depuis 3 jours (qui ont un parcours non terminé). Les apprenants peuvent désactiver ces emails dans leurs préférences.',
      },
    ],
  },
]

// ─── Composant ──────────────────────────────────────────────────────────────

export function HelpPageClient({ userRole, userName }: HelpPageClientProps) {
  const isAdmin = userRole === 'ADMIN'
  const isTrainer = userRole === 'TRAINER' || isAdmin
  const isLearner = true // tout le monde a la section apprenant

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Aide
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Bonjour {userName.split(' ')[0]}, retrouvez ici toutes les informations pour utiliser FormaCPV
        </p>
      </div>

      {/* Apprenant */}
      {isLearner && (
        <Section
          title="Guide apprenant"
          description="Suivre vos formations, passer les quiz et gagner des badges"
          icon={GraduationCap}
          sections={learnerSections}
          color="green"
        />
      )}

      {/* Formateur */}
      {isTrainer && (
        <Section
          title="Guide formateur"
          description="Gérer vos apprenants et suivre leur progression"
          icon={Users}
          sections={trainerSections}
          color="blue"
        />
      )}

      {/* Admin */}
      {isAdmin && (
        <Section
          title="Guide administrateur"
          description="Configurer la plateforme, gérer les contenus et les accès"
          icon={Shield}
          sections={adminSections}
          color="red"
        />
      )}
    </div>
  )
}

function Section({
  title,
  description,
  icon: Icon,
  sections,
  color,
}: {
  title: string
  description: string
  icon: React.ElementType
  sections: { id: string; icon: React.ElementType; title: string; items: { q: string; a: string }[] }[]
  color: 'green' | 'blue' | 'red'
}) {
  const colorMap = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${colorMap[color]}`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section) => (
          <div key={section.id}>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
              <section.icon className="h-4 w-4 text-muted-foreground" />
              {section.title}
            </h3>
            <Accordion type="multiple" className="space-y-1">
              {section.items.map((item, i) => (
                <AccordionItem key={i} value={`${section.id}-${i}`} className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm font-medium py-2.5 hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3 whitespace-pre-line">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
