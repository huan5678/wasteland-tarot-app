'use client';

import React from 'react';
import { PixelIcon } from '@/components/ui/icons';import { Button } from "@/components/ui/button";

interface AccountTabProps {
  user: any;
  profile: any;
  isOAuthUser: boolean;
  logout: () => void;
}

// 危險操作配置
const DANGER_ACTIONS = [
{
  key: 'logout',
  label: '登出所有 Pip-Boy 會話',
  buttonText: '登出',
  icon: 'logout',
  variant: 'border' as const,
  onClick: (logout: () => void) => logout()
},
{
  key: 'delete',
  label: '永久刪除你的 Vault 居民帳戶和所有占卜資料',
  buttonText: '刪除帳戶',
  icon: 'trash',
  variant: 'solid' as const,
  onClick: () => alert('Account deletion not implemented in this demo')
}] as
const;

export function AccountTab({ user, profile, isOAuthUser, logout }: AccountTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Login Method */}
      <div className="border-2 border-pip-boy-green/30 bg-pip-boy-green/5 p-6">
        <h3 className="text-xl font-bold text-pip-boy-green mb-4">
          <PixelIcon name="shield-check" size={24} className="mr-2 inline" decorative />登入方式
        </h3>
        <div className="space-y-4">
          <div>
            <p className="text-pip-boy-green/70 text-sm mb-2">當前登入方式</p>
            <div className="p-4 border border-pip-boy-green/30 bg-pip-boy-green/5">
              {isOAuthUser ?
              <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-pip-boy-green" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  </svg>
                  <div>
                    <p className="text-pip-boy-green font-semibold">Google OAuth</p>
                    <p className="text-pip-boy-green/70 text-xs">透過 Google 帳號登入</p>
                  </div>
                </div> :

              <div className="flex items-center gap-3">
                  <PixelIcon name="mail" size={24} variant="primary" decorative />
                  <div>
                    <p className="text-pip-boy-green font-semibold">Email + Password</p>
                    <p className="text-pip-boy-green/70 text-xs">傳統帳號密碼登入</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <div>
            <p className="text-pip-boy-green/70 text-sm mb-2">連結的 Email</p>
            <p className="text-pip-boy-green px-4 py-2 border border-pip-boy-green/30 bg-black/30">
              {user?.email || profile.email}
            </p>
          </div>

          {isOAuthUser &&
          <div className="mt-4 p-3 border border-pip-boy-green/30 bg-pip-boy-green/5">
              <p className="text-pip-boy-green/70 text-xs">
                你的帳號已連結 Google OAuth，享有快速登入和安全保護。
              </p>
            </div>
          }
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-2 border-red-400/30 bg-red-900/10 p-6">
        <h3 className="text-xl font-bold text-red-400 mb-4">
          <PixelIcon name="alert-triangle" size={24} className="mr-2 inline" decorative />危險區域
        </h3>

        <div className="space-y-4">
          {DANGER_ACTIONS.map((action) =>
          <div key={action.key}>
              <p className="text-red-400/80 text-sm mb-2">
                {action.label}
              </p>
              <Button
                size="default"
                variant={action.variant === 'border' ? 'outline' : 'destructive'}
                onClick={() => action.onClick(logout)}
                className="w-full px-4 py-2 transition-colors"
              >
                <PixelIcon name={action.icon} size={16} className="mr-2 inline" aria-label={action.buttonText} />
                {action.buttonText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>);

}