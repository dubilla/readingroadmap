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

export async function searchBooks(query: string): Promise<OpenLibraryBook[]> {
  if (!query.trim()) {
    return [];
  }

  console.log('🔍 Searching Open Library for:', query);
  
  try {
    const url = `${OPEN_LIBRARY_API}/search.json`;
    const params = new URLSearchParams({
      q: query.trim(),
      fields: 'key,title,author_name,cover_i,number_of_pages_median',
      limit: '10'
    });
    
    const fullUrl = `${url}?${params.toString()}`;
    console.log('📡 Making request to:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add a timeout using AbortController
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    console.log('✅ Open Library response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: OpenLibrarySearchResponse = await response.json();
    
    console.log('📊 Open Library response data:', {
      numFound: data.numFound,
      docsCount: data.docs?.length || 0
    });
    
    return data.docs || [];
  } catch (error) {
    console.error('❌ Error searching books:', error);
    
    if (error instanceof Error) {
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.name === 'AbortError') {
        throw new Error('Search request timed out. Please try again.');
      }
      
      if (error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        throw new Error('Open Library service is temporarily unavailable. Please try again later.');
      }
    }
    
    throw new Error('Failed to search books. Please check your connection and try again.');
  }
}
