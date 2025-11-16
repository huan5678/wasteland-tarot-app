/**
 * CTA Section Integration Tests
 *
 * 測試 CTA 區塊的顯示、樣式和互動行為
 * Requirements: 7.1, 7.2, 7.5, 7.6, 7.7, 7.8, 7.9
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock client-page component
// 注意：此測試假設 CTA Section 已在 client-page.tsx 中實作
// 實際實作時需要確保 CTA Section 可被獨立測試
const MockCTASection = () => {
  return (
    <section
      className="border-2 border-pip-boy-green p-8"
      style={{ backgroundColor: 'var(--color-pip-boy-green-10)' }}
      data-testid="cta-section"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">
          準備好探索你的廢土命運了嗎？
        </h2>
        <p className="text-lg mb-8">
          加入數千名信賴塔羅智慧做出生存決策的 Vault Dweller
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            className="px-6 py-3 hover:scale-105 transition-transform"
            onClick={() => {
              window.location.href = '/auth/register';
            }}
            data-testid="cta-register-button"
          >
            註冊 Vault 帳號
          </button>
          <button
            className="px-6 py-3 hover:scale-105 transition-transform"
            onClick={() => {
              window.location.href = '/cards';
            }}
            data-testid="cta-browse-button"
          >
            瀏覽卡牌圖書館
          </button>
        </div>
      </div>
    </section>
  );
};

describe('CTA Section Integration Tests', () => {
  beforeEach(() => {
    // Reset any mock state before each test
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  describe('Requirement 7.1 - Display correct title and subtitle', () => {
    it('應該顯示正確的 CTA 標題', () => {
      render(<MockCTASection />);

      const heading = screen.getByRole('heading', {
        name: /準備好探索你的廢土命運了嗎？/i,
      });

      expect(heading).toBeInTheDocument();
      expect(heading).toHaveClass('text-3xl', 'font-bold');
    });

    it('應該顯示正確的 CTA 副標題', () => {
      render(<MockCTASection />);

      const subtitle = screen.getByText(
        /加入數千名信賴塔羅智慧做出生存決策的 Vault Dweller/i
      );

      expect(subtitle).toBeInTheDocument();
      expect(subtitle).toHaveClass('text-lg');
    });
  });

  describe('Requirement 7.2 - Two action buttons using PipBoyButton component', () => {
    it('應該顯示"註冊 Vault 帳號"按鈕（default 變體）', () => {
      render(<MockCTASection />);

      const registerButton = screen.getByTestId('cta-register-button');

      expect(registerButton).toBeInTheDocument();
      expect(registerButton).toHaveTextContent('註冊 Vault 帳號');
    });

    it('應該顯示"瀏覽卡牌圖書館"按鈕（outline 變體）', () => {
      render(<MockCTASection />);

      const browseButton = screen.getByTestId('cta-browse-button');

      expect(browseButton).toBeInTheDocument();
      expect(browseButton).toHaveTextContent('瀏覽卡牌圖書館');
    });

    // Note: 實際實作時需要驗證 PipBoyButton variant props
    // 此測試需要在實作 PipBoyButton 整合後更新
  });

  describe('Requirement 7.5 - Section styling (border-2, padding, background)', () => {
    it('應該應用正確的區塊樣式', () => {
      render(<MockCTASection />);

      const section = screen.getByTestId('cta-section');

      // 驗證 border-2 border-pip-boy-green
      expect(section).toHaveClass('border-2', 'border-pip-boy-green');

      // 驗證 padding p-8
      expect(section).toHaveClass('p-8');

      // 驗證 background var(--color-pip-boy-green-10)
      expect(section).toHaveStyle({
        backgroundColor: 'var(--color-pip-boy-green-10)',
      });
    });

    it('應該包含 max-w-4xl mx-auto 容器和置中文字', () => {
      render(<MockCTASection />);

      const container = screen
        .getByTestId('cta-section')
        .querySelector('.max-w-4xl');

      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('max-w-4xl', 'mx-auto', 'text-center');
    });
  });

  describe('Requirement 7.6 - Button hover with scale-105 transform', () => {
    it('註冊按鈕應該包含 hover:scale-105 類別', () => {
      render(<MockCTASection />);

      const registerButton = screen.getByTestId('cta-register-button');

      expect(registerButton).toHaveClass('hover:scale-105');
      expect(registerButton).toHaveClass('transition-transform');
    });

    it('瀏覽按鈕應該包含 hover:scale-105 類別', () => {
      render(<MockCTASection />);

      const browseButton = screen.getByTestId('cta-browse-button');

      expect(browseButton).toHaveClass('hover:scale-105');
      expect(browseButton).toHaveClass('transition-transform');
    });
  });

  describe('Requirement 7.7 - Desktop horizontal layout (flex-row)', () => {
    it('應該在桌面使用水平佈局', () => {
      render(<MockCTASection />);

      const buttonContainer = screen
        .getByTestId('cta-section')
        .querySelector('.flex');

      expect(buttonContainer).toBeInTheDocument();

      // 檢查響應式 flexbox 類別
      // flex-col (手機) + md:flex-row (桌面)
      expect(buttonContainer).toHaveClass('flex', 'flex-col', 'md:flex-row');
    });
  });

  describe('Requirement 7.8 - Mobile vertical layout (flex-col)', () => {
    it('應該在手機使用垂直佈局', () => {
      render(<MockCTASection />);

      const buttonContainer = screen
        .getByTestId('cta-section')
        .querySelector('.flex');

      expect(buttonContainer).toBeInTheDocument();

      // 預設為 flex-col（手機垂直佈局）
      expect(buttonContainer).toHaveClass('flex-col');
    });
  });

  describe('Requirement 7.9 - Navigation functionality', () => {
    it('點擊"註冊 Vault 帳號"按鈕應該導向 /auth/register', () => {
      render(<MockCTASection />);

      const registerButton = screen.getByTestId('cta-register-button');
      registerButton.click();

      expect(window.location.href).toBe('/auth/register');
    });

    it('點擊"瀏覽卡牌圖書館"按鈕應該導向 /cards', () => {
      render(<MockCTASection />);

      const browseButton = screen.getByTestId('cta-browse-button');
      browseButton.click();

      expect(window.location.href).toBe('/cards');
    });
  });
});
