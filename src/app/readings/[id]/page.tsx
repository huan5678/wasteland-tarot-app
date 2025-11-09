/**
 * Reading Detail Page - 占卜詳情頁面（Tab 式設計）
 *
 * 使用 Tab 形式整合以下內容：
 * - Tab 1: 占卜總覽 - 問題、牌陣、所有卡牌
 * - Tab 2-N: 每張卡牌的詳細資訊（整合 ReadingCardDetail）
 * - Tab N+1: 解讀結果
 * - Tab N+2: 元資料
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { readingsAPI } from '@/lib/api';
import { PixelIcon } from '@/components/ui/icons';
import type { Reading } from '@/lib/api';
import type { ReadingCard } from '@/components/readings/ReadingCardDetail';
import { cn } from '@/lib/utils';
import { getCardImageUrl, getCardImageAlt } from '@/lib/utils/cardImages';
import { useReadingsStore } from '@/lib/readingsStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Switch } from '@/components/ui/switch';
import { ShareButton } from '@/components/share/ShareButton';
import { CardDetailModal } from '@/components/tarot/CardDetailModal';
import type { WastelandCard } from '@/types/database';
import { useAuthStore } from '@/lib/authStore';
import { useMetadataStore } from '@/stores/metadataStore';
import StoryAudioPlayer from '@/components/tarot/StoryAudioPlayer';
import { use3DTilt } from '@/hooks/tilt/use3DTilt';
import { TiltVisualEffects } from '@/components/tilt/TiltVisualEffects';
import { useIsMobile } from '@/hooks/useMediaQuery';

// Tab 類型定義（移除 card-${number}，改用 Modal 顯示卡片詳情）
import { Button } from "@/components/ui/button";type MainTabType = 'overview' | 'interpretation' | 'metadata';

// 工具函數
const getSpreadTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'single': '單張牌',
    'three_card': '三張牌',
    'celtic_cross': '凱爾特十字',
    'past_present_future': '過去現在未來'
  };
  return typeMap[type] || type;
};


export default function ReadingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const readingId = params.id as string;
  const isMobile = useIsMobile(); // 偵測移動端/桌面端 (< 640px)

  const [reading, setReading] = useState<Reading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MainTabType>('overview');
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'gemini'>('openai');
  const [isRequestingAI, setIsRequestingAI] = useState(false);
  const [isTTSGenerating, setIsTTSGenerating] = useState(false);

  // Modal 狀態管理
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState<(WastelandCard & {story?: any;audioUrls?: Record<string, string>;}) | null>(null);

  // Auth state
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);

  // Metadata store
  const metadataStore = useMetadataStore();
  const getCharacterName = useMetadataStore((s) => s.getCharacterName);
  const getFactionName = useMetadataStore((s) => s.getFactionName);
  const getKarmaName = useMetadataStore((s) => s.getKarmaName);

  // Hooks
  const deleteReading = useReadingsStore((s) => s.deleteReading);
  const requestAIInterpretation = useReadingsStore((s) => s.requestAIInterpretation);
  const storeError = useReadingsStore((s) => s.error);

  // Metadata 初始化
  useEffect(() => {
    metadataStore.initialize();
  }, []);

  // 認證狀態初始化檢查（防止重開機後被重導向）
  useEffect(() => {
    console.log('[ReadingDetail] 🔍 驗證登入狀態...', {
      isInitialized,
      hasUser: !!user,
      userId: user?.id
    });

    // 如果尚未初始化，先初始化
    if (!isInitialized) {
      console.log('[ReadingDetail] ⏳ 尚未初始化，開始初始化...');
      initialize();
      return;
    }

    // 初始化完成後，檢查是否有使用者
    if (isInitialized && !user) {
      console.log('[ReadingDetail] 🔀 Auth check redirect', {
        timestamp: new Date().toISOString(),
        from: `/readings/${readingId}`,
        to: `/auth/login?returnUrl=%2Freadings%2F${readingId}`,
        reason: 'User not authenticated',
        isInitialized
      });
      router.push(`/auth/login?returnUrl=%2Freadings%2F${readingId}`);
      return;
    }

    console.log('[ReadingDetail] ✅ 登入狀態有效，使用者:', user?.email);
  }, [user, isInitialized, initialize, router, readingId]);

  useEffect(() => {
    const fetchReading = async () => {
      if (!readingId) return;
      // 等待認證初始化完成且用戶存在
      if (!isInitialized || !user) {
        console.log('[ReadingDetail] ⏳ 等待認證初始化...', {
          isInitialized,
          hasUser: !!user
        });
        return;
      }
      // 如果正在刪除，不要重新載入
      if (isDeleting) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await readingsAPI.getById(readingId);
        console.log('📊 Reading data:', data);
        console.log('🤖 AI requested?:', data.ai_interpretation_requested);
        console.log('🤖 AI at?:', data.ai_interpretation_at);
        // 檢查新舊資料結構
        if ('card_positions' in data) {
          console.log('🃏 Card positions (NEW structure):', data.card_positions);
          console.log('🃏 Card positions length:', data.card_positions?.length);
          
          // 檢查第一張卡的 character_voices
          if (data.card_positions && data.card_positions.length > 0) {
            const firstCard = data.card_positions[0].card;
            console.log('🔍 First card from API:', {
              name: firstCard?.name,
              hasCharacterVoices: !!firstCard?.character_voices,
              characterVoicesKeys: firstCard?.character_voices ? Object.keys(firstCard.character_voices) : [],
              firstVoiceValue: firstCard?.character_voices ? Object.values(firstCard.character_voices)[0] : null
            });
          }
        } else {
          console.log('🃏 Cards drawn (LEGACY structure):', (data as any).cards_drawn);
          console.log('🃏 Cards drawn length:', (data as any).cards_drawn?.length);
        }
        setReading(data);
      } catch (err: any) {
        console.error('Failed to fetch reading:', err);
        // 只有在非刪除狀態下才顯示錯誤
        if (!isDeleting) {
          // 如果是 404 錯誤，直接跳轉到占卜列表頁面
          if (err.status === 404) {
            console.log('Reading not found, redirecting to readings list...');
            router.push('/readings');
            return;
          }
          setError(err.message || '無法載入占卜記錄');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReading();
  }, [readingId, isDeleting, router, isInitialized, user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 轉換卡牌資料為 ReadingCard 格式
  const convertToReadingCard = useCallback((card: any, index: number): ReadingCard => {
    console.log(`🔄 [Convert] Converting card ${index}:`, {
      name: card.name,
      character_voices: card.character_voices,
      character_voices: card.character_voices
    });

    return {
      id: card.card_id || card.id || `card-${index}`,
      name: card.name || card.card_name || '未知卡牌',
      suit: card.suit || 'Unknown',
      number: card.number || card.card_number, // 卡牌編號（必要欄位，用於圖片路徑）
      is_major_arcana: card.is_major_arcana || false, // Major Arcana 標記（必要欄位，用於圖片路徑）
      image_url: card.image_url || '',
      is_reversed: card.is_reversed || false,
      position: card.position,
      upright_meaning: card.upright_meaning,
      reversed_meaning: card.reversed_meaning,
      meaning_upright: card.meaning_upright,
      meaning_reversed: card.meaning_reversed,
      description: card.description,
      keywords: card.keywords,
      fallout_reference: card.fallout_reference,
      character_voices: card.character_voices,
      radiation_factor: card.radiation_factor,
      karma_alignment: card.karma_alignment,
      symbolism: card.symbolism,
      element: card.element,
      astrological_association: card.astrological_association,
      card_number: card.card_number || card.number,
      position_in_reading: card.position_name || card.position_in_reading || `位置 ${index + 1}`,
      position_meaning: card.position_meaning || '',
      card_index: index
    };
  }, []);

  // Memoized 計算 - 支援新舊兩種資料結構
  const cardsData = useMemo(() => {
    if (!reading) return [];

    // 新資料結構：使用 card_positions
    if ('card_positions' in reading && reading.card_positions && reading.card_positions.length > 0) {
      return reading.card_positions.map((position, index) => {
        // 使用完整的 card 物件（後端現在會包含）
        const card = position.card;
        if (!card) {
          // 如果沒有完整卡牌資料，使用基本 position 資訊
          return convertToReadingCard({
            card_id: position.card_id,
            is_reversed: position.is_reversed,
            position_number: position.position_number,
            position_name: position.position_name,
            position_meaning: position.position_meaning,
            name: `卡牌 ${position.position_number}`,
            suit: 'Unknown',
            image_url: ''
          }, index);
        }

        // 調試：檢查從 API 收到的 card 資料
        console.log('[Convert] Converting card:', {
          name: card.name,
          hasCharacterVoices: !!card.character_voices,
          characterVoicesKeys: card.character_voices ? Object.keys(card.character_voices) : [],
          characterVoicesSample: card.character_voices
        });
        
        // 使用完整的卡牌資料
        return convertToReadingCard({
          card_id: card.id,
          id: card.id,
          name: card.name,
          suit: card.suit,
          image_url: card.visuals?.image_url || card.image_url || '',
          upright_meaning: card.upright_meaning,
          reversed_meaning: card.reversed_meaning,
          is_reversed: position.is_reversed,
          position_name: position.position_name,
          position_meaning: position.position_meaning,
          position_number: position.position_number,
          // 從 card 中提取其他資訊
          number: card.number || card.card_number, // 確保提取卡牌編號
          is_major_arcana: card.is_major_arcana || card.suit === 'major_arcana' || card.suit === 'major-arcana', // Major Arcana 標記
          fallout_reference: card.fallout_easter_egg || card.nuka_cola_reference,
          // 使用 character_voices 而不是 character_voices
          character_voices: card.character_voices || card.character_voices,
          radiation_factor: card.metadata?.radiation_level || 0,
          keywords: card.keywords,
          description: card.upright_meaning // 使用 upright_meaning 作為描述
        }, index);
      });
    }

    // 舊資料結構：使用 cards_drawn
    if ('cards_drawn' in reading && (reading as any).cards_drawn) {
      return (reading as any).cards_drawn.map((card: any, index: number) => convertToReadingCard(card, index));
    }

    return [];
  }, [reading, convertToReadingCard]);

  // 生成 Tab 配置（移除卡片 Tab，改用 Modal 顯示）
  const tabConfig = useMemo(() => {
    const tabs = [
    { id: 'overview' as MainTabType, label: '占卜總覽', icon: 'eye' as const, color: 'text-pip-boy-green' }];


    if (reading?.interpretation) {
      tabs.push({ id: 'interpretation' as MainTabType, label: '解讀結果', icon: 'book' as const, color: 'text-yellow-400' });
    }

    tabs.push({ id: 'metadata' as MainTabType, label: '元資料', icon: 'info' as const, color: 'text-gray-400' });

    return tabs;
  }, [reading]);

  // 卡片點擊處理（響應式：移動端導航 / 桌面端 Modal）
  const handleCardClick = useCallback((card: ReadingCard, index: number) => {
    console.log('[ReadingDetail] Card clicked:', card.name, { isMobile });

    if (isMobile) {
      // 移動端：導航到卡牌詳情頁面
      console.log('[ReadingDetail] Mobile: Navigate to /readings/' + readingId + '/card/' + card.id);
      router.push(`/readings/${readingId}/card/${card.id}`);
    } else {
      // 桌面端：開啟 Modal
      console.log('[ReadingDetail] Desktop: Open modal');

      // 轉換為 WastelandCard 格式
      const wastelandCard: WastelandCard & {story?: any;audioUrls?: Record<string, string>;} = {
        id: card.id,
        name: card.name,
        suit: card.suit,
        number: card.number || card.card_number || 0,
        keywords: card.keywords || [],
        upright_meaning: card.upright_meaning || '',
        reversed_meaning: card.reversed_meaning || '',
        description: card.description || '',
        fallout_reference: card.fallout_reference,
        vault_reference: card.vault_reference,
        threat_level: card.threat_level,
        wasteland_humor: card.wasteland_humor,
        rarity_level: card.rarity_level || 'common',
        karma_alignment: card.karma_alignment || 'NEUTRAL',
        radiation_factor: card.radiation_factor || 0,
        pip_boy_interpretation: card.pip_boy_interpretation || '',
        character_voices: card.character_voices || {},
        element: card.element,
        astrological_association: card.astrological_association,
        symbolism: card.symbolism,
        image_url: getCardImageUrl(card as any),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setSelectedCardForModal(wastelandCard);
      setIsCardModalOpen(true);
    }
  }, [isMobile, readingId, router]);

  // 互動處理
  const handleImageError = useCallback((index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  }, []);

  // 3D Tilt Card 元件
  const TiltCard = ({ card, index }: {card: ReadingCard;index: number;}) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    // 使用 3D tilt hook（與 CardThumbnail 相同配置）
    const {
      tiltRef,
      tiltHandlers,
      tiltStyle,
      tiltState
    } = use3DTilt({
      enable3DTilt: true,
      tiltMaxAngle: 15,
      tiltTransitionDuration: 400,
      enableGyroscope: true,
      enableGloss: true,
      size: 'medium',
      loading: !imageLoaded
    });

    return (
      <motion.button
        ref={tiltRef}
        onClick={() => handleCardClick(card, index)}
        className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4 hover:border-pip-boy-green hover:bg-pip-boy-green/10 transition-all duration-200 text-left group cursor-pointer relative overflow-hidden"
        onMouseEnter={tiltHandlers.onMouseEnter}
        onMouseMove={tiltHandlers.onMouseMove}
        onMouseLeave={tiltHandlers.onMouseLeave}
        style={tiltStyle}
        whileTap={{ scale: 0.95 }}>

        {/* 3D Tilt Visual Effects */}
        {tiltState.isTilted &&
        <TiltVisualEffects
          tiltState={tiltState}
          enableGloss={true} />

        }

        <div className="aspect-[2/3] bg-pip-boy-green/20 border border-pip-boy-green/50 rounded flex flex-col items-center justify-center mb-3 relative overflow-hidden">
          {card.number !== undefined && card.suit && !imageErrors[index] ?
          <img
            src={getCardImageUrl(card as any)}
            alt={getCardImageAlt(card as any)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              card.is_reversed && "rotate-180",
              !imageLoaded && "opacity-0"
            )}
            onError={() => handleImageError(index)}
            onLoad={() => setImageLoaded(true)} /> :


          <>
              <PixelIcon name="spade" sizePreset="lg" variant="primary" decorative />
              <span className="text-xs text-pip-boy-green/70 mt-2">
                {card.position_in_reading}
              </span>
            </>
          }

          {/* Hover 效果 */}
          <div className="absolute inset-0 bg-pip-boy-green/0 group-hover:bg-pip-boy-green/20 transition-colors flex items-center justify-center">
            <PixelIcon
              name="eye"
              sizePreset="lg"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-pip-boy-green"
              decorative />

          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-bold text-pip-boy-green mb-1">
            {card.name}
          </p>
          {card.position_in_reading &&
          <p className="text-xs text-pip-boy-green/70">
              {card.position_in_reading}
            </p>
          }
          {card.is_reversed &&
          <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded">
              逆位
            </span>
          }
        </div>
      </motion.button>);

  };

  // 確認刪除
  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteReading(readingId);
      if (success) {
        // 成功刪除後的追蹤
        import('@/lib/actionTracker').then((m) => m.track('reading:delete', { id: readingId }));
        // 設置 reading 為 null，避免在跳轉過程中觸發 404
        setReading(null);
        // 關閉對話框
        setDeleteDialogOpen(false);
        // 刪除成功後跳轉到占卜列表頁面
        router.push('/readings');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setIsDeleting(false);
    }
  };

  // 請求 AI 解讀
  const handleRequestAI = async () => {
    if (!reading || reading.ai_interpretation_requested) return;

    setIsRequestingAI(true);

    try {
      console.log('[handleRequestAI] 開始請求 AI 解讀');
      console.log('[handleRequestAI] Reading:', reading);

      // Extract card IDs from current reading (not from store!)
      const cardIds: string[] = [];

      if ('card_positions' in reading && reading.card_positions && reading.card_positions.length > 0) {
        cardIds.push(...reading.card_positions.map((pos) => pos.card_id));
        console.log('[handleRequestAI] 從 card_positions 提取 card IDs:', cardIds);
      } else if ('cards_drawn' in reading && (reading as any).cards_drawn && (reading as any).cards_drawn.length > 0) {
        cardIds.push(...(reading as any).cards_drawn.map((card: any) => card.card_id || card.id).filter(Boolean));
        console.log('[handleRequestAI] 從 cards_drawn 提取 card IDs:', cardIds);
      }

      if (cardIds.length === 0) {
        console.error('[handleRequestAI] 找不到卡牌資料');
        return;
      }

      // Call backend streaming API directly
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      console.log('[handleRequestAI] 呼叫後端 streaming API');

      // Map faction values to backend enum
      // 統一陣營 key 格式（使用底線）
      const factionMapping: Record<string, string> = {
        // 獨立派
        'independent': 'independent',
        
        // 避難所系統
        'vault-tec': 'vault_dweller',
        'vault_tec': 'vault_dweller',
        'vault_dweller': 'vault_dweller',
        
        // 主要陣營
        'brotherhood': 'brotherhood',
        'brotherhood-of-steel': 'brotherhood',
        'brotherhood_of_steel': 'brotherhood',
        'enclave': 'enclave',
        'ncr': 'ncr',
        'legion': 'legion',
        'caesars-legion': 'legion',
        'caesars_legion': 'legion',
        
        // Fallout 4 陣營
        'minutemen': 'minutemen',
        'railroad': 'railroad',
        'institute': 'institute',
        
        // 其他陣營
        'children-of-atom': 'children_of_atom',
        'children_of_atom': 'children_of_atom',
        'raiders': 'raiders'
      };

      const mappedFaction = reading.faction_influence ?
      factionMapping[reading.faction_influence.toLowerCase()] || null :
      null;

      console.log('[handleRequestAI] Faction mapping:', {
        original: reading.faction_influence,
        mapped: mappedFaction
      });

      const requestBody = {
        card_ids: cardIds,
        question: reading.question || '未指定問題',
        character_voice: reading.character_voice_used || 'pip_boy',
        karma_alignment: reading.karma_context || 'neutral',
        faction_alignment: mappedFaction,
        spread_type: reading.spread_type || 'three_card'
      };

      console.log('[handleRequestAI] Request body:', requestBody);

      const response = await fetch(`${API_BASE_URL}/api/v1/readings/interpretation/stream-multi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pip-boy-token') || ''}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let interpretation = '';

      if (!reader) {
        throw new Error('無法讀取回應串流');
      }

      console.log('[handleRequestAI] 開始接收 AI 串流');

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[handleRequestAI] 串流結束');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();

            if (data === '[DONE]') {
              console.log('[handleRequestAI] 收到完成信號');
              break;
            }

            if (data.startsWith('[ERROR]')) {
              const errorMsg = data.substring(7).trim();
              console.error('[handleRequestAI] 收到錯誤:', errorMsg);
              throw new Error(errorMsg);
            }

            // Parse JSON-encoded chunk (backend sends JSON to handle newlines)
            try {
              const textChunk = JSON.parse(data);
              interpretation += textChunk;
            } catch (e) {
              console.warn('[handleRequestAI] Failed to parse chunk, using raw data:', data);
              interpretation += data;
            }
          }
        }
      }

      console.log('[handleRequestAI] AI 解讀完成，長度:', interpretation.length);

      // Save to backend via PATCH
      const updated = await readingsAPI.patch(readingId, {
        overall_interpretation: interpretation,
        summary_message: "AI 已完成解讀",
        prediction_confidence: 0.85,
        ai_interpretation_requested: true,
        ai_interpretation_at: new Date().toISOString(),
        ai_interpretation_provider: selectedProvider
      });

      if (updated) {
        setReading(updated);
        console.log('[handleRequestAI] 成功儲存 AI 解讀');
        import('@/lib/actionTracker').then((m) => m.track('reading:ai-interpretation', { id: readingId, provider: selectedProvider }));

        // 開始 TTS 生成狀態
        setIsTTSGenerating(true);

        // 等待 10 秒讓背景任務完成 TTS 音頻生成，然後重新載入資料
        console.log('[handleRequestAI] 等待 TTS 音頻生成...');
        setTimeout(async () => {
          try {
            const refreshed = await readingsAPI.getById(readingId);
            if (refreshed) {
              setReading(refreshed);
              console.log('[handleRequestAI] 已重新載入資料，音頻 URL:', refreshed.interpretation_audio_url);
            }
          } catch (err) {
            console.error('[handleRequestAI] 重新載入資料失敗:', err);
          } finally {
            // TTS 生成完成（無論成功或失敗）
            setIsTTSGenerating(false);
          }
        }, 10000); // 10 秒後重新載入
      }
    } catch (error) {
      console.error('[handleRequestAI] AI interpretation request failed:', error);
    } finally {
      setIsRequestingAI(false);
    }
  };

  // === 渲染函數 ===

  // AI 解讀區塊（可在多個 tab 中使用）
  const renderAIInterpretationSection = () => {
    const hasAI = reading?.ai_interpretation_requested;
    const canRequest = !hasAI && !isRequestingAI;

    return (
      <div className="border-2 border-pip-boy-green/30 p-6 bg-black/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-pip-boy-green flex items-center gap-2 uppercase tracking-wider">
            <PixelIcon name="brain" sizePreset="sm" variant="primary" decorative />
            AI 深度解讀
          </h3>

          {!hasAI && (
          <Button
            size="default"
            variant="default"
            onClick={handleRequestAI}
            disabled={!canRequest}
            className="flex items-center gap-2"
          >


            {isRequestingAI ? (
              <>
                <PixelIcon name="loader" animation="spin" sizePreset="xs" className="text-black" decorative />
                <span>分析中...</span>
              </>
            ) : (
              <>
                <PixelIcon name="sparkles" sizePreset="xs" className="text-black" decorative />
                <span>請求 AI 解讀</span>
              </>
            )}
          </Button>
          )}

          {hasAI &&
          <div className="flex items-center gap-2 text-xs text-pip-boy-green/70">
              <PixelIcon name="check" sizePreset="xs" variant="success" decorative />
              <span className="uppercase tracking-wider">已使用 AI 解讀</span>
              {reading.ai_interpretation_at &&
            <span className="text-pip-boy-green/50">
                  ({new Date(reading.ai_interpretation_at).toLocaleDateString('zh-TW')})
                </span>
            }
              {reading.ai_interpretation_provider &&
            <span className="text-pip-boy-green/50">
                  - {reading.ai_interpretation_provider.toUpperCase()}
                </span>
            }
            </div>
          }
        </div>

        {/* AI Provider 選擇 Switch（未使用 AI 解讀時顯示）*/}
        {!hasAI && !isRequestingAI &&
        <div className="mb-4 flex items-center justify-center gap-3 p-3 bg-pip-boy-green/5 border border-pip-boy-green/20 rounded">
            <span className={cn(
            "text-sm font-bold uppercase tracking-wider transition-colors",
            selectedProvider === 'openai' ? 'text-pip-boy-green' : 'text-pip-boy-green/50'
          )}>
              OpenAI
            </span>
            <Switch
            checked={selectedProvider === 'gemini'}
            onCheckedChange={(checked) => setSelectedProvider(checked ? 'gemini' : 'openai')}
            disabled={hasAI}
            className="data-[state=checked]:bg-pip-boy-green" />

            <span className={cn(
            "text-sm font-bold uppercase tracking-wider transition-colors",
            selectedProvider === 'gemini' ? 'text-pip-boy-green' : 'text-pip-boy-green/50'
          )}>
              Gemini
            </span>
          </div>
        }

        {/* AI 解讀內容 */}
        {hasAI && reading.overall_interpretation &&
        <div className="space-y-4">
            {/* TTS 語音朗讀 */}
            <div className="bg-pip-boy-green/5 p-4 border border-pip-boy-green/20 rounded">
              <div className="flex items-center gap-2 mb-3">
                <PixelIcon name="volume-up" sizePreset="sm" variant="primary" decorative />
                <h4 className="text-sm font-bold text-pip-boy-green uppercase tracking-wider">
                  語音朗讀
                </h4>
              </div>

              {/* TTS 生成中 Loading 狀態 */}
              {isTTSGenerating && !reading.interpretation_audio_url &&
            <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <PixelIcon
                name="loader"
                animation="spin"
                sizePreset="lg"
                variant="primary"
                decorative />

                  <div className="text-center">
                    <p className="text-sm text-pip-boy-green font-bold uppercase tracking-wider mb-1">
                      正在生成語音檔案...
                    </p>
                    <p className="text-xs text-pip-boy-green/60">
                      請稍候，TTS 服務處理中
                    </p>
                  </div>
                </div>
            }

              {/* 音頻播放器（TTS 完成或已有音頻檔案）*/}
              {!isTTSGenerating &&
            <StoryAudioPlayer
              key={reading.interpretation_audio_url || 'no-audio'} // 強制重新渲染當 URL 改變
              audioUrl={reading.interpretation_audio_url || ""}
              characterName="AI 解讀"
              characterKey="ai_interpretation"
              storyText={reading.overall_interpretation}
              useFallback={!reading.interpretation_audio_url}
              volume={0.8} />

            }
            </div>

            <div className="bg-black/70 p-4 border border-pip-boy-green/20 rounded">
              <p className="text-sm text-pip-boy-green/90 leading-relaxed whitespace-pre-wrap">
                {reading.overall_interpretation}
              </p>
            </div>

            {reading.summary_message &&
          <div className="bg-pip-boy-green/5 p-3 border-l-4 border-pip-boy-green rounded">
                <p className="text-xs text-pip-boy-green font-bold uppercase tracking-wider">
                  {reading.summary_message}
                </p>
              </div>
          }

            {reading.prediction_confidence !== undefined &&
          <div className="flex items-center gap-2 text-xs text-pip-boy-green/60">
                <PixelIcon name="chart" sizePreset="xs" decorative />
                <span className="uppercase tracking-wider">
                  預測信心度: {(reading.prediction_confidence * 100).toFixed(0)}%
                </span>
              </div>
          }
          </div>
        }

        {/* 未請求時的說明 */}
        {!hasAI && !isRequestingAI &&
        <div className="text-sm text-pip-boy-green/70 space-y-2">
            <p className="leading-relaxed">
              使用 AI 深度分析你的占卜結果，獲得更詳細的解讀與建議。
            </p>
            <p className="text-xs text-pip-boy-green/50 flex items-center gap-2">
              <PixelIcon name="alert" sizePreset="xs" variant="warning" decorative />
              <span className="uppercase tracking-wider">注意：每次占卜只能使用一次 AI 解讀功能</span>
            </p>
          </div>
        }

        {/* 錯誤顯示 */}
        {storeError &&
        <div className="mt-4 bg-red-500/10 border border-red-500/30 p-3 rounded">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <PixelIcon name="alert" sizePreset="xs" variant="error" decorative />
              <span>{storeError}</span>
            </div>
          </div>
        }
      </div>);

  };

  // 1. 占卜總覽 Tab
  const renderOverviewTab = () =>
  <motion.div
    key="overview"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6">

      {/* AI 解讀區塊 */}
      {renderAIInterpretationSection()}

      {/* 占卜資訊卡片 */}
      <div className="border-2 border-pip-boy-green bg-pip-boy-green/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-pip-boy-green">占卜記錄</h2>
          <span className="text-sm text-pip-boy-green/70">
            {reading && formatDate(reading.created_at)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {reading?.spread_type &&
        <span className="px-3 py-1 bg-pip-boy-green/20 border border-pip-boy-green/50 text-sm rounded">
              {getSpreadTypeName(reading.spread_type)}
            </span>
        }
          {reading?.faction_influence &&
        <span className="px-3 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 text-sm rounded">
              {getFactionName(reading.faction_influence)}
            </span>
        }
          {reading?.karma_context &&
        <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-sm rounded">
              {getKarmaName(reading.karma_context)}
            </span>
        }
        </div>

        <div className="border-l-4 border-pip-boy-green/50 pl-4 py-2 bg-pip-boy-green/5">
          <p className="text-pip-boy-green italic text-lg">
            "{reading?.question}"
          </p>
        </div>
      </div>

      {/* 所有卡牌網格 */}
      <div>
        <h3 className="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-pip-boy-green">
          <PixelIcon name="spade" sizePreset="sm" variant="primary" decorative />
          抽到的卡牌
        </h3>

        {cardsData.length === 0 ? (
      /* 無卡牌資料的提示 */
      <div className="border-2 border-orange-400/40 bg-orange-500/5 p-8 rounded-lg">
            <div className="text-center space-y-4">
              <PixelIcon name="alert-triangle" sizePreset="xl" variant="warning" animation="pulse" decorative />
              <div>
                <h4 className="text-orange-400 font-bold text-lg mb-2">暫無卡牌資料</h4>
                <p className="text-pip-boy-green/70 text-sm">
                  此占卜記錄的卡牌資料尚未載入或不可用。
                </p>
                <p className="text-pip-boy-green/60 text-xs mt-2">
                  這可能是由於資料庫中的占卜記錄尚未包含完整的卡牌資訊。
                </p>
              </div>
            </div>
          </div>) :

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cardsData.map((card, index) =>
        <TiltCard key={index} card={card} index={index} />
        )}
          </div>
      }
      </div>
    </motion.div>;


  // 解讀結果 Tab
  const renderInterpretationTab = () =>
  <motion.div
    key="interpretation"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6">

      {/* AI 解讀區塊 */}
      {renderAIInterpretationSection()}

      {/* 原始解讀結果 */}
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 rounded-lg">
        <h3 className="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-pip-boy-green">
          <PixelIcon name="book" sizePreset="sm" variant="primary" decorative />
          完整解讀結果
        </h3>

        <p className="text-pip-boy-green/90 whitespace-pre-wrap leading-relaxed">
          {reading?.interpretation}
        </p>
      </div>
    </motion.div>;


  // 4. 元資料 Tab
  const renderMetadataTab = () =>
  <motion.div
    key="metadata"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reading?.character_voice_used &&
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-pip-boy-green">
              <PixelIcon name="user" sizePreset="xs" variant="primary" decorative />
              角色聲音
            </h3>
            <p className="text-pip-boy-green/80 text-base leading-relaxed">
              {getCharacterName(reading.character_voice_used)}
            </p>
          </div>
      }

        {reading?.karma_context &&
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-pip-boy-green">
              <PixelIcon name="zap" sizePreset="xs" variant="warning" decorative />
              業力背景
            </h3>
            <p className="text-pip-boy-green/80 text-base leading-relaxed">
              {getKarmaName(reading.karma_context)}
            </p>
          </div>
      }

        {reading?.faction_influence &&
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 rounded-lg">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2 text-pip-boy-green">
              <PixelIcon name="flag" sizePreset="xs" variant="info" decorative />
              派系影響
            </h3>
            <p className="text-pip-boy-green/80 text-base leading-relaxed">
              {getFactionName(reading.faction_influence)}
            </p>
          </div>
      }
      </div>
    </motion.div>;


  // === Loading & Error States ===
  // 顯示載入畫面（初始化中或資料載入中）
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">
            {!isInitialized ? '驗證認證狀態...' : '載入占卜記錄...'}
          </p>
        </div>
      </div>);

  }

  if (error || !reading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="border-2 border-red-500 bg-red-500/10 p-6 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <PixelIcon name="alert-triangle" sizePreset="lg" variant="error" animation="pulse" decorative />
            <h2 className="text-xl font-bold text-red-400 uppercase">錯誤</h2>
          </div>
          <p className="text-red-300 mb-6">{error || '找不到此占卜記錄'}</p>
          <Button size="sm" variant="outline"
          onClick={() => router.push('/dashboard')}
          className="w-full px-4 py-3 transition-all duration-200 uppercase font-bold tracking-wider">

            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="arrow-left" sizePreset="xs" variant="default" decorative />
              返回 Dashboard
            </span>
          </Button>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-black text-pip-boy-green p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Button size="default" variant="link"
          onClick={() => router.push('/readings')}
          className="flex items-center gap-2 transition-colors mb-4">

            <PixelIcon name="arrow-left" sizePreset="xs" variant="default" decorative />
            <span className="text-sm uppercase tracking-wider">返回占卜紀錄</span>
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b-2 border-pip-boy-green/30 mb-6">
          <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-pip-boy-green/30">
            {tabConfig.map((tab, index) => {
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
                  transition={{ delay: index * 0.05 }}>

                  <PixelIcon name={tab.icon} sizePreset="xs" decorative />
                  <span>{tab.label}</span>
                </motion.button>);

            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[60vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'interpretation' && renderInterpretationTab()}
            {activeTab === 'metadata' && renderMetadataTab()}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/readings')}
            className="px-4 py-3 transition-all duration-200 uppercase font-bold tracking-wider"
          >
            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="arrow-left" sizePreset="xs" variant="default" decorative />
              返回占卜記錄
            </span>
          </Button>

          {/* Share Button - 只對已完成的占卜顯示 */}
          {reading && <ShareButton readingId={reading.id} />}

          <Button size="sm" variant="outline"
          onClick={() => setDeleteDialogOpen(true)}
          className="px-4 py-3 transition-all duration-200 uppercase font-bold tracking-wider">

            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="trash" sizePreset="xs" decorative />
              刪除占卜
            </span>
          </Button>

          <Button size="sm" variant="outline"
          onClick={() => router.push('/readings/new')}
          className="px-4 py-3 transition-all duration-200 uppercase font-bold tracking-wider">

            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="magic" sizePreset="xs" variant="success" decorative />
              新占卜
            </span>
          </Button>
        </div>

        {/* 刪除確認對話框 */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="刪除占卜記錄"
          description="確定要刪除這筆占卜記錄嗎？此操作無法復原，所有相關的卡牌和解讀資料都將被永久刪除。"
          confirmText="刪除"
          cancelText="取消"
          variant="destructive"
          isLoading={isDeleting} />


        {/* 卡片詳情 Modal */}
        {selectedCardForModal &&
        <CardDetailModal
          card={selectedCardForModal as any}
          isOpen={isCardModalOpen}
          onClose={() => {
            setIsCardModalOpen(false);
            setSelectedCardForModal(null);
          }}
          readingContext={
          // 從 cardsData 中找到對應的 card，取得占卜情境資訊
          (() => {
            const cardIndex = cardsData.findIndex((c) => c.id === selectedCardForModal.id);
            if (cardIndex === -1) return undefined;

            const card = cardsData[cardIndex];
            return {
              question: reading?.question,
              spreadType: reading?.spread_type ? getSpreadTypeName(reading.spread_type) : undefined,
              positionName: card.position_in_reading,
              positionMeaning: card.position_meaning,
              cardIndex: cardIndex,
              totalCards: cardsData.length
            };
          })()
          }
          enableAudio={true}
          showQuickActions={true}
          showBookmark={!!user}
          showShare={true}
          showPersonalNotes={!!user}
          isGuestMode={!user}
          factionInfluence={reading?.faction_influence} />

        }
      </div>
    </div>);

}