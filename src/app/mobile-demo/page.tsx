'use client';

import React, { useState, useEffect } from 'react';
import { MobileTarotCard } from '@/components/mobile/MobileTarotCard';
import { MobileReadingInterface } from '@/components/mobile/MobileReadingInterface';
import { MobileNavigation, MobileTabBar, PullToRefresh } from '@/components/mobile/MobileNavigation';
import { MobileSpreadSelector } from '@/components/mobile/MobileSpreadSelector';
import { ResponsiveContainer, MobileGrid, MobileCard, SafeAreaView } from '@/components/layout/ResponsiveContainer';
import { useAdvancedDeviceCapabilities } from '@/hooks/useAdvancedGestures';
import { useMobilePerformance, useAdaptiveQuality } from '@/hooks/useMobilePerformance';
import { createMobileAccessibility } from '@/utils/mobileAccessibility';
import { PixelIcon } from '@/components/ui/icons';
import type { IconName } from '@/components/ui/icons';

// Mock data for demo
import { Button } from "@/components/ui/button";const mockCard = {
  id: 1,
  name: '愚者',
  suit: '大秘儀',
  number: 0,
  meaning_upright: '新的開始，純真，自由精神，原始',
  meaning_reversed: '魯莽，愚蠢，冒險，無視風險',
  image_url: '/images/cards/fool.jpg',
  keywords: ['新開始', '冒險', '純真', '自由'],
  position: 'upright' as const
};

const mockSpreads = [
{
  id: 'single',
  name: '單牌占卜',
  description: '最簡單的占卜方式，適合快速了解當前狀況或獲得簡單指引。',
  cardCount: 1,
  difficulty: 'beginner' as const,
  category: 'daily' as const,
  duration: '1-2 分鐘',
  iconName: 'star' as IconName,
  preview: ['當前狀況'],
  positions: [
  { id: '1', label: '核心訊息', meaning: '代表當前最重要的訊息或指引' }],

  isPopular: true
},
{
  id: 'love_triangle',
  name: '愛情三角',
  description: '探索愛情關係中的各種面向，包括過去、現在和未來的感情走向。',
  cardCount: 3,
  difficulty: 'intermediate' as const,
  category: 'love' as const,
  duration: '5-10 分鐘',
  iconName: 'heart' as IconName,
  preview: ['過去', '現在', '未來'],
  positions: [
  { id: '1', label: '過去影響', meaning: '影響現在愛情狀況的過去因素' },
  { id: '2', label: '當前狀態', meaning: '目前愛情關係的真實狀況' },
  { id: '3', label: '未來走向', meaning: '愛情關係可能的發展方向' }],

  isNew: true
},
{
  id: 'career_path',
  name: '事業道路',
  description: '深入分析您的職業發展，包括現狀分析、機會與挑戰、以及未來建議。',
  cardCount: 5,
  difficulty: 'advanced' as const,
  category: 'career' as const,
  duration: '15-20 分鐘',
  iconName: 'coin' as IconName,
  preview: ['現狀', '優勢', '挑戰', '機會', '建議'],
  positions: [
  { id: '1', label: '現況分析', meaning: '當前職業狀況的整體評估' },
  { id: '2', label: '個人優勢', meaning: '您在職場上的核心競爭力' },
  { id: '3', label: '面臨挑戰', meaning: '需要克服的困難或障礙' },
  { id: '4', label: '發展機會', meaning: '可以把握的成長機會' },
  { id: '5', label: '行動建議', meaning: '具體的改進或發展策略' }],

  isFavorite: true
}];


const mockReading = {
  id: 'demo-reading',
  title: '今日運勢占卜',
  spreadType: 'single',
  cards: [mockCard],
  interpretation: '愚者牌代表著新的開始和無限的可能性。這張牌出現在您的占卜中，暗示著現在是一個適合冒險和嘗試新事物的時機。不要被過去的經驗束縛，保持開放的心態，勇敢地踏出第一步。雖然前方的路充滿未知，但正是這種不確定性帶來了最大的潛力和成長機會。',
  timestamp: new Date(),
  notes: '這是一個充滿希望的卦象，建議保持樂觀積極的態度。'
};

export default function MobileDemoPage() {
  const [currentDemo, setCurrentDemo] = useState<
    'cards' | 'reading' | 'spreads' | 'navigation' | 'performance'>(
    'cards');
  const [showFullscreenReading, setShowFullscreenReading] = useState(false);
  const [selectedSpread, setSelectedSpread] = useState('');

  const { isTouchDevice, screenSize, isIOS, isAndroid } = useAdvancedDeviceCapabilities();
  const performanceMetrics = useMobilePerformance();
  const { qualityLevel, settings } = useAdaptiveQuality();

  // Initialize mobile accessibility
  useEffect(() => {
    const accessibility = createMobileAccessibility({
      enableVoiceOver: true,
      enableScreenReader: true,
      enableHighContrast: false,
      fontSize: 'medium'
    });

    accessibility.announce('歡迎使用廢土塔羅移動版演示');

    return () => {
      accessibility.destroy();
    };
  }, []);

  const refreshData = async () => {
    // Simulate data refresh
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('Data refreshed');
  };

  const demoTabs = [
  { id: 'cards', label: '卡牌', iconName: 'star' as IconName, isActive: currentDemo === 'cards' },
  { id: 'reading', label: '占卜', iconName: 'heart' as IconName, isActive: currentDemo === 'reading' },
  { id: 'spreads', label: '牌陣', iconName: 'users' as IconName, isActive: currentDemo === 'spreads' },
  { id: 'navigation', label: '導航', iconName: 'trending-up' as IconName, isActive: currentDemo === 'navigation' },
  { id: 'performance', label: '性能', iconName: 'zap' as IconName, isActive: currentDemo === 'performance' }];


  const DeviceInfo = () =>
  <MobileCard variant="outlined" className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-pip-boy-green font-bold">設備信息</h3>
        <div className="flex items-center gap-2 text-pip-boy-green/70">
          {screenSize === 'mobile' && <PixelIcon name="device-mobile" size={24} decorative />}
          {screenSize === 'tablet' && <PixelIcon name="device-tablet" size={24} decorative />}
          {screenSize === 'desktop' && <PixelIcon name="device-desktop" size={24} decorative />}
          <span className="text-sm">{screenSize}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-pip-boy-green/60">觸控設備</div>
          <div className="text-pip-boy-green">
            {isTouchDevice ? '是' : '否'}
          </div>
        </div>
        <div>
          <div className="text-pip-boy-green/60">操作系統</div>
          <div className="text-pip-boy-green">
            {isIOS ? 'iOS' : isAndroid ? 'Android' : '其他'}
          </div>
        </div>
        <div>
          <div className="text-pip-boy-green/60">畫質等級</div>
          <div className="text-pip-boy-green">
            {qualityLevel === 'low' ? '低' : qualityLevel === 'medium' ? '中' : '高'}
          </div>
        </div>
        <div>
          <div className="text-pip-boy-green/60">FPS</div>
          <div className="text-pip-boy-green">
            {performanceMetrics.fps}
          </div>
        </div>
      </div>
    </MobileCard>;


  const renderCurrentDemo = () => {
    switch (currentDemo) {
      case 'cards':
        return (
          <div className="space-y-8">
            <DeviceInfo />

            <MobileCard>
              <h3 className="text-pip-boy-green font-bold mb-4">移動卡牌演示</h3>
              <p className="text-pip-boy-green/70 mb-6 text-sm">
                體驗針對移動設備優化的塔羅牌交互功能
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <h4 className="text-pip-boy-green font-bold mb-3">標準大小</h4>
                  <MobileTarotCard
                    card={mockCard}
                    isRevealed={true}
                    position="upright"
                    size="medium"
                    showKeywords={true}
                    enableHaptic={true}
                    onLongPress={(card) => console.log('Long press:', card.name)}
                    onSwipe={(direction, card) => console.log('Swipe:', direction, card.name)}
                    onDoubleTap={(card) => console.log('Double tap:', card.name)} />

                </div>

                <div className="text-center">
                  <h4 className="text-pip-boy-green font-bold mb-3">小尺寸</h4>
                  <MobileTarotCard
                    card={mockCard}
                    isRevealed={false}
                    position="upright"
                    size="small"
                    enableHaptic={true}
                    onClick={(card) => console.log('Click:', card.name)} />

                </div>
              </div>

              <div className="mt-8 p-4 bg-pip-boy-green/10 rounded-lg">
                <h4 className="text-pip-boy-green font-bold mb-2">手勢操作</h4>
                <ul className="text-pip-boy-green/70 text-sm space-y-1">
                  <li>• 點擊：翻牌或選擇</li>
                  <li>• 長按：查看詳細信息</li>
                  <li>• 雙擊：進入全螢幕模式</li>
                  <li>• 滑動：切換或導航</li>
                  <li>• 捏合：縮放（全螢幕模式）</li>
                </ul>
              </div>

              <Button size="default" variant="link"
              onClick={() => setShowFullscreenReading(true)}
              className="w-full mt-6 py-3 font-bold transition-colors\n flex items-center justify-center gap-2">



                體驗全螢幕閱讀
                <PixelIcon name="arrow-right" size={24} decorative />
              </Button>
            </MobileCard>
          </div>);


      case 'reading':
        return (
          <div className="space-y-6">
            <DeviceInfo />

            <MobileCard>
              <h3 className="text-pip-boy-green font-bold mb-4">移動閱讀體驗</h3>
              <p className="text-pip-boy-green/70 mb-6 text-sm">
                針對移動設備優化的占卜閱讀界面，支持全螢幕模式、語音朗讀和手勢導航
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-pip-boy-green/5 rounded-lg">
                  <span className="text-pip-boy-green">全螢幕模式</span>
                  <span className="text-pip-boy-green/70 text-sm">✓</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-pip-boy-green/5 rounded-lg">
                  <span className="text-pip-boy-green">手勢導航</span>
                  <span className="text-pip-boy-green/70 text-sm">✓</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-pip-boy-green/5 rounded-lg">
                  <span className="text-pip-boy-green">語音朗讀</span>
                  <span className="text-pip-boy-green/70 text-sm">✓</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-pip-boy-green/5 rounded-lg">
                  <span className="text-pip-boy-green">觸覺回饋</span>
                  <span className="text-pip-boy-green/70 text-sm">✓</span>
                </div>
              </div>

              <Button size="default" variant="link"
              onClick={() => setShowFullscreenReading(true)}
              className="w-full mt-6 py-3 font-bold transition-colors">


                開始演示閱讀
              </Button>
            </MobileCard>
          </div>);


      case 'spreads':
        return (
          <div className="space-y-6">
            <DeviceInfo />

            <MobileCard>
              <h3 className="text-pip-boy-green font-bold mb-4">智能牌陣選擇器</h3>
              <p className="text-pip-boy-green/70 mb-6 text-sm">
                移動優化的牌陣選擇界面，具備智能篩選、排序和詳細預覽功能
              </p>

              <MobileSpreadSelector
                spreads={mockSpreads}
                selectedSpread={selectedSpread}
                onSpreadSelect={setSelectedSpread}
                onStartReading={(spreadId) => {
                  console.log('Starting reading with spread:', spreadId);
                  setShowFullscreenReading(true);
                }} />

            </MobileCard>
          </div>);


      case 'navigation':
        return (
          <div className="space-y-6">
            <DeviceInfo />

            <MobileCard>
              <h3 className="text-pip-boy-green font-bold mb-4">移動導航系統</h3>
              <p className="text-pip-boy-green/70 mb-6 text-sm">
                針對移動設備設計的導航系統，支持下拉刷新、底部標籤欄和手勢操作
              </p>

              <div className="space-y-6">
                {/* Tab Bar Demo */}
                <div>
                  <h4 className="text-pip-boy-green font-bold mb-3">底部標籤欄</h4>
                  <div className="border border-pip-boy-green/30 rounded-lg overflow-hidden">
                    <MobileTabBar
                      tabs={demoTabs}
                      onTabChange={setCurrentDemo} />

                  </div>
                </div>

                {/* Pull to Refresh Demo */}
                <div>
                  <h4 className="text-pip-boy-green font-bold mb-3">下拉刷新</h4>
                  <div className="h-32 border border-pip-boy-green/30 rounded-lg overflow-hidden">
                    <PullToRefresh onRefresh={refreshData}>
                      <div className="h-full flex items-center justify-center">
                        <p className="text-pip-boy-green/70 text-sm">在此區域向下拉動以刷新</p>
                      </div>
                    </PullToRefresh>
                  </div>
                </div>

                {/* Navigation Features */}
                <div>
                  <h4 className="text-pip-boy-green font-bold mb-3">導航功能</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-pip-boy-green/5 rounded-lg">
                      <span className="text-pip-boy-green">自動隱藏</span>
                      <span className="text-pip-boy-green/70 text-sm">滾動時隱藏</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-pip-boy-green/5 rounded-lg">
                      <span className="text-pip-boy-green">快速操作</span>
                      <span className="text-pip-boy-green/70 text-sm">懸浮按鈕</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-pip-boy-green/5 rounded-lg">
                      <span className="text-pip-boy-green">手勢支持</span>
                      <span className="text-pip-boy-green/70 text-sm">滑動導航</span>
                    </div>
                  </div>
                </div>
              </div>
            </MobileCard>
          </div>);


      case 'performance':
        return (
          <div className="space-y-6">
            <DeviceInfo />

            <MobileCard>
              <h3 className="text-pip-boy-green font-bold mb-4">性能監控</h3>
              <p className="text-pip-boy-green/70 mb-6 text-sm">
                實時監控應用性能，自動調整畫質以確保流暢體驗
              </p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-pip-boy-green/10 rounded-lg text-center">
                    <div className="text-2xl text-pip-boy-green font-bold">
                      {performanceMetrics.fps}
                    </div>
                    <div className="text-pip-boy-green/70 text-sm">FPS</div>
                  </div>
                  <div className="p-4 bg-pip-boy-green/10 rounded-lg text-center">
                    <div className="text-2xl text-pip-boy-green font-bold">
                      {performanceMetrics.memoryUsage}%
                    </div>
                    <div className="text-pip-boy-green/70 text-sm">記憶體使用</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-pip-boy-green/5 rounded-lg">
                    <span className="text-pip-boy-green">網路速度</span>
                    <span className="text-pip-boy-green/70 text-sm">
                      {performanceMetrics.connectionSpeed}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-pip-boy-green/5 rounded-lg">
                    <span className="text-pip-boy-green">低效能設備</span>
                    <span className="text-pip-boy-green/70 text-sm">
                      {performanceMetrics.isLowPerformanceDevice ? '是' : '否'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-pip-boy-green/5 rounded-lg">
                    <span className="text-pip-boy-green">自適應畫質</span>
                    <span className="text-pip-boy-green/70 text-sm">
                      {qualityLevel === 'low' ? '低' : qualityLevel === 'medium' ? '中' : '高'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-pip-boy-green/10 rounded-lg">
                  <h5 className="text-pip-boy-green font-bold mb-2">優化設置</h5>
                  <div className="text-sm text-pip-boy-green/70 space-y-1">
                    <div>動畫時長: {settings.animationDuration}s</div>
                    <div>圖片品質: {settings.imageQuality}%</div>
                    <div>粒子效果: {settings.enableParticles ? '啟用' : '停用'}</div>
                    <div>陰影效果: {settings.enableShadows ? '啟用' : '停用'}</div>
                  </div>
                </div>
              </div>
            </MobileCard>
          </div>);


      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="min-h-screen bg-gradient-to-br from-wasteland-darker via-wasteland-dark to-black">
      <PullToRefresh onRefresh={refreshData} className="min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-sm border-b border-pip-boy-green/30 p-4">
          <h1 className="text-pip-boy-green text-xl font-bold text-center">
            廢土塔羅移動版演示
          </h1>
        </div>

        {/* Content */}
        <div className="p-4 pb-24">
          <ResponsiveContainer
            enableSwipeNavigation={true}
            className="max-w-2xl mx-auto">

            {renderCurrentDemo()}
          </ResponsiveContainer>
        </div>

        {/* Bottom Navigation */}
        <MobileTabBar
          tabs={demoTabs}
          onTabChange={setCurrentDemo}
          className="fixed bottom-0 left-0 right-0" />


        {/* Fullscreen Reading Demo */}
        {showFullscreenReading &&
        <MobileReadingInterface
          reading={mockReading}
          onClose={() => setShowFullscreenReading(false)}
          onShare={() => console.log('Share reading')}
          onSave={() => console.log('Save reading')}
          enableVoice={true} />

        }
      </PullToRefresh>
    </SafeAreaView>);

}