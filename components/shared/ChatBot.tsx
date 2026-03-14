'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { MessageCircle, X, Send, Bot, User, ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react'

// ─── Knowledge base ─────────────────────────────────────────────────────────

interface QA {
  keywords: string[]
  question: string
  answer: string // supports simple markdown: **bold**, [link](url), \n for line breaks, - for lists
  category: string
  roles?: string[] // if set, only show for these roles
}

const KNOWLEDGE_BASE: QA[] = [
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

// ─── Categories for suggestions ─────────────────────────────────────────────

interface CategorySuggestions {
  label: string
  questions: string[]
}

function getCategorySuggestions(role: string): CategorySuggestions[] {
  const categories: Record<string, string[]> = {}

  for (const qa of KNOWLEDGE_BASE) {
    if (qa.roles && !qa.roles.includes(role)) continue
    if (!categories[qa.category]) categories[qa.category] = []
    categories[qa.category].push(qa.question)
  }

  return Object.entries(categories).map(([label, questions]) => ({ label, questions }))
}

function getTopSuggestions(role: string): string[] {
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

// ─── Fuzzy matching ─────────────────────────────────────────────────────────

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['']/g, ' ')
}

/** Levenshtein distance for fuzzy matching */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

/** Check if query word fuzzy-matches a keyword */
function fuzzyMatch(queryWord: string, keyword: string): boolean {
  // Exact substring
  if (keyword.includes(queryWord) || queryWord.includes(keyword)) return true

  // For short words, require exact or substring match
  if (queryWord.length <= 3) return false

  // Levenshtein: allow 1 error per 4 chars
  const maxDist = Math.floor(queryWord.length / 4) + 1
  const dist = levenshtein(queryWord, keyword)
  return dist <= maxDist
}

interface ScoredMatch {
  qa: QA
  score: number
}

function findMatches(query: string, role: string): ScoredMatch[] {
  const q = normalize(query)
  const queryWords = q.split(/\s+/).filter((w) => w.length >= 2)

  const scored: ScoredMatch[] = []

  for (const qa of KNOWLEDGE_BASE) {
    if (qa.roles && !qa.roles.includes(role)) continue

    // Exact question match
    if (normalize(qa.question) === q) {
      scored.push({ qa, score: 1000 })
      continue
    }

    let score = 0

    // Keyword matching (exact + fuzzy)
    for (const keyword of qa.keywords) {
      const nk = normalize(keyword)
      // Check if any query word matches this keyword
      for (const qw of queryWords) {
        if (nk.includes(qw) || qw.includes(nk)) {
          score += nk.length * 2 // exact match bonus
        } else if (fuzzyMatch(qw, nk)) {
          score += nk.length // fuzzy match
        }
      }
      // Also check full query contains keyword
      if (q.includes(nk)) {
        score += nk.length * 2
      }
    }

    // Question similarity bonus
    const questionWords = normalize(qa.question).split(/\s+/)
    for (const qw of queryWords) {
      if (questionWords.some((w) => w.includes(qw) || qw.includes(w))) {
        score += 2
      }
    }

    if (score > 0) {
      scored.push({ qa, score })
    }
  }

  return scored.sort((a, b) => b.score - a.score)
}

function findAnswer(query: string, role: string): { best: QA | null; similar: QA[] } {
  const matches = findMatches(query, role)

  if (matches.length === 0) return { best: null, similar: [] }

  const best = matches[0].score >= 4 ? matches[0].qa : null
  const similar = best
    ? matches.slice(1, 4).map((m) => m.qa)
    : matches.slice(0, 3).map((m) => m.qa)

  return { best, similar }
}

// ─── Simple markdown renderer ───────────────────────────────────────────────

function renderMarkdown(text: string, onNavigate?: (href: string) => void): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-0.5 my-1">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  function renderInline(str: string): React.ReactNode {
    const parts: React.ReactNode[] = []
    const regex = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index))
      }
      if (match[1]) {
        parts.push(<strong key={match.index} className="font-semibold">{match[1]}</strong>)
      } else if (match[2] && match[3]) {
        const href = match[3]
        const isInternal = href.startsWith('/')
        if (isInternal && onNavigate) {
          parts.push(
            <button
              key={match.index}
              onClick={() => onNavigate(href)}
              className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
            >
              {match[2]}
            </button>
          )
        } else {
          parts.push(
            <a key={match.index} href={href} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">
              {match[2]}
            </a>
          )
        }
      }
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex))
    }
    return parts.length === 1 ? parts[0] : <>{parts}</>
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2))
    } else {
      flushList()
      if (trimmed === '') {
        // Skip empty lines but add spacing via margins
      } else {
        elements.push(<p key={key++} className="my-1">{renderInline(trimmed)}</p>)
      }
    }
  }
  flushList()

  return elements
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  type: 'bot' | 'user'
  text: string
  richText?: React.ReactNode[]
  suggestions?: string[]
  categorySuggestions?: CategorySuggestions[]
  showCategories?: boolean
  feedbackGiven?: 'up' | 'down'
}

interface ChatBotProps {
  userName: string
  currentSpace: 'admin' | 'trainer' | 'learner'
}

const spaceToRole: Record<string, string> = {
  admin: 'ADMIN',
  trainer: 'TRAINER',
  learner: 'LEARNER',
}

const roleLabels: Record<string, string> = {
  ADMIN: 'administrateur',
  TRAINER: 'formateur',
  LEARNER: 'apprenant',
}

const STORAGE_KEY_PREFIX = 'formacpv-chatbot-'

export function ChatBot({ userName, currentSpace }: ChatBotProps) {
  const userRole = spaceToRole[currentSpace] || 'LEARNER'
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const handleNavigate = useCallback((href: string) => {
    router.push(href)
    setIsOpen(false)
  }, [router])

  const topSuggestions = useMemo(() => getTopSuggestions(userRole), [userRole])
  const allCategories = useMemo(() => getCategorySuggestions(userRole), [userRole])

  // Load messages from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${currentSpace}`)
      if (stored) {
        const parsed: ChatMessage[] = JSON.parse(stored)
        // Re-render markdown for bot messages
        const restored = parsed.map((msg) => ({
          ...msg,
          richText: msg.type === 'bot' ? renderMarkdown(msg.text, handleNavigate) : undefined,
          suggestions: msg.suggestions || undefined,
          categorySuggestions: msg.categorySuggestions || undefined,
        }))
        setMessages(restored)
      }
    } catch {
      // ignore parse errors
    }
  }, [])

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Save without richText (not serializable)
        const toStore = messages.map(({ richText, ...rest }) => rest)
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${currentSpace}`, JSON.stringify(toStore))
      } catch {
        // ignore
      }
    }
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Animate open
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setShowPanel(true))
      })
    } else {
      setShowPanel(false)
    }
  }, [isOpen])

  // Init welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const firstName = userName?.split(' ')[0] || ''
      setMessages([{
        id: '0',
        type: 'bot',
        text: `Bonjour${firstName ? ` ${firstName}` : ''} ! 👋 Je suis l'assistant FormaCPV. Comment puis-je vous aider en tant qu'${roleLabels[userRole] || 'utilisateur'} ?`,
        richText: renderMarkdown(`Bonjour${firstName ? ` **${firstName}**` : ''} ! 👋 Je suis l'assistant FormaCPV.\n\nComment puis-je vous aider en tant qu'**${roleLabels[userRole] || 'utilisateur'}** ?`, handleNavigate),
        suggestions: topSuggestions,
        showCategories: true,
        categorySuggestions: allCategories,
      }])
    }
  }, [isOpen, messages.length, userName, userRole, topSuggestions, allCategories])

  const addBotMessage = useCallback((text: string, options?: {
    suggestions?: string[]
    categorySuggestions?: CategorySuggestions[]
    showCategories?: boolean
  }) => {
    setIsTyping(true)
    const delay = Math.min(300 + text.length * 3, 1200)
    setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        text,
        richText: renderMarkdown(text, handleNavigate),
        suggestions: options?.suggestions,
        categorySuggestions: options?.categorySuggestions,
        showCategories: options?.showCategories,
      }])
    }, delay)
  }, [])

  function handleQuestion(question: string) {
    setExpandedCategory(null)

    // Add user message
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      text: question,
    }])

    const { best, similar } = findAnswer(question, userRole)

    if (best) {
      const followUp = topSuggestions
        .filter((s) => s !== question && s !== best.question)
        .slice(0, 2)
      followUp.push("J'ai un autre problème")

      addBotMessage(best.answer, { suggestions: followUp })
    } else if (similar.length > 0) {
      // "Did you mean?" suggestions
      const didYouMean = similar.map((qa) => qa.question)
      addBotMessage(
        "Je n'ai pas trouvé de réponse exacte, mais voici des questions similaires :",
        { suggestions: didYouMean },
      )
    } else {
      addBotMessage(
        "Je n'ai pas trouvé de réponse à votre question. Essayez de **reformuler** ou consultez les thèmes ci-dessous.",
        {
          suggestions: topSuggestions.slice(0, 3),
          categorySuggestions: allCategories,
          showCategories: true,
        },
      )
    }
  }

  function handleFeedback(messageId: string, feedback: 'up' | 'down') {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, feedbackGiven: feedback } : msg
      )
    )
  }

  function handleClearHistory() {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${currentSpace}`)
    setMessages([])
    setExpandedCategory(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isTyping) return
    handleQuestion(input.trim())
    setInput('')
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-200 hover:scale-105 active:scale-95 group"
          aria-label="Ouvrir l'assistant"
        >
          <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 items-center justify-center text-[9px] font-bold text-white">?</span>
          </span>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
            showPanel
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
          }`}
          style={{ height: '520px', maxHeight: 'calc(100vh - 6rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Assistant FormaCPV</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <p className="text-[11px] text-blue-100">En ligne</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 1 && (
                <button
                  onClick={handleClearHistory}
                  className="rounded-full px-2 py-1 text-[11px] hover:bg-white/20 transition-colors"
                  title="Effacer l'historique"
                >
                  Effacer
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                {msg.type === 'bot' ? (
                  <div className="flex gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="space-y-2 max-w-[85%]">
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm leading-relaxed">
                        {msg.richText || msg.text}
                      </div>

                      {/* Feedback buttons */}
                      {msg.id !== '0' && (
                        <div className="flex items-center gap-1 ml-1">
                          {msg.feedbackGiven ? (
                            <span className="text-[11px] text-muted-foreground">
                              {msg.feedbackGiven === 'up' ? 'Merci pour le retour !' : 'Merci, on va améliorer.'}
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleFeedback(msg.id, 'up')}
                                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-green-600"
                                title="Utile"
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, 'down')}
                                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-red-500"
                                title="Pas utile"
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Quick suggestions */}
                      {msg.suggestions && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => !isTyping && handleQuestion(s)}
                              disabled={isTyping}
                              className="text-xs px-2.5 py-1.5 rounded-full border bg-background hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors text-left disabled:opacity-50"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Category suggestions */}
                      {msg.showCategories && msg.categorySuggestions && (
                        <div className="space-y-1 mt-2">
                          <p className="text-[11px] text-muted-foreground font-medium ml-1">Parcourir par thème :</p>
                          {msg.categorySuggestions.map((cat) => (
                            <div key={cat.label} className="border rounded-lg overflow-hidden">
                              <button
                                onClick={() => setExpandedCategory(expandedCategory === cat.label ? null : cat.label)}
                                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                              >
                                {cat.label}
                                <ChevronDown className={`h-3 w-3 transition-transform ${expandedCategory === cat.label ? 'rotate-180' : ''}`} />
                              </button>
                              {expandedCategory === cat.label && (
                                <div className="px-2 pb-2 space-y-1">
                                  {cat.questions.map((q) => (
                                    <button
                                      key={q}
                                      onClick={() => !isTyping && handleQuestion(q)}
                                      disabled={isTyping}
                                      className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-blue-50 hover:text-blue-700 transition-colors disabled:opacity-50"
                                    >
                                      {q}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="flex gap-2 max-w-[85%]">
                      <div className="rounded-2xl rounded-tr-sm bg-blue-600 text-white px-3 py-2 text-sm">
                        {msg.text}
                      </div>
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2 animate-in fade-in duration-150">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 mt-0.5">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t shrink-0 bg-background">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 text-sm rounded-full"
              disabled={isTyping}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full h-9 w-9 shrink-0 bg-blue-600 hover:bg-blue-700"
              disabled={!input.trim() || isTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
