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
  try {
    const response = await axios.get<OpenLibrarySearchResponse>(`${OPEN_LIBRARY_API}/search.json`, {
      params: {
        q: query,
        fields: 'key,title,author_name,cover_i,number_of_pages_median',
        limit: 10
      }
    });
    return response.data.docs;
  } catch (error) {
    console.error('Error searching books:', error);
    return [];
  }
}
