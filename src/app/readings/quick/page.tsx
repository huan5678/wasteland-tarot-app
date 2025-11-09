'use client';

/**
 * 快速占卜頁面 - 供訪客使用，無需登入
 *
 * 功能：
 * - 允許未登入用戶體驗占卜功能
 * - Carousel 瀏覽與翻牌互動
 * - localStorage 狀態持久化
 * - Modal 解牌介面與語音播放
 * - CTA 導流至註冊/登入
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PixelIcon } from '@/components/ui/icons';
import { enhancedWastelandCards } from '@/data/enhancedCards';
import type { DetailedTarotCard } from '@/components/tarot/CardDetailModal';
import { QuickReadingStorage } from '@/lib/quickReadingStorage';
import { CarouselContainer } from '@/components/readings/CarouselContainer';
import { useDailyCardBackContext } from '@/components/providers/DailyCardBackProvider';
import { Button } from "@/components/ui/button";
import { TarotCard } from '@/components/tarot/TarotCard';
import { CardDetailModal } from '@/components/tarot/CardDetailModal';
import { useIsMobile } from '@/hooks/useMediaQuery';

// 初始化 storage 服務
const storage = new QuickReadingStorage();

export default function QuickReadingPage() {
  const router = useRouter();
  const isMobile = useIsMobile(); // 偵測移動端/桌面端 (< 640px)

  // 取得每日隨機卡背
  const { cardBackPath, isLoading: isCardBackLoading } = useDailyCardBackContext();
  const displayCardBackUrl = isCardBackLoading ? '/assets/cards/card-backs/01.png' : cardBackPath;

  // 狀態管理
  const [cardPool, setCardPool] = useState<DetailedTarotCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(Date.now()); // 用於強制重新掛載卡片

  /**
   * 從 enhancedCards 中隨機選取 3-5 張大阿爾克納
   */
  const initializeCardPool = useCallback((): DetailedTarotCard[] => {
    // 篩選大阿爾克納
    const majorArcana = enhancedWastelandCards.filter(
      (card) => card.suit === 'major_arcana' // 修正：使用 API 枚舉值
    );

    if (majorArcana.length === 0) {
      console.error('No Major Arcana cards found in enhancedWastelandCards');
      setError('卡牌資料載入失敗');
      return [];
    }

    // 使用所有可用的大阿爾克納（3-5 張）
    const availableCount = Math.min(majorArcana.length, 5);
    const selectedCards: DetailedTarotCard[] = [];
    const usedIndices = new Set<number>();

    // 隨機選取（確保不重複）
    while (selectedCards.length < availableCount && selectedCards.length < 100) {
      const randomIndex = Math.floor(Math.random() * majorArcana.length);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        selectedCards.push(majorArcana[randomIndex]);
      }
    }

    console.log(`Initialized card pool with ${selectedCards.length} cards:`, selectedCards.map((c) => c.name));
    return selectedCards;
  }, []);

  /**
   * 頁面載入時初始化卡牌池與載入已保存狀態
   * 重要：使用 ref 確保只初始化一次，防止無限循環
   */
  const hasInitialized = useRef(false);

  useEffect(() => {
    // 防止重複初始化
    if (hasInitialized.current) {
      console.log('[QuickReading] Already initialized, skipping...');
      return;
    }

    const initialize = async () => {
      console.log('[QuickReading] Starting initialization...');
      hasInitialized.current = true;
      setIsLoading(true);

      // 檢查 localStorage 是否可用
      if (!storage.isAvailable()) {
        console.warn('[QuickReading] localStorage not available, using memory-only state');
      }

      // 嘗試從 localStorage 載入已保存的狀態
      const savedState = storage.load();

      if (savedState.success && savedState.value) {
        console.log('[QuickReading] Found saved state:', savedState.value);

        // 嘗試恢復卡牌池
        try {
          const savedCardIds = savedState.value.cardPoolIds || [];
          const restoredPool = savedCardIds
            .map((id: string) => enhancedWastelandCards.find(c => c.id.toString() === id))
            .filter((card): card is DetailedTarotCard => card !== undefined);

          if (restoredPool.length > 0) {
            console.log('[QuickReading] Restored card pool:', restoredPool.map(c => ({ id: c.id, name: c.name })));
            setCardPool(restoredPool);
            setSelectedCardId(savedState.value.selectedCardId || null);
            setSessionKey(Date.now()); // 強制重新掛載避免閃爍
            console.log('[QuickReading] Loaded from localStorage successfully');
          } else {
            throw new Error('No valid cards in saved pool');
          }
        } catch (error) {
          console.warn('[QuickReading] Failed to restore saved state:', error);
          // 失敗時重新初始化
          const newCardPool = initializeCardPool();
          setCardPool(newCardPool);
          setSelectedCardId(null);
          setSessionKey(Date.now());
        }
      } else {
        // 沒有保存的狀態，重新初始化
        console.log('[QuickReading] No saved state, initializing new card pool');
        const newCardPool = initializeCardPool();
        console.log('[QuickReading] Generated new card pool:', newCardPool.map(c => ({ id: c.id, name: c.name })));
        setCardPool(newCardPool);
        setSelectedCardId(null);
        setSessionKey(Date.now());
      }

      setIsLoading(false);
      console.log('[QuickReading] Initialization complete');
    };

    initialize();

    // Cleanup: 當組件卸載時重置 flag
    return () => {
      console.log('[QuickReading] Component unmounting, resetting init flag');
      hasInitialized.current = false;
    };
  }, []); // 空 dependency array，只在 mount 時執行

  /**
   * 處理卡牌翻轉
   */
  const handleCardFlip = useCallback(
    (cardId: string) => {
      if (selectedCardId) {
        // 已經選中卡牌，不允許再翻其他卡
        return;
      }

      console.log('[QuickReading] Card flipped:', cardId);
      setSelectedCardId(cardId);

      // 儲存至 localStorage
      const saveData = {
        selectedCardId: cardId,
        cardPoolIds: cardPool.map((c) => c.id.toString()),
        timestamp: Date.now()
      };

      console.log('[QuickReading] Saving to localStorage:', saveData);
      const saveResult = storage.save(saveData);

      if (saveResult.success) {
        console.log('[QuickReading] ✅ Saved to localStorage successfully');

        // 驗證保存
        const verification = storage.load();
        if (verification.success && verification.value) {
          console.log('[QuickReading] ✅ Verification: localStorage contains:', verification.value);
        } else {
          console.error('[QuickReading] ❌ Verification failed:', verification.success ? 'No data' : verification.error);
        }
      } else {
        console.error('[QuickReading] ❌ Failed to save to localStorage:', saveResult.error);
      }
    },
    [selectedCardId, cardPool]
  );

  /**
   * 處理點擊已翻開的卡牌（響應式：移動端導航 / 桌面端 Modal）
   */
  const handleCardClick = useCallback(
    (card: DetailedTarotCard) => {
      if (card.id.toString() === selectedCardId) {
        console.log('[QuickReading] Card clicked:', card.name, { isMobile });

        if (isMobile) {
          // 移動端：導航到卡牌詳情頁面
          console.log('[QuickReading] Mobile: Navigate to /readings/quick/card/' + card.id);
          router.push(`/readings/quick/card/${card.id}`);
        } else {
          // 桌面端：開啟 Modal
          console.log('[QuickReading] Desktop: Open modal');
          setIsModalOpen(true);
        }
      }
    },
    [selectedCardId, isMobile, router]
  );

  /**
   * 關閉 Modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  /**
   * 導航至註冊頁面
   */
  const handleRegister = useCallback(() => {
    router.push('/auth/register');
  }, [router]);

  /**
   * 導航至登入頁面
   */
  const handleLogin = useCallback(() => {
    router.push('/auth/login');
  }, [router]);

  /**
   * 返回首頁
   */
  const handleGoBack = useCallback(() => {
    router.push('/');
  }, [router]);

  // 取得選中的卡牌物件
  const selectedCard = selectedCardId ?
  cardPool.find((c) => c.id.toString() === selectedCardId) :
  null;

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen text-pip-boy-green flex items-center justify-center">
        <div className="text-center">
          <PixelIcon name="card-stack" size={48} className="mx-auto mb-4 text-pip-boy-green animate-pulse" decorative />
          <p className="text-sm text-pip-boy-green animate-pulse">
            正在初始化廢土塔羅系統...
          </p>
        </div>
      </div>);

  }

  // 錯誤狀態
  if (error || cardPool.length === 0) {
    return (
      <div className="min-h-screen text-pip-boy-green flex items-center justify-center p-4">
        <div className="max-w-md text-center border-2 border-red-400 p-8">
          <h1 className="text-2xl font-bold text-red-400 mb-4">系統錯誤</h1>
          <p className="text-sm text-pip-boy-green/70 mb-6">
            {error || '無法載入卡牌資料'}
          </p>
          <Button size="lg" variant="outline"
          onClick={handleGoBack}
          className="px-6 py-3 transition-all">

            返回首頁
          </Button>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen text-pip-boy-green p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div
          className="border-2 border-pip-boy-green p-4 mb-8"
          style={{ backgroundColor: 'var(--color-pip-boy-green-10)' }}>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button size="icon" variant="link"
              onClick={handleGoBack}
              className="transition-colors"
              aria-label="返回首頁">

                <PixelIcon name="arrow-left" size={24} aria-label="返回首頁" />
              </Button>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span>快速占卜模式</span>
                  <span>|</span>
                  <span>訪客體驗</span>
                </div>
              </div>
            </div>
            <Button size="xs" variant="outline"
            onClick={handleRegister}
            className="flex items-center gap-2 transition-colors px-3 py-1 border">

              <PixelIcon name="user-plus" size={16} aria-label="註冊 Vault 帳號" />
              註冊 Vault 帳號
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div
          className="border-2 border-pip-boy-green p-8"
          style={{ backgroundColor: 'var(--color-pip-boy-green-5)' }}>

          <div className="text-center mb-8">
            <PixelIcon name="card-stack" size={64} className="mx-auto mb-4 text-pip-boy-green" decorative />
            <h1 className="text-3xl font-bold text-pip-boy-green mb-2">
              快速占卜
            </h1>
            <p className="text-sm text-text-muted">
              無需登入，立即體驗廢土塔羅的智慧
            </p>
          </div>

          {/* 條件渲染：未選中時顯示 Carousel，已選中時顯示單張卡片 */}
          {!selectedCardId ? (
            // 未選中：顯示 Carousel 供選擇
            <CarouselContainer
              cards={cardPool}
              selectedCardId={selectedCardId}
              activeIndex={activeCardIndex}
              onIndexChange={setActiveCardIndex}
              onCardFlip={handleCardFlip}
              onCardClick={handleCardClick}
              isDisabled={false}>

              {(card, index, isActive) => {
                const isCardRevealed = false; // 未選中前都是卡背
                const isCardSelected = false;

                return (
                  <TarotCard
                    key={`${sessionKey}-${card.id}`}
                    card={card}
                    isRevealed={isCardRevealed}
                    position="upright"
                    size="large"
                    flipStyle="kokonut"
                    cardBackUrl={displayCardBackUrl}
                    onClick={() => {
                      // 卡背狀態，點擊翻牌
                      handleCardFlip(card.id.toString());
                    }}
                    isSelectable={true}
                    isSelected={false}
                    showGlow={false}
                    enableHaptic={true}
                  />
                );
              }}
            </CarouselContainer>
          ) : (
            // 已選中：只顯示選中的卡片（靜態展示）
            (() => {
              const selectedCardData = cardPool.find(c => c.id.toString() === selectedCardId);

              console.log('[QuickReading] Rendering selected card:', {
                selectedCardId,
                cardPoolLength: cardPool.length,
                cardPoolIds: cardPool.map(c => c.id.toString()),
                foundCard: selectedCardData,
                hasImageUrl: !!selectedCardData?.image_url,
                hasUprightMeaning: !!(selectedCardData as any)?.upright_meaning,
                hasMeaningUpright: !!(selectedCardData as any)?.meaning_upright,
                imageUrl: selectedCardData?.image_url,
                uprightMeaning: (selectedCardData as any)?.upright_meaning,
                meaningUpright: (selectedCardData as any)?.meaning_upright
              });

              if (!selectedCardData) {
                console.error('[QuickReading] ❌ Selected card not found in card pool!');
                return (
                  <div className="flex justify-center items-center py-8">
                    <div className="text-center text-pip-boy-green">
                      <p className="text-lg mb-4">錯誤：找不到選中的卡片</p>
                      <p className="text-sm text-pip-boy-green/70">selectedCardId: {selectedCardId}</p>
                      <p className="text-sm text-pip-boy-green/70">cardPool IDs: {cardPool.map(c => c.id).join(', ')}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="flex justify-center items-center py-8">
                  <div className="max-w-sm">
                    <TarotCard
                      key={`${sessionKey}-${selectedCardId}`}
                      card={selectedCardData}
                      isRevealed={true}
                      position="upright"
                      size="large"
                      flipStyle="kokonut"
                      cardBackUrl={displayCardBackUrl}
                      onClick={() => {
                        handleCardClick(selectedCardData);
                      }}
                      isSelectable={false}
                      isSelected={true}
                      showGlow={true}
                      enableHaptic={true}
                    />
                  </div>
                </div>
              );
            })()
          )}

          {/* 主要 CTA - 翻牌後顯示 */}
          {selectedCardId &&
          <div className="mt-8 border-2 border-pip-boy-green p-6 animate-pulse-border">
              <div className="flex items-center gap-3 mb-4">
                <PixelIcon name="card-stack" size={32} className="text-pip-boy-green animate-pulse" decorative />
                <h3 className="text-xl text-pip-boy-green">
                  這是你的專屬命運展示 - 僅此一次
                </h3>
              </div>

              <p className="text-sm text-pip-boy-green/70 mb-4">
                想要探索更多可能性？註冊後可獲得：
              </p>

              <ul className="space-y-2 mb-6 text-sm text-pip-boy-green/80">
                <li className="flex items-center gap-2">
                  <PixelIcon name="check" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
                  <span><span className="text-pip-boy-green font-bold">無限次抽卡</span>，探索完整塔羅智慧</span>
                </li>
                <li className="flex items-center gap-2">
                  <PixelIcon name="check" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
                  <span>個人化 AI 解讀（Karma & Faction 系統）</span>
                </li>
                <li className="flex items-center gap-2">
                  <PixelIcon name="check" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
                  <span>占卜記錄保存與歷史追蹤</span>
                </li>
                <li className="flex items-center gap-2">
                  <PixelIcon name="check" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
                  <span>多種牌陣選擇（三卡、Celtic Cross）</span>
                </li>
                <li className="flex items-center gap-2">
                  <PixelIcon name="check" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
                  <span>角色語音解讀（Pip-Boy, Mr. Handy, Scribe）</span>
                </li>
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" variant="outline"
              onClick={handleRegister}
              className="flex-1 px-6 py-3 transition-all">

                  立即註冊 - 解鎖完整體驗
                </Button>
                <Button size="sm" variant="link"
              onClick={handleLogin}
              className="transition-colors">

                  已有帳號？立即登入 →
                </Button>
              </div>
            </div>
          }

          {/* Info Box */}
          <div
            className="mt-8 border border-pip-boy-green p-4"
            style={{ backgroundColor: 'var(--color-pip-boy-green-5)' }}>

            <p className="text-xs text-text-muted text-center flex items-center justify-center gap-2">
              <PixelIcon name="file-text" size={16} className="text-pip-boy-green flex-shrink-0" decorative />
              <span>註冊 Vault 帳號後，你可以：儲存占卜歷史 | 使用高級牌陣 | 獲得 AI 詳細解讀 | 追蹤 Karma 變化</span>
            </p>
          </div>
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedCard &&
      <CardDetailModal
        card={selectedCard}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        position="upright"
        isGuestMode={true} />

      }
    </div>);

}