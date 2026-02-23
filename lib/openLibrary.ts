const OPEN_LIBRARY_API = 'https://openlibrary.org';

export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
}

export interface OpenLibrarySearchResponse {
  docs: OpenLibraryBook[];
  numFound: number;
}

export function getCoverImageUrl(coverId: number | undefined): string {
  if (!coverId) {
    return 'https://via.placeholder.com/300x400?text=No+Cover';
  }
  return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
}

async function makeSearchRequest(params: URLSearchParams): Promise<OpenLibraryBook[]> {
  const url = `${OPEN_LIBRARY_API}/search.json`;
  const fullUrl = `${url}?${params.toString()}`;

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data: OpenLibrarySearchResponse = await response.json();
  return data.docs || [];
}

export async function searchBooks(query: string): Promise<OpenLibraryBook[]> {
  if (!query.trim()) {
    return [];
  }

  const trimmedQuery = query.trim();
  const fields = 'key,title,author_name,cover_i,number_of_pages_median';

  const [generalResult, authorResult] = await Promise.allSettled([
    makeSearchRequest(new URLSearchParams({ q: trimmedQuery, fields, limit: '10' })),
    makeSearchRequest(new URLSearchParams({ author: trimmedQuery, fields, limit: '10' })),
  ]);

  const general = generalResult.status === 'fulfilled' ? generalResult.value : [];
  const byAuthor = authorResult.status === 'fulfilled' ? authorResult.value : [];

  // Merge: author-specific results first (more relevant for author queries), deduplicate by key
  const seen = new Set<string>();
  const merged: OpenLibraryBook[] = [];
  for (const book of [...byAuthor, ...general]) {
    if (!seen.has(book.key)) {
      seen.add(book.key);
      merged.push(book);
    }
  }

  return merged.slice(0, 10);
}
