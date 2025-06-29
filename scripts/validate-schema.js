#!/usr/bin/env node

/**
 * Schema Validation Script
 * 
 * This script validates that:
 * 1. TypeScript types are valid
 * 2. Schema file exists and has basic structure
 * 3. No obvious type mismatches
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Validating schema consistency...\n');

try {
  // Check TypeScript compilation
  console.log('1. Checking TypeScript types...');
  const { execSync } = await import('child_process');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript types are valid');

  // Check if schema.ts exists and is valid
  console.log('\n2. Validating schema.ts file...');
  const schemaPath = path.join(__dirname, '..', 'shared', 'schema.ts');
  
  if (!fs.existsSync(schemaPath)) {
    throw new Error('schema.ts file not found');
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Basic validation - check for common issues
  if (schemaContent.includes('userId: number')) {
    console.log('⚠️  Warning: Found userId: number in schema.ts');
    console.log('   Make sure this matches your database schema (should be string for UUIDs)');
  }
  
  // Check for UUID validation in Zod schemas
  if (!schemaContent.includes('z.string().uuid()')) {
    console.log('⚠️  Warning: No UUID validation found in Zod schemas');
    console.log('   Consider adding z.string().uuid() for userId fields');
  }
  
  console.log('✅ Schema file is valid');

  console.log('\n🎉 All schema validations passed!');
  console.log('\n💡 For full schema validation, run: supabase db diff');
  
} catch (error) {
  console.error('\n❌ Schema validation failed:', error.message);
  process.exit(1);
} 