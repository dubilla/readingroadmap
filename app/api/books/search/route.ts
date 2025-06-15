import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/database'
import type { Book } from '../../../../shared/schema'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // For now, we'll use a simple approach - in production you'd want proper auth
    const { data: allBooks, error } = await db.query('books')

    if (error) {
      console.error('Error fetching books:', error)
      return NextResponse.json(
        { error: 'Failed to search books' },
        { status: 500 }
      )
    }

    // Filter books in memory
    const filteredBooks = (allBooks || []).filter((book: Book) => 
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase())
    )

    return NextResponse.json(filteredBooks)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 