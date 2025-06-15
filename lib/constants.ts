export const MOCK_BOOKS = [
  {
    id: 1,
    title: "The Rational Optimist",
    author: "Matt Ridley",
    pages: 356,
    coverUrl: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73",
    status: "to-read",
    lane: "backlog",
    readingProgress: 0,
    estimatedMinutes: 356
  },
  {
    id: 2,
    title: "Psychology of Money",
    author: "Morgan Housel",
    pages: 256,
    coverUrl: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666",
    status: "reading",
    lane: "in-progress",
    readingProgress: 45,
    estimatedMinutes: 256
  },
  {
    id: 3,
    title: "Deep Work",
    author: "Cal Newport",
    pages: 304,
    coverUrl: "https://images.unsplash.com/photo-1555252586-d77e8c828e41",
    status: "to-read",
    lane: "next-up",
    readingProgress: 0,
    estimatedMinutes: 304
  }
] as const;

export const LANES = {
  backlog: {
    id: "backlog",
    title: "Backlog",
    description: "Books to read eventually"
  },
  "next-up": {
    id: "next-up",
    title: "Next Up",
    description: "Books to read soon"
  },
  "in-progress": {
    id: "in-progress", 
    title: "In Progress",
    description: "Currently reading"
  },
  completed: {
    id: "completed",
    title: "Completed",
    description: "Finished books"
  }
} as const;
