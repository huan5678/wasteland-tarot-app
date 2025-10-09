/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SavedSessionsList } from './SavedSessionsList';
import * as sessionsAPI from '@/lib/api/sessions';

// Mock the API module
jest.mock('@/lib/api/sessions', () => ({
  listIncompleteSessions: jest.fn(),
  deleteSession: jest.fn(),
}));

const mockSessions = [
  {
    id: 'session-1',
    user_id: 'user-123',
    spread_type: 'three-card',
    question: 'What should I focus on today?',
    status: 'paused',
    created_at: '2025-10-01T10:00:00Z',
    updated_at: '2025-10-01T10:30:00Z',
    last_accessed_at: '2025-10-01T10:30:00Z',
  },
  {
    id: 'session-2',
    user_id: 'user-123',
    spread_type: 'celtic-cross',
    question: 'Career guidance?',
    status: 'active',
    created_at: '2025-10-01T09:00:00Z',
    updated_at: '2025-10-01T09:15:00Z',
  },
];

describe('SavedSessionsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (sessionsAPI.listIncompleteSessions as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<SavedSessionsList userId="user-123" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display list of saved sessions', async () => {
    (sessionsAPI.listIncompleteSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      total: 2,
    });

    render(<SavedSessionsList userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('What should I focus on today?')).toBeInTheDocument();
      expect(screen.getByText('Career guidance?')).toBeInTheDocument();
    });
  });

  it('should show empty state when no sessions', async () => {
    (sessionsAPI.listIncompleteSessions as jest.Mock).mockResolvedValue({
      sessions: [],
      total: 0,
    });

    render(<SavedSessionsList userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText(/no saved sessions/i)).toBeInTheDocument();
    });
  });

  it('should call onResumeSession when resume button clicked', async () => {
    const mockOnResume = jest.fn();
    (sessionsAPI.listIncompleteSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      total: 2,
    });

    render(<SavedSessionsList userId="user-123" onResumeSession={mockOnResume} />);

    await waitFor(() => {
      const resumeButtons = screen.getAllByRole('button', { name: /resume/i });
      fireEvent.click(resumeButtons[0]);
    });

    expect(mockOnResume).toHaveBeenCalledWith('session-1');
  });

  it('should delete session when delete button clicked', async () => {
    (sessionsAPI.listIncompleteSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      total: 2,
    });
    (sessionsAPI.deleteSession as jest.Mock).mockResolvedValue(true);

    render(<SavedSessionsList userId="user-123" />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
    });

    // Should show confirmation
    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(sessionsAPI.deleteSession).toHaveBeenCalledWith('session-1');
    });
  });

  it('should display session status badges', async () => {
    (sessionsAPI.listIncompleteSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      total: 2,
    });

    render(<SavedSessionsList userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText('paused')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  it('should format dates correctly', async () => {
    (sessionsAPI.listIncompleteSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions,
      total: 2,
    });

    render(<SavedSessionsList userId="user-123" />);

    await waitFor(() => {
      // Should display relative time or formatted date (multiple instances)
      const updatedElements = screen.getAllByText(/updated/i);
      expect(updatedElements.length).toBeGreaterThan(0);
    });
  });

  it('should handle API errors gracefully', async () => {
    (sessionsAPI.listIncompleteSessions as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(<SavedSessionsList userId="user-123" />);

    await waitFor(() => {
      expect(screen.getByText(/error loading sessions/i)).toBeInTheDocument();
    });
  });

  it('should support pagination', async () => {
    const firstPage = {
      sessions: mockSessions.slice(0, 1),
      total: 2,
    };
    const secondPage = {
      sessions: mockSessions.slice(1, 2),
      total: 2,
    };

    (sessionsAPI.listIncompleteSessions as jest.Mock)
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    render(<SavedSessionsList userId="user-123" pageSize={1} />);

    await waitFor(() => {
      expect(screen.getByText('What should I focus on today?')).toBeInTheDocument();
    });

    // Click next page
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Career guidance?')).toBeInTheDocument();
    });
  });

  it('should filter by status', async () => {
    (sessionsAPI.listIncompleteSessions as jest.Mock).mockResolvedValue({
      sessions: mockSessions.filter((s) => s.status === 'paused'),
      total: 1,
    });

    render(<SavedSessionsList userId="user-123" statusFilter="paused" />);

    await waitFor(() => {
      expect(screen.getByText('What should I focus on today?')).toBeInTheDocument();
      expect(screen.queryByText('Career guidance?')).not.toBeInTheDocument();
    });

    expect(sessionsAPI.listIncompleteSessions).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({ status: 'paused' })
    );
  });
});
