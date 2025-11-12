/**
 * IncompleteSessionsList - Display and manage resumable sessions
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/lib/sessionStore';
import { PixelIcon } from '@/components/ui/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle } from
'@/components/ui/dialog';
import type { SessionMetadata } from '@/types/session';import { Button } from "@/components/ui/button";

export function IncompleteSessionsList() {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SessionMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    incompleteSessions,
    totalSessions,
    isLoading,
    loadIncompleteSessions,
    resumeSession,
    deleteSession
  } = useSessionStore();

  useEffect(() => {
    loadIncompleteSessions();
  }, [loadIncompleteSessions]);

  const handleResume = async (id: string) => {
    try {
      await resumeSession(id);
      router.push('/readings/new');
    } catch (error) {
      console.error('恢復會話失敗:', error);
    }
  };

  const handleDeleteClick = (session: SessionMetadata, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(session);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;

    setIsDeleting(true);
    try {
      await deleteSession(sessionToDelete.id);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    } catch (error) {
      console.error('刪除會話失敗:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} 天前`;
    } else if (diffHours > 0) {
      return `${diffHours} 小時前`;
    } else if (diffMins > 0) {
      return `${diffMins} 分鐘前`;
    } else {
      return '剛剛';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-pip-boy-green">載入會話...</p>
      </div>);

  }

  if (incompleteSessions.length === 0) {
    return (
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-8 text-center">
        <PixelIcon name="time" sizePreset="lg" variant="muted" className="mx-auto mb-3 opacity-50" decorative />
        <p className="text-pip-boy-green/70">
          目前沒有未完成的占卜會話
        </p>
        <p className="text-pip-boy-green/50 text-sm mt-2">
          開始新的占卜，系統會自動為你儲存進度
        </p>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-pip-boy-green">
            未完成的占卜 ({totalSessions})
          </h3>
        </div>

        <div className="space-y-3">
          {incompleteSessions.map((session) =>
          <SessionCard
            key={session.id}
            session={session}
            onResume={() => handleResume(session.id)}
            onDelete={(e) => handleDeleteClick(session, e)}
            formatDate={formatDate} />

          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog - Fallout Style */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="border-2 border-pip-boy-green bg-black/95 text-pip-boy-green shadow-[0_0_30px_rgba(0,255,136,0.3)]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <PixelIcon
                name="alert-triangle"
                sizePreset="lg"
                variant="warning"
                animation="pulse"
                decorative />

              <DialogTitle className="text-xl font-bold text-pip-boy-green uppercase tracking-wider">
                ⚠️ 警告：刪除會話
              </DialogTitle>
            </div>
            <DialogDescription className="text-pip-boy-green/80 text-sm mt-3 border-l-2 border-pip-boy-green/30 pl-3">
              此操作無法復原。會話資料將永久移除。
            </DialogDescription>
          </DialogHeader>

          {sessionToDelete &&
          <div className="border border-pip-boy-green/30 bg-pip-boy-green/5 p-4 my-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-pip-boy-green/70">牌陣類型：</span>
                <span className="text-pip-boy-green font-semibold">{sessionToDelete.spread_type}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <span className="text-pip-boy-green/70 whitespace-nowrap">問題：</span>
                <span className="text-pip-boy-green">{sessionToDelete.question}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-pip-boy-green/50">
                <PixelIcon name="clock" sizePreset="xs" variant="muted" decorative />
                <span>建立於 {new Date(sessionToDelete.created_at).toLocaleString('zh-TW')}</span>
              </div>
            </div>
          }

          <DialogFooter className="gap-3">
            <Button size="sm" variant="outline"
            onClick={handleCancelDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 uppercase font-bold tracking-wider">

              <span className="flex items-center justify-center gap-2">
                <PixelIcon name="close" sizePreset="xs" variant="default" decorative />
                取消
              </span>
            </Button>
            <Button size="sm" variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 uppercase font-bold tracking-wider">

              {isDeleting ?
              <span className="flex items-center justify-center gap-2">
                  <PixelIcon name="loader-4" sizePreset="xs" animation="spin" variant="error" decorative />
                  刪除中...
                </span> :

              <span className="flex items-center justify-center gap-2">
                  <PixelIcon name="trash" sizePreset="xs" variant="error" decorative />
                  確認刪除
                </span>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);

}

function SessionCard({
  session,
  onResume,
  onDelete,
  formatDate





}: {session: SessionMetadata;onResume: () => void;onDelete: (e: React.MouseEvent) => void;formatDate: (date: string) => string;}) {
  return (
    <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-all duration-200 p-4 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-pip-boy-green/20 border border-pip-boy-green/50 text-pip-boy-green text-xs rounded">
              {session.spread_type}
            </span>
            <span className="text-pip-boy-green/50 text-xs">
              {formatDate(session.updated_at)}
            </span>
          </div>

          <p className="text-pip-boy-green text-sm line-clamp-2 mb-2">
            {session.question}
          </p>

          <div className="flex items-center gap-2 text-xs text-pip-boy-green/70">
            <PixelIcon name="clock" sizePreset="xs" variant="muted" decorative />
            <span>建立於 {new Date(session.created_at).toLocaleDateString('zh-TW')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline"
          onClick={onResume}
          className="flex items-center gap-1.5 px-3 py-2 border transition-colors"
          title="恢復會話">

            <PixelIcon name="play" sizePreset="xs" variant="success" decorative />
            <span>恢復</span>
          </Button>

          <Button size="icon" variant="outline"
          onClick={onDelete}
          className="p-2 border transition-colors"
          title="刪除會話">

            <PixelIcon name="trash" sizePreset="xs" variant="error" decorative />
          </Button>
        </div>
      </div>
    </div>);

}