# Agent Dashboard — Design Spec

**Date:** 2026-04-26  
**Projet:** Outfit Now — Dashboard de pilotage des agents IA  
**Statut:** Approuvé

---

## Vue d'ensemble

Dashboard web Next.js intégré au monorepo Outfit Now (`apps/dashboard`) pour piloter une hiérarchie d'agents IA et humains. Objectif : briefer les agents, suivre l'avancement des tâches, valider les outputs — le tout depuis un hub centralisé avec vue kanban.

---

## Hiérarchie des agents

```
Manager Agent (automatisé — Claude API)
├── Senior Designer Agent (mix)
│   ├── UI/UX Designer (humain ou Claude)
│   └── Brand Designer (humain ou Claude)
├── Senior Influencer/Ambassador Agent (mix)
│   ├── Content Creator (humain ou Claude)
│   └── Community Manager (humain ou Claude)
├── Senior Juridique Agent (mix)
│   ├── Contract Specialist (humain ou Claude)
│   ├── Compliance Officer (humain ou Claude)
│   ├── IP Specialist (humain ou Claude)
│   └── RGPD/Data Protection (humain ou Claude)
└── Senior Directeur Financier Agent (mix)
    ├── Budget Analyst (humain ou Claude)
    ├── Financial Reporting (humain ou Claude)
    ├── Cash Flow (humain ou Claude)
    └── Investment Analyst (humain ou Claude)
```

Chaque agent a un type : `claude` (automatisé via API Anthropic) ou `human` (collaborateur représenté dans l'interface).

---

## Stack technique

| Couche      | Choix                                                    |
| ----------- | -------------------------------------------------------- |
| Framework   | Next.js 14 (App Router)                                  |
| Emplacement | `apps/dashboard/` dans le monorepo Outfit Now            |
| Auth        | JWT partagé avec `apps/api`                              |
| UI          | Tailwind CSS + design tokens de `packages/design-tokens` |
| Police      | Inter                                                    |
| Thème       | Dark mode, accent violet/gold                            |
| API Claude  | `claude-sonnet-4-6` via SDK Anthropic                    |
| Temps réel  | WebSocket (depuis `apps/api`)                            |

---

## Architecture

```
apps/dashboard/
├── app/
│   ├── page.tsx                  → Hub principal (overview + métriques)
│   ├── agents/[id]/page.tsx      → Page dédiée par agent
│   └── board/page.tsx            → Kanban partagé
├── components/
│   ├── AgentTree/                → Sidebar hiérarchie (Manager → Seniors → Sub-agents)
│   ├── AgentCard/                → Card statut + actions rapides
│   ├── KanbanBoard/              → Board tâches inter-agents avec drag & drop
│   ├── BriefPanel/               → Panneau pour envoyer un brief à un agent
│   └── OutputFeed/               → Fil des livrables (texte, image, URL)
└── lib/
    ├── agents/                   → Logique Claude API (agents automatisés)
    └── api/                      → Appels vers l'API Fastify existante
```

---

## Pages

### Hub (`/`)

- **Sidebar gauche** : arbre des 7 agents avec indicateur de statut (actif / en attente / bloqué)
- **Zone centrale** : métriques globales — tâches en cours, livrables en attente de validation, agents actifs
- **Feed droite** : derniers outputs des agents (posts, designs, rapports) avec bouton Valider/Rejeter

### Kanban (`/board`)

- Colonnes : `Backlog → En cours → En review → Validé`
- Chaque carte = une tâche assignée à un agent (couleur distinctive par agent)
- Drag & drop pour changer de colonne
- Clic sur carte → détail de la tâche + output associé

### Page Agent (`/agents/[id]`)

- Profil : nom, rôle, type (Claude API ou humain), statut
- Panneau Brief : zone de texte pour envoyer des instructions
- Historique des tâches et outputs de cet agent
- Liste des sous-agents (si agent Senior)

---

## Modèle de données

Nouvelles tables Prisma dans `apps/api/prisma/schema.prisma` :

```prisma
model Agent {
  id        String   @id @default(cuid())
  name      String
  role      String
  type      AgentType  // CLAUDE | HUMAN
  parentId  String?
  parent    Agent?   @relation("AgentHierarchy", fields: [parentId], references: [id])
  children  Agent[]  @relation("AgentHierarchy")
  status    AgentStatus @default(IDLE)
  tasks     Task[]
  briefs    Brief[]
  outputs   Output[]
  createdAt DateTime @default(now())
}

model Task {
  id              String     @id @default(cuid())
  title           String
  description     String?
  status          TaskStatus @default(BACKLOG)
  assignedAgentId String
  agent           Agent      @relation(fields: [assignedAgentId], references: [id])
  output          Output?
  dueDate         DateTime?
  createdAt       DateTime   @default(now())
}

model Output {
  id        String     @id @default(cuid())
  taskId    String     @unique
  task      Task       @relation(fields: [taskId], references: [id])
  agentId   String
  agent     Agent      @relation(fields: [agentId], references: [id])
  content   String
  type      OutputType // TEXT | IMAGE | URL
  validated Boolean    @default(false)
  createdAt DateTime   @default(now())
}

model Brief {
  id      String   @id @default(cuid())
  agentId String
  agent   Agent    @relation(fields: [agentId], references: [id])
  content String
  sentAt  DateTime @default(now())
  sentBy  String   // userId
}

enum AgentType   { CLAUDE HUMAN }
enum AgentStatus { IDLE ACTIVE BLOCKED }
enum TaskStatus  { BACKLOG IN_PROGRESS IN_REVIEW DONE }
enum OutputType  { TEXT IMAGE URL }
```

---

## Intégration Claude API

- Les agents de type `CLAUDE` utilisent `claude-sonnet-4-6` avec tool use
- Le Manager Agent peut créer des sous-tâches et les déléguer via tool use
- Les outputs générés sont sauvegardés en DB et affichés dans le dashboard
- Prompt caching activé pour les briefs récurrents (réduction de coût)

---

## Intégration API Fastify

Nouveaux endpoints dans `apps/api/src/routes/agents/` :

```
GET    /agents                    → liste tous les agents
GET    /agents/:id                → détail d'un agent
POST   /agents/:id/brief          → envoyer un brief
GET    /tasks                     → liste des tâches (filtres : agentId, status)
PATCH  /tasks/:id/status          → changer le statut d'une tâche
POST   /outputs/:id/validate      → valider un output
WS     /ws                        → mises à jour temps réel des statuts
```

---

## Seed initial

Script `apps/api/prisma/seeds/agents.ts` crée :

- 1 Manager Agent (type CLAUDE)
- 4 Seniors (Designer = HUMAN, Influencer = CLAUDE, Juridique = HUMAN, CFO = HUMAN)
- 12 Sub-agents (2 pour Designer, 2 pour Influencer, 4 pour Juridique, 4 pour CFO — types mixtes)

---

## Gestion des erreurs

- Agents Claude : retry automatique (3 tentatives) sur timeout API, statut `BLOCKED` affiché dans le dashboard si persistant
- WebSocket : reconnexion automatique côté client (backoff exponentiel)
- Outputs : validation obligatoire avant passage en `DONE` dans le kanban

---

## Ce qui est hors scope (v1)

- Application mobile Outfit Now (existante — non modifiée)
- Notifications push / email
- Historique de versioning des briefs
- Multi-tenant (un seul workspace pour l'instant)
