# Casing Convention: Database ↔ TypeScript

This document outlines our approach to handling the casing convention mismatch between our snake_case database and camelCase TypeScript frontend.

## Overview

We maintain a clean separation between database conventions (snake_case) and JavaScript/TypeScript conventions (camelCase) through explicit inline mapping at the API boundary.

## The Problem

- **Database**: Uses snake_case (`cover_url`, `reading_progress`, `user_id`)
- **TypeScript/JavaScript**: Uses camelCase (`coverUrl`, `readingProgress`, `userId`)
- **API Boundary**: Needs to transform between these conventions

## Our Solution: Inline Mapping

We use explicit inline mapping at the database call site to transform between conventions. This approach is:

- **Explicit**: You can see exactly what's being transformed
- **Type-safe**: TypeScript ensures correct mapping
- **Maintainable**: No hidden abstractions or "magic"
- **Industry standard**: Widely used in Next.js/Supabase projects

## Implementation Pattern

### Reading from Database (snake_case → camelCase)

```typescript
// API route GET handler
const { data: rows } = await supabase
  .from('books')
  .select('*')
  .eq('user_id', session.user.id);

const books: Book[] = rows?.map(r => ({
  id: r.id,
  title: r.title,
  author: r.author,
  pages: r.pages,
  coverUrl: r.cover_url,        // snake_case → camelCase
  status: r.status,
  userId: r.user_id,            // snake_case → camelCase
  laneId: r.lane_id,            // snake_case → camelCase
  readingProgress: r.reading_progress,  // snake_case → camelCase
  goodreadsId: r.goodreads_id,  // snake_case → camelCase
  estimatedMinutes: r.estimated_minutes, // snake_case → camelCase
  addedAt: r.added_at,          // snake_case → camelCase
})) ?? [];

return NextResponse.json(books);
```

### Writing to Database (camelCase → snake_case)

```typescript
// API route POST/PUT handler
const bookData = bookSchema.parse(await req.json()); // camelCase from frontend

await supabase.from('books').insert({
  title: bookData.title,
  author: bookData.author,
  pages: bookData.pages,
  cover_url: bookData.coverUrl,        // camelCase → snake_case
  status: bookData.status,
  user_id: session.user.id,
  lane_id: bookData.laneId ?? null,    // camelCase → snake_case
  estimated_minutes: estimatedMinutes, // camelCase → snake_case
});
```

## Type Definitions

We maintain a single set of camelCase types for the frontend:

```typescript
// shared/schema.ts
export interface Book {
  id: number;
  title: string;
  author: string;
  pages: number;
  coverUrl: string;           // camelCase
  status: 'to-read' | 'reading' | 'completed';
  userId: number;             // camelCase
  laneId: number | null;      // camelCase
  readingProgress: number;    // camelCase
  goodreadsId?: string;       // camelCase
  estimatedMinutes: number;   // camelCase
  addedAt: string;            // camelCase
}
```

## Benefits

1. **Clear Separation**: Database and frontend conventions are clearly separated
2. **No Abstraction Overhead**: No transformation functions to maintain
3. **Explicit Mapping**: You can see exactly what's being transformed
4. **Type Safety**: TypeScript ensures correct field mapping
5. **Easy Debugging**: Mapping logic is right there in the code
6. **Industry Standard**: Follows Next.js/Supabase best practices

## Guidelines

- **Database**: Always use snake_case
- **TypeScript Types**: Always use camelCase
- **API Routes**: Transform inline at the database call site
- **Frontend Components**: Use camelCase exclusively
- **Validation Schemas**: Use camelCase (matches frontend input)

## Alternative Approaches (Not Used)

- **Transformation Functions**: More abstraction, harder to debug
- **Auto-transformation Libraries**: Less explicit, potential performance overhead
- **Database camelCase**: Goes against SQL conventions
- **Frontend snake_case**: Goes against JavaScript conventions

## Future Maintenance

When adding new fields:
1. Add to database in snake_case
2. Add to TypeScript interface in camelCase
3. Update inline mapping in relevant API routes
4. Update frontend components to use camelCase

This approach scales well for small to medium projects and provides the right balance of explicitness and maintainability. 