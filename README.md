# 📚 Reading Roadmap

A modern web application for organizing and tracking your reading journey. Built with Next.js, Supabase, and TypeScript.

## ✨ Features

- **Book Management**: Add books from Open Library or manually
- **Reading Progress**: Track your reading progress with visual indicators
- **Custom Lanes**: Organize books into custom categories
- **Reading Board**: Drag-and-drop interface for managing your reading workflow
- **Authentication**: Secure user accounts with Supabase Auth
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ReadingRoadmap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start Supabase locally**
   ```bash
   supabase start
   supabase db reset
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, API)
- **Styling**: Tailwind CSS, Radix UI
- **State Management**: TanStack Query
- **Testing**: Jest, Playwright
- **Deployment**: Vercel

## 📁 Project Structure

```
ReadingRoadmap/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Supabase SSR)
│   └── auth/              # Authentication pages
├── components/            # React components
├── lib/                   # Utilities and configurations
├── supabase/             # Supabase configuration
│   ├── config.toml       # Supabase local config
│   └── migrations/       # Database migrations
└── shared/               # Shared types and schemas
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all
```

## 📚 Documentation

- [Local Development Guide](LOCAL_DEVELOPMENT.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Testing Guide](TESTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 