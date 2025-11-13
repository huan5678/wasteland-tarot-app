/**
 * SharePage - 公開分享頁面
 *
 * 功能：
 * - 通過 share_token 載入公開的占卜資料
 * - 無需登入即可查看
 * - 只顯示過濾後的公開資料（不含 user_id, email 等）
 * - 提供 CTA 引導訪客開始自己的占卜
 *
 * TDD Green Phase: 實作功能讓測試通過
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '分享占卜 | 廢土塔羅 - 查看公開占卜記錄',
  description: '查看用戶分享的塔羅占卜記錄。無需登入即可瀏覽完整的占卜結果與解讀內容。',
};

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { shareAPI } from '@/lib/api/share';
import { PixelIcon } from '@/components/ui/icons';
import type { PublicReadingData } from '@/types/api';
import { cn } from '@/lib/utils';
import { getCardImageUrl, getCardImageAlt, getFallbackImageUrl } from '@/lib/utils/cardImages';

// 工具函數
import { Button } from "@/components/ui/button";const getSpreadTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'single': '單張牌',
    'three_card': '三張牌',
    'celtic_cross': '凱爾特十字',
    'past_present_future': '過去現在未來'
  };
  return typeMap[type] || type;
};

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

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const shareToken = params.token as string;

  const [reading, setReading] = useState<PublicReadingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchSharedReading = async () => {
      if (!shareToken) {
        setError('無效的分享連結');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await shareAPI.getSharedReading(shareToken);
        console.log('📊 Shared reading data:', data);
        setReading(data);
      } catch (err: any) {
        console.error('Failed to fetch shared reading:', err);

        if (err.status === 404) {
          setError('此分享連結不存在或已失效');
        } else if (err.status === 422) {
          setError('無效的分享連結格式');
        } else {
          setError(err.message || '無法載入分享的占卜結果');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedReading();
  }, [shareToken]);

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  // 轉換卡牌資料
  const cardsData = useMemo(() => {
    if (!reading?.card_positions) return [];

    return reading.card_positions.map((position, index) => {
      const card = position.card;
      if (!card) return null;

      return {
        id: card.id,
        name: card.name,
        suit: card.suit,
        number: card.number || card.card_number,
        is_major_arcana: card.is_major_arcana || card.suit === 'major_arcana',
        image_url: card.image_url,
        is_reversed: position.is_reversed,
        position_name: position.position_name,
        position_meaning: position.position_meaning,
        upright_meaning: card.upright_meaning,
        reversed_meaning: card.reversed_meaning,
        fallout_reference: card.fallout_easter_egg || card.nuka_cola_reference,
        keywords: card.keywords,
        card_index: index
      };
    }).filter(Boolean);
  }, [reading]);

  // === Loading State ===
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pip-boy-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pip-boy-green">載入分享的占卜結果...</p>
        </div>
      </div>);

  }

  // === Error State ===
  if (error || !reading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="border-2 border-red-500 bg-red-500/10 p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <PixelIcon name="alert-triangle" sizePreset="lg" variant="error" animation="pulse" decorative />
            <h2 className="text-xl font-bold text-red-400 uppercase">無法載入</h2>
          </div>
          <p className="text-red-300 mb-6">{error || '找不到此分享的占卜結果'}</p>

          <Button size="sm" variant="outline"
          onClick={() => router.push('/')}
          className="w-full px-4 py-3 transition-all duration-200 uppercase font-bold tracking-wider">

            <span className="flex items-center justify-center gap-2">
              <PixelIcon name="home" sizePreset="xs" decorative />
              前往首頁
            </span>
          </Button>
        </div>
      </div>);

  }

  // === Success State - Display Reading ===
  return (
    <div className="min-h-screen bg-black text-pip-boy-green p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-pip-boy-green bg-pip-boy-green/5 p-6 mb-8">

          <div className="flex items-center gap-3 mb-2">
            <PixelIcon name="share" sizePreset="md" variant="primary" decorative />
            <h1 className="text-3xl font-bold uppercase tracking-wider text-pip-boy-green">
              分享的占卜結果
            </h1>
          </div>
          <p className="text-pip-boy-green/70 text-sm">
            有人分享了他們的塔羅占卜結果給你
          </p>
        </motion.div>

        {/* Reading Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border-2 border-pip-boy-green bg-pip-boy-green/5 p-6 mb-6">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold uppercase tracking-wider text-pip-boy-green">占卜記錄</h2>
            <span className="text-sm text-pip-boy-green/70">
              {formatDate(reading.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {reading.spread_type &&
            <span className="px-3 py-1 bg-pip-boy-green/20 border border-pip-boy-green/50 text-sm rounded">
                {getSpreadTypeName(reading.spread_type)}
              </span>
            }
            {reading.character_voice &&
            <span className="px-3 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 text-sm rounded">
                角色: {reading.character_voice}
              </span>
            }
          </div>

          <div className="border-l-4 border-pip-boy-green/50 pl-4 py-2 bg-pip-boy-green/5">
            <p className="text-pip-boy-green italic text-lg">
              "{reading.question}"
            </p>
          </div>
        </motion.div>

        {/* Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6">

          <h3 className="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-pip-boy-green">
            <PixelIcon name="spade" sizePreset="sm" variant="primary" decorative />
            抽到的卡牌
          </h3>

          {cardsData.length === 0 ?
          <div className="border-2 border-orange-400/40 bg-orange-500/5 p-8 rounded-lg">
              <div className="text-center space-y-4">
                <PixelIcon name="alert-triangle" sizePreset="xl" variant="warning" animation="pulse" decorative />
                <div>
                  <h4 className="text-orange-400 font-bold text-lg mb-2">暫無卡牌資料</h4>
                  <p className="text-pip-boy-green/70 text-sm">
                    此占卜記錄的卡牌資料尚未載入或不可用。
                  </p>
                </div>
              </div>
            </div> :

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {cardsData.map((card: any, index) =>
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-4">

                  <div className="aspect-[2/3] bg-pip-boy-green/20 border border-pip-boy-green/50 rounded flex flex-col items-center justify-center mb-3 relative overflow-hidden">
                    {card.number !== undefined && card.suit && !imageErrors[index] ?
                <img
                  src={getCardImageUrl(card)}
                  alt={getCardImageAlt(card)}
                  className={cn(
                    "w-full h-full object-cover",
                    card.is_reversed && "rotate-180"
                  )}
                  onError={() => handleImageError(index)} /> :


                <>
                        <PixelIcon name="spade" sizePreset="lg" variant="primary" decorative />
                        <span className="text-xs text-pip-boy-green/70 mt-2">
                          {card.position_name}
                        </span>
                      </>
                }
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-bold text-pip-boy-green mb-1">
                      {card.name}
                    </p>
                    {card.position_name &&
                <p className="text-xs text-pip-boy-green/70">
                        {card.position_name}
                      </p>
                }
                    {card.is_reversed &&
                <span className="inline-block mt-1 px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded">
                        逆位
                      </span>
                }
                  </div>
                </motion.div>
            )}
            </div>
          }
        </motion.div>

        {/* Interpretation Section */}
        {reading.overall_interpretation &&
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6 mb-6">

            <h3 className="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-pip-boy-green">
              <PixelIcon name="book" sizePreset="sm" variant="primary" decorative />
              占卜解讀
            </h3>

            <div className="bg-black/50 p-4 border border-pip-boy-green/20 rounded">
              <p className="text-sm text-pip-boy-green/90 leading-relaxed whitespace-pre-wrap">
                {reading.overall_interpretation}
              </p>
            </div>

            {reading.summary_message &&
          <div className="mt-4 bg-pip-boy-green/5 p-3 border-l-4 border-pip-boy-green rounded">
                <p className="text-xs text-pip-boy-green font-bold uppercase tracking-wider">
                  {reading.summary_message}
                </p>
              </div>
          }
          </motion.div>
        }

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border-2 border-pip-boy-green bg-pip-boy-green/10 p-8 text-center">

          <h3 className="text-2xl font-bold uppercase tracking-wider mb-3 text-pip-boy-green">
            想試試看自己的命運嗎？
          </h3>
          <p className="text-pip-boy-green/70 mb-6 text-sm">
            在廢土中尋找你的答案，開始你的塔羅占卜之旅
          </p>

          <Button size="xl" variant="outline"
          onClick={() => router.push('/')}
          className="px-8 py-4 transition-all duration-200 uppercase font-bold tracking-wider">

            <span className="flex items-center justify-center gap-3">
              <PixelIcon name="sparkles" sizePreset="sm" variant="warning" decorative />
              馬上開始占卜
              <PixelIcon name="arrow-right" sizePreset="sm" decorative />
            </span>
          </Button>

          <p className="mt-4 text-xs text-pip-boy-green/50 uppercase tracking-wider">
            無需登入 · 完全免費
          </p>
        </motion.div>

        {/* Privacy Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center">

          <p className="text-xs text-pip-boy-green/60">
            <PixelIcon name="lock" sizePreset="xs" className="inline mr-1" decorative />
            此分享連結不包含任何個人身份資訊，僅顯示占卜結果
          </p>
        </motion.div>
      </div>
    </div>);

}