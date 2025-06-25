# 🚀 Local Development Guide

This guide will help you set up the ReadingRoadmap app for local development using Supabase.

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **Supabase CLI** - Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```
3. **Git** - Make sure you have Git installed

## 🛠️ Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ReadingRoadmap
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Optional: For testing
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### 4. Start Supabase Local Development
```bash
# Start Supabase services
supabase start

# This will start:
# - Database on port 54322
# - API on port 54321
# - Studio on port 54323
# - Inbucket (email testing) on port 54324
```

### 5. Run Database Migrations
```bash
# Apply migrations to local database
supabase db reset
```

### 6. Start the Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🔧 Development Workflow

### Database Changes
When you need to make database changes:

1. **Create a new migration:**
   ```bash
   supabase migration new your_migration_name
   ```

2. **Edit the generated migration file** in `supabase/migrations/`

3. **Apply the migration:**
   ```bash
   supabase db reset
   ```

### Testing
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

## 🌐 Access Points

- **App**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323
- **API**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   - Make sure ports 3000, 54321-54324 are available
   - Use `supabase stop` to stop services if needed

2. **Database connection issues**
   - Ensure Supabase is running: `supabase status`
   - Reset database: `supabase db reset`

3. **Environment variables**
   - Check that `.env.local` exists and has correct values
   - Restart the dev server after changing env vars

### Supabase CLI Commands
```bash
# Check status
supabase status

# Stop services
supabase stop

# Reset database
supabase db reset

# View logs
supabase logs

# Generate types
supabase gen types typescript --local > types/supabase.ts
```

## 📁 Project Structure

```
ReadingRoadmap/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Supabase SSR)
│   └── ...
├── components/            # React components
├── lib/                   # Utilities
│   └── supabase.ts       # Supabase client setup
├── supabase/             # Supabase configuration
│   ├── config.toml       # Supabase config
│   └── migrations/       # Database migrations
└── ...
```

## 🔄 Environment Differences

**Local Development**: Uses Supabase Local
- Database: Local PostgreSQL via Supabase
- Auth: Supabase Auth (local)
- Storage: Local file system
- API: Supabase API (local)

**Production**: Uses Supabase Cloud
- Database: Supabase hosted PostgreSQL
- Auth: Supabase Auth (cloud)
- Storage: Supabase Storage (cloud)
- API: Supabase API (cloud)

## 🚀 Next Steps

1. Create your first user lane
2. Add some books to test the functionality
3. Explore the reading board
4. Check out the Supabase Studio for database management 