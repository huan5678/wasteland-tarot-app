/**
 * CredentialCard Component
 * 顯示單個 Passkey Credential 的資訊卡片（Fallout 主題）
 *
 * 功能：
 * - 顯示 credential 名稱、建立日期、最後使用日期
 * - 顯示裝置類型圖示（依 transports 推測）
 * - 顯示 transports、authenticator_attachment、counter
 * - 提供編輯和刪除操作
 * - Pip-Boy 廢土主題 UI
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PixelIcon } from '@/components/ui/icons';
import type { CredentialInfo } from '@/lib/webauthn/types';

/**
 * Props
 */
interface CredentialCardProps {
  credential: CredentialInfo & { counter?: number };
  onEdit: (credential: CredentialInfo) => void;
  onDelete: (credential: CredentialInfo) => void;
}

/**
 * 根據 transports 推測裝置類型圖示
 */
function getDeviceIcon(transports: AuthenticatorTransport[]): string {
  if (transports.includes('usb')) return 'usb';
  if (transports.includes('nfc')) return 'nfc';
  if (transports.includes('ble')) return 'bluetooth';
  if (transports.includes('internal')) return 'fingerprint';
  return 'fingerprint'; // 預設圖示
}

/**
 * 格式化 transports 為中文顯示
 */
function formatTransports(transports: AuthenticatorTransport[]): string {
  const transportMap: Record<string, string> = {
    internal: '平台內建',
    usb: 'USB',
    nfc: 'NFC',
    ble: '藍牙',
  };

  return transports.map((t) => transportMap[t] || t).join(', ');
}

/**
 * 格式化日期為本地時間
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 截斷 Credential ID 顯示
 */
function truncateCredentialId(id: string): string {
  if (id.length <= 16) return id;
  return `${id.substring(0, 16)}...`;
}

/**
 * CredentialCard 元件
 */
export function CredentialCard({ credential, onEdit, onDelete }: CredentialCardProps) {
  const deviceIcon = getDeviceIcon(credential.transports);
  const transportsText = formatTransports(credential.transports);

  return (
    <Card className="border-pip-boy-green border-2 bg-background-card hover:border-radiation-orange transition-colors">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-pip-boy-green/10 border border-pip-boy-green/30">
            <PixelIcon name={deviceIcon} sizePreset="md" variant="primary" decorative />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-pip-boy-green">{credential.name}</h3>
            <p className="text-sm text-text-muted">{credential.falloutDeviceName}</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(credential)}
            className="hover:bg-pip-boy-green/10"
            aria-label="編輯 Passkey 名稱"
          >
            <PixelIcon name="edit" sizePreset="xs" variant="primary" />
            <span className="ml-1">編輯</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(credential)}
            className="hover:bg-error/10 hover:text-error"
            aria-label="刪除 Passkey"
          >
            <PixelIcon name="trash" sizePreset="xs" variant="error" />
            <span className="ml-1">刪除</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Credential ID（截斷顯示） */}
        <div className="text-xs text-text-muted font-mono">
          <span className="text-pip-boy-green">ID:</span> {truncateCredentialId(credential.id)}
        </div>

        {/* 建立日期 */}
        <div className="flex items-center text-sm">
          <PixelIcon name="calendar" sizePreset="xs" variant="muted" decorative />
          <span className="ml-2 text-text-muted">建立於：</span>
          <span className="ml-1 text-text-primary">{formatDate(credential.createdAt)}</span>
        </div>

        {/* 最後使用日期 */}
        <div className="flex items-center text-sm">
          <PixelIcon name="clock" sizePreset="xs" variant="muted" decorative />
          <span className="ml-2 text-text-muted">最後使用：</span>
          {credential.lastUsedAt ? (
            <span className="ml-1 text-text-primary">{formatDate(credential.lastUsedAt)}</span>
          ) : (
            <span className="ml-1 text-warning">從未使用</span>
          )}
        </div>

        {/* Transports */}
        <div className="flex items-center text-sm">
          <PixelIcon name="connection" sizePreset="xs" variant="muted" decorative />
          <span className="ml-2 text-text-muted">連線方式：</span>
          <span className="ml-1 text-text-primary">{transportsText}</span>
        </div>

        {/* 裝置類型 */}
        <div className="flex items-center text-sm">
          <PixelIcon name="device" sizePreset="xs" variant="muted" decorative />
          <span className="ml-2 text-text-muted">裝置類型：</span>
          <span className="ml-1 text-text-primary">
            {credential.deviceType === 'platform' ? '平台認證器' : '可移除認證器'}
          </span>
        </div>

        {/* Counter（如果有） */}
        {credential.counter !== undefined && (
          <div className="flex items-center text-sm">
            <PixelIcon name="hash" sizePreset="xs" variant="muted" decorative />
            <span className="ml-2 text-text-muted">使用次數：</span>
            <span className="ml-1 text-text-primary">{credential.counter}</span>
          </div>
        )}

        {/* 廢土風格分隔線 */}
        <div className="pt-2 border-t border-pip-boy-green/20" />

        {/* 狀態指示器 */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                credential.lastUsedAt
                  ? 'bg-pip-boy-green animate-pulse'
                  : 'bg-text-muted/50'
              }`}
            />
            <span className="text-text-muted">
              {credential.lastUsedAt ? '已啟用' : '未使用'}
            </span>
          </div>

          <div className="text-text-muted">
            [{credential.deviceType === 'platform' ? 'PLATFORM' : 'ROAMING'}]
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
