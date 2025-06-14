import axios from 'axios';

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

  try {
    const response = await axios.get<OpenLibrarySearchResponse>(`${OPEN_LIBRARY_API}/search.json`, {
      params: {
        q: query.trim(),
        fields: 'key,title,author_name,cover_i,number_of_pages_median',
        limit: 10
      },
      timeout: 10000, // 10 second timeout
    });
    
    return response.data.docs || [];
  } catch (error) {
    console.error('Error searching books:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Search request timed out. Please try again.');
      }
      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      if (error.response?.status >= 500) {
        throw new Error('Open Library service is temporarily unavailable. Please try again later.');
      }
    }
    
    throw new Error('Failed to search books. Please check your connection and try again.');
  }
}
