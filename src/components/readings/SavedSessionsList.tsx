'use client';

import React, { useState, useEffect } from 'react';
import {
  listIncompleteSessions,
  deleteSession,
  type SessionMetadata } from
'@/lib/api/sessions';
import { formatDistanceToNow } from 'date-fns';import { Button } from "@/components/ui/button";

interface SavedSessionsListProps {
  userId: string;
  onResumeSession?: (sessionId: string) => void;
  pageSize?: number;
  statusFilter?: 'active' | 'paused' | 'complete';
}

export function SavedSessionsList({
  userId,
  onResumeSession,
  pageSize = 10,
  statusFilter
}: SavedSessionsListProps) {
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [userId, page, statusFilter]);

  async function loadSessions() {
    try {
      setLoading(true);
      setError(null);
      const response = await listIncompleteSessions(userId, {
        limit: pageSize,
        offset: page * pageSize,
        status: statusFilter
      });
      setSessions(response.sessions);
      setTotal(response.total);
    } catch (err) {
      setError('Error loading sessions. Please try again.');
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(sessionId: string) {
    try {
      setDeletingId(sessionId);
      await deleteSession(sessionId);
      setShowDeleteConfirm(null);
      // Reload sessions after deletion
      await loadSessions();
    } catch (err) {
      setError('Failed to delete session. Please try again.');
      console.error('Failed to delete session:', err);
    } finally {
      setDeletingId(null);
    }
  }

  function handleResume(sessionId: string) {
    if (onResumeSession) {
      onResumeSession(sessionId);
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-300';
      case 'paused':
        return 'bg-yellow-900 text-yellow-300';
      case 'complete':
        return 'bg-blue-900 text-blue-300';
      default:
        return 'bg-gray-900 text-gray-300';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-green-400">
          Loading saved sessions...
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-400">{error}</div>
      </div>);

  }

  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400 text-center">
          <p className="text-xl mb-2">No saved sessions found</p>
          <p className="text-sm">Start a new reading to create a session</p>
        </div>
      </div>);

  }

  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {sessions.map((session) =>
        <div
          key={session.id}
          className="bg-black/40 border border-green-900/50 rounded-lg p-4 hover:border-green-700/70 transition-colors">

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-green-400 font-semibold truncate">
                  {session.question}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                  <span className="capitalize">{session.spread_type.replace('-', ' ')}</span>
                  <span>•</span>
                  <span
                  className={`px-2 py-0.5 rounded text-xs ${getStatusColor(
                    session.status
                  )}`}>

                    {session.status}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Updated {formatDistanceToNow(new Date(session.updated_at))} ago
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="link"
              onClick={() => handleResume(session.id)}
              className="px-4 py-2 rounded transition-colors"
              aria-label="Resume session">

                  Resume
                </Button>
                <Button size="icon" variant="link"
              onClick={() => setShowDeleteConfirm(session.id)}
              className="px-4 py-2 rounded transition-colors"
              aria-label="Delete session"
              disabled={deletingId === session.id}>

                  {deletingId === session.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>

            {/* Delete confirmation */}
            {showDeleteConfirm === session.id &&
          <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded">
                <p className="text-red-300 text-sm mb-3">
                  Are you sure you want to delete this session? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="link"
              onClick={() => handleDelete(session.id)}
              className="px-3 py-1 rounded"
              aria-label="Confirm deletion">

                    Confirm
                  </Button>
                  <Button size="sm" variant="link"
              onClick={() => setShowDeleteConfirm(null)}
              className="px-3 py-1 rounded">

                    Cancel
                  </Button>
                </div>
              </div>
          }
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 &&
      <div className="flex items-center justify-between pt-4 border-t border-green-900/50">
          <div className="text-sm text-gray-400">
            Page {page + 1} of {totalPages} ({total} total)
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="link"
          onClick={() => setPage(page - 1)}
          disabled={!hasPrevPage}
          className="px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous page">

              Previous
            </Button>
            <Button size="sm" variant="link"
          onClick={() => setPage(page + 1)}
          disabled={!hasNextPage}
          className="px-4 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next page">

              Next
            </Button>
          </div>
        </div>
      }
    </div>);

}