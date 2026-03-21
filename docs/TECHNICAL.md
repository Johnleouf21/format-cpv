# FormaCPV — Documentation technique

## Vue d'ensemble

FormaCPV est une plateforme de formation interne gamifiée, conçue pour permettre aux entreprises de former leurs collaborateurs via des parcours structurés, des quiz interactifs et un système de progression motivant.

### Chiffres clés du projet

| Métrique | Valeur |
|---|---|
| Fichiers TypeScript/TSX | 252 |
| Lignes de code | ~27 000 |
| Routes API | 58 |
| Modèles Prisma | 21 |
| Score Lighthouse Performance | 95/100 |
| Score Lighthouse Accessibilité | 90+/100 |
| Score Lighthouse Best Practices | 96/100 |

---

## Stack technique

### Frontend
| Technologie | Version | Usage |
|---|---|---|
| **Next.js** | 16.1.6 | Framework React full-stack (App Router) |
| **React** | 19.2.4 | Bibliothèque UI |
| **TypeScript** | 5.x | Typage statique |
| **Tailwind CSS** | 4.x | Styles utilitaires |
| **Radix UI** | Via shadcn/ui | Composants accessibles (Dialog, Select, Checkbox, etc.) |
| **Lucide React** | 0.575 | Icônes |
| **React Markdown** | 10.x | Rendu du contenu Markdown des modules |
| **React PDF** | 4.x | Génération des certificats PDF |

### Backend
| Technologie | Version | Usage |
|---|---|---|
| **Next.js API Routes** | 16.x | Endpoints REST |
| **Prisma ORM** | 7.x | Accès base de données, migrations |
| **PostgreSQL** | 16 | Base de données relationnelle |
| **NextAuth.js** | 5.0 beta | Authentification (magic link) |
| **Resend** | 6.x | Envoi d'emails transactionnels |
| **Zod** | 4.x | Validation des données entrantes |

### Infrastructure
| Service | Usage |
|---|---|
| **Vercel** | Hébergement, déploiement, cron jobs |
| **Neon** | Base de données PostgreSQL managée (production) |
| **Docker** | Base de données locale (développement) |
| **Resend** | Service d'envoi d'emails |

---

## Architecture

### Structure du projet

```
forma-cpv/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Pages publiques (login, invite)
│   ├── (dashboard)/              # Pages authentifiées
│   │   ├── admin/                # Espace administrateur
│   │   ├── trainer/              # Espace formateur
│   │   ├── learner/              # Espace apprenant
│   │   ├── profile/              # Profil utilisateur
│   │   └── help/                 # Page d'aide
│   └── api/                      # 58 routes API REST
│       ├── admin/                # CRUD admin (modules, parcours, centres, etc.)
│       ├── auth/                 # Authentification magic link
│       ├── cron/                 # Tâches planifiées (rappels email)
│       ├── learner/              # XP, leaderboard
│       ├── notifications/        # Notifications in-app
│       ├── progress/             # Complétion des modules
│       ├── quiz/                 # Soumission de quiz
│       └── ...
├── components/
│   ├── admin/                    # Composants admin
│   ├── learner/                  # Composants apprenant
│   ├── shared/                   # Composants partagés
│   │   ├── chatbot/              # Sous-composants chatbot
│   │   └── ...
│   ├── trainer/                  # Composants formateur
│   ├── profile/                  # Composants profil
│   └── ui/                       # Composants UI (shadcn)
├── lib/
│   ├── auth/                     # Configuration auth + helper requireAuth
│   ├── chatbot/                  # Base de connaissances + moteur de recherche
│   ├── errors/                   # Gestion centralisée des erreurs API
│   ├── services/                 # Logique métier
│   │   ├── admin/                # Services admin (modules, parcours, learners)
│   │   ├── activity-log.service  # Journal d'activité
│   │   ├── badge.service         # Attribution des badges
│   │   ├── email.service         # Envoi d'emails centralisé
│   │   ├── notification.service  # Notifications in-app
│   │   ├── xp.service            # Calcul XP et niveaux
│   │   └── ...
│   ├── utils/                    # Utilitaires (rate limit, progression, média)
│   └── validations/              # Schémas Zod de validation
├── prisma/
│   └── schema.prisma             # Schéma de base de données (21 modèles)
└── vercel.json                   # Configuration cron Vercel
```

### Modèle de données (21 tables)

```
User ──────────┬──> UserParcours ──> Parcours ──> Module ──> Quiz ──> Question ──> Answer
               ├──> UserCenter ──> Center (hiérarchie parent/enfant)
               ├──> Progress ──> QuizResult
               ├──> EarnedBadge
               ├──> Notification
               ├──> Feedback
               ├──> ActivityLog
               └──> NotificationPreference

AllowedEmail / AllowedDomain (whitelist)
PendingLogin (auth magic link)
Invitation (tokens d'invitation)
VerificationToken (NextAuth)
```

---

## Fonctionnalités détaillées

### 1. Authentification & sécurité

- **Magic link** : connexion sans mot de passe via email (NextAuth.js Credentials provider)
- **Cross-device** : le lien fonctionne depuis n'importe quel appareil, polling automatique côté navigateur d'origine
- **Auto-login** : si le lien est ouvert dans le même navigateur, redirection automatique
- **Whitelist** : contrôle d'accès par domaine (@entreprise.com) ou email individuel
- **RBAC** : 3 rôles (ADMIN, TRAINER, LEARNER) avec helper `requireAuth()` sur les 58 routes
- **Rate limiting** : protection des endpoints auth (in-memory, configurable)
- **CSP** : Content Security Policy renforcée (unsafe-eval supprimé en production)
- **Headers** : HSTS, Permissions-Policy, X-Frame-Options, X-Content-Type-Options
- **Logs réduits** : pas de stack trace en production

### 2. Gestion des contenus

- **Parcours** : groupes de modules ordonnés avec description
- **Modules** : contenu Markdown avec support images, vidéos (YouTube, Vimeo, SharePoint), liens
- **Mode brouillon** : modules non publiés invisibles pour les apprenants
- **Temps minimum** : durée obligatoire configurable par module (avec tolérance 10%)
- **Quiz** : 4 types de questions
  - Choix unique
  - Choix multiple
  - Ordonnancement (remettre dans le bon ordre)
  - Association (relier des paires)

### 3. Gamification

- **Points XP** : 10 XP/module, 20 XP/quiz réussi, 30 XP/quiz parfait, 15 XP/badge, 50 XP/parcours
- **Niveaux** : progression par paliers croissants
- **10 badges** : Premier module, Studieux (5), Expert (10), Challenger (1er quiz), As du quiz (80%+), Perfectionniste (100%), Diplômé, Champion, Persévérant (5 quiz), Polyvalent (3+ parcours)
- **Leaderboard** : classement filtré par centre, XP et niveaux
- **Certificats** : PDF généré à la complétion d'un parcours

### 4. Centres et hiérarchie

- **Structure parent/enfant** : GIE > SELAS > Centres
- **Multi-rattachement** : un apprenant peut appartenir à plusieurs centres (table UserCenter)
- **Régions** : sélection parmi les 18 régions françaises
- **Leaderboard par centre** : les apprenants ne voient que leurs collègues du même centre

### 5. Notifications & communication

- **Notifications in-app** : cloche avec compteur, polling 30s, popover
- **Emails transactionnels** : bienvenue, invitation, assignation, rappel, mise à jour contenu
- **Rappels automatiques** : cron Vercel quotidien, relance après 3 jours d'inactivité
- **Chatbot** : assistant intégré avec base de connaissances, feedback thumbs up/down, draggable
- **Contact** : formulaire dans le profil pour contacter formateur/admin par email

### 6. Administration

- **Dashboard** : statistiques globales
- **Journal d'activité** : 21 types d'événements tracés (CRUD, connexions, quiz, badges, etc.)
- **Export CSV** : 3 types (apprenants, modules complétés, résultats quiz) avec BOM UTF-8
- **Filtrage** : par formateur, parcours, statut, centre
- **Whitelist** : gestion des domaines et emails autorisés avec barre de recherche
- **Avis** : collecte d'avis fin de parcours (1-5 étoiles, nominatif ou anonyme)

### 7. Espace formateur

- **Mes apprenants** : liste, progression, détail avec correction quiz
- **Restriction** : ne peut ajouter que des utilisateurs existants (pas de création)
- **Protection** : ne peut pas s'assigner un apprenant déjà attribué à un autre formateur
- **Leaderboard** : vue détaillée avec breakdown XP, filtre multi-centres
- **Statistiques** : taux de connexion, progression moyenne, apprenants à risque

### 8. Accessibilité & UX

- **Score Lighthouse** : 90+ en accessibilité
- **ARIA** : labels sur tous les boutons icon-only, progressbars nommées
- **Contrastes** : conformité WCAG AA
- **Responsive** : design mobile-first avec navigation adaptée
- **Onboarding** : tour guidé en 8 étapes au premier login
- **Thème** : clair/sombre
- **Layout** : sidebar (défaut) ou header, au choix de l'utilisateur
- **Page d'aide** : guide intégré adapté au rôle

---

## Patterns et conventions

### Helper d'authentification

```typescript
// Avant (4 lignes par route)
const session = await auth()
if (!session?.user?.id) throw new ApiError(401, ...)
if (session.user.role !== 'ADMIN') throw new ApiError(403, ...)

// Après (1 ligne)
const session = await requireAuth('ADMIN')
const session = await requireAuth('ADMIN', 'TRAINER')
const session = await requireAuth() // juste authentifié
```

### Service email centralisé

```typescript
// Helper unique pour tous les envois
async function sendEmail(config: { to, subject, html, text, replyTo? }): Promise<EmailResult>

// Utilisé par toutes les fonctions d'envoi
export async function sendWelcomeEmail(params) {
  const { html, text } = welcomeTemplate(...)
  return sendEmail({ to, subject, html, text })
}
```

### Calcul XP batch

```typescript
// Évite le N+1 : 5 requêtes pour N utilisateurs au lieu de N*4
const xpMap = await getBulkUserXP(userIds)
```

### Journal d'activité non-bloquant

```typescript
// Fire-and-forget, ne bloque pas la réponse API
logActivity({ action: 'MODULE_COMPLETED', userId, targetId, targetType: 'module' })
```

---

## Déploiement

### Prérequis

- Node.js 20+
- PostgreSQL 16 (Docker pour le dev, Neon pour la prod)
- Compte Resend (emails)
- Compte Vercel (hébergement)

### Variables d'environnement

```env
DATABASE_URL=               # URL PostgreSQL
NEXTAUTH_URL=               # URL du site
NEXTAUTH_SECRET=            # Secret JWT
RESEND_API_KEY=             # Clé API Resend
EMAIL_FROM=                 # Email expéditeur
CRON_SECRET=                # Secret pour le cron de rappels
```

### Commandes

```bash
# Développement
npm run db                  # Démarrer PostgreSQL via Docker
npx prisma db push          # Synchroniser le schéma
npm run dev                 # Lancer le serveur de développement

# Production
npx prisma generate         # Générer le client Prisma
npm run build               # Build Next.js
npm start                   # Démarrer en production

# Base de données
npm run db:studio           # Interface visuelle Prisma Studio
npm run db:reset            # Reset complet (dev uniquement)
```

### Déploiement Vercel

1. Push sur `main` → déploiement automatique
2. Variables d'environnement configurées dans Vercel Dashboard
3. `prisma generate` exécuté automatiquement via `postinstall`
4. Cron job `/api/cron/reminders` configuré dans `vercel.json` (quotidien à 9h UTC)

---

## Sécurité

### Mesures implémentées

| Mesure | Détail |
|---|---|
| Authentification | Magic link, pas de mot de passe stocké |
| Autorisation | RBAC avec `requireAuth()` sur 58 routes |
| Rate limiting | 5 req/min login, 60/min polling, 10/min invitations |
| CSP | Script-src sans unsafe-eval en prod |
| HSTS | max-age 1 an en production |
| Permissions-Policy | camera, microphone, geolocation bloqués |
| Validation | Zod sur toutes les entrées API |
| SQL Injection | Impossible (Prisma ORM, pas de raw SQL) |
| XSS | CSP + React auto-escape + rehype-raw contrôlé |
| Session | Cookie HTTPOnly, SameSite Lax, Secure en prod, 8h max |
| Formateur | Ne peut pas créer de comptes ni voler d'apprenants |
| Token invitation | Format UUID validé avant requête DB |
| Logs | Stack traces supprimées en production |

### Points à surveiller

- `unsafe-inline` dans script-src (nécessaire pour Next.js/Tailwind)
- Session de 8h (pourrait être réduite selon le contexte)
- Rate limiting in-memory (perdu au redémarrage, suffisant pour le scale actuel)

---

## Performance

### Optimisations

- **Batch XP** : `getBulkUserXP()` — 5 requêtes groupées au lieu de N×4 requêtes individuelles
- **Skeleton loading** : réservation d'espace pendant le chargement (CLS = 0)
- **useMemo** : prévention des re-renders sur les composants lourds (iframe vidéo)
- **Modules publiés** : filtrage côté serveur, pas de transfert de données inutiles
- **Notifications** : polling 30s (pas de WebSocket, suffisant pour le use case)
- **Emails** : envoi non-bloquant avec pauses entre les emails (rate limit Resend)

### Scores Lighthouse (page /learner)

| Métrique | Score |
|---|---|
| Performance | 95 |
| Accessibilité | 90+ |
| Best Practices | 96 |
| FCP | 0.7s |
| LCP | 0.7s |
| CLS | 0 |

---

## Évolutions possibles

- **WebSocket** : remplacer le polling des notifications par du temps réel
- **SCORM/xAPI** : compatibilité avec les standards LMS
- **SSO** : intégration Azure AD (champ `azureAdId` déjà prévu dans le schema)
- **Mobile** : application native React Native / Flutter
- **Analytics** : tableaux de bord avancés avec graphiques temporels
- **Multi-tenant** : isolation par entreprise pour un déploiement SaaS
