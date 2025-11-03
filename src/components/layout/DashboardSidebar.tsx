'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/authStore';
import { useBingoStore } from '@/lib/stores/bingoStore';
import { PixelIcon } from '@/components/ui/icons';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger } from
'@/components/ui/tooltip';import { Button } from "@/components/ui/button";

const SIDEBAR_COLLAPSED_KEY = 'dashboard-sidebar-collapsed';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  ariaLabel: string;
  badge?: boolean;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  // 賓果 Store（用於紅點邏輯）
  const hasClaimed = useBingoStore((s) => s.hasClaimed);
  const dailyNumber = useBingoStore((s) => s.dailyNumber);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(120); // 預設值

  // 初始化：從 localStorage 讀取狀態
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // 監聽 Header 高度變化
  useEffect(() => {
    const handleHeaderHeightChange = ((e: CustomEvent) => {
      setHeaderHeight(e.detail.height);
    }) as EventListener;

    window.addEventListener('header-height-change', handleHeaderHeightChange);

    return () => {
      window.removeEventListener('header-height-change', handleHeaderHeightChange);
    };
  }, []);

  /**
   * 賓果簽到紅點邏輯（修復 2025-10-30）
   *
   * 顯示條件：
   * 1. 使用者已登入
   * 2. 今日尚未領取號碼（hasClaimed === false）
   * 3. 有可領取的號碼（dailyNumber !== null，即日期 <= 25 日）
   *
   * 隱藏條件：
   * - 已領取當天號碼
   * - 超過 25 日（沒有號碼可領取）
   */
  const showBingoBadge = user && !hasClaimed && dailyNumber !== null;

  // 切換收合狀態
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newState));
  };

  // 導航處理
  const handleNavigation = (href: string) => {
    router.push(href);
  };

  // 選單結構（功能分類）
  const navSections: NavSection[] = [
  {
    title: '核心功能',
    items: [
    { href: '/dashboard', label: '控制台', icon: 'home', ariaLabel: '控制台' },
    { href: '/readings/new', label: '新占卜', icon: 'spade', ariaLabel: '新占卜' },
    { href: '/readings', label: '占卜記錄', icon: 'scroll-text', ariaLabel: '占卜記錄' }]

  },
  {
    title: '工具',
    items: [
    { href: '/dashboard/rhythm-editor', label: '節奏編輯器', icon: 'music', ariaLabel: '節奏編輯器' },
    { href: '/cards', label: '卡牌圖書館', icon: 'library', ariaLabel: '卡牌圖書館' }]

  },
  {
    title: '每日',
    items: [
    { href: '/bingo', label: '賓果簽到', icon: 'dices', ariaLabel: '賓果簽到', badge: showBingoBadge },
    { href: '/achievements', label: '成就系統', icon: 'trophy', ariaLabel: '成就系統' }]

  },
  {
    title: '設定',
    items: [
    { href: '/profile', label: '個人檔案', icon: 'user-circle', ariaLabel: '個人檔案' },
    ...(user?.is_admin ? [{ href: '/admin', label: '管理後台', icon: 'shield', ariaLabel: '管理後台', adminOnly: true }] : [])]

  }];


  const isActive = (href: string) => pathname === href;

  // 選單項目渲染（展開狀態）
  const renderExpandedItem = (item: NavItem) =>
  <Button size="icon" variant="default"
  key={item.href}
  onClick={() => handleNavigation(item.href)}
  className="{expression}"







  aria-label={item.ariaLabel}
  aria-current={isActive(item.href) ? 'page' : undefined}>

      <div className="relative">
        <PixelIcon
        name={item.icon}
        sizePreset="sm"
        variant="primary"
        decorative />

        {item.badge &&
      <span
        className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"
        aria-label="有新內容" />

      }
      </div>
      <span className="flex-1 text-left">{item.label}</span>
    </Button>;


  // 選單項目渲染（收合狀態）
  const renderCollapsedItem = (item: NavItem) =>
  <TooltipProvider key={item.href} delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="default"
        onClick={() => handleNavigation(item.href)}
        className="{expression}"







        aria-label={item.ariaLabel}
        aria-current={isActive(item.href) ? 'page' : undefined}>

            <PixelIcon
            name={item.icon}
            sizePreset="sm"
            variant="primary"
            decorative />

            {item.badge &&
          <span
            className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"
            aria-label="有新內容" />

          }
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{item.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>;


  return (
    <aside
      className={`
        self-start sticky
        bg-wasteland-darker border-r-2 border-pip-boy-green
        flex flex-col flex-shrink-0
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-60'}
      `}
      style={{
        top: `${headerHeight}px`,
        height: `calc(100vh - ${headerHeight}px)`
      }}
      aria-label="主要導航">

      {/* Sidebar Header - Fixed Top */}
      <div className={`
        flex-shrink-0
        border-b-2 border-pip-boy-green/30 p-4
        ${isCollapsed ? 'px-2' : ''}
      `}>
        {isCollapsed ?
        <div className="flex justify-center">
            <PixelIcon
            name="grid"
            sizePreset="md"
            variant="primary"
            decorative />

          </div> :

        <div>
            <h2 className="text-lg font-bold text-pip-boy-green text-glow-green">
              控制台
            </h2>
            <p className="text-xs text-pip-boy-green/60">
              Dashboard
            </p>
          </div>
        }
      </div>

      {/* Navigation Sections - Scrollable Middle */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navSections.map((section, sectionIndex) =>
        <div key={section.title}>
            {/* 分隔線（第一個區塊除外） */}
            {sectionIndex > 0 &&
          <div className="h-px bg-pip-boy-green/30 my-2 mx-2" />
          }

            {/* 分類標題（展開時） */}
            {!isCollapsed &&
          <div className="px-4 py-2 text-xs font-bold text-pip-boy-green/50 uppercase tracking-wider">
                {section.title}
              </div>
          }

            {/* 選單項目 */}
            <div className={isCollapsed ? 'space-y-1' : ''}>
              {section.items.map((item) =>
            isCollapsed ? renderCollapsedItem(item) : renderExpandedItem(item)
            )}
            </div>
          </div>
        )}
      </nav>

      {/* Collapse Toggle Button - Fixed Bottom */}
      <div className="flex-shrink-0 border-t-2 border-pip-boy-green/30 p-2">
        {isCollapsed ?
        <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="link"
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center py-3 transition-all duration-200"
              aria-label="展開側邊欄">

                  <PixelIcon
                  name="chevron-right"
                  sizePreset="sm"
                  variant="primary"
                  decorative />

                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>展開</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> :

        <Button size="default" variant="link"
        onClick={toggleCollapse}
        className="w-full flex items-center gap-3 px-4 py-3 transition-all duration-200"
        aria-label="收合側邊欄">

            <PixelIcon
            name="chevron-left"
            sizePreset="sm"
            variant="primary"
            decorative />

            <span className="text-sm">收合</span>
          </Button>
        }
      </div>
    </aside>);

}