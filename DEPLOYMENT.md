# 🚀 Deployment Guide: Vercel + Supabase

This guide will help you deploy your ReadingRoadmap application to Vercel with Supabase as the database.

## 📋 Prerequisites

- [Vercel Account](https://vercel.com)
- [Supabase Account](https://supabase.com)
- [GitHub Account](https://github.com) (for version control)

## 🗄️ Step 1: Set up Supabase Database

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `readingroadmap`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Set up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migration.sql`
3. Paste and run the SQL script
4. Verify tables are created in **Table Editor**

### 1.3 Get API Keys

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **anon public** key

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2.2 Set Environment Variables

In Vercel project settings, add these environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
NODE_ENV=production
```

### 2.3 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your app will be available at `https://your-project.vercel.app`

## 🔧 Step 3: Update Client Configuration

### 3.1 Update API Client

The client needs to be updated to use the new API routes. Update your `client/src/lib/queryClient.ts`:

```typescript
// Update API base URL for production
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-project.vercel.app/api'
  : '/api'
```

### 3.2 Update Authentication

Update your authentication context to work with Supabase sessions instead of Express sessions.

## 🧪 Step 4: Test Deployment

### 4.1 Test Authentication

1. Visit your deployed app
2. Try to register a new account
3. Try to log in
4. Verify data is saved in Supabase

### 4.2 Test Core Features

1. Add a book to your library
2. Create a reading list (swimlane)
3. Move books between lanes
4. Check reading progress tracking

## 🔒 Step 5: Security Configuration

### 5.1 Supabase Row Level Security

The migration script includes RLS policies, but verify they're working:

1. Go to **Authentication** → **Policies** in Supabase
2. Ensure all tables have appropriate policies
3. Test that users can only access their own data

### 5.2 Environment Variables

Ensure all sensitive data is in environment variables:

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ❌ No hardcoded secrets

## 📊 Step 6: Monitoring & Analytics

### 6.1 Vercel Analytics

1. Enable Vercel Analytics in project settings
2. Monitor performance and errors

### 6.2 Supabase Monitoring

1. Check **Database** → **Logs** for queries
2. Monitor **Authentication** → **Users**
3. Set up alerts for unusual activity

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation

#### Database Connection Issues
- Verify Supabase URL and keys
- Check network connectivity
- Ensure RLS policies are correct

#### Authentication Problems
- Check Supabase auth settings
- Verify JWT token handling
- Test session management

### Debug Commands

```bash
# Test local build
npm run build

# Check TypeScript errors
npm run check

# Test API routes locally
npm run dev
```

## 📈 Performance Optimization

### Bundle Size
- Current bundle: ~611KB
- Target: <500KB
- Use dynamic imports for code splitting

### Database Performance
- Add indexes for frequently queried columns
- Use connection pooling
- Monitor slow queries

## 🔄 Continuous Deployment

### GitHub Integration
1. Connect GitHub repository to Vercel
2. Enable automatic deployments
3. Set up preview deployments for PRs

### Environment Management
- Use different Supabase projects for dev/staging/prod
- Set up environment-specific variables
- Test migrations before production

## 💰 Cost Optimization

### Vercel Pricing
- **Hobby**: $0/month (good for personal projects)
- **Pro**: $20/month (for teams)

### Supabase Pricing
- **Free**: $0/month (50MB database, 2GB bandwidth)
- **Pro**: $25/month (8GB database, 250GB bandwidth)

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

## 🎯 Next Steps

After successful deployment:

1. **Set up custom domain** (optional)
2. **Add monitoring and alerts**
3. **Implement backup strategies**
4. **Add performance monitoring**
5. **Set up CI/CD pipelines**

---

**Need help?** Check the troubleshooting section or reach out to the community! 