import React from 'react'
import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '../components/providers'
import type { Viewport } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata = {
  title: 'ReadingRoadmap',
  description: 'Track and organize your reading journey',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 