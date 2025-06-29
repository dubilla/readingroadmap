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

### 1.3 Configure Authentication Settings

1. Go to **Authentication** → **Settings**
2. Set the **Site URL** to your production domain (e.g., `https://readingroadmap.vercel.app`)
3. Add your production domain to **Redirect URLs**:
   - `https://readingroadmap.vercel.app`
   - `https://readingroadmap.vercel.app/auth/callback`
4. Enable **Email confirmations** in the Email settings
5. Configure custom email templates (optional but recommended)

### 1.4 Get API Keys

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
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave empty)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.2 Set Environment Variables

In Vercel project settings, add these environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://readingroadmap.vercel.app

# Supabase Auth Configuration (for production)
SITE_URL=https://readingroadmap.vercel.app

# Environment
NODE_ENV=production
```

### 2.3 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your app will be available at `https://your-project.vercel.app`

## 🔧 Step 3: Configure Email Templates (Optional)

For production, you can configure custom email templates in Supabase:

1. Go to **Authentication** → **Email Templates**
2. Customize the templates for:
   - Confirm signup
   - Magic link
   - Password recovery
   - Email change confirmation

## 📧 Step 4: Set up SMTP (Optional)

For production email delivery, configure SMTP:

1. Go to **Authentication** → **Settings** → **Email**
2. Enable **SMTP**
3. Configure your SMTP provider (SendGrid, Mailgun, etc.)
4. Set sender email and name

## 🔄 Step 5: Update Local Development

After deploying, update your local `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000

# Supabase Auth Configuration (for local development)
SITE_URL=http://127.0.0.1:3000

# Optional: For testing
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## 🧪 Step 6: Test the Deployment

1. Visit your production URL
2. Test user registration and email confirmation
3. Verify email templates are working
4. Test login and logout functionality

## 🔍 Troubleshooting

### Email Not Sending
- Check SMTP configuration in Supabase
- Verify email templates are properly configured
- Check spam folder for confirmation emails

### Redirect Issues
- Ensure redirect URLs are correctly set in Supabase
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly
- Check that the auth callback route is working

### Authentication Errors
- Verify Supabase URL and keys are correct
- Check that email confirmations are enabled
- Ensure database schema is properly migrated

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🎯 Next Steps

After successful deployment:

1. **Set up custom domain** (optional)
2. **Add monitoring and alerts**
3. **Implement backup strategies**
4. **Add performance monitoring**
5. **Set up CI/CD pipelines**

---

**Need help?** Check the troubleshooting section or reach out to the community! 