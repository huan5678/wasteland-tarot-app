'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger } from
'@/components/ui/navigation-menu';
import { PixelIcon } from '@/components/ui/icons';
import { UserAvatar } from './UserAvatar';import { Button } from "@/components/ui/button";

interface UserMenuProps {
  user: {
    name: string;
    avatarUrl?: string | null; // 用戶上傳的頭像
    profilePicture?: string | null; // OAuth 頭像
  };
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const router = useRouter();

  const menuItems = [
  {
    label: '個人資料',
    icon: 'user-circle',
    href: '/profile',
    action: () => router.push('/profile')
  },
  {
    label: '帳號設定',
    icon: 'settings',
    href: '/settings',
    action: () => router.push('/settings')
  },
  {
    label: '登出',
    icon: 'door-open',
    href: null,
    action: onLogout,
    variant: 'error' as const
  }];


  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="
            flex items-center gap-2 px-3 py-2
            border-2 border-pip-boy-green/30
            hover:border-pip-boy-green
            bg-wasteland-dark
            hover:bg-pip-boy-green/10
            transition-all duration-200
            data-[state=open]:border-pip-boy-green
            data-[state=open]:bg-pip-boy-green/10
          ">









            <UserAvatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              profilePictureUrl={user.profilePicture}
              size="sm"
              showName={false} />

            <span className="text-sm text-pip-boy-green font-bold hidden sm:inline">
              {user.name}
            </span>
          </NavigationMenuTrigger>

          <NavigationMenuContent className="
            min-w-[240px] p-2
            bg-wasteland-dark
            border-2 border-pip-boy-green
            shadow-[0_0_20px_rgba(0,255,136,0.3)]
          ">





            <div className="space-y-1">
              {menuItems.map((item) =>
              <Button size="icon" variant="default"
              key={item.label}
              onClick={item.action}
              className="{expression}">










                  <PixelIcon
                  name={item.icon}
                  sizePreset="sm"
                  variant={item.variant || 'primary'}
                  decorative />

                  <span>{item.label}</span>
                </Button>
              )}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>);

}