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
  
  console.log('📡 Making request to:', fullUrl);
  
  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
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
}

export async function searchBooks(query: string): Promise<OpenLibraryBook[]> {
  if (!query.trim()) {
    return [];
  }

  const trimmedQuery = query.trim();
  console.log('🔍 Searching Open Library for:', trimmedQuery);
  
  try {
    // Strategy 1: Try exact phrase match in title OR author (most specific)
    console.log('🎯 Strategy 1: Exact phrase match in title OR author');
    const exactParams = new URLSearchParams({
      q: `title:"${trimmedQuery}" OR author_name:"${trimmedQuery}"`,
      fields: 'key,title,author_name,cover_i,number_of_pages_median',
      limit: '10'
    });
    
    let results = await makeSearchRequest(exactParams);
    
    // If we got good results (more than 2), return them
    if (results.length > 2) {
      console.log('✅ Found good results with exact phrase match');
      return results;
    }
    
    // Strategy 2: Try broader phrase search (across all fields)
    console.log('🎯 Strategy 2: General phrase search');
    const generalPhraseParams = new URLSearchParams({
      q: `"${trimmedQuery}"`,
      fields: 'key,title,author_name,cover_i,number_of_pages_median',
      limit: '10'
    });
    
    results = await makeSearchRequest(generalPhraseParams);
    
    // If we got some results, return them
    if (results.length > 0) {
      console.log('✅ Found results with general phrase search');
      return results;
    }
    
    // Strategy 3: Fall back to original broad search (least specific)
    console.log('🎯 Strategy 3: Fallback to broad search');
    const fallbackParams = new URLSearchParams({
      q: trimmedQuery,
      fields: 'key,title,author_name,cover_i,number_of_pages_median',
      limit: '10'
    });
    
    results = await makeSearchRequest(fallbackParams);
    console.log('✅ Using fallback broad search results');
    return results;
    
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
