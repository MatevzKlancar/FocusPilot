# FocusPilot 🎯

**FocusPilot** is an AI-powered productivity coach that helps you fight procrastination, set meaningful goals, and build sustainable habits. Turn your big ambitions into daily wins with personalized task breakdown, streak tracking, and motivational guidance.

## ✨ Features

### 🎯 **Smart Goal Management**

- AI-powered goal discovery for when you're unsure what to work on
- Automatic breakdown of big goals into manageable daily/weekly/monthly tasks
- SMART goal formulation with realistic timelines

### 📅 **Intelligent Task Scheduling**

- Daily task recommendations based on your goals
- Recurring habits and one-time milestones
- Automatic task prioritization and scheduling

### 🔥 **Streak Tracking & Motivation**

- Visual streak counter to maintain momentum
- Motivational messages and celebration of progress
- Recovery guidance when streaks are broken

### 🤖 **AI Productivity Coach**

- Personalized coaching via chat interface
- Real-time task completion feedback
- Goal adjustment recommendations based on progress

### 📊 **Progress Analytics**

- Goal completion tracking
- Habit formation insights
- Performance trends and patterns

## 🏗️ Technical Architecture

### Tech Stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Bun + Hono v4 (REST API + Server-Sent Events)
- **Database:** Supabase (PostgreSQL + RLS + Auth)
- **AI:** OpenAI GPT-4 with function calling for agent tools
- **Monorepo:** pnpm workspaces + Turborepo

### Project Structure

```
apps/
  api/                    # Bun + Hono server (REST + SSE)
  web/                    # Next.js frontend (App Router)
packages/
  db/                     # Supabase typed client + migration helpers
  types/                  # Zod schemas & shared TS types
  lib-openai/             # OpenAI agent tools and prompts
supabase/
  migrations/             # SQL migration files
  seed.sql               # Development seed data
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (latest)
- [pnpm](https://pnpm.io/) (v8+)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Node.js](https://nodejs.org/) (v18+)

### 1. Clone & Install

```bash
git clone <repository-url> focuspilot
cd focuspilot
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env.local

# Edit with your credentials
# You'll need:
# - Supabase project credentials
# - OpenAI API key
```

### 3. Database Setup

```bash
# Start Supabase locally
supabase start

# Run migrations
supabase db reset

# Generate TypeScript types
pnpm db:gen
```

### 4. Development

```bash
# Start all services
pnpm dev

# Or start individually:
pnpm dev:web    # Next.js frontend (localhost:3000)
pnpm dev:api    # Bun API server (localhost:3001)
```

## 📋 Environment Variables

### Required Variables

```bash
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=sk-your_openai_api_key

# API Configuration
API_URL=http://localhost:3001
PORT=3001

# Next.js Public Variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm dev:web          # Start Next.js frontend only
pnpm dev:api          # Start Bun API server only

# Building
pnpm build            # Build all packages and apps
pnpm lint             # Run ESLint across all packages
pnpm type-check       # Run TypeScript checks

# Testing
pnpm test             # Run all tests
bun test              # Run Bun tests (API)

# Database
pnpm db:gen           # Generate TypeScript types from Supabase schema
pnpm db:reset         # Reset database with fresh migrations
pnpm db:start         # Start Supabase locally
pnpm db:stop          # Stop Supabase
```

## 🗄️ Database Schema

### Core Tables

- **`goals`** - User goals with titles, descriptions, and target dates
- **`tasks`** - Individual tasks linked to goals with due dates and recurrence
- **`streaks`** - User streak tracking with current and best streaks

### Key Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Automatic Timestamps** - `created_at` and `updated_at` fields
- **Streak Triggers** - Automatic streak updates when tasks are completed
- **Helper Functions** - `get_today_tasks()`, `update_streak()`, etc.

## 🤖 AI Agent System

### Available Tools

- **`create_goal`** - Create new goals from user conversations
- **`create_task`** - Break goals into specific, actionable tasks
- **`complete_task`** - Mark tasks as done and update streaks
- **`get_today_tasks`** - Retrieve today's focus items for context

### Agent Personality

FocusPilot is designed to be:

- **Supportive** - Always encouraging, never judgmental
- **Action-oriented** - Focuses on next steps and practical advice
- **Motivational** - Uses positive language and celebrates progress
- **Smart** - Breaks big goals into realistic, achievable tasks

## 🔌 API Endpoints

### Authentication

All API endpoints require a valid Supabase JWT token in the Authorization header:

```
Authorization: Bearer <supabase_jwt_token>
```

### Core Endpoints

```
GET    /api/goals              # List user goals
POST   /api/goals              # Create new goal
PATCH  /api/goals/:id          # Update goal
DELETE /api/goals/:id          # Delete goal

GET    /api/tasks              # List user tasks
POST   /api/tasks              # Create new task
PATCH  /api/tasks/:id          # Update task
POST   /api/tasks/:id/complete # Mark task complete

GET    /api/streaks            # Get user streak data

POST   /api/chat               # Chat with AI agent (SSE stream)
```

## 🧪 Testing

### Backend Tests

```bash
cd apps/api
bun test
```

### Frontend Tests

```bash
cd apps/web
npm test
```

### Database Tests

Test the streak logic and SQL functions:

```bash
# In Supabase dashboard or psql
SELECT * FROM get_today_tasks('user-uuid');
```

## 🚢 Deployment

### Environment Setup

1. Create production Supabase project
2. Set up environment variables in your hosting platform
3. Configure domain and CORS settings

### Build & Deploy

```bash
# Build for production
pnpm build

# Deploy API (example with Bun)
cd apps/api
bun build src/index.ts --outdir dist --target bun

# Deploy Web (example with Vercel)
cd apps/web
npx vercel deploy
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Run the linter**: `pnpm lint`
5. **Run tests**: `pnpm test`
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript strict mode
- Use semantic commit messages
- Add tests for new features
- Update documentation for API changes
- Keep components small and focused

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for the amazing backend-as-a-service platform
- **OpenAI** for the powerful GPT models
- **Hono** for the lightning-fast web framework
- **Next.js** for the excellent React framework
- **Bun** for the fast JavaScript runtime

---

**Built with ❤️ by the FocusPilot team**

_Transform your productivity, one task at a time._ 🎯
