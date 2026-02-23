import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../test/test-utils'
import { BookActionDrawer } from '../../components/book-action-drawer'
import { mockBook } from '../../test/test-utils'
import type { Book, UserLane } from '@shared/schema'

// Mock vaul Drawer to render content directly (avoids portal issues in tests)
jest.mock('vaul', () => {
  const React = require('react')
  return {
    Drawer: {
      Root: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
        open ? <div data-testid="drawer">{children}</div> : null,
      Content: React.forwardRef(({ children, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>{children}</div>
      )),
      Overlay: React.forwardRef((props: any, ref: any) => <div ref={ref} {...props} />),
      Title: React.forwardRef(({ children, ...props }: any, ref: any) => (
        <h2 ref={ref} {...props}>{children}</h2>
      )),
      Description: React.forwardRef(({ children, ...props }: any, ref: any) => (
        <p ref={ref} {...props}>{children}</p>
      )),
      Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      Trigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      Close: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    },
  }
})

// Mock ResponsiveModal to render content directly (avoids Radix aria-hidden portal issues in tests)
jest.mock('../../components/ui/responsive-modal', () => {
  const React = require('react')
  return {
    ResponsiveModal: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? <div data-testid="responsive-modal">{children}</div> : null,
    ResponsiveModalContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ResponsiveModalHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ResponsiveModalTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    ResponsiveModalDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    ResponsiveModalTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    ResponsiveModalClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

// Mock the AlertDialog UI components directly
jest.mock('../../components/ui/alert-dialog', () => {
  const React = require('react')
  return {
    AlertDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? <div role="alertdialog">{children}</div> : null,
    AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
    AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    AlertDialogAction: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <button ref={ref} {...props}>{children}</button>
    )),
    AlertDialogCancel: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <button ref={ref} {...props}>{children}</button>
    )),
  }
})

describe('BookActionDrawer', () => {
  const testBook: Book = {
    ...mockBook,
    id: 1,
    title: 'Test Book',
    author: 'Test Author',
    status: 'to-read',
    laneId: null,
  }

  const testLane: UserLane = {
    id: 10,
    name: 'Fiction',
    order: 0,
    userId: '1',
    createdAt: new Date().toISOString(),
  }

  const defaultProps = {
    book: testBook,
    userLanes: [] as UserLane[],
    open: true,
    onOpenChange: jest.fn(),
    onStatusChange: jest.fn(),
    onLaneChange: jest.fn(),
    onDelete: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Delete button rendering', () => {
    it('renders Remove Book button when onDelete is provided', () => {
      render(<BookActionDrawer {...defaultProps} />)

      expect(screen.getByRole('button', { name: /remove book/i })).toBeInTheDocument()
    })

    it('does not render Remove Book button when onDelete is not provided', () => {
      const { onDelete, ...propsWithoutDelete } = defaultProps
      render(<BookActionDrawer {...propsWithoutDelete} />)

      expect(screen.queryByRole('button', { name: /remove book/i })).not.toBeInTheDocument()
    })

    it('does not render when drawer is closed', () => {
      render(<BookActionDrawer {...defaultProps} open={false} />)

      expect(screen.queryByRole('button', { name: /remove book/i })).not.toBeInTheDocument()
    })

    it('does not render when book is null', () => {
      render(<BookActionDrawer {...defaultProps} book={null} />)

      expect(screen.queryByRole('button', { name: /remove book/i })).not.toBeInTheDocument()
    })
  })

  describe('Confirmation dialog', () => {
    it('shows confirmation dialog when Remove Book is clicked', async () => {
      render(<BookActionDrawer {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /remove book/i }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
        expect(screen.getByText('Remove book')).toBeInTheDocument()
      })
    })

    it('displays the book title in the confirmation message', async () => {
      render(<BookActionDrawer {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /remove book/i }))

      await waitFor(() => {
        expect(screen.getByText(/cannot be undone/)).toBeInTheDocument()
      })
    })

    it('shows Cancel and Remove buttons in confirmation dialog', async () => {
      render(<BookActionDrawer {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /remove book/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
      })
    })
  })

  describe('Delete action', () => {
    it('calls onDelete with book id when Remove is confirmed', async () => {
      render(<BookActionDrawer {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /remove book/i }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

      expect(defaultProps.onDelete).toHaveBeenCalledWith(1)
    })

    it('closes the drawer after confirming delete', async () => {
      render(<BookActionDrawer {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /remove book/i }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })

    it('does not call onDelete when Cancel is clicked', async () => {
      render(<BookActionDrawer {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /remove book/i }))

      await waitFor(() => {
        expect(screen.getByRole('alertdialog')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(defaultProps.onDelete).not.toHaveBeenCalled()
    })
  })

  describe('Existing drawer features still work', () => {
    it('renders book title and author', () => {
      render(<BookActionDrawer {...defaultProps} />)

      expect(screen.getByText('Test Book')).toBeInTheDocument()
      expect(screen.getByText('Test Author')).toBeInTheDocument()
    })

    it('renders status buttons', () => {
      render(<BookActionDrawer {...defaultProps} />)

      expect(screen.getByRole('button', { name: /to read/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reading/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /completed/i })).toBeInTheDocument()
    })

    it('calls onStatusChange when a status button is clicked', () => {
      render(<BookActionDrawer {...defaultProps} />)

      fireEvent.click(screen.getByRole('button', { name: /completed/i }))

      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(1, 'completed')
    })

    it('calls onLaneChange when a lane is clicked', () => {
      render(<BookActionDrawer {...defaultProps} userLanes={[testLane]} />)

      fireEvent.click(screen.getByRole('button', { name: /fiction/i }))

      expect(defaultProps.onLaneChange).toHaveBeenCalledWith(1, 10)
    })
  })
})
