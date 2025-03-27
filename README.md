# ReadingRoadmap

A modern web application for tracking and organizing your reading list. Keep track of books you want to read, create reading lists, and manage your reading journey.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ReadingRoadmap.git
   cd ReadingRoadmap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret
   ```

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes 