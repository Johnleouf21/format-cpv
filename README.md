# FormaCPV

[![CI](https://github.com/Johnleouf21/forma-cpv/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/forma-cpv/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Private-red)]()

Plateforme de formation interne gamifiée — parcours structurés, quiz interactifs, système XP et suivi de progression.

## Stack

| Frontend | Backend | Infrastructure |
|---|---|---|
| Next.js 16 (App Router) | Next.js API Routes | Vercel |
| React 19 + TypeScript | Prisma ORM 7 | Neon (PostgreSQL) |
| Tailwind CSS 4 | NextAuth.js 5 | Resend (emails) |
| Radix UI / shadcn | Zod (validation) | GitHub Actions (CI/CD) |
| @dnd-kit (drag & drop) | | Husky + Commitlint |

## Fonctionnalités

- **Parcours & Modules** — contenu Markdown, vidéos, mode brouillon/publié
- **Quiz enrichis** — choix unique/multiple, ordonnancement (drag & drop), association
- **Gamification** — XP, niveaux, 10 badges, leaderboard par centre
- **Centres hiérarchiques** — GIE > SELAS > centres, multi-rattachement
- **3 rôles** — Admin, Formateur, Apprenant avec RBAC sur 58 routes API
- **Notifications** — in-app (cloche + centre), emails transactionnels, rappels automatiques
- **Sécurité** — magic link auth, rate limiting, CSP, HSTS
- **Accessibilité** — Lighthouse 90+, ARIA, contrastes WCAG AA
- **Documentation** — aide intégrée par rôle, chatbot, doc technique dans l'app

## Démarrage rapide

```bash
# Prérequis : Node.js 20+, pnpm, Docker

# 1. Cloner et installer
git clone <repo-url>
cd forma-cpv
pnpm install

# 2. Base de données locale
pnpm db
npx prisma db push

# 3. Configurer les variables d'environnement
cp .env.example .env
# Remplir DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 4. Lancer
pnpm dev
```

## Scripts

| Commande | Description |
|---|---|
| `pnpm dev` | Serveur de développement |
| `pnpm build` | Build de production |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm test` | Tests unitaires (Vitest) |
| `pnpm db` | Démarrer PostgreSQL (Docker) |
| `pnpm db:studio` | Interface Prisma Studio |

## Convention de commits

Les commits suivent la [convention conventionnelle](https://www.conventionalcommits.org/) :

```
feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation
refactor: refactoring
perf: performance
chore: maintenance
```

## Branches

| Branche | Usage |
|---|---|
| `main` | Production (déploiement automatique Vercel) |
| `dev` | Développement (preview Vercel) |
| `feature/*` | Nouvelles fonctionnalités → PR vers dev |
| `fix/*` | Corrections → PR vers dev |

## Documentation

La documentation technique complète est accessible dans l'application : **Admin > Documentation**.
