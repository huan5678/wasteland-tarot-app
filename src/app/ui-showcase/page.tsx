'use client';

import React, { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

/**
 * Pipboy-UI-Vibe 元件系統完整展示頁面
 *
 * 展示所有 48 個整合元件及其功能
 * - OKLCH 色彩系統
 * - PixelIcon 圖示系統
 * - Radix UI Primitives
 * - CVA 變體管理
 */
export default function UIShowcasePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sliderValue, setSliderValue] = useState([50]);
  const [progress, setProgress] = useState(65);
  const [switchChecked, setSwitchChecked] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* 頁面標題 */}
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-primary uppercase tracking-wider">
            <PixelIcon name="flask-line" sizePreset="xl" className="inline-block mr-4" decorative />
            UI 元件系統展示
          </h1>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Pipboy-UI-Vibe 整合元件庫 - 48 個完整元件 | OKLCH 色彩系統 | PixelIcon 圖示 | Radix UI 無障礙
          </p>

          {/* 快速統計 */}
          <div className="flex justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">48</div>
              <div className="text-sm text-muted-foreground">元件</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2800+</div>
              <div className="text-sm text-muted-foreground">圖示</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">無障礙</div>
            </div>
          </div>
        </header>

        <Separator className="my-8" />

        {/* 快速導航 */}
        <nav className="sticky top-4 z-10 bg-card/95 backdrop-blur border-2 border-border rounded-lg p-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {['按鈕', '卡片', '表單', '回饋', '佈局', '導航', '浮層', '圖示', '色彩'].map((section) => (
              <a
                key={section}
                href={`#${section}`}
                className="px-3 py-1.5 text-sm border border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-colors rounded"
              >
                {section}
              </a>
            ))}
          </div>
        </nav>

        {/* Section 1: 按鈕元件 */}
        <section id="按鈕" className="space-y-6">
          <div className="flex items-center gap-3">
            <PixelIcon name="cursor-line" sizePreset="lg" variant="primary" />
            <h2 className="text-4xl font-bold text-primary uppercase">按鈕元件</h2>
          </div>

          {/* Variants */}
          <Card>
            <CardHeader>
              <CardTitle>9 個變體 (Variants)</CardTitle>
              <CardDescription>不同用途的按鈕樣式</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Button variant="default" className="w-full">Default</Button>
                  <p className="text-xs text-muted-foreground">主要操作 - Pip-Boy Green</p>
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">Outline</Button>
                  <p className="text-xs text-muted-foreground">次要操作 - 透明背景</p>
                </div>
                <div className="space-y-2">
                  <Button variant="destructive" className="w-full">Destructive</Button>
                  <p className="text-xs text-muted-foreground">刪除操作 - 深紅色</p>
                </div>
                <div className="space-y-2">
                  <Button variant="secondary" className="w-full">Secondary</Button>
                  <p className="text-xs text-muted-foreground">次要強調 - 輻射橙</p>
                </div>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full">Ghost</Button>
                  <p className="text-xs text-muted-foreground">輕量操作 - 無邊框</p>
                </div>
                <div className="space-y-2">
                  <Button variant="link" className="w-full">Link</Button>
                  <p className="text-xs text-muted-foreground">連結樣式</p>
                </div>
                <div className="space-y-2">
                  <Button variant="success" className="w-full">Success</Button>
                  <p className="text-xs text-muted-foreground">成功狀態 - 亮綠色</p>
                </div>
                <div className="space-y-2">
                  <Button variant="warning" className="w-full">Warning</Button>
                  <p className="text-xs text-muted-foreground">警告 - 警告黃</p>
                </div>
                <div className="space-y-2">
                  <Button variant="info" className="w-full">Info</Button>
                  <p className="text-xs text-muted-foreground">資訊 - Vault 藍</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sizes */}
          <Card>
            <CardHeader>
              <CardTitle>6 個尺寸 (Sizes)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="xs">XS (28px)</Button>
                <Button size="sm">SM (32px)</Button>
                <Button size="default">Default (40px)</Button>
                <Button size="lg">LG (48px)</Button>
                <Button size="xl">XL (56px)</Button>
                <Button size="icon">
                  <PixelIcon name="star-fill" decorative />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* States */}
          <Card>
            <CardHeader>
              <CardTitle>狀態展示</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button>Normal</Button>
              <Button disabled>Disabled</Button>
              <Button>
                With Icon
                <PixelIcon name="arrow-right-line" sizePreset="sm" className="ml-2" decorative />
              </Button>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        {/* Section 2: 卡片元件 */}
        <section id="卡片" className="space-y-6">
          <div className="flex items-center gap-3">
            <PixelIcon name="layout-grid-line" sizePreset="lg" variant="primary" />
            <h2 className="text-4xl font-bold text-primary uppercase">卡片元件</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>標準卡片樣式</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  帶有邊框和背景的標準卡片，適用於大部分內容展示。
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>懸浮卡片樣式</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  帶有陰影效果的卡片，視覺上更加突出。
                </p>
              </CardContent>
            </Card>

            <Card variant="ghost">
              <CardHeader>
                <CardTitle>Ghost Card</CardTitle>
                <CardDescription>幽靈卡片樣式</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  輕量級卡片，背景更透明。
                </p>
              </CardContent>
            </Card>

            <Card variant="interactive" isClickable onClick={() => alert('Card clicked!')}>
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>可點擊卡片</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  帶有 hover 效果的互動卡片，點擊試試！
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Card with special effects */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card glowEffect padding="md">
              <CardContent className="text-center py-6">
                <PixelIcon name="flashlight-line" sizePreset="xl" className="mx-auto mb-3" variant="primary" />
                <p className="font-bold">glowEffect</p>
                <p className="text-sm text-muted-foreground">外發光效果</p>
              </CardContent>
            </Card>

            <Card isLoading padding="md">
              <CardContent className="text-center py-6">
                <PixelIcon name="loader-line" sizePreset="xl" className="mx-auto mb-3 animate-spin" variant="primary" />
                <p className="font-bold">isLoading</p>
                <p className="text-sm text-muted-foreground">載入脈衝動畫</p>
              </CardContent>
            </Card>

            <Card showCornerIcons padding="md">
              <CardContent className="text-center py-6">
                <PixelIcon name="shield-check-line" sizePreset="xl" className="mx-auto mb-3" variant="primary" />
                <p className="font-bold">showCornerIcons</p>
                <p className="text-sm text-muted-foreground">Vault-Tec 角落裝飾</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-12" />

        {/* Section 3: 表單元件 */}
        <section id="表單" className="space-y-6">
          <div className="flex items-center gap-3">
            <PixelIcon name="edit-line" sizePreset="lg" variant="primary" />
            <h2 className="text-4xl font-bold text-primary uppercase">表單元件</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>完整表單範例</CardTitle>
              <CardDescription>展示所有表單控制元件</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input */}
              <div className="space-y-2">
                <Label htmlFor="username">使用者名稱</Label>
                <Input id="username" type="text" placeholder="輸入使用者名稱" />
              </div>

              {/* Input with Error */}
              <div className="space-y-2">
                <Label htmlFor="email">電子郵件</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  error="請輸入有效的電子郵件地址"
                />
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <Label htmlFor="bio">個人簡介</Label>
                <Textarea id="bio" placeholder="告訴我們關於你的事..." rows={4} />
              </div>

              {/* Select */}
              <div className="space-y-2">
                <Label htmlFor="role">角色</Label>
                <Select>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="選擇角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overseer">監督者 (Overseer)</SelectItem>
                    <SelectItem value="dweller">避難所居民</SelectItem>
                    <SelectItem value="wanderer">廢土流浪者</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms" className="cursor-pointer">
                  我同意條款與條件
                </Label>
              </div>

              {/* Radio Group */}
              <div className="space-y-2">
                <Label>難度</Label>
                <RadioGroup defaultValue="normal">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="easy" id="easy" />
                    <Label htmlFor="easy" className="cursor-pointer">簡單</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label htmlFor="normal" className="cursor-pointer">普通</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hard" id="hard" />
                    <Label htmlFor="hard" className="cursor-pointer">困難</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Switch */}
              <div className="flex items-center space-x-2">
                <Switch id="notifications" checked={switchChecked} onCheckedChange={setSwitchChecked} />
                <Label htmlFor="notifications" className="cursor-pointer">
                  啟用通知 ({switchChecked ? 'ON' : 'OFF'})
                </Label>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <Label>音量: {sliderValue[0]}%</Label>
                <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
              </div>

              {/* Disabled Input */}
              <div className="space-y-2">
                <Label htmlFor="disabled">Disabled Input</Label>
                <Input id="disabled" placeholder="This is disabled" disabled />
              </div>
            </CardContent>
            <CardFooter>
              <Button size="lg">
                <PixelIcon name="send-plane-line" sizePreset="sm" className="mr-2" decorative />
                提交表單
              </Button>
            </CardFooter>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar 日曆</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        {/* Section 4: 回饋元件 */}
        <section id="回饋" className="space-y-6">
          <div className="flex items-center gap-3">
            <PixelIcon name="notification-line" sizePreset="lg" variant="primary" />
            <h2 className="text-4xl font-bold text-primary uppercase">回饋元件</h2>
          </div>

          {/* Alerts */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Alert 警告</h3>
            <Alert variant="default">
              <PixelIcon name="information-line" sizePreset="sm" className="mr-2" />
              <AlertTitle>資訊提示</AlertTitle>
              <AlertDescription>這是一個標準的資訊提示框。</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <PixelIcon name="error-warning-line" sizePreset="sm" className="mr-2" />
              <AlertTitle>錯誤</AlertTitle>
              <AlertDescription>發生了錯誤，請稍後再試。</AlertDescription>
            </Alert>
          </div>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress 進度條</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">載入進度</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
                  <PixelIcon name="subtract-line" sizePreset="xs" decorative />
                </Button>
                <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
                  <PixelIcon name="add-line" sizePreset="xs" decorative />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Skeleton */}
          <Card>
            <CardHeader>
              <CardTitle>Skeleton 骨架屏</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>

          {/* Badge */}
          <Card>
            <CardHeader>
              <CardTitle>Badge 徽章</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </CardContent>
          </Card>

          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>Avatar 頭像</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>VT</AvatarFallback>
              </Avatar>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        {/* Section 5: 佈局元件 */}
        <section id="佈局" className="space-y-6">
          <div className="flex items-center gap-3">
            <PixelIcon name="layout-line" sizePreset="lg" variant="primary" />
            <h2 className="text-4xl font-bold text-primary uppercase">佈局元件</h2>
          </div>

          {/* Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Tabs 分頁</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tab1">
                <TabsList>
                  <TabsTrigger value="tab1">狀態</TabsTrigger>
                  <TabsTrigger value="tab2">物品</TabsTrigger>
                  <TabsTrigger value="tab3">資料</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" className="space-y-2">
                  <p className="text-muted-foreground">這是第一個分頁的內容。</p>
                </TabsContent>
                <TabsContent value="tab2" className="space-y-2">
                  <p className="text-muted-foreground">這是第二個分頁的內容。</p>
                </TabsContent>
                <TabsContent value="tab3" className="space-y-2">
                  <p className="text-muted-foreground">這是第三個分頁的內容。</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Accordion */}
          <Card>
            <CardHeader>
              <CardTitle>Accordion 摺疊面板</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>第一項</AccordionTrigger>
                  <AccordionContent>
                    這是第一項的詳細內容。可以包含任何元素。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>第二項</AccordionTrigger>
                  <AccordionContent>
                    這是第二項的詳細內容。
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>第三項</AccordionTrigger>
                  <AccordionContent>
                    這是第三項的詳細內容。
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Separator */}
          <Card>
            <CardHeader>
              <CardTitle>Separator 分隔線</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>上方內容</div>
              <Separator />
              <div>下方內容</div>
              <div className="flex items-center gap-4">
                <div>左側</div>
                <Separator orientation="vertical" className="h-12" />
                <div>右側</div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Table 表格</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>項目</TableHead>
                    <TableHead>數量</TableHead>
                    <TableHead className="text-right">價格</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>治療針</TableCell>
                    <TableCell>10</TableCell>
                    <TableCell className="text-right">50 瓶蓋</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>輻射寧</TableCell>
                    <TableCell>5</TableCell>
                    <TableCell className="text-right">75 瓶蓋</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>核子可樂</TableCell>
                    <TableCell>3</TableCell>
                    <TableCell className="text-right">20 瓶蓋</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        {/* Section 6: 導航元件 */}
        <section id="導航" className="space-y-6">
          <div className="flex items-center gap-3">
            <PixelIcon name="compass-line" sizePreset="lg" variant="primary" />
            <h2 className="text-4xl font-bold text-primary uppercase">導航元件</h2>
          </div>

          {/* Breadcrumb */}
          <Card>
            <CardHeader>
              <CardTitle>Breadcrumb 麵包屑</CardTitle>
            </CardHeader>
            <CardContent>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">首頁</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/components">元件</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/components/breadcrumb">麵包屑</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        {/* Section 7: 浮層元件 */}
        <section id="浮層" className="space-y-6">
          <div className="flex items-center gap-3">
            <PixelIcon name="window-line" sizePreset="lg" variant="primary" />
            <h2 className="text-4xl font-bold text-primary uppercase">浮層元件</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Overlay 元件</CardTitle>
              <CardDescription>對話框、彈出視窗、提示框</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {/* Dialog */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>開啟對話框</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Vault-Tec 通知</DialogTitle>
                    <DialogDescription>
                      這是一個基礎的對話框範例。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-muted-foreground text-sm">
                      對話框支援 Escape 鍵關閉、點擊背景關閉、焦點管理等功能。
                    </p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">取消</Button>
                    </DialogClose>
                    <Button onClick={() => setDialogOpen(false)}>確認</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">開啟 Popover</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">Popover 標題</h4>
                    <p className="text-sm text-muted-foreground">
                      這是一個彈出視窗，可以包含任何內容。
                    </p>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Tooltip */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>這是一個提示框</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        {/* Section 8: PixelIcon 圖示展示 */}
        <section id="圖示" className="space-y-6">
          <div className="flex items-center gap-3">
            <PixelIcon name="emoji-sticker-line" sizePreset="lg" variant="primary" />
            <h2 className="text-4xl font-bold text-primary uppercase">PixelIcon 圖示系統</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>RemixIcon 2800+ 圖示</CardTitle>
              <CardDescription>完整的像素風格圖示庫</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Size Presets */}
                <div>
                  <h4 className="font-medium mb-3">尺寸預設 (6 種)</h4>
                  <div className="flex items-center gap-4">
                    <PixelIcon name="star-fill" sizePreset="xs" variant="primary" />
                    <PixelIcon name="star-fill" sizePreset="sm" variant="primary" />
                    <PixelIcon name="star-fill" sizePreset="md" variant="primary" />
                    <PixelIcon name="star-fill" sizePreset="lg" variant="primary" />
                    <PixelIcon name="star-fill" sizePreset="xl" variant="primary" />
                    <PixelIcon name="star-fill" sizePreset="xxl" variant="primary" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    xs (16px) | sm (24px) | md (32px) | lg (48px) | xl (72px) | xxl (96px)
                  </p>
                </div>

                {/* Variants */}
                <div>
                  <h4 className="font-medium mb-3">語意化顏色 (8 種)</h4>
                  <div className="flex flex-wrap gap-3">
                    <PixelIcon name="checkbox-circle-fill" sizePreset="lg" variant="default" />
                    <PixelIcon name="checkbox-circle-fill" sizePreset="lg" variant="primary" />
                    <PixelIcon name="checkbox-circle-fill" sizePreset="lg" variant="secondary" />
                    <PixelIcon name="checkbox-circle-fill" sizePreset="lg" variant="success" />
                    <PixelIcon name="checkbox-circle-fill" sizePreset="lg" variant="warning" />
                    <PixelIcon name="checkbox-circle-fill" sizePreset="lg" variant="error" />
                    <PixelIcon name="checkbox-circle-fill" sizePreset="lg" variant="info" />
                    <PixelIcon name="checkbox-circle-fill" sizePreset="lg" variant="muted" />
                  </div>
                </div>

                {/* Animations */}
                <div>
                  <h4 className="font-medium mb-3">動畫效果 (7 種)</h4>
                  <div className="flex flex-wrap gap-4">
                    <div className="text-center">
                      <PixelIcon name="loader-line" sizePreset="lg" variant="primary" animation="spin" />
                      <p className="text-xs text-muted-foreground mt-1">spin</p>
                    </div>
                    <div className="text-center">
                      <PixelIcon name="notification-line" sizePreset="lg" variant="primary" animation="pulse" />
                      <p className="text-xs text-muted-foreground mt-1">pulse</p>
                    </div>
                    <div className="text-center">
                      <PixelIcon name="arrow-down-line" sizePreset="lg" variant="primary" animation="bounce" />
                      <p className="text-xs text-muted-foreground mt-1">bounce</p>
                    </div>
                    <div className="text-center">
                      <PixelIcon name="radio-button-line" sizePreset="lg" variant="primary" animation="ping" />
                      <p className="text-xs text-muted-foreground mt-1">ping</p>
                    </div>
                    <div className="text-center">
                      <PixelIcon name="eye-line" sizePreset="lg" variant="primary" animation="fade" />
                      <p className="text-xs text-muted-foreground mt-1">fade</p>
                    </div>
                    <div className="text-center">
                      <PixelIcon name="error-warning-line" sizePreset="lg" variant="error" animation="wiggle" />
                      <p className="text-xs text-muted-foreground mt-1">wiggle</p>
                    </div>
                    <div className="text-center">
                      <PixelIcon name="rocket-line" sizePreset="lg" variant="primary" animation="float" />
                      <p className="text-xs text-muted-foreground mt-1">float</p>
                    </div>
                  </div>
                </div>

                {/* Common Icons */}
                <div>
                  <h4 className="font-medium mb-3">常用圖示範例</h4>
                  <div className="grid grid-cols-6 md:grid-cols-12 gap-4">
                    {[
                      'home-line', 'user-line', 'settings-line', 'search-line',
                      'heart-line', 'star-line', 'bookmark-line', 'notification-line',
                      'mail-line', 'phone-line', 'map-pin-line', 'calendar-line',
                      'clock-line', 'download-line', 'upload-line', 'share-line',
                      'edit-line', 'delete-bin-line', 'check-line', 'close-line',
                      'arrow-left-line', 'arrow-right-line', 'arrow-up-line', 'arrow-down-line'
                    ].map((icon) => (
                      <div key={icon} className="text-center">
                        <PixelIcon name={icon} sizePreset="md" variant="primary" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Button variant="link" asChild>
                      <a href="/icon-showcase" target="_blank">
                        查看完整 2800+ 圖示展示
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="my-12" />

        {/* Section 9: OKLCH 色彩系統 */}
        <section id="色彩" className="space-y-6">
          <div className="flex items-center gap-3">
            <PixelIcon name="palette-line" sizePreset="lg" variant="primary" />
            <h2 className="text-4xl font-bold text-primary uppercase">OKLCH 色彩系統</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>現代化色彩空間</CardTitle>
              <CardDescription>
                使用 OKLCH 色彩空間提供更精確、一致的色彩管理
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-20 rounded border-2 border-border bg-background"></div>
                  <p className="text-sm font-medium">Background</p>
                  <code className="text-xs text-muted-foreground">oklch(0.14 0.02 152)</code>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded border-2 border-border bg-primary"></div>
                  <p className="text-sm font-medium">Primary</p>
                  <code className="text-xs text-muted-foreground">oklch(0.96 0.29 139)</code>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded border-2 border-border bg-secondary"></div>
                  <p className="text-sm font-medium">Secondary</p>
                  <code className="text-xs text-muted-foreground">oklch(0.87 0.21 72)</code>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded border-2 border-border bg-destructive"></div>
                  <p className="text-sm font-medium">Destructive</p>
                  <code className="text-xs text-muted-foreground">oklch(0.74 0.18 72)</code>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded border-2 border-border bg-accent"></div>
                  <p className="text-sm font-medium">Accent</p>
                  <code className="text-xs text-muted-foreground">oklch(0.17 0.02 152)</code>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded border-2 border-border bg-muted"></div>
                  <p className="text-sm font-medium">Muted</p>
                  <code className="text-xs text-muted-foreground">oklch(0.17 0.02 152)</code>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded border-2 border-border bg-card"></div>
                  <p className="text-sm font-medium">Card</p>
                  <code className="text-xs text-muted-foreground">oklch(0.17 0.02 152)</code>
                </div>
                <div className="space-y-2">
                  <div className="h-20 rounded border-2 border-border bg-popover"></div>
                  <p className="text-sm font-medium">Popover</p>
                  <code className="text-xs text-muted-foreground">oklch(0.14 0.02 152)</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 技術特性總結 */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <PixelIcon name="shield-check-line" sizePreset="lg" variant="primary" />
            <h2 className="text-4xl font-bold text-primary uppercase">技術特性</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 space-y-3 text-center">
                <PixelIcon name="code-line" sizePreset="xl" className="mx-auto" variant="primary" />
                <h3 className="font-bold text-lg">CVA 變體系統</h3>
                <p className="text-sm text-muted-foreground">
                  class-variance-authority 提供類型安全的樣式變體管理
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3 text-center">
                <PixelIcon name="accessibility-line" sizePreset="xl" className="mx-auto" variant="primary" />
                <h3 className="font-bold text-lg">Radix UI 無障礙</h3>
                <p className="text-sm text-muted-foreground">
                  基於 Radix UI Primitives，符合 WCAG AA 標準
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3 text-center">
                <PixelIcon name="braces-line" sizePreset="xl" className="mx-auto" variant="primary" />
                <h3 className="font-bold text-lg">TypeScript</h3>
                <p className="text-sm text-muted-foreground">
                  完整類型定義與 IDE 自動完成支援
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3 text-center">
                <PixelIcon name="palette-line" sizePreset="xl" className="mx-auto" variant="primary" />
                <h3 className="font-bold text-lg">OKLCH 色彩</h3>
                <p className="text-sm text-muted-foreground">
                  現代化 OKLCH 色彩空間，更精確的色彩管理
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3 text-center">
                <PixelIcon name="volume-up-line" sizePreset="xl" className="mx-auto" variant="primary" />
                <h3 className="font-bold text-lg">音效整合</h3>
                <p className="text-sm text-muted-foreground">
                  內建 useAudioEffect hook 音效系統
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3 text-center">
                <PixelIcon name="reactjs-line" sizePreset="xl" className="mx-auto" variant="primary" />
                <h3 className="font-bold text-lg">React 19</h3>
                <p className="text-sm text-muted-foreground">
                  使用最新 React 19 功能與最佳實踐
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 頁尾 */}
        <footer className="text-center space-y-4 py-12 border-t-2 border-border">
          <div className="flex justify-center gap-2">
            <PixelIcon name="radiation-line" sizePreset="sm" variant="primary" />
            <p className="text-foreground font-bold">Pipboy-UI-Vibe 元件系統</p>
            <PixelIcon name="radiation-line" sizePreset="sm" variant="primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            48 個元件 | OKLCH 色彩 | 2800+ 圖示 | 100% 無障礙
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <a href="/icon-showcase" className="text-primary hover:underline">
              圖示展示
            </a>
            <span className="text-muted-foreground">|</span>
            <a href="https://github.com/huan5678/pipboy-ui-vibe" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              GitHub
            </a>
            <span className="text-muted-foreground">|</span>
            <a href="/PIPBOY_UI_VIBE_INTEGRATION_COMPLETE.md" className="text-primary hover:underline">
              整合報告
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
