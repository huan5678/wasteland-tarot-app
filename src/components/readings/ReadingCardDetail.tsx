/**
 * ReadingCardDetail Component - 占卜紀錄專屬的卡牌詳情元件
 *
 * 功能特點：
 * - 顯示卡牌在此次占卜中的位置意義（過去/現在/未來等）
 * - 整合 CardDetailModal 的核心功能
 * - 針對占卜情境客製化的展示介面
 * - 僅供已登入使用者使用（無訪客模式）
 */

'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PixelIcon } from '@/components/ui/icons';
import type { IconName } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { getCardImageUrl, getCardImageAlt, getFallbackImageUrl } from '@/lib/utils/cardImages';
import useClickOutside from '@/hooks/useClickOutside';
import { useTextToSpeech } from '@/hooks/audio/useTextToSpeech';
import useCardInteractions from '@/hooks/useCardInteractions';

// 卡牌資料結構
import { Button } from "@/components/ui/button";export interface ReadingCard {
  id: string | number;
  name: string;
  description?: string;
  suit: string;
  card_number?: number;
  number?: number;
  image_url: string;
  upright_meaning?: string;
  reversed_meaning?: string;
  meaning_upright?: string;
  meaning_reversed?: string;
  keywords?: string[];
  fallout_reference?: string;
  character_voices?: {
    [voice: string]: string;
  };
  radiation_factor?: number;
  karma_alignment?: 'GOOD' | 'NEUTRAL' | 'EVIL';
  symbolism?: string;
  element?: string;
  astrological_association?: string;
  position?: 'upright' | 'reversed';
  is_reversed?: boolean;
  // 占卜情境專屬欄位
  position_in_reading?: string; // 在牌陣中的位置（如「過去」、「現在」、「未來」）
  position_meaning?: string; // 這個位置的意義說明
  card_index?: number; // 在牌組中的索引
}

// 標籤類型
type TabType = 'context' | 'overview' | 'meanings' | 'characters' | 'insights' | 'interactions';

interface TabConfig {
  id: TabType;
  label: string;
  name: IconName;
  color: string;
}

interface ReadingCardDetailProps {
  card: ReadingCard | null;
  isOpen: boolean;
  onClose: () => void;
  // 占卜情境資訊
  readingType?: string; // 牌陣類型
  readingQuestion?: string; // 占卜問題
  totalCards?: number; // 牌陣總卡數
  // 互動回調
  onBookmarkToggle?: (card: ReadingCard, isBookmarked: boolean) => void;
  onShareCard?: (card: ReadingCard) => void;
  onNotesUpdate?: (card: ReadingCard, notes: string) => void;
  // 功能開關
  enableAudio?: boolean;
  showQuickActions?: boolean;
}

// 標籤配置（占卜情境優先）
const TAB_CONFIG: TabConfig[] = [
{ id: 'context', label: '占卜情境', name: 'pin' as IconName, color: 'text-orange-400' },
{ id: 'overview', label: '總覽', name: 'eye' as IconName, color: 'text-pip-boy-green' },
{ id: 'meanings', label: '含義', name: 'book' as IconName, color: 'text-blue-400' },
{ id: 'characters', label: '角色', name: 'users' as IconName, color: 'text-purple-400' },
{ id: 'insights', label: '洞察', name: 'bulb' as IconName, color: 'text-yellow-400' },
{ id: 'interactions', label: '互動', name: 'cog' as IconName, color: 'text-cyan-400' }];


// 工具函數
const getSuitIcon = (suit: string) => {
  const suitLower = suit.toLowerCase();
  if (suitLower.includes('權杖') || suitLower.includes('wand') || suitLower.includes('radiation_rod'))
  return <PixelIcon name="zap" sizePreset="xs" decorative />;
  if (suitLower.includes('聖杯') || suitLower.includes('cup') || suitLower.includes('nuka_cola'))
  return <PixelIcon name="heart" sizePreset="xs" decorative />;
  if (suitLower.includes('寶劍') || suitLower.includes('sword') || suitLower.includes('combat_weapon'))
  return <PixelIcon name="sword" sizePreset="xs" decorative />;
  if (suitLower.includes('錢幣') || suitLower.includes('pentacle') || suitLower.includes('bottle_cap'))
  return <PixelIcon name="coin" sizePreset="xs" decorative />;
  if (suitLower.includes('major_arcana'))
  return <PixelIcon name="star" sizePreset="xs" decorative />;
  return <PixelIcon name="star" sizePreset="xs" decorative />;
};

const getRadiationLevel = (factor: number = 0) => {
  if (factor >= 0.8) return { label: '極高輻射', color: 'text-red-400', bgColor: 'bg-red-900/30' };
  if (factor >= 0.6) return { label: '高輻射', color: 'text-orange-400', bgColor: 'bg-orange-900/30' };
  if (factor >= 0.4) return { label: '中等輻射', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' };
  if (factor >= 0.2) return { label: '低輻射', color: 'text-pip-boy-green/60', bgColor: 'bg-pip-boy-green/10' };
  return { label: '安全', color: 'text-pip-boy-green', bgColor: 'bg-pip-boy-green/10' };
};

const getKarmaColor = (alignment?: string) => {
  switch (alignment) {
    case 'GOOD':return 'text-blue-400';
    case 'EVIL':return 'text-red-400';
    default:return 'text-pip-boy-green/70';
  }
};

const getReadingTypeName = (type: string = '') => {
  const typeMap: Record<string, string> = {
    'single': '單張牌',
    'three_card': '三張牌',
    'celtic_cross': '凱爾特十字',
    'past_present_future': '過去現在未來'
  };
  return typeMap[type] || type;
};

// 角色聲音選擇器
const CharacterVoiceSelector = ({
  voices,
  selectedVoice,
  onVoiceChange,
  enableAudio = false





}: {voices: {[key: string]: string;};selectedVoice: string;onVoiceChange: (voice: string) => void;enableAudio?: boolean;}) => {
  const voiceNames: {[key: string]: string;} = {
    'PIP_BOY': 'Pip-Boy',
    'pip_boy': 'Pip-Boy',
    'SUPER_MUTANT': '超級變種人',
    'super_mutant': '超級變種人',
    'GHOUL': '屍鬼',
    'ghoul': '屍鬼',
    'RAIDER': '掠奪者',
    'raider': '掠奪者',
    'BROTHERHOOD_SCRIBE': '兄弟會書記員',
    'brotherhood_scribe': '兄弟會書記員',
    'VAULT_DWELLER': '避難所居民',
    'vault_dweller': '避難所居民'
  };

  const getVoicePersonality = (voice: string) => {
    switch (voice.toLowerCase()) {
      case 'pip_boy':
        return { bgColor: 'bg-pip-boy-green/10', textColor: 'text-pip-boy-green', borderColor: 'border-pip-boy-green/40' };
      case 'super_mutant':
        return { bgColor: 'bg-red-500/10', textColor: 'text-red-400', borderColor: 'border-red-500/40' };
      case 'ghoul':
        return { bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/40' };
      case 'raider':
        return { bgColor: 'bg-orange-500/10', textColor: 'text-orange-400', borderColor: 'border-orange-500/40' };
      case 'brotherhood_scribe':
        return { bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/40' };
      default:
        return { bgColor: 'bg-pip-boy-green/10', textColor: 'text-pip-boy-green/70', borderColor: 'border-pip-boy-green/40' };
    }
  };

  return (
    <div className="mb-6">
      <h4 className="text-pip-boy-green font-bold text-sm mb-3">選擇角色聲音</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.keys(voices).map((voice) => {
          const personality = getVoicePersonality(voice);
          const isSelected = selectedVoice === voice;

          return (
            <motion.button
              key={voice}
              onClick={() => onVoiceChange(voice)}
              className={cn(
                "p-3 text-xs border rounded-lg transition-all duration-200",
                isSelected ?
                `${personality.bgColor} ${personality.textColor} ${personality.borderColor} shadow-lg` :
                `border-pip-boy-green/20 text-pip-boy-green/70 hover:${personality.bgColor}`
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>

              <span className="font-bold">{voiceNames[voice] || voice}</span>
            </motion.button>);

        })}
      </div>
    </div>);

};

export function ReadingCardDetail({
  card,
  isOpen,
  onClose,
  readingType,
  readingQuestion,
  totalCards,
  onBookmarkToggle,
  onShareCard,
  onNotesUpdate,
  enableAudio = true,
  showQuickActions = true
}: ReadingCardDetailProps) {
  // 狀態管理
  const [selectedVoice, setSelectedVoice] = useState('PIP_BOY');
  const [activeTab, setActiveTab] = useState<TabType>('context');
  const [imageError, setImageError] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);

  // Hooks
  const {
    speak,
    stop: stopSpeech,
    isSpeaking,
    isSupported: audioSupported
  } = useTextToSpeech();

  const {
    isBookmarked,
    toggleBookmark,
    updateBookmarkNotes,
    getStudyProgress,
    markAsViewed
  } = useCardInteractions();

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 動畫變體
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: -20 }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  // Memoized 計算
  const radiationInfo = useMemo(() => getRadiationLevel(card?.radiation_factor), [card?.radiation_factor]);
  const uprightMeaning = useMemo(() => card?.upright_meaning || card?.meaning_upright || '未知含義', [card]);
  const reversedMeaning = useMemo(() => card?.reversed_meaning || card?.meaning_reversed || '未知含義', [card]);
  const currentMeaning = useMemo(() =>
  card?.is_reversed || card?.position === 'reversed' ? reversedMeaning : uprightMeaning,
  [card, uprightMeaning, reversedMeaning]
  );

  const cardIsBookmarked = useMemo(() =>
  card ? isBookmarked(card.id.toString()) : false,
  [card, isBookmarked]
  );

  const cardStudyProgress = useMemo(() =>
  card ? getStudyProgress(card.id.toString()) : null,
  [card, getStudyProgress]
  );

  // 鍵盤導航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      // Tab 切換
      if (event.key === 'ArrowLeft' && event.ctrlKey) {
        event.preventDefault();
        const currentIndex = TAB_CONFIG.findIndex((tab) => tab.id === activeTab);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : TAB_CONFIG.length - 1;
        setActiveTab(TAB_CONFIG[previousIndex].id);
        return;
      }

      if (event.key === 'ArrowRight' && event.ctrlKey) {
        event.preventDefault();
        const currentIndex = TAB_CONFIG.findIndex((tab) => tab.id === activeTab);
        const nextIndex = currentIndex < TAB_CONFIG.length - 1 ? currentIndex + 1 : 0;
        setActiveTab(TAB_CONFIG[nextIndex].id);
        return;
      }

      // 圖片縮放
      if (activeTab === 'overview') {
        if (event.key === '+' || event.key === '=') {
          event.preventDefault();
          setImageZoom((prev) => Math.min(prev + 0.25, 3));
          return;
        }
        if (event.key === '-' || event.key === '_') {
          event.preventDefault();
          setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
          return;
        }
        if (event.key === '0') {
          event.preventDefault();
          setImageZoom(1);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // 標記為已查看
    if (card) {
      markAsViewed(card.id.toString());
    }

    // Focus 管理
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, activeTab, card, markAsViewed]);

  // 互動處理
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleBookmarkToggle = useCallback(async () => {
    if (!card) return;
    await toggleBookmark(card);
    onBookmarkToggle?.(card, !cardIsBookmarked);
  }, [card, cardIsBookmarked, toggleBookmark, onBookmarkToggle]);

  const handleShareCard = useCallback(() => {
    if (!card) return;
    onShareCard?.(card);
  }, [card, onShareCard]);

  const handleNotesUpdate = useCallback(async (notes: string) => {
    if (!card) return;
    await updateBookmarkNotes(card.id.toString(), notes);
    onNotesUpdate?.(card, notes);
  }, [card, updateBookmarkNotes, onNotesUpdate]);

  const handleSpeakText = useCallback((text: string) => {
    if (!enableAudio || !audioSupported || isSpeaking) return;
    try {
      speak(text);
    } catch (error) {
      console.error('Speech error:', error);
    }
  }, [enableAudio, audioSupported, isSpeaking, speak]);

  const handleImageZoom = useCallback((delta: number) => {
    setImageZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  }, []);

  const handleImageReset = useCallback(() => {
    setImageZoom(1);
  }, []);

  // Click outside
  useClickOutside(modalRef, onClose);

  // 卡牌圖片 URL
  const cardImageUrl = useMemo(() => {
    if (!card) return getFallbackImageUrl();
    return imageError ? getFallbackImageUrl() : getCardImageUrl(card as any);
  }, [card, imageError]);

  const cardImageAlt = useMemo(() => {
    if (!card) return 'Tarot Card';
    return getCardImageAlt(card as any);
  }, [card]);

  if (!isOpen || !card) return null;

  // === 標籤內容渲染器 ===

  // 1. 占卜情境標籤
  const renderContextTab = () =>
  <motion.div
    key="context"
    variants={tabContentVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="space-y-6">

      {/* 占卜資訊 */}
      <div className="bg-orange-500/5 border border-orange-400/20 p-6 rounded-lg">
        <h3 className="text-orange-400 font-bold text-lg mb-4 flex items-center gap-2">
          <PixelIcon name="radioactive" sizePreset="sm" decorative />
          本次占卜資訊
        </h3>

        <div className="space-y-4">
          {readingType &&
        <div>
              <span className="text-pip-boy-green/70 text-sm">牌陣類型：</span>
              <span className="text-pip-boy-green ml-2">{getReadingTypeName(readingType)}</span>
            </div>
        }

          {readingQuestion &&
        <div>
              <span className="text-pip-boy-green/70 text-sm">占卜問題：</span>
              <p className="text-pip-boy-green mt-1 italic border-l-4 border-orange-400/50 pl-3">
                "{readingQuestion}"
              </p>
            </div>
        }

          {card.position_in_reading &&
        <div>
              <span className="text-pip-boy-green/70 text-sm">牌陣位置：</span>
              <span className="text-orange-400 ml-2 font-bold">{card.position_in_reading}</span>
              {card.card_index !== undefined && totalCards &&
          <span className="text-pip-boy-green/60 ml-2 text-xs">
                  ({card.card_index + 1}/{totalCards})
                </span>
          }
            </div>
        }

          {card.position_meaning &&
        <div className="mt-4 pt-4 border-t border-orange-400/20">
              <h4 className="text-orange-400/80 font-bold text-sm mb-2">此位置代表：</h4>
              <p className="text-pip-boy-green/90 text-sm leading-relaxed">
                {card.position_meaning}
              </p>
            </div>
        }
        </div>
      </div>

      {/* 在此情境下的意義 */}
      <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
        <h3 className="text-pip-boy-green font-bold text-lg mb-4 flex items-center gap-2">
          <PixelIcon name="bulb" sizePreset="sm" decorative />
          在此情境下的意義
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-pip-boy-green/70">卡牌狀態：</span>
            {card.is_reversed || card.position === 'reversed' ?
          <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded flex items-center gap-1">
                <PixelIcon name="alert" sizePreset="xs" decorative />
                逆位
              </span> :

          <span className="px-2 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 text-xs rounded">
                正位
              </span>
          }
          </div>

          <div className="bg-pip-boy-green/5 border-l-4 border-pip-boy-green/50 p-4 rounded">
            <p className="text-pip-boy-green/90 text-sm leading-relaxed">
              {currentMeaning}
            </p>
          </div>
        </div>
      </div>
    </motion.div>;


  // 2. 總覽標籤
  const renderOverviewTab = () =>
  <motion.div
    key="overview"
    variants={tabContentVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* 左側 - 卡牌圖片 */}
      <div className="space-y-4">
        <div className="relative">
          <div className="w-full max-w-md mx-auto aspect-[2/3] border-2 border-pip-boy-green/60 rounded-lg overflow-hidden bg-wasteland-dark relative">
            {imageError ?
          <div className="w-full h-full flex items-center justify-center text-pip-boy-green/60">
                <div className="text-center">
                  <PixelIcon name="alert" sizePreset="lg" decorative />
                  <div className="text-sm mt-2">圖片載入失敗</div>
                </div>
              </div> :

          <motion.img
            src={cardImageUrl}
            alt={cardImageAlt}
            className={cn(
              "w-full h-full object-cover transition-transform duration-200",
              (card.is_reversed || card.position === 'reversed') && "rotate-180"
            )}
            style={{ transform: `scale(${imageZoom})${card.is_reversed || card.position === 'reversed' ? ' rotate(180deg)' : ''}` }}
            onError={() => setImageError(true)}
            animate={{ scale: imageZoom }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }} />

          }

            {/* 圖片縮放控制 */}
            <div className="hidden md:flex absolute top-2 right-2 flex-col gap-1.5">
              <Button size="icon" variant="link"
            onClick={() => handleImageZoom(0.25)}
            className="p-2 rounded transition-all"
            title="放大">

                <PixelIcon name="zoom-in" sizePreset="sm" decorative />
              </Button>
              <Button size="icon" variant="link"
            onClick={() => handleImageZoom(-0.25)}
            className="p-2 rounded transition-all"
            title="縮小">

                <PixelIcon name="zoom-out" sizePreset="sm" decorative />
              </Button>
              <Button size="icon" variant="link"
            onClick={handleImageReset}
            className="p-2 rounded transition-all"
            title="重置大小">

                <PixelIcon name="reload" sizePreset="sm" decorative />
              </Button>
            </div>
          </div>

          {(card.is_reversed || card.position === 'reversed') &&
        <div className="absolute top-2 left-2 bg-red-900/80 text-red-400 px-2 py-1 rounded text-xs">
              逆位
            </div>
        }
        </div>

        {/* 卡牌 Metadata */}
        <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-pip-boy-green/70">花色：</span>
              <span className="text-pip-boy-green ml-1">{card.suit}</span>
            </div>
            <div>
              <span className="text-pip-boy-green/70">編號：</span>
              <span className="text-pip-boy-green ml-1">{card.number || card.card_number || 'N/A'}</span>
            </div>
            {card.karma_alignment &&
          <div>
                <span className="text-pip-boy-green/70">業力：</span>
                <span className={getKarmaColor(card.karma_alignment) + ' ml-1'}>{card.karma_alignment}</span>
              </div>
          }
          </div>
        </div>

        {/* 關鍵詞 */}
        {card.keywords && card.keywords.length > 0 &&
      <div>
            <h4 className="text-pip-boy-green font-bold mb-2 flex items-center gap-2">
              <PixelIcon name="target" sizePreset="xs" decorative />
              關鍵詞
            </h4>
            <div className="flex flex-wrap gap-2">
              {card.keywords.map((keyword, index) =>
          <motion.span
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="px-2 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 text-pip-boy-green/80 text-xs rounded">

                  {keyword}
                </motion.span>
          )}
            </div>
          </div>
      }
      </div>

      {/* 右側 - 當前含義 */}
      <div className="space-y-6">
        <div>
          <h4 className="text-pip-boy-green font-bold mb-3 flex items-center gap-2">
            <PixelIcon name="book" sizePreset="sm" decorative />
            {card.is_reversed || card.position === 'reversed' ? '逆位含義' : '正位含義'}
          </h4>
          <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded">
            <p className="text-pip-boy-green/90 text-sm leading-relaxed">
              {currentMeaning}
            </p>
          </div>
        </div>

        {card.description &&
      <div>
            <h4 className="text-pip-boy-green font-bold mb-2 flex items-center gap-2">
              <PixelIcon name="info" sizePreset="xs" decorative />
              描述
            </h4>
            <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-3 rounded">
              <p className="text-pip-boy-green/90 text-sm leading-relaxed">
                {card.description}
              </p>
            </div>
          </div>
      }

        {/* 廢土背景 */}
        {card.fallout_reference &&
      <div>
            <h4 className="text-pip-boy-green font-bold mb-3 flex items-center gap-2">
              <PixelIcon name="radioactive" sizePreset="sm" decorative />
              廢土背景
            </h4>
            <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded">
              <p className="text-pip-boy-green/90 text-sm leading-relaxed">
                {card.fallout_reference}
              </p>
            </div>
          </div>
      }
      </div>
    </motion.div>;


  // 3. 含義標籤
  const renderMeaningsTab = () =>
  <motion.div
    key="meanings"
    variants={tabContentVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}>

          <h4 className="text-blue-400 font-bold text-lg mb-3 flex items-center gap-2">
            <PixelIcon name="arrow-left" sizePreset="sm" decorative />
            正位意義
          </h4>
          <div className="bg-blue-500/5 border border-blue-400/20 p-4 rounded-lg">
            <p className="text-blue-300/90 text-sm leading-relaxed">
              {uprightMeaning}
            </p>
          </div>
        </motion.div>

        <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}>

          <h4 className="text-orange-400 font-bold text-lg mb-3 flex items-center gap-2">
            <PixelIcon name="arrow-right" sizePreset="sm" decorative />
            逆位意義
          </h4>
          <div className="bg-orange-500/5 border border-orange-400/20 p-4 rounded-lg">
            <p className="text-orange-300/90 text-sm leading-relaxed">
              {reversedMeaning}
            </p>
          </div>
        </motion.div>
      </div>

      {/* 象徵意義與元素 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {card.symbolism &&
      <div>
            <h4 className="text-pip-boy-green font-bold mb-3 flex items-center gap-2">
              <PixelIcon name="star" sizePreset="sm" decorative />
              象徵意義
            </h4>
            <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded">
              <p className="text-pip-boy-green/90 text-sm leading-relaxed">
                {card.symbolism}
              </p>
            </div>
          </div>
      }

        {(card.element || card.astrological_association) &&
      <div className="space-y-4">
            {card.element &&
        <div>
                <h5 className="text-pip-boy-green/80 font-bold text-sm mb-2">元素</h5>
                <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-3 rounded">
                  <p className="text-pip-boy-green/80 text-sm">{card.element}</p>
                </div>
              </div>
        }
            {card.astrological_association &&
        <div>
                <h5 className="text-pip-boy-green/80 font-bold text-sm mb-2">占星關聯</h5>
                <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-3 rounded">
                  <p className="text-pip-boy-green/80 text-sm">{card.astrological_association}</p>
                </div>
              </div>
        }
          </div>
      }
      </div>
    </motion.div>;


  // 4. 角色標籤
  const renderCharactersTab = () =>
  <motion.div
    key="characters"
    variants={tabContentVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="space-y-6">

      {card.character_voices &&
    <div>
          <CharacterVoiceSelector
        voices={card.character_voices}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        enableAudio={enableAudio} />


          <motion.div
        key={selectedVoice}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PixelIcon name="message" sizePreset="sm" variant="primary" decorative />
                <h4 className="text-pip-boy-green font-bold">
                  {selectedVoice.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())} 的解讀
                </h4>
              </div>

              {enableAudio && audioSupported && card.character_voices?.[selectedVoice] &&
          <motion.button
            onClick={() => handleSpeakText(card.character_voices![selectedVoice])}
            disabled={isSpeaking}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "p-2 rounded border transition-colors flex items-center gap-2",
              isSpeaking ?
              "bg-orange-500/20 border-orange-400 text-orange-400 animate-pulse" :
              "border-pip-boy-green/40 text-pip-boy-green hover:bg-pip-boy-green/10"
            )}
            title="播放角色聲音">

                  {isSpeaking ?
            <>
                      <PixelIcon name="volume-x" sizePreset="xs" decorative />
                      <span className="text-xs">播放中...</span>
                    </> :

            <>
                      <PixelIcon name="volume" sizePreset="xs" decorative />
                      <span className="text-xs">播放</span>
                    </>
            }
                </motion.button>
          }
            </div>

            <p className="text-pip-boy-green/90 text-sm leading-relaxed">
              {card.character_voices[selectedVoice] || '無可用解讀'}
            </p>
          </motion.div>
        </div>
    }
    </motion.div>;


  // 5. 洞察標籤
  const renderInsightsTab = () =>
  <motion.div
    key="insights"
    variants={tabContentVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="space-y-6">

      <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
        <h4 className="text-pip-boy-green font-bold mb-4 flex items-center gap-2">
          <PixelIcon name="brain" sizePreset="sm" decorative />
          卡牌分析洞察
        </h4>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {cardStudyProgress &&
        <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{cardStudyProgress.timesViewed}</div>
              <div className="text-pip-boy-green/70 text-xs">個人查看次數</div>
            </div>
        }
        </div>
      </div>

      {/* 個人學習進度 */}
      <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
        <h4 className="text-pip-boy-green font-bold mb-4 flex items-center gap-2">
          <PixelIcon name="target" sizePreset="xs" decorative />
          個人學習進度
        </h4>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-pip-boy-green/70">理解程度</span>
              <span className="text-pip-boy-green">{cardStudyProgress?.studyProgress || 0}%</span>
            </div>
            <div className="w-full bg-pip-boy-green/10 rounded-full h-2">
              <motion.div
              className="bg-pip-boy-green h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${cardStudyProgress?.studyProgress || 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }} />

            </div>
          </div>

          {cardStudyProgress?.lastViewed &&
        <div className="flex items-center gap-2 text-sm text-pip-boy-green/70">
              <PixelIcon name="calendar" sizePreset="xs" decorative />
              <span>上次查看：{cardStudyProgress.lastViewed.toLocaleDateString()}</span>
            </div>
        }
        </div>
      </div>
    </motion.div>;


  // 6. 互動標籤
  const renderInteractionsTab = () =>
  <motion.div
    key="interactions"
    variants={tabContentVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="space-y-6">

      {/* 快速操作 */}
      {showQuickActions &&
    <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
          <h4 className="text-pip-boy-green font-bold mb-4">快速操作</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <motion.button
          onClick={handleBookmarkToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "p-3 rounded border text-sm transition-colors flex flex-col items-center gap-2",
            cardIsBookmarked ?
            "bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green" :
            "border-pip-boy-green/40 text-pip-boy-green/70 hover:bg-pip-boy-green/10"
          )}>

              <PixelIcon name="bookmark" sizePreset="sm" decorative />
              <span>{cardIsBookmarked ? '已收藏' : '收藏'}</span>
            </motion.button>

            <motion.button
          onClick={handleShareCard}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded border border-purple-400/40 text-purple-400 text-sm hover:bg-purple-500/10 transition-colors flex flex-col items-center gap-2">

              <PixelIcon name="share" sizePreset="sm" decorative />
              <span>分享</span>
            </motion.button>

            <motion.button
          onClick={() => navigator.clipboard.writeText(`${card.name}: ${currentMeaning}`)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 rounded border border-cyan-400/40 text-cyan-400 text-sm hover:bg-cyan-500/10 transition-colors flex flex-col items-center gap-2">

              <PixelIcon name="copy" sizePreset="sm" decorative />
              <span>複製</span>
            </motion.button>
          </div>
        </div>
    }

      {/* 個人筆記 */}
      <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
        <h4 className="text-pip-boy-green font-bold mb-4 flex items-center gap-2">
          <PixelIcon name="message" sizePreset="sm" decorative />
          個人筆記
        </h4>
        <textarea
        onChange={(e) => handleNotesUpdate(e.target.value)}
        placeholder="記下你對這張卡片的想法和感悟..."
        className="w-full h-32 bg-wasteland-dark border border-pip-boy-green/30 text-pip-boy-green text-sm p-3 rounded resize-none focus:outline-none focus:border-pip-boy-green/60" />

      </div>
    </motion.div>;


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reading-card-modal-title">

        <motion.div
          ref={modalRef}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-wasteland-dark border-2 border-pip-boy-green max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="border-b border-pip-boy-green/30 p-4 flex items-center justify-between bg-pip-boy-green/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}>

                  {getSuitIcon(card.suit)}
                </motion.div>
                <h2 id="reading-card-modal-title" className="text-xl font-bold text-pip-boy-green">
                  {card.name}
                </h2>
              </div>

              {card.radiation_factor !== undefined &&
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "px-3 py-1 rounded text-xs flex items-center gap-2",
                  radiationInfo.bgColor,
                  radiationInfo.color
                )}>

                  <PixelIcon name="radioactive" sizePreset="xs" decorative />
                  {radiationInfo.label}
                </motion.div>
              }
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block text-xs text-pip-boy-green/60 mr-4">
                Ctrl+← → 切換分頁 | ESC 關閉
              </div>

              <motion.button
                ref={closeButtonRef}
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-pip-boy-green hover:text-pip-boy-green/80 p-2 rounded border border-pip-boy-green/40 hover:bg-pip-boy-green/10 transition-colors"
                aria-label="關閉卡牌詳情">

                <PixelIcon name="close" sizePreset="sm" decorative />
              </motion.button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-pip-boy-green/30 bg-wasteland-dark/50">
            <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-pip-boy-green/30">
              {TAB_CONFIG.map((tab, index) => {
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-all duration-200 whitespace-nowrap",
                      isActive ?
                      `${tab.color} border-current bg-pip-boy-green/5` :
                      "text-pip-boy-green/60 border-transparent hover:text-pip-boy-green/80 hover:bg-pip-boy-green/5"
                    )}
                    whileHover={{ y: -1 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}>

                    <PixelIcon name={tab.name} sizePreset="xs" decorative />
                    <span>{tab.label}</span>
                  </motion.button>);

              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'context' && renderContextTab()}
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'meanings' && renderMeaningsTab()}
              {activeTab === 'characters' && renderCharactersTab()}
              {activeTab === 'insights' && renderInsightsTab()}
              {activeTab === 'interactions' && renderInteractionsTab()}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-pip-boy-green/30 p-4 bg-pip-boy-green/5">
            <div className="flex justify-between items-center text-xs text-pip-boy-green/60">
              <div className="flex items-center gap-4">
                <span>VAULT-TEC 塔羅系統 v3.0.0</span>
                <span>輻射等級: {radiationInfo.label}</span>
              </div>
              <div className="flex items-center gap-4">
                {cardIsBookmarked && <span>★ 已收藏</span>}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>);

}