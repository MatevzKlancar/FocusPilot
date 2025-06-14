# FocusPilot 🎯

**FocusPilot** is an AI-powered productivity coach that helps you turn ambitious goals into daily victories. Whether you're learning a new skill, building a business, getting fit, or developing better habits, FocusPilot provides personalized task breakdown, streak tracking, and motivational coaching to keep you on track.

## ✨ What FocusPilot Does

### 🧠 **Intelligent Goal Breakdown**

Tell FocusPilot what you want to achieve, and it automatically creates a structured plan with:

- **Daily tasks** that build momentum through consistency
- **Weekly reviews** to track progress and adjust course
- **Milestone achievements** to mark significant progress
- **Time-based scheduling** based on your available commitment (15 minutes to 8 hours daily)

### 📅 **Smart Task Management**

- **Today's Focus**: See exactly what you need to work on today
- **Recurring Tasks**: Daily and weekly habits that compound over time
- **Progress Tracking**: Visual indicators of completion and momentum
- **Flexible Scheduling**: Tasks adapt to your lifestyle and availability

### 🔥 **Streak & Momentum Building**

- **Streak Tracking**: Visual counters that motivate consistency
- **Daily Check-ins**: Mark tasks complete and build momentum
- **Progress Analytics**: See your growth over time
- **Motivational Coaching**: AI encouragement tailored to your progress

### 🤖 **AI Productivity Coach**

- **Personalized Guidance**: Coaching style adapts to your goal type
- **Task Optimization**: AI suggests the most effective daily actions
- **Accountability**: Gentle but firm reminders to stay on track
- **Context-Aware**: Remembers your history and adjusts recommendations

## 🎯 Supported Goal Types

FocusPilot provides specialized task breakdown strategies for different types of goals:

### **Personal Development**

- **Skill Learning**: Practice sessions, assessments, milestone projects
- **Creative Projects**: Daily creation time, project planning, deliverables
- **Fitness Goals**: Progressive training, baseline tracking, assessments
- **Habit Building**: Environment setup, consistency tracking, habit strength checks
- **Career Development**: Daily skill building, networking, portfolio projects
- **Personal Growth**: Self-reflection, behavior change, mindset work

### **Business & Entrepreneurship**

- **MVP Launch**: Daily development, customer validation, shipping deadlines
- **Customer Acquisition**: Outreach activities, conversion optimization, metrics
- **Revenue Generation**: Sales activities, pricing optimization, financial tracking
- **Product Validation**: User research, analytics setup, market feedback

Each goal type gets a customized breakdown that eliminates guesswork and keeps you focused on what matters most.

## 🏗️ Technical Architecture

### Modern Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Bun + Hono v4 (REST API + Server-Sent Events)
- **Database**: Supabase (PostgreSQL + Row Level Security + Auth)
- **AI**: OpenAI GPT-4 with function calling for smart task management
- **Monorepo**: pnpm workspaces + Turborepo for efficient development

### Project Structure

```
apps/
  api/                    # Bun + Hono server
  web/                    # Next.js frontend
packages/
  db/                     # Supabase client + services
  types/                  # Zod schemas + shared types
  lib-openai/             # AI agent tools + prompts
supabase/
  migrations/             # SQL files
  seed.sql               # Development data
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

# Edit with your credentials:
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
- **`tasks`** - Individual tasks linked to goals with due dates and recurrence settings
- **`streaks`** - User streak tracking with current and best streaks

### Key Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Automatic Timestamps** - `created_at` and `updated_at` fields
- **Streak Triggers** - Automatic streak updates when tasks are completed
- **Helper Functions** - `get_today_tasks()`, `update_streak()`, etc.

## 🤖 AI System

### Available Tools

- **`create_goal_with_breakdown`** - Creates goals with automatic task breakdown
- **`create_task`** - Adds individual tasks to existing goals
- **`complete_task`** - Marks tasks as done and updates streaks
- **`get_today_tasks`** - Retrieves today's focus items
- **`get_goal_tasks`** - Shows all tasks for a specific goal

### How It Works

1. **Goal Analysis**: AI analyzes your goal and determines the best breakdown strategy
2. **Task Generation**: Creates daily, weekly, and milestone tasks based on goal type
3. **Progress Tracking**: Monitors completion and adjusts recommendations
4. **Coaching**: Provides motivational guidance tailored to your progress style

### Example Breakdown

**Goal**: "Learn Spanish in 6 months"
**Daily Time**: 30 minutes

**Generated Tasks**:

- Daily: "Practice Spanish - 30 minutes" (recurring)
- Daily: "Complete Duolingo lesson" (recurring)
- Weekly: "Spanish conversation practice" (recurring)
- Milestone: "Complete beginner course" (due in 30 days)
- Milestone: "Hold 5-minute conversation" (due in 60 days)

## 🔌 API Endpoints

### Authentication

All API endpoints require a valid Supabase JWT token:

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

POST   /api/ai/chat            # Chat with AI coach
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

Test SQL functions and triggers:

```sql
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

## 🎨 Key Features in Action

### Daily Workflow

1. **Morning Check-in**: See today's tasks and current streak
2. **Task Execution**: Work through your personalized daily actions
3. **Progress Tracking**: Mark tasks complete as you finish them
4. **Evening Review**: Reflect on progress and prepare for tomorrow

### Goal Management

1. **Goal Creation**: Tell FocusPilot what you want to achieve
2. **Time Commitment**: Specify how much time you can dedicate daily
3. **Automatic Breakdown**: Get a structured plan with daily/weekly tasks
4. **Progress Monitoring**: Track completion rates and streak building

### AI Coaching

1. **Contextual Guidance**: Coaching adapts to your goal type and progress
2. **Motivational Support**: Encouragement tailored to your current momentum
3. **Task Optimization**: Suggestions for more effective daily actions
4. **Accountability**: Gentle reminders to maintain consistency

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
- **OpenAI** for the powerful GPT models that make intelligent coaching possible
- **Hono** for the lightning-fast web framework
- **Next.js** for the excellent React framework
- **Bun** for the fast JavaScript runtime

---

**Built with ❤️ for ambitious people who want to turn their goals into reality** 🎯

_Transform your productivity, one task at a time._
