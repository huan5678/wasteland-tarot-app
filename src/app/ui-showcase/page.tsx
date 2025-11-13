import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UI 展示 | 廢土塔羅 - 元件與設計系統展示',
  description: '廢土塔羅設計系統展示頁面，包含所有 UI 元件、色彩系統、字體樣式與互動範例。供開發者參考與測試。',
};

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PixelIcon } from "@/components/ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "@/components/ui/menubar";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Toaster } from "@/components/ui/toaster";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useState } from "react";

export default function UIShowcase() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sliderValue, setSliderValue] = useState([50]);
  const [switchChecked, setSwitchChecked] = useState(false);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-mono">
      <Toaster />

      {/* Pip-Boy Header */}
      <header className="border-2 border-primary p-4 rounded-sm bg-card shadow-[0_0_20px_hsl(var(--primary)/0.3)] mb-6">
        <div className="flex items-center gap-3 mb-2">
          <PixelIcon name="terminal-line" sizePreset="lg" variant="primary" animation="pulse" decorative />
          <h1 className="text-3xl font-bold text-primary tracking-wider">
            PIP-BOY 3000 MK IV - COMPLETE COMPONENT LIBRARY
          </h1>
        </div>
        <p className="text-sm text-muted-foreground uppercase tracking-wide">
          ROBCO INDUSTRIES UNIFIED OPERATING SYSTEM | COPYRIGHT 2075-2077 ROBCO INDUSTRIES
        </p>

        {/* Breadcrumb */}
        <Breadcrumb className="mt-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/components">Components</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Showcase</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Main Interface Tabs */}
      <Tabs defaultValue="buttons" className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-card border border-primary">
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="dialogs">Dialogs</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="navigation">Nav</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
        </TabsList>

        {/* Buttons & Actions Tab */}
        <TabsContent value="buttons" className="space-y-6">
          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">BUTTON VARIANTS</CardTitle>
              <CardDescription>Primary action controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><PixelIcon name="settings-3-line" sizePreset="sm" decorative /></Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">BADGES</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">TOGGLE BUTTONS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Toggle>
                  <PixelIcon name="user-line" sizePreset="sm" className="mr-2" decorative />
                  Toggle
                </Toggle>
                <Toggle variant="outline">
                  <PixelIcon name="mail-line" sizePreset="sm" className="mr-2" decorative />
                  Outline
                </Toggle>
              </div>

              <ToggleGroup type="single">
                <ToggleGroupItem value="left">Left</ToggleGroupItem>
                <ToggleGroupItem value="center">Center</ToggleGroupItem>
                <ToggleGroupItem value="right">Right</ToggleGroupItem>
              </ToggleGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forms Tab */}
        <TabsContent value="forms" className="space-y-6">
          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">INPUT FIELDS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="Enter username..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="vault@dweller.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Type your message here..." />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">INPUT OTP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Enter Access Code</Label>
                <InputOTP maxLength={6}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">SELECT & RADIO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Select Faction</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose faction..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brotherhood">Brotherhood of Steel</SelectItem>
                    <SelectItem value="ncr">New California Republic</SelectItem>
                    <SelectItem value="legion">Caesar&apos;s Legion</SelectItem>
                    <SelectItem value="minutemen">Minutemen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Radio Group</Label>
                <RadioGroup defaultValue="option-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-1" id="option-1" />
                    <Label htmlFor="option-1">Peaceful Resolution</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option-2" id="option-2" />
                    <Label htmlFor="option-2">Aggressive Approach</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms">Accept terms and conditions</Label>
              </div>

              <div className="space-y-2">
                <Label>Radiation Level: {sliderValue}%</Label>
                <Slider value={sliderValue} onValueChange={setSliderValue} max={100} step={1} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="power" checked={switchChecked} onCheckedChange={setSwitchChecked} />
                <Label htmlFor="power">Power Armor Systems {switchChecked ? "ON" : "OFF"}</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">CALENDAR & DATE PICKER</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border border-primary" />
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">COMMAND PALETTE</CardTitle>
            </CardHeader>
            <CardContent>
              <Command className="rounded-lg border border-primary">
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    <CommandItem>
                      <PixelIcon name="calendar-line" sizePreset="sm" className="mr-2" decorative />
                      <span>Calendar</span>
                    </CommandItem>
                    <CommandItem>
                      <PixelIcon name="user-line" sizePreset="sm" className="mr-2" decorative />
                      <span>Search Users</span>
                    </CommandItem>
                    <CommandItem>
                      <PixelIcon name="settings-3-line" sizePreset="sm" className="mr-2" decorative />
                      <span>Settings</span>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dialogs Tab */}
        <TabsContent value="dialogs" className="space-y-6">
          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">DIALOG SYSTEMS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>TERMINAL ACCESS</DialogTitle>
                    <DialogDescription>
                      You are accessing a secured terminal. Unauthorized access is prohibited.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm">Enter your credentials to continue.</p>
                    <Input placeholder="Password..." type="password" />
                  </div>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Critical Alert</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ CRITICAL SYSTEM ALERT</AlertDialogTitle>
                    <AlertDialogDescription>
                      Reactor core temperature exceeding safe parameters. Immediate action required.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Evacuate</AlertDialogCancel>
                    <AlertDialogAction>Override Safety</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline">Open Drawer</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>DRAWER INTERFACE</DrawerTitle>
                    <DrawerDescription>Slide-up panel for additional controls</DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4">
                    <p className="text-sm">Drawer content goes here...</p>
                  </div>
                  <DrawerFooter>
                    <Button>Submit</Button>
                    <DrawerClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">Open Sheet</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>SHEET PANEL</SheetTitle>
                    <SheetDescription>Side panel for additional information</SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <p className="text-sm">Sheet content here...</p>
                  </div>
                </SheetContent>
              </Sheet>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Open Popover</Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-2">
                    <h4 className="font-medium text-primary">Quick Stats</h4>
                    <p className="text-sm text-muted-foreground">
                      Health: 85/100 | AP: 65/100
                    </p>
                  </div>
                </PopoverContent>
              </Popover>

              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="link">@Vault-Dweller</Button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="flex justify-between space-x-4">
                    <Avatar>
                      <AvatarFallback>VD</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-primary">Vault Dweller</h4>
                      <p className="text-sm text-muted-foreground">
                        Level 50 Survivor - Vault 111
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover for Tooltip</Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This is a tooltip message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">ACCORDION</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Mission Objectives</AccordionTrigger>
                  <AccordionContent>
                    Locate and secure the GECK from Vault 87. Beware of super mutant activity in the area.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Equipment List</AccordionTrigger>
                  <AccordionContent>
                    Power Armor, Laser Rifle, Stimpaks (x10), RadAway (x5), Fusion Cores (x3)
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Quest Log</AccordionTrigger>
                  <AccordionContent>
                    Active Quests: The Nuclear Option, Reunions, Dangerous Minds
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">COLLAPSIBLE</CardTitle>
            </CardHeader>
            <CardContent>
              <Collapsible open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Hidden Information</h4>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <PixelIcon
                        name="arrow-down-s-line"
                        sizePreset="sm"
                        className={`transition-transform ${isCollapsibleOpen ? 'rotate-180' : ''}`}
                        decorative
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    This content can be collapsed and expanded.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Display Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">DATA TABLE</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">10mm Pistol</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>3 lbs</TableCell>
                    <TableCell>50 caps</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Stimpak</TableCell>
                    <TableCell>8</TableCell>
                    <TableCell>0 lbs</TableCell>
                    <TableCell>120 caps</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Nuka-Cola</TableCell>
                    <TableCell>12</TableCell>
                    <TableCell>12 lbs</TableCell>
                    <TableCell>24 caps</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">PROGRESS INDICATORS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>XP Progress</span>
                  <span>75%</span>
                </div>
                <Progress value={75} segmented segments={20} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Health</span>
                  <span>60%</span>
                </div>
                <Progress value={60} segmented segments={20} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Radiation</span>
                  <span>35%</span>
                </div>
                <Progress value={35} segmented segments={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">AVATARS</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Avatar>
                <AvatarFallback>VD</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>BoS</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>NCR</AvatarFallback>
              </Avatar>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">CAROUSEL</CardTitle>
            </CardHeader>
            <CardContent>
              <Carousel className="w-full max-w-xs mx-auto">
                <CarouselContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <CarouselItem key={num}>
                      <div className="p-1">
                        <Card>
                          <CardContent className="flex aspect-square items-center justify-center p-6">
                            <span className="text-4xl font-semibold">{num}</span>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">SCROLL AREA</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 w-full rounded-md border border-primary p-4">
                <div className="space-y-4">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="text-sm">
                      Terminal Log Entry #{i + 1}: System operational
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">SKELETON LOADING</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">ASPECT RATIO</CardTitle>
            </CardHeader>
            <CardContent>
              <AspectRatio ratio={16 / 9} className="bg-muted border border-primary">
                <div className="flex h-full w-full items-center justify-center">
                  <PixelIcon name="terminal-line" sizePreset="xl" variant="primary" decorative />
                </div>
              </AspectRatio>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">ALERTS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <PixelIcon name="information-line" sizePreset="sm" decorative />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  You have received a new radio transmission from Diamond City.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <PixelIcon name="alert-line" sizePreset="sm" decorative />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Critical radiation levels detected. Seek shelter immediately.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">TOAST NOTIFICATIONS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => {
                  toast({
                    title: "Mission Complete",
                    description: "You have successfully completed 'Out of Time'",
                  });
                }}
              >
                Show Success Toast
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  toast({
                    variant: "destructive",
                    title: "Critical Error",
                    description: "Power armor fusion core depleted",
                  });
                }}
              >
                Show Error Toast
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">SEPARATOR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Section 1</h4>
                <p className="text-sm text-muted-foreground">Content above separator</p>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium">Section 2</h4>
                <p className="text-sm text-muted-foreground">Content below separator</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Navigation Tab */}
        <TabsContent value="navigation" className="space-y-6">
          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">DROPDOWN MENU</CardTitle>
            </CardHeader>
            <CardContent>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <PixelIcon name="menu-line" sizePreset="sm" className="mr-2" decorative />
                    Open Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <PixelIcon name="user-line" sizePreset="sm" className="mr-2" decorative />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <PixelIcon name="settings-3-line" sizePreset="sm" className="mr-2" decorative />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <PixelIcon name="inbox-line" sizePreset="sm" className="mr-2" decorative />
                    Inventory
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">CONTEXT MENU</CardTitle>
            </CardHeader>
            <CardContent>
              <ContextMenu>
                <ContextMenuTrigger className="flex h-32 w-full items-center justify-center rounded-md border border-primary border-dashed text-sm">
                  Right click here
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem>Copy</ContextMenuItem>
                  <ContextMenuItem>Paste</ContextMenuItem>
                  <ContextMenuItem>Delete</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">MENUBAR</CardTitle>
            </CardHeader>
            <CardContent>
              <Menubar>
                <MenubarMenu>
                  <MenubarTrigger>File</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>New Tab</MenubarItem>
                    <MenubarItem>New Window</MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>Share</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>Edit</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>Undo</MenubarItem>
                    <MenubarItem>Redo</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>View</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>Toggle Fullscreen</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">NAVIGATION MENU</CardTitle>
            </CardHeader>
            <CardContent>
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Getting Started</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-4">
                        <NavigationMenuLink>Introduction</NavigationMenuLink>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Components</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-[400px] p-4">
                        <NavigationMenuLink>All Components</NavigationMenuLink>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">PAGINATION</CardTitle>
            </CardHeader>
            <CardContent>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      2
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6">
          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">RESIZABLE PANELS</CardTitle>
            </CardHeader>
            <CardContent>
              <ResizablePanelGroup direction="horizontal" className="min-h-[200px] rounded-lg border border-primary">
                <ResizablePanel defaultSize={50}>
                  <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">Panel One</span>
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={50}>
                  <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">Panel Two</span>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </CardContent>
          </Card>

          <Card className="border-2 border-primary bg-card/50">
            <CardHeader>
              <CardTitle className="text-primary">CARDS</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Card Title</CardTitle>
                  <CardDescription>Card description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Card content</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Another Card</CardTitle>
                  <CardDescription>With more content</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">More card content</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-muted-foreground uppercase tracking-wide border-t border-primary pt-4">
        <p>VAULT-TEC ASSISTED TARGETING SYSTEM V1.0.4</p>
        <p className="mt-1">ALL SYSTEMS NOMINAL | BATTERY LEVEL: 98%</p>
      </footer>
    </div>
  );
}
