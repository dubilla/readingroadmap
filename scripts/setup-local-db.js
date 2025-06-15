#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up local PostgreSQL database...');

// Check if PostgreSQL is installed
try {
  execSync('which psql', { stdio: 'pipe' });
  console.log('✅ PostgreSQL is installed');
} catch (error) {
  console.error('❌ PostgreSQL is not installed. Please install it first:');
  console.log('   macOS: brew install postgresql');
  console.log('   Ubuntu: sudo apt-get install postgresql postgresql-contrib');
  console.log('   Windows: Download from https://www.postgresql.org/download/windows/');
  process.exit(1);
}

// Create database
try {
  console.log('📦 Creating database...');
  execSync('createdb readingroadmap_development', { stdio: 'inherit' });
  console.log('✅ Database created successfully');
} catch (error) {
  console.log('ℹ️  Database might already exist, continuing...');
}

// Run migrations
try {
  console.log('🔄 Running migrations...');
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  console.log('✅ Migrations completed');
} catch (error) {
  console.error('❌ Failed to run migrations:', error.message);
  process.exit(1);
}

console.log('🎉 Local database setup complete!');
console.log('📝 You can now run: npm run dev'); 