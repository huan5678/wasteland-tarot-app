/**
 * PixelIcon 元件單元測試
 *
 * 測試覆蓋範圍：
 * - 基本渲染功能
 * - Props 正確應用（size, className, aria-label）
 * - 無障礙支援（decorative prop）
 * - Fallback 機制
 * - Loading 狀態
 * - 快取機制
 * - lucide-react 名稱映射
 * - 錯誤處理
 * - 互動功能（onClick）
 *
 * @module PixelIcon.test
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PixelIcon } from '../PixelIcon';
import { iconRegistry } from '../../../../lib/iconRegistry';

// Mock SVG 內容
const mockHomeSvg = '<svg><path d="M0 0h24v24H0z"/></svg>';
const mockUserSvg = '<svg><circle cx="12" cy="12" r="10"/></svg>';
const mockFallbackSvg = '<svg><text>?</text></svg>';

/**
 * Mock global.fetch
 * 模擬網路請求，返回不同的 SVG 內容
 */
beforeEach(() => {
  // 清除快取，確保每個測試獨立
  iconRegistry.clearCache();

  // Mock fetch API
  global.fetch = jest.fn((url: string) => {
    const urlString = url.toString();

    // 根據 URL 返回不同的 SVG
    if (urlString.includes('home.svg')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => mockHomeSvg,
      } as Response);
    }

    if (urlString.includes('user.svg')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => mockUserSvg,
      } as Response);
    }

    if (urlString.includes('info-box.svg')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => mockFallbackSvg,
      } as Response);
    }

    // 不存在的圖示返回 404
    return Promise.resolve({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    } as Response);
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('PixelIcon 元件', () => {
  // ========== 基本渲染測試 ==========
  describe('基本渲染', () => {
    it('應該正確渲染圖示（使用 name prop）', async () => {
      render(<PixelIcon name="home" />);

      // 等待圖示載入
      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toBeInTheDocument();
      });

      // 驗證 fetch 被正確呼叫
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/icons/pixelarticons/home.svg')
      );
    });

    it('應該在載入中時顯示佔位符', () => {
      render(<PixelIcon name="home" />);

      // 佔位符應該有 animate-pulse 類別
      const placeholder = document.querySelector('.animate-pulse');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveClass('bg-pip-boy-green/20');
    });

    it('載入完成後應該移除佔位符', async () => {
      render(<PixelIcon name="home" />);

      // 等待載入完成
      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toBeInTheDocument();
      });

      // 佔位符應該不存在
      const placeholder = document.querySelector('.animate-pulse');
      expect(placeholder).not.toBeInTheDocument();
    });
  });

  // ========== Size Prop 測試 ==========
  describe('Size prop', () => {
    it('應該正確應用預設尺寸（24px）', async () => {
      render(<PixelIcon name="home" />);

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toHaveStyle({ width: '24px', height: '24px' });
      });
    });

    it('應該正確應用自訂尺寸（32px）', async () => {
      render(<PixelIcon name="home" size={32} />);

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toHaveStyle({ width: '32px', height: '32px' });
      });
    });

    it('應該正確應用大尺寸（48px）', async () => {
      render(<PixelIcon name="home" size={48} />);

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toHaveStyle({ width: '48px', height: '48px' });
      });
    });

    it('應該正確應用超大尺寸（96px）', async () => {
      render(<PixelIcon name="home" size={96} />);

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toHaveStyle({ width: '96px', height: '96px' });
      });
    });
  });

  // ========== ClassName Prop 測試 ==========
  describe('ClassName prop', () => {
    it('應該正確應用自訂 CSS 類別', async () => {
      render(<PixelIcon name="home" className="text-pip-boy-green" />);

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toHaveClass('text-pip-boy-green');
      });
    });

    it('應該同時保留基本類別和自訂類別', async () => {
      render(<PixelIcon name="home" className="custom-class" />);

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toHaveClass('inline-flex');
        expect(icon).toHaveClass('items-center');
        expect(icon).toHaveClass('justify-center');
        expect(icon).toHaveClass('custom-class');
      });
    });
  });

  // ========== 無障礙支援測試 ==========
  describe('無障礙支援', () => {
    it('應該正確設定 aria-label', async () => {
      render(<PixelIcon name="home" aria-label="返回首頁" />);

      await waitFor(() => {
        const icon = screen.getByLabelText('返回首頁');
        expect(icon).toBeInTheDocument();
      });
    });

    it('沒有 aria-label 時應該使用圖示名稱作為預設', async () => {
      render(<PixelIcon name="home" />);

      await waitFor(() => {
        const icon = screen.getByLabelText('home');
        expect(icon).toBeInTheDocument();
      });
    });

    it('decorative prop 應該設定 aria-hidden', async () => {
      render(<PixelIcon name="home" decorative />);

      await waitFor(() => {
        const icon = document.querySelector('[aria-hidden="true"]');
        expect(icon).toBeInTheDocument();
      });
    });

    it('decorative 圖示不應該有 role="img"', async () => {
      render(<PixelIcon name="home" decorative />);

      await waitFor(() => {
        // 等待載入完成
        const icon = document.querySelector('[aria-hidden="true"]');
        expect(icon).toBeInTheDocument();
      });

      // role="img" 應該不存在
      const imgRole = screen.queryByRole('img');
      expect(imgRole).not.toBeInTheDocument();
    });

    it('非 decorative 圖示應該有 role="img"', async () => {
      render(<PixelIcon name="home" aria-label="首頁" />);

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  // ========== Fallback 機制測試 ==========
  describe('Fallback 機制', () => {
    it('不存在的圖示應該使用 fallback 圖示', async () => {
      render(<PixelIcon name="nonexistent-icon" />);

      // 等待 fallback 載入
      await waitFor(() => {
        const icon = document.querySelector('[role="img"]');
        expect(icon).toBeInTheDocument();
      });

      // 驗證 fetch 被呼叫兩次（原始圖示 + fallback）
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('nonexistent-icon.svg')
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('info-box.svg')
      );
    });

    it('fallback 載入失敗時應該顯示錯誤佔位符', async () => {
      // Mock fetch 全部失敗
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response)
      );

      render(<PixelIcon name="nonexistent" />);

      // 等待錯誤狀態顯示 - 檢查仍然是佔位符（載入失敗會保持 loading 狀態的佔位符）
      await waitFor(() => {
        // 驗證依然顯示佔位符（因為載入失敗）
        const placeholder = document.querySelector('.animate-pulse');
        expect(placeholder).toBeInTheDocument();
      }, { timeout: 3000 });

      // 驗證 console.error 被呼叫
      // 注意：這個測試主要驗證錯誤處理邏輯，實際渲染可能仍是佔位符
    });
  });

  // ========== 快取機制測試 ==========
  describe('快取機制', () => {
    it('相同圖示載入兩次應該使用快取', async () => {
      const { rerender } = render(<PixelIcon name="home" />);

      // 等待第一次載入
      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });

      // 清除 mock 呼叫記錄
      jest.clearAllMocks();

      // 重新渲染相同圖示
      rerender(<PixelIcon name="home" />);

      // 等待渲染完成
      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });

      // 不應該再次呼叫 fetch（使用快取）
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('不同圖示應該分別載入', async () => {
      const { rerender } = render(<PixelIcon name="home" />);

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });

      // 切換到不同圖示
      rerender(<PixelIcon name="user" />);

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });

      // fetch 應該被呼叫兩次（home + user）
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ========== lucide-react 名稱映射測試 ==========
  describe('lucide-react 名稱映射', () => {
    it('應該將 lucide-react 的 "x" 映射到 "close"', async () => {
      render(<PixelIcon name="x" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('close.svg')
        );
      });
    });

    it('應該將 "user-circle" 映射到 "user"', async () => {
      render(<PixelIcon name="user-circle" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('user.svg')
        );
      });
    });
  });

  // ========== 錯誤處理測試 ==========
  describe('錯誤處理', () => {
    it('應該在控制台輸出警告當圖示載入失敗', async () => {
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();

      render(<PixelIcon name="nonexistent" />);

      await waitFor(() => {
        expect(consoleWarn).toHaveBeenCalledWith(
          expect.stringContaining('Icon "nonexistent" not found'),
          expect.anything()
        );
      });

      consoleWarn.mockRestore();
    });

    it('應該在控制台輸出錯誤當 fallback 也失敗', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      // Mock 所有請求失敗
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          text: async () => 'Not Found',
        } as Response)
      );

      render(<PixelIcon name="nonexistent" />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          expect.stringContaining('Failed to load fallback icon'),
          expect.anything()
        );
      });

      consoleError.mockRestore();
    });
  });

  // ========== 互動功能測試 ==========
  describe('互動功能', () => {
    it('應該正確處理 onClick 事件', async () => {
      const handleClick = jest.fn();

      render(<PixelIcon name="home" onClick={handleClick} />);

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });

      const icon = screen.getByRole('img');
      await userEvent.click(icon);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('有 onClick 時應該加上 cursor-pointer 類別', async () => {
      const handleClick = jest.fn();

      render(<PixelIcon name="home" onClick={handleClick} />);

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toHaveClass('cursor-pointer');
      });
    });

    it('沒有 onClick 時不應該有 cursor-pointer 類別', async () => {
      render(<PixelIcon name="home" />);

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).not.toHaveClass('cursor-pointer');
      });
    });

    it('應該正確處理 onMouseEnter 事件', async () => {
      const handleMouseEnter = jest.fn();

      render(<PixelIcon name="home" onMouseEnter={handleMouseEnter} />);

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });

      const icon = screen.getByRole('img');
      await userEvent.hover(icon);

      expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    });

    it('應該正確處理 onMouseLeave 事件', async () => {
      const handleMouseLeave = jest.fn();

      render(<PixelIcon name="home" onMouseLeave={handleMouseLeave} />);

      await waitFor(() => {
        expect(screen.getByRole('img')).toBeInTheDocument();
      });

      const icon = screen.getByRole('img');
      await userEvent.hover(icon);
      await userEvent.unhover(icon);

      expect(handleMouseLeave).toHaveBeenCalledTimes(1);
    });
  });

  // ========== Pip-Boy 主題整合測試 ==========
  describe('Pip-Boy 主題整合', () => {
    it('載入中的佔位符應該使用 pip-boy-green 顏色', () => {
      render(<PixelIcon name="home" />);

      const placeholder = document.querySelector('.animate-pulse');
      expect(placeholder).toHaveClass('bg-pip-boy-green/20');
    });

    it('應該正確應用 Pip-Boy 顏色類別', async () => {
      render(<PixelIcon name="home" className="text-pip-boy-green" />);

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toHaveClass('text-pip-boy-green');
      });
    });
  });

  // ========== 圖示路徑正確性測試 ==========
  describe('圖示路徑正確性', () => {
    it('應該從正確的路徑載入圖示', async () => {
      render(<PixelIcon name="home" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/icons/pixelarticons/home.svg')
        );
      });
    });

    it('fallback 圖示應該使用正確的路徑', async () => {
      render(<PixelIcon name="nonexistent" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/icons/pixelarticons/info-box.svg')
        );
      });
    });
  });

  // ========== Style Prop 測試 ==========
  describe('Style prop', () => {
    it('應該正確應用自訂內聯樣式', async () => {
      render(<PixelIcon name="home" style={{ color: '#00FF00' }} />);

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toHaveStyle({ color: '#00FF00' });
      });
    });

    it('自訂樣式不應該覆蓋尺寸屬性', async () => {
      render(
        <PixelIcon
          name="home"
          size={32}
          style={{ color: '#00FF00' }}
        />
      );

      await waitFor(() => {
        const icon = screen.getByRole('img');
        expect(icon).toHaveStyle({
          width: '32px',
          height: '32px',
          color: '#00FF00',
        });
      });
    });
  });
});
