/**
 * CredentialCard 元件測試
 * 測試單個 Credential 卡片的顯示和操作
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { CredentialCard } from '../CredentialCard';
import type { CredentialInfo } from '@/lib/webauthn/types';

// Mock PixelIcon
vi.mock('@/components/ui/icons', () => ({
  PixelIcon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`}>{name}</span>,
}));

describe('CredentialCard', () => {
  const mockCredential: CredentialInfo = {
    id: 'cred-1',
    name: 'MacBook Touch ID',
    createdAt: '2025-01-01T10:00:00Z',
    lastUsedAt: '2025-10-27T12:00:00Z',
    deviceType: 'platform',
    transports: ['internal'],
    falloutDeviceName: 'Pip-Boy 生物掃描器 (平台)',
  };

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  describe('基本渲染', () => {
    it('應該顯示 credential 名稱', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('MacBook Touch ID')).toBeInTheDocument();
    });

    it('應該顯示建立日期', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/建立於/)).toBeInTheDocument();
      expect(screen.getByText(/2025-01-01/)).toBeInTheDocument();
    });

    it('應該顯示最後使用日期', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/最後使用/)).toBeInTheDocument();
      expect(screen.getByText(/2025-10-27/)).toBeInTheDocument();
    });

    it('應該在無最後使用日期時顯示「從未使用」', () => {
      const neverUsedCredential = {
        ...mockCredential,
        lastUsedAt: undefined,
      };

      render(
        <CredentialCard
          credential={neverUsedCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/從未使用/)).toBeInTheDocument();
    });

    it('應該顯示 Fallout 裝置名稱', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Pip-Boy 生物掃描器 (平台)')).toBeInTheDocument();
    });
  });

  describe('裝置類型圖示', () => {
    it('應該顯示平台裝置 (internal) 的指紋圖示', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('icon-fingerprint')).toBeInTheDocument();
    });

    it('應該顯示 USB 裝置的 USB 圖示', () => {
      const usbCredential = {
        ...mockCredential,
        deviceType: 'cross-platform' as const,
        transports: ['usb'] as AuthenticatorTransport[],
        falloutDeviceName: 'Vault-Tec 安全金鑰 (USB)',
      };

      render(
        <CredentialCard
          credential={usbCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('icon-usb')).toBeInTheDocument();
    });

    it('應該顯示 NFC 裝置的 NFC 圖示', () => {
      const nfcCredential = {
        ...mockCredential,
        deviceType: 'cross-platform' as const,
        transports: ['nfc'] as AuthenticatorTransport[],
        falloutDeviceName: 'Vault-Tec 安全金鑰 (NFC)',
      };

      render(
        <CredentialCard
          credential={nfcCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('icon-nfc')).toBeInTheDocument();
    });

    it('應該顯示藍牙裝置的藍牙圖示', () => {
      const bleCredential = {
        ...mockCredential,
        deviceType: 'cross-platform' as const,
        transports: ['ble'] as AuthenticatorTransport[],
        falloutDeviceName: 'Vault-Tec 安全金鑰 (藍牙)',
      };

      render(
        <CredentialCard
          credential={bleCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByTestId('icon-bluetooth')).toBeInTheDocument();
    });
  });

  describe('操作按鈕', () => {
    it('應該顯示編輯按鈕', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByRole('button', { name: /編輯/i })).toBeInTheDocument();
    });

    it('應該顯示刪除按鈕', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByRole('button', { name: /刪除/i })).toBeInTheDocument();
    });

    it('應該在點擊編輯按鈕時呼叫 onEdit', async () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const editButton = screen.getByRole('button', { name: /編輯/i });
      await userEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledWith(mockCredential);
    });

    it('應該在點擊刪除按鈕時呼叫 onDelete', async () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /刪除/i });
      await userEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockCredential);
    });
  });

  describe('Fallout 主題樣式', () => {
    it('應該使用 Pip-Boy 綠色邊框', () => {
      const { container } = render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('border-pip-boy-green');
    });

    it('應該使用廢土風格背景', () => {
      const { container } = render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('bg-background-card');
    });
  });

  describe('Transports 顯示', () => {
    it('應該顯示多個 transports', () => {
      const multiTransportCredential = {
        ...mockCredential,
        deviceType: 'cross-platform' as const,
        transports: ['usb', 'nfc', 'ble'] as AuthenticatorTransport[],
        falloutDeviceName: 'Vault-Tec 多功能安全金鑰',
      };

      render(
        <CredentialCard
          credential={multiTransportCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/USB/)).toBeInTheDocument();
      expect(screen.getByText(/NFC/)).toBeInTheDocument();
      expect(screen.getByText(/藍牙/)).toBeInTheDocument();
    });

    it('應該正確顯示 internal transport', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/平台內建/)).toBeInTheDocument();
    });
  });

  describe('Counter 顯示', () => {
    it('應該顯示使用次數', () => {
      const credentialWithCounter = {
        ...mockCredential,
        counter: 42,
      } as CredentialInfo & { counter?: number };

      render(
        <CredentialCard
          credential={credentialWithCounter}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/使用次數：42/)).toBeInTheDocument();
    });

    it('應該在無 counter 時不顯示使用次數', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText(/使用次數/)).not.toBeInTheDocument();
    });
  });

  describe('Credential ID 顯示', () => {
    it('應該截斷顯示 credential ID', () => {
      render(
        <CredentialCard
          credential={mockCredential}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // 應該顯示截斷的 ID（前 16 字元 + "..."）
      expect(screen.getByText(/ID:/)).toBeInTheDocument();
      expect(screen.getByText(/cred-1/)).toBeInTheDocument();
    });
  });
});
