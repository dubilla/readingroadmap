# Local Development Setup

This guide will help you set up the ReadingRoadmap app for local development using a local PostgreSQL database.

## Prerequisites

1. **PostgreSQL** - Install PostgreSQL on your system:
   - **macOS**: `brew install postgresql`
   - **Ubuntu**: `sudo apt-get install postgresql postgresql-contrib`
   - **Windows**: Download from https://www.postgresql.org/download/windows/

2. **Node.js** - Make sure you have Node.js 18+ installed

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Local Database
```bash
# Start PostgreSQL service (if not already running)
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql

# Run the setup script
npm run db:setup
```

This script will:
- Check if PostgreSQL is installed
- Create a local database called `readingroadmap_development`
- Run database migrations

### 3. Configure Environment
The `.env.local` file should already be configured with:
```
DATABASE_URL="postgres://dubilla@localhost:5432/readingroadmap_development"
SESSION_SECRET="your-session-secret"
NODE_ENV="development"
```

**Note**: The DATABASE_URL uses your local PostgreSQL user. If you need to specify a password, update it to: `postgres://dubilla:password@localhost:5432/readingroadmap_development`

### 4. Start Development Server
```bash
npm run dev
```

## Database Management

### View Database Schema
```bash
npm run db:studio
```
This opens Drizzle Studio in your browser where you can view and edit your database.

### Generate New Migrations
```bash
npm run db:generate
```

### Apply Migrations
```bash
npm run db:push
```

## Environment Configuration

### Local Development (.env.local)
- Uses local PostgreSQL database
- No authentication required
- Fast development iteration

### Production (.env.production)
- Uses Supabase
- Full authentication and authorization
- Deployed to Vercel

## Switching Between Environments

The app automatically detects which environment to use based on:
- `NODE_ENV` environment variable
- Presence of Supabase environment variables

**Local Development**: Uses local PostgreSQL + Drizzle ORM
**Production**: Uses Supabase

## Troubleshooting

### PostgreSQL Connection Issues
1. Make sure PostgreSQL is running
2. Check your DATABASE_URL in `.env.local`
3. Verify the database exists: `psql -l`

### Migration Issues
1. Reset the database: `dropdb readingroadmap_development && createdb readingroadmap_development`
2. Re-run migrations: `npm run db:push`

### Port Conflicts
If port 5432 is in use, update your DATABASE_URL to use a different port.

## Development Workflow

1. Make changes to your schema in `shared/schema.ts`
2. Generate migrations: `npm run db:generate`
3. Apply migrations: `npm run db:push`
4. Test your changes locally
5. Deploy to production (uses Supabase automatically) 