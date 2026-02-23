import { searchBooks, getCoverImageUrl } from '../../lib/openLibrary'

const mockFetch = global.fetch as jest.Mock

function makeOpenLibraryResponse(docs: object[]) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ docs, numFound: docs.length }),
  })
}

function makeFailedResponse(status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: 'Internal Server Error',
  })
}

const tolkienBook = {
  key: '/works/OL27482W',
  title: 'The Fellowship of the Ring',
  author_name: ['J.R.R. Tolkien'],
  cover_i: 9255566,
  number_of_pages_median: 479,
}

const kingBook = {
  key: '/works/OL81626W',
  title: 'The Gunslinger',
  author_name: ['Stephen King'],
  cover_i: 8234567,
  number_of_pages_median: 224,
}

const generalOnlyBook = {
  key: '/works/OL99999W',
  title: 'General Result Only',
  author_name: ['Some Author'],
  cover_i: undefined,
  number_of_pages_median: 300,
}

describe('searchBooks', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('returns empty array for empty query without calling fetch', async () => {
    const result = await searchBooks('')
    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns empty array for whitespace-only query without calling fetch', async () => {
    const result = await searchBooks('   ')
    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('makes both a general (q=) and author-specific (author=) search in parallel', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('author=')) return makeOpenLibraryResponse([tolkienBook])
      if (url.includes('q=')) return makeOpenLibraryResponse([])
      return makeFailedResponse()
    })

    await searchBooks('tolkien')

    const calledUrls: string[] = mockFetch.mock.calls.map((call) => call[0] as string)
    expect(calledUrls.some((url) => url.includes('q=tolkien'))).toBe(true)
    expect(calledUrls.some((url) => url.includes('author=tolkien'))).toBe(true)
  })

  it('returns books from a title search', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('q=')) return makeOpenLibraryResponse([tolkienBook])
      return makeOpenLibraryResponse([])
    })

    const results = await searchBooks('fellowship of the ring')
    expect(results.some((b) => b.key === tolkienBook.key)).toBe(true)
  })

  it('returns books from an author search', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('author=')) return makeOpenLibraryResponse([tolkienBook])
      return makeOpenLibraryResponse([])
    })

    const results = await searchBooks('tolkien')
    expect(results.some((b) => b.key === tolkienBook.key)).toBe(true)
  })

  it('returns books for a mixed author+title query', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('q=')) return makeOpenLibraryResponse([tolkienBook])
      return makeOpenLibraryResponse([])
    })

    const results = await searchBooks('tolkien fellowship')
    expect(results.some((b) => b.key === tolkienBook.key)).toBe(true)
  })

  it('deduplicates books that appear in both searches (by key)', async () => {
    mockFetch.mockImplementation((url: string) => {
      // tolkienBook returned from BOTH searches
      if (url.includes('author=')) return makeOpenLibraryResponse([tolkienBook])
      if (url.includes('q=')) return makeOpenLibraryResponse([tolkienBook, kingBook])
      return makeFailedResponse()
    })

    const results = await searchBooks('tolkien')

    const tolkienResults = results.filter((b) => b.key === tolkienBook.key)
    expect(tolkienResults).toHaveLength(1)
  })

  it('places author-specific results before general results', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('author=')) return makeOpenLibraryResponse([tolkienBook])
      if (url.includes('q=')) return makeOpenLibraryResponse([kingBook, generalOnlyBook])
      return makeFailedResponse()
    })

    const results = await searchBooks('tolkien')

    const tolkienIndex = results.findIndex((b) => b.key === tolkienBook.key)
    const kingIndex = results.findIndex((b) => b.key === kingBook.key)
    const generalIndex = results.findIndex((b) => b.key === generalOnlyBook.key)

    expect(tolkienIndex).toBeLessThan(kingIndex)
    expect(tolkienIndex).toBeLessThan(generalIndex)
  })

  it('still returns results when the author search fails', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('author=')) return makeFailedResponse()
      if (url.includes('q=')) return makeOpenLibraryResponse([tolkienBook])
      return makeFailedResponse()
    })

    const results = await searchBooks('tolkien')
    expect(results.some((b) => b.key === tolkienBook.key)).toBe(true)
  })

  it('still returns results when the general search fails', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('author=')) return makeOpenLibraryResponse([tolkienBook])
      if (url.includes('q=')) return makeFailedResponse()
      return makeFailedResponse()
    })

    const results = await searchBooks('tolkien')
    expect(results.some((b) => b.key === tolkienBook.key)).toBe(true)
  })

  it('returns empty array when both searches fail', async () => {
    mockFetch.mockImplementation(() => makeFailedResponse())

    const results = await searchBooks('tolkien')
    expect(results).toEqual([])
  })

  it('caps results at 10 books', async () => {
    const manyBooks = Array.from({ length: 10 }, (_, i) => ({
      key: `/works/OL${i}W`,
      title: `Book ${i}`,
      author_name: ['Author'],
      number_of_pages_median: 200,
    }))
    const extraBooks = Array.from({ length: 10 }, (_, i) => ({
      key: `/works/OL${i + 100}W`,
      title: `Extra Book ${i}`,
      author_name: ['Author'],
      number_of_pages_median: 200,
    }))

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('author=')) return makeOpenLibraryResponse(manyBooks)
      if (url.includes('q=')) return makeOpenLibraryResponse(extraBooks)
      return makeFailedResponse()
    })

    const results = await searchBooks('author')
    expect(results.length).toBeLessThanOrEqual(10)
  })

  it('handles network errors gracefully by returning empty array', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const results = await searchBooks('tolkien')
    expect(results).toEqual([])
  })
})

describe('getCoverImageUrl', () => {
  it('returns a cover URL when coverId is provided', () => {
    const url = getCoverImageUrl(12345)
    expect(url).toBe('https://covers.openlibrary.org/b/id/12345-L.jpg')
  })

  it('returns placeholder URL when coverId is undefined', () => {
    const url = getCoverImageUrl(undefined)
    expect(url).toContain('placeholder')
  })
})
