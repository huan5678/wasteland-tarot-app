/**
 * Enhanced CardDetailModal Component - Ultimate Card Information Experience
 * Fallout-themed modal with tabbed interface, animations, and comprehensive card data display
 */

'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Radiation, Zap, Heart, Sword, Coins, Star, AlertTriangle,
  Volume2, VolumeX, BookOpen, Users, Share2, Bookmark, BookmarkCheck,
  Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut, Copy, ArrowLeft, ArrowRight,
  Gamepad2, Settings, Info, History, Lightbulb, FlaskConical,
  Trophy, Target, Brain, MessageCircle, Calendar, MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useClickOutside from '@/hooks/useClickOutside'
import { useTextToSpeech } from '@/hooks/audio/useTextToSpeech'
import { VoiceSelector } from '@/components/audio/VoiceSelector'
import { AudioVisualizer } from '@/components/audio/AudioVisualizer'
import useCardInteractions from '@/hooks/useCardInteractions'
import CardRelationships, { CardSynergy } from './CardRelationships'
import StudyMode, { StudyResults } from './StudyMode'
import CardShare, { ShareOptions } from './CardShare'

// Enhanced card data structure with full database integration
export interface DetailedTarotCard {
  id: string | number
  name: string
  description?: string
  suit: string
  value?: number
  card_number?: number
  number?: number
  image_url: string
  upright_meaning?: string
  reversed_meaning?: string
  meaning_upright?: string
  meaning_reversed?: string
  keywords?: string[]
  fallout_reference?: string
  character_voice_interpretations?: {
    [voice: string]: string
  }
  radiation_factor?: number
  karma_alignment?: 'GOOD' | 'NEUTRAL' | 'EVIL'
  symbolism?: string
  element?: string
  astrological_association?: string
  position?: 'upright' | 'reversed'
  // Extended properties from database
  audio_cue_url?: string
  vault_reference?: number
  threat_level?: number
  wasteland_humor?: string
  nuka_cola_reference?: string
  special_ability?: string
  draw_frequency?: number
  total_appearances?: number
  positive_feedback_count?: number
  negative_feedback_count?: number
  average_rating?: number
  rarity_level?: string
  is_active?: boolean
  is_complete?: boolean
  created_at?: string
  updated_at?: string
}

// Tab types for the modal interface
type TabType = 'overview' | 'meanings' | 'characters' | 'lore' | 'insights' | 'interactions'

interface TabConfig {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface CardBookmark {
  cardId: string
  isBookmarked: boolean
  bookmarkedAt?: string
  notes?: string
}

interface CardInteractionState {
  isBookmarked: boolean
  personalNotes: string
  studyProgress: number
  timesViewed: number
  lastViewed?: Date
}

interface CardDetailModalProps {
  card: DetailedTarotCard | null
  isOpen: boolean
  onClose: () => void
  onAddToReading?: (card: DetailedTarotCard) => void
  onBookmarkToggle?: (card: DetailedTarotCard, isBookmarked: boolean) => void
  onShareCard?: (card: DetailedTarotCard) => void
  onNotesUpdate?: (card: DetailedTarotCard, notes: string) => void
  onCardSelect?: (cardId: string) => void
  initialTab?: TabType
  enableAudio?: boolean
  showQuickActions?: boolean
  // Optional data for enhanced relationships
  allCards?: DetailedTarotCard[]
  cardSynergies?: CardSynergy[]
  // Guest mode props
  isGuestMode?: boolean
  showBookmark?: boolean
  showShare?: boolean
  showStudyMode?: boolean
  showPersonalNotes?: boolean
}

// Tab configuration for the modal interface
// Base tabs that are always shown
const BASE_TABS: TabConfig[] = [
  { id: 'overview', label: '總覽', icon: Eye, color: 'text-pip-boy-green' },
  { id: 'meanings', label: '含義', icon: BookOpen, color: 'text-blue-400' },
  { id: 'characters', label: '角色', icon: Users, color: 'text-purple-400' }
]

// Tabs that require login
const AUTHENTICATED_TABS: TabConfig[] = [
  { id: 'insights', label: '洞察', icon: Lightbulb, color: 'text-yellow-400' },
  { id: 'interactions', label: '互動', icon: Settings, color: 'text-cyan-400' }
]

const getSuitIcon = (suit: string) => {
  const suitLower = suit.toLowerCase()
  if (suitLower.includes('權杖') || suitLower.includes('wand') || suitLower.includes('radiation_rod')) return <Zap className="w-4 h-4" />
  if (suitLower.includes('聖杯') || suitLower.includes('cup') || suitLower.includes('nuka_cola')) return <Heart className="w-4 h-4" />
  if (suitLower.includes('寶劍') || suitLower.includes('sword') || suitLower.includes('combat_weapon')) return <Sword className="w-4 h-4" />
  if (suitLower.includes('錢幣') || suitLower.includes('pentacle') || suitLower.includes('bottle_cap')) return <Coins className="w-4 h-4" />
  if (suitLower.includes('major_arcana')) return <Star className="w-4 h-4" />
  return <Star className="w-4 h-4" />
}

const getRadiationLevel = (factor: number = 0) => {
  if (factor >= 0.8) return { label: '極高輻射', color: 'text-red-400', bgColor: 'bg-red-900/30' }
  if (factor >= 0.6) return { label: '高輻射', color: 'text-orange-400', bgColor: 'bg-orange-900/30' }
  if (factor >= 0.4) return { label: '中等輻射', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' }
  if (factor >= 0.2) return { label: '低輻射', color: 'text-pip-boy-green/60', bgColor: 'bg-pip-boy-green/10' }
  return { label: '安全', color: 'text-pip-boy-green', bgColor: 'bg-pip-boy-green/10' }
}

const getKarmaColor = (alignment?: string) => {
  switch (alignment) {
    case 'GOOD': return 'text-blue-400'
    case 'EVIL': return 'text-red-400'
    default: return 'text-pip-boy-green/70'
  }
}

// Enhanced character voice selector with audio support
const CharacterVoiceSelector = ({
  voices,
  selectedVoice,
  onVoiceChange,
  enableAudio = false,
  card
}: {
  voices: { [key: string]: string }
  selectedVoice: string
  onVoiceChange: (voice: string) => void
  enableAudio?: boolean
  card?: DetailedTarotCard
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(enableAudio)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const voiceNames: { [key: string]: string } = {
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
    'vault_dweller': '避難所居民',
    'CODSWORTH': 'Codsworth',
    'codsworth': 'Codsworth',
    'WASTELAND_TRADER': '廢土商人',
    'wasteland_trader': '廢土商人'
  }

  const getVoicePersonality = (voice: string) => {
    switch (voice.toLowerCase()) {
      case 'pip_boy':
        return { bgColor: 'bg-pip-boy-green/10', textColor: 'text-pip-boy-green', borderColor: 'border-pip-boy-green/40' }
      case 'super_mutant':
        return { bgColor: 'bg-red-500/10', textColor: 'text-red-400', borderColor: 'border-red-500/40' }
      case 'ghoul':
        return { bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400', borderColor: 'border-yellow-500/40' }
      case 'raider':
        return { bgColor: 'bg-orange-500/10', textColor: 'text-orange-400', borderColor: 'border-orange-500/40' }
      case 'brotherhood_scribe':
        return { bgColor: 'bg-blue-500/10', textColor: 'text-blue-400', borderColor: 'border-blue-500/40' }
      default:
        return { bgColor: 'bg-pip-boy-green/10', textColor: 'text-pip-boy-green/70', borderColor: 'border-pip-boy-green/40' }
    }
  }

  const handlePlayAudio = useCallback(async (voice: string) => {
    if (!audioEnabled || !card?.character_voice_interpretations?.[voice]) return

    setIsPlaying(true)
    try {
      // Get the interpretation text for this voice
      const text = card.character_voice_interpretations[voice]
      if (text) {
        // Use external handleSpeakText function
        if (typeof window !== 'undefined' && (window as any).handleCardSpeech) {
          await (window as any).handleCardSpeech(text, voice)
        }
      }
    } catch (error) {
      console.error('Audio playback error:', error)
    } finally {
      setTimeout(() => setIsPlaying(false), 1000)
    }
  }, [audioEnabled, card])

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-pip-boy-green font-mono font-bold text-sm">選擇角色聲音</h4>
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={cn(
            "p-2 rounded border transition-colors",
            audioEnabled
              ? "bg-pip-boy-green/10 border-pip-boy-green/40 text-pip-boy-green"
              : "border-pip-boy-green/20 text-pip-boy-green/60 hover:bg-pip-boy-green/5"
          )}
          title={audioEnabled ? '停用音頻' : '啟用音頻'}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.keys(voices).map((voice) => {
          const personality = getVoicePersonality(voice)
          const isSelected = selectedVoice === voice

          return (
            <motion.button
              key={voice}
              onClick={() => onVoiceChange(voice)}
              className={cn(
                "relative p-3 text-xs font-mono border rounded-lg transition-all duration-200 hover:scale-105",
                isSelected
                  ? `${personality.bgColor} ${personality.textColor} ${personality.borderColor} shadow-lg`
                  : `border-pip-boy-green/20 text-pip-boy-green/70 hover:${personality.bgColor} hover:${personality.textColor}`
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">{voiceNames[voice] || voice}</span>
                {audioEnabled && isSelected && (
                  <motion.div
                    onClick={(e) => {
                      e.stopPropagation()
                      if (voices[voice] && typeof window !== 'undefined' && (window as any).handleCardSpeech) {
                        (window as any).handleCardSpeech(voices[voice].slice(0, 50) + '...', voice.toLowerCase())
                      }
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "p-1 rounded transition-all duration-200 cursor-pointer",
                      isPlaying ? "animate-pulse bg-orange-500/20" : "hover:bg-black/20"
                    )}
                    title="播放聲音範例"
                  >
                    {isPlaying ? (
                      <VolumeX className="w-3 h-3 text-orange-400" />
                    ) : (
                      <Volume2 className="w-3 h-3" />
                    )}
                  </motion.div>
                )}
              </div>
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export function CardDetailModal({
  card,
  isOpen,
  onClose,
  onAddToReading,
  onBookmarkToggle,
  onShareCard,
  onNotesUpdate,
  onCardSelect,
  initialTab = 'overview',
  enableAudio = true,
  showQuickActions = true,
  allCards = [],
  cardSynergies = [],
  isGuestMode = false,
  showBookmark = true,
  showShare = true,
  showStudyMode = true,
  showPersonalNotes = true
}: CardDetailModalProps) {
  // Enhanced state management
  const [selectedVoice, setSelectedVoice] = useState('PIP_BOY')
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [imageError, setImageError] = useState(false)
  const [imageZoom, setImageZoom] = useState(1)
  const [showShareModal, setShowShareModal] = useState(false)

  // Hooks for enhanced functionality
  const {
    speak,
    pause,
    resume,
    stop: stopSpeech,
    isSpeaking,
    isPaused,
    isSupported: audioSupported
  } = useTextToSpeech()

  const {
    isBookmarked,
    toggleBookmark,
    updateBookmarkNotes,
    getStudyProgress,
    markAsViewed,
    updatePersonalData
  } = useCardInteractions()

  // Refs for interaction
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  // Animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: -20 }
  }

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  // Memoized calculations
  const radiationInfo = useMemo(() => getRadiationLevel(card?.radiation_factor), [card?.radiation_factor])
  const uprightMeaning = useMemo(() => card?.upright_meaning || card?.meaning_upright || '未知含義', [card])
  const reversedMeaning = useMemo(() => card?.reversed_meaning || card?.meaning_reversed || '未知含義', [card])
  const currentMeaning = useMemo(() =>
    card?.position === 'reversed' ? reversedMeaning : uprightMeaning,
    [card?.position, uprightMeaning, reversedMeaning]
  )

  // Dynamically compute visible tabs based on guest mode
  const TAB_CONFIG = useMemo(() => {
    if (isGuestMode) {
      return BASE_TABS // Only show base tabs for guests
    }
    return [...BASE_TABS, ...AUTHENTICATED_TABS] // Show all tabs for authenticated users
  }, [isGuestMode])

  // Enhanced keyboard navigation and interactions
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      // Tab navigation between tabs
      if (event.key === 'ArrowLeft' && event.ctrlKey) {
        event.preventDefault()
        const currentIndex = TAB_CONFIG.findIndex(tab => tab.id === activeTab)
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : TAB_CONFIG.length - 1
        setActiveTab(TAB_CONFIG[previousIndex].id)
        return
      }

      if (event.key === 'ArrowRight' && event.ctrlKey) {
        event.preventDefault()
        const currentIndex = TAB_CONFIG.findIndex(tab => tab.id === activeTab)
        const nextIndex = currentIndex < TAB_CONFIG.length - 1 ? currentIndex + 1 : 0
        setActiveTab(TAB_CONFIG[nextIndex].id)
        return
      }

      // Image zoom controls
      if (activeTab === 'overview') {
        if (event.key === '+' || event.key === '=') {
          event.preventDefault()
          setImageZoom(prev => Math.min(prev + 0.25, 3))
          return
        }
        if (event.key === '-' || event.key === '_') {
          event.preventDefault()
          setImageZoom(prev => Math.max(prev - 0.25, 0.5))
          return
        }
        if (event.key === '0') {
          event.preventDefault()
          setImageZoom(1)
          return
        }
      }

      // Bookmark toggle
      if (event.key === 'b' && event.ctrlKey) {
        event.preventDefault()
        handleBookmarkToggle()
        return
      }

      // Share card
      if (event.key === 's' && event.ctrlKey) {
        event.preventDefault()
        handleShareCard()
        return
      }

      // Standard tab trapping
      if (event.key === 'Tab') {
        const modal = modalRef.current
        if (!modal) return

        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    // Update interaction state
    if (card) {
      markAsViewed(card.id.toString())
    }

    // Focus management
    setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 100)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose, activeTab])

  // Interaction handlers
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  // Get card interaction state
  const cardStudyProgress = useMemo(() =>
    card ? getStudyProgress(card.id.toString()) : null,
    [card, getStudyProgress]
  )

  const cardIsBookmarked = useMemo(() =>
    card ? isBookmarked(card.id.toString()) : false,
    [card, isBookmarked]
  )

  const handleBookmarkToggle = useCallback(async () => {
    if (!card) return
    await toggleBookmark(card)
    onBookmarkToggle?.(card, !cardIsBookmarked)
  }, [card, cardIsBookmarked, toggleBookmark, onBookmarkToggle])

  const handleShareCard = useCallback(() => {
    if (!card) return
    setShowShareModal(true)
    onShareCard?.(card)
  }, [card, onShareCard])

  const handleShareComplete = useCallback((method: string, options: ShareOptions) => {
    console.log('Card shared via:', method, options)
    setShowShareModal(false)
  }, [])

  const handleAddToReading = useCallback(() => {
    if (!card) return
    onAddToReading?.(card)
  }, [card, onAddToReading])

  const handleNotesUpdate = useCallback(async (notes: string) => {
    if (!card) return
    await updateBookmarkNotes(card.id.toString(), notes)
    onNotesUpdate?.(card, notes)
  }, [card, updateBookmarkNotes, onNotesUpdate])

  const handleSpeakText = useCallback((text: string) => {
    if (!enableAudio || !audioSupported || isSpeaking) return

    try {
      speak(text)
    } catch (error) {
      console.error('Speech error:', error)
    }
  }, [enableAudio, audioSupported, isSpeaking, speak])

  const handleImageZoom = useCallback((delta: number) => {
    setImageZoom(prev => Math.max(0.5, Math.min(3, prev + delta)))
  }, [])

  const handleImageReset = useCallback(() => {
    setImageZoom(1)
  }, [])

  // Click outside to close
  useClickOutside(modalRef, onClose)

  if (!isOpen || !card) return null

  // Tab content renderers
  const renderOverviewTab = () => (
    <motion.div
      key="overview"
      variants={tabContentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {/* Left Column - Card Image */}
      <div className="space-y-4">
        <div className="relative" ref={imageContainerRef}>
          <div className={cn(
            "w-full max-w-md mx-auto aspect-[2/3] border-2 border-pip-boy-green/60 rounded-lg overflow-hidden bg-wasteland-dark relative",
            card.position === 'reversed' && "transform rotate-180"
          )}>
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center text-pip-boy-green/60">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                  <div className="font-mono text-sm">圖片載入失敗</div>
                </div>
              </div>
            ) : (
              <motion.img
                src={card.image_url}
                alt={card.name}
                className="w-full h-full object-cover transition-transform duration-200"
                style={{ transform: `scale(${imageZoom})` }}
                onError={() => setImageError(true)}
                animate={{ scale: imageZoom }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}

            {/* Image Controls - Hidden on small screens */}
            <div className="hidden md:flex absolute top-2 right-2 flex-col gap-1.5">
              <button
                onClick={() => handleImageZoom(0.25)}
                className="p-2 bg-black/60 text-pip-boy-green rounded hover:bg-black/80 hover:cursor-pointer transition-all"
                title="放大"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleImageZoom(-0.25)}
                className="p-2 bg-black/60 text-pip-boy-green rounded hover:bg-black/80 hover:cursor-pointer transition-all"
                title="縮小"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <button
                onClick={handleImageReset}
                className="p-2 bg-black/60 text-pip-boy-green rounded hover:bg-black/80 hover:cursor-pointer transition-all"
                title="重置大小"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {card.position === 'reversed' && (
            <div className="absolute top-2 left-2 bg-red-900/80 text-red-400 px-2 py-1 rounded text-xs font-mono">
              逆位
            </div>
          )}
        </div>

        {/* Card Metadata */}
        <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm font-mono">
            <div>
              <span className="text-pip-boy-green/70">花色：</span>
              <span className="text-pip-boy-green">{card.suit}</span>
            </div>
            <div>
              <span className="text-pip-boy-green/70">編號：</span>
              <span className="text-pip-boy-green">{card.number || card.card_number || 'N/A'}</span>
            </div>
            {card.karma_alignment && (
              <div>
                <span className="text-pip-boy-green/70">業力：</span>
                <span className={getKarmaColor(card.karma_alignment)}>{card.karma_alignment}</span>
              </div>
            )}
            {card.rarity_level && (
              <div>
                <span className="text-pip-boy-green/70">稀有度：</span>
                <span className="text-pip-boy-green capitalize">{card.rarity_level}</span>
              </div>
            )}
          </div>

          {card.average_rating && (
            <div className="flex items-center gap-2 pt-2 border-t border-pip-boy-green/10">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-pip-boy-green/70 text-sm font-mono">
                評分：{card.average_rating.toFixed(1)}/5.0
              </span>
            </div>
          )}
        </div>

        {/* Keywords */}
        {card.keywords && card.keywords.length > 0 && (
          <div>
            <h4 className="text-pip-boy-green font-mono font-bold mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              關鍵詞
            </h4>
            <div className="flex flex-wrap gap-2">
              {card.keywords.map((keyword, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="px-2 py-1 bg-pip-boy-green/10 border border-pip-boy-green/30 text-pip-boy-green/80 text-xs font-mono rounded hover:bg-pip-boy-green/20 transition-colors"
                >
                  {keyword}
                </motion.span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Current Meaning */}
      <div className="space-y-6">
        <div>
          <h4 className="text-pip-boy-green font-mono font-bold mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {card.position === 'reversed' ? '逆位含義' : '正位含義'}
            {card.position === 'reversed' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
          </h4>
          <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded">
            <p id="card-modal-description" className="text-pip-boy-green/90 font-mono text-sm leading-relaxed">
              {currentMeaning}
            </p>
          </div>
        </div>

        {/* Description */}
        {card.description && (
          <div>
            <h4 className="text-pip-boy-green font-mono font-bold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              描述
            </h4>
            <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-3 rounded">
              <p className="text-pip-boy-green/90 font-mono text-sm leading-relaxed">
                {card.description}
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {(card.draw_frequency || card.total_appearances) && (
          <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded">
            <h4 className="text-pip-boy-green font-mono font-bold mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              使用統計
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              {card.total_appearances && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-pip-boy-green">{card.total_appearances}</div>
                  <div className="text-pip-boy-green/70">總出現次數</div>
                </div>
              )}
              {card.draw_frequency && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-pip-boy-green">{(card.draw_frequency * 100).toFixed(1)}%</div>
                  <div className="text-pip-boy-green/70">抽取頻率</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lore Section - Integrated from Lore Tab */}
        {card.fallout_reference && (
          <div className="mt-6 pt-6 border-t border-pip-boy-green/20">
            <h4 className="text-pip-boy-green font-mono font-bold mb-3 flex items-center gap-2">
              <Radiation className="w-5 h-5" />
              廢土背景
            </h4>
            <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded">
              <p className="text-pip-boy-green/90 font-mono text-sm leading-relaxed">
                {card.fallout_reference}
              </p>
            </div>
          </div>
        )}

        {/* Extended Fallout Details */}
        {(card.vault_reference || card.threat_level !== undefined) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {card.vault_reference && (
              <div>
                <h5 className="text-blue-400 font-mono font-bold text-sm mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  避難所關聯
                </h5>
                <div className="bg-blue-500/5 border border-blue-400/20 p-3 rounded">
                  <p className="text-blue-300/80 font-mono text-sm">Vault {card.vault_reference}</p>
                </div>
              </div>
            )}

            {card.threat_level !== undefined && (
              <div>
                <h5 className="text-red-400 font-mono font-bold text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  威脅等級
                </h5>
                <div className="bg-red-500/5 border border-red-400/20 p-3 rounded">
                  <p className="text-red-300/80 font-mono text-sm">{card.threat_level}/10</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Special Features */}
        {(card.wasteland_humor || card.nuka_cola_reference || card.special_ability) && (
          <div className="space-y-4 mt-4">
            {card.wasteland_humor && (
              <div>
                <h5 className="text-yellow-400 font-mono font-bold text-sm mb-2">廢土幽默</h5>
                <div className="bg-yellow-500/5 border border-yellow-400/20 p-3 rounded">
                  <p className="text-yellow-300/80 font-mono text-sm italic">
                    "{card.wasteland_humor}"
                  </p>
                </div>
              </div>
            )}

            {card.nuka_cola_reference && (
              <div>
                <h5 className="text-cyan-400 font-mono font-bold text-sm mb-2">核子可樂關聯</h5>
                <div className="bg-cyan-500/5 border border-cyan-400/20 p-3 rounded">
                  <p className="text-cyan-300/80 font-mono text-sm">{card.nuka_cola_reference}</p>
                </div>
              </div>
            )}

            {card.special_ability && (
              <div>
                <h5 className="text-purple-400 font-mono font-bold text-sm mb-2">特殊能力</h5>
                <div className="bg-purple-500/5 border border-purple-400/20 p-3 rounded">
                  <p className="text-purple-300/80 font-mono text-sm">{card.special_ability}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )

  const renderMeaningsTab = () => (
    <motion.div
      key="meanings"
      variants={tabContentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Both Meanings Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="text-blue-400 font-mono font-bold text-lg mb-3 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            正位意義
          </h4>
          <div className="bg-blue-500/5 border border-blue-400/20 p-4 rounded-lg">
            <p className="text-blue-300/90 font-mono text-sm leading-relaxed">
              {uprightMeaning}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-orange-400 font-mono font-bold text-lg mb-3 flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            逆位意義
          </h4>
          <div className="bg-orange-500/5 border border-orange-400/20 p-4 rounded-lg">
            <p className="text-orange-300/90 font-mono text-sm leading-relaxed">
              {reversedMeaning}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Symbolism and Elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {card.symbolism && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-pip-boy-green font-mono font-bold mb-3 flex items-center gap-2">
              <Star className="w-5 h-5" />
              象徵意義
            </h4>
            <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-4 rounded">
              <p className="text-pip-boy-green/90 font-mono text-sm leading-relaxed">
                {card.symbolism}
              </p>
            </div>
          </motion.div>
        )}

        {(card.element || card.astrological_association) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            {card.element && (
              <div>
                <h5 className="text-pip-boy-green/80 font-mono font-bold text-sm mb-2">元素</h5>
                <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-3 rounded">
                  <p className="text-pip-boy-green/80 font-mono text-sm">{card.element}</p>
                </div>
              </div>
            )}
            {card.astrological_association && (
              <div>
                <h5 className="text-pip-boy-green/80 font-mono font-bold text-sm mb-2">占星關聯</h5>
                <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-3 rounded">
                  <p className="text-pip-boy-green/80 font-mono text-sm">{card.astrological_association}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )

  const renderCharactersTab = () => (
    <motion.div
      key="characters"
      variants={tabContentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {card.character_voice_interpretations && (
        <div>
          <CharacterVoiceSelector
            voices={card.character_voice_interpretations}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            enableAudio={enableAudio}
            card={card}
          />

          <motion.div
            key={selectedVoice}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-pip-boy-green" />
                <h4 className="text-pip-boy-green font-mono font-bold">
                  {selectedVoice.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} 的解讀
                </h4>
              </div>

              {enableAudio && audioSupported && card.character_voice_interpretations?.[selectedVoice] && (
                <motion.button
                  onClick={() => handleSpeakText(
                    card.character_voice_interpretations![selectedVoice],
                    selectedVoice.toLowerCase()
                  )}
                  disabled={isSpeaking}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "p-2 rounded border transition-colors flex items-center gap-2",
                    isSpeaking
                      ? "bg-orange-500/20 border-orange-400 text-orange-400 animate-pulse"
                      : "border-pip-boy-green/40 text-pip-boy-green hover:bg-pip-boy-green/10"
                  )}
                  title="播放角色聲音"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span className="font-mono text-xs">播放中...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span className="font-mono text-xs">播放</span>
                    </>
                  )}
                </motion.button>
              )}
            </div>

            <p className="text-pip-boy-green/90 font-mono text-sm leading-relaxed">
              {card.character_voice_interpretations[selectedVoice] || '無可用解讀'}
            </p>

            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex items-center gap-2 text-xs font-mono text-orange-400"
              >
                <div className="flex space-x-1">
                  <motion.div
                    className="w-1 h-1 bg-orange-400 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                  <motion.div
                    className="w-1 h-1 bg-orange-400 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-1 h-1 bg-orange-400 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
                <span>正在播放角色聲音...</span>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  )

  // renderLoreTab removed - lore content integrated into renderOverviewTab

  const renderInsightsTab = () => (
    <motion.div
      key="insights"
      variants={tabContentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Advanced Card Relationships */}
      <CardRelationships
        card={card}
        allCards={allCards}
        synergies={cardSynergies}
        onCardSelect={onCardSelect}
      />

      {/* Usage Analytics */}
      <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
        <h4 className="text-pip-boy-green font-mono font-bold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          卡牌分析洞察
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {card.total_appearances && (
            <div className="text-center">
              <div className="text-2xl font-bold text-pip-boy-green">{card.total_appearances}</div>
              <div className="text-pip-boy-green/70 text-xs">總出現</div>
            </div>
          )}
          {card.positive_feedback_count && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{card.positive_feedback_count}</div>
              <div className="text-pip-boy-green/70 text-xs">正面反饋</div>
            </div>
          )}
          {card.negative_feedback_count && (
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{card.negative_feedback_count}</div>
              <div className="text-pip-boy-green/70 text-xs">負面反饋</div>
            </div>
          )}
          {cardStudyProgress && (
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{cardStudyProgress.timesViewed}</div>
              <div className="text-pip-boy-green/70 text-xs">個人查看</div>
            </div>
          )}
        </div>

        {card.average_rating && (
          <div className="flex items-center justify-center gap-4 pt-4 border-t border-pip-boy-green/10">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-pip-boy-green font-mono">平均評分</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {card.average_rating.toFixed(1)}/5.0
            </div>
          </div>
        )}
      </div>

      {/* Personal Progress */}
      <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
        <h4 className="text-pip-boy-green font-mono font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          個人學習進度
        </h4>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm font-mono mb-2">
              <span className="text-pip-boy-green/70">理解程度</span>
              <span className="text-pip-boy-green">{cardStudyProgress?.studyProgress || 0}%</span>
            </div>
            <div className="w-full bg-pip-boy-green/10 rounded-full h-2">
              <motion.div
                className="bg-pip-boy-green h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${cardStudyProgress?.studyProgress || 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          {cardStudyProgress?.lastViewed && (
            <div className="flex items-center gap-2 text-sm font-mono text-pip-boy-green/70">
              <Calendar className="w-4 h-4" />
              <span>上次查看：{cardStudyProgress.lastViewed.toLocaleDateString()}</span>
            </div>
          )}

          {cardStudyProgress?.masteryLevel && (
            <div className="flex items-center gap-2 text-sm font-mono">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-pip-boy-green/70">熟練度：</span>
              <span className="text-pip-boy-green capitalize">{cardStudyProgress.masteryLevel}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )

  const renderInteractionsTab = () => (
    <motion.div
      key="interactions"
      variants={tabContentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      {/* Quick Actions */}
      {showQuickActions && (
        <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
          <h4 className="text-pip-boy-green font-mono font-bold mb-4">快速操作</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {showBookmark && (
              <motion.button
                onClick={handleBookmarkToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "p-3 rounded border font-mono text-sm transition-colors flex flex-col items-center gap-2",
                  cardIsBookmarked
                    ? "bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green"
                    : "border-pip-boy-green/40 text-pip-boy-green/70 hover:bg-pip-boy-green/10"
                )}
              >
                {cardIsBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                <span>{cardIsBookmarked ? '已收藏' : '收藏'}</span>
              </motion.button>
            )}

            <motion.button
              onClick={handleAddToReading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded border border-blue-400/40 text-blue-400 font-mono text-sm hover:bg-blue-500/10 transition-colors flex flex-col items-center gap-2"
            >
              <Target className="w-5 h-5" />
              <span>加入占卜</span>
            </motion.button>

            {showShare && (
              <motion.button
                onClick={handleShareCard}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded border border-purple-400/40 text-purple-400 font-mono text-sm hover:bg-purple-500/10 transition-colors flex flex-col items-center gap-2"
              >
                <Share2 className="w-5 h-5" />
                <span>分享</span>
              </motion.button>
            )}

            <motion.button
              onClick={() => navigator.clipboard.writeText(`${card.name}: ${currentMeaning}`)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded border border-cyan-400/40 text-cyan-400 font-mono text-sm hover:bg-cyan-500/10 transition-colors flex flex-col items-center gap-2"
            >
              <Copy className="w-5 h-5" />
              <span>複製</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Personal Notes */}
      {showPersonalNotes && (
        <div className="bg-pip-boy-green/5 border border-pip-boy-green/20 p-6 rounded-lg">
          <h4 className="text-pip-boy-green font-mono font-bold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            個人筆記
          </h4>
          <textarea
            defaultValue={cardIsBookmarked ? '' : ''}
            onChange={(e) => handleNotesUpdate(e.target.value)}
            placeholder="記下你對這張卡片的想法和感悟..."
            className="w-full h-32 bg-wasteland-dark border border-pip-boy-green/30 text-pip-boy-green font-mono text-sm p-3 rounded resize-none focus:outline-none focus:border-pip-boy-green/60"
          />
        </div>
      )}

      {/* Interactive Study Mode */}
      {showStudyMode && (
        <StudyMode
          card={card}
          relatedCards={allCards.filter(c => c.id !== card.id).slice(0, 5)}
          mode="single"
          onComplete={(results: StudyResults) => {
            console.log('Study session completed:', results)
            // Update study progress
            if (cardStudyProgress) {
              // This would update the user's study progress in the backend
            }
          }}
        />
      )}

      {/* Card Sharing */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-6"
          >
            <CardShare
              card={card}
              position={card.position}
              onShare={handleShareComplete}
              onClose={() => setShowShareModal(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

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
        aria-labelledby="card-modal-title"
        aria-describedby="card-modal-description"
      >
        <motion.div
          ref={modalRef}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-wasteland-dark border-2 border-pip-boy-green max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Enhanced Header */}
          <div className="border-b border-pip-boy-green/30 p-4 flex items-center justify-between bg-pip-boy-green/5">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {getSuitIcon(card.suit)}
                </motion.div>
                <h2 id="card-modal-title" className="text-xl font-bold text-pip-boy-green font-mono">
                  {card.name}
                </h2>
              </div>

              {card.radiation_factor !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-mono flex items-center gap-2",
                    radiationInfo.bgColor,
                    radiationInfo.color
                  )}
                >
                  <Radiation className="w-3 h-3" />
                  {radiationInfo.label}
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Keyboard shortcuts hint */}
              <div className="hidden md:block text-xs text-pip-boy-green/60 font-mono mr-4">
                Ctrl+← → 切換分頁 | ESC 關閉
              </div>

              <motion.button
                ref={closeButtonRef}
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-pip-boy-green hover:text-pip-boy-green/80 p-2 rounded border border-pip-boy-green/40 hover:bg-pip-boy-green/10 transition-colors"
                aria-label="關閉卡牌詳情"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-pip-boy-green/30 bg-wasteland-dark/50">
            <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-pip-boy-green/30">
              {TAB_CONFIG.map((tab, index) => {
                const isActive = activeTab === tab.id
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 font-mono text-sm border-b-2 transition-all duration-200 whitespace-nowrap",
                      isActive
                        ? `${tab.color} border-current bg-pip-boy-green/5`
                        : "text-pip-boy-green/60 border-transparent hover:text-pip-boy-green/80 hover:bg-pip-boy-green/5"
                    )}
                    whileHover={{ y: -1 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'meanings' && renderMeaningsTab()}
              {activeTab === 'characters' && renderCharactersTab()}
              {activeTab === 'insights' && renderInsightsTab()}
              {activeTab === 'interactions' && renderInteractionsTab()}
            </AnimatePresence>
          </div>

          {/* Guest Mode CTA */}
          {isGuestMode && (
            <div className="border-t border-pip-boy-green/30 p-6 bg-gradient-to-r from-pip-boy-green/10 to-pip-boy-green/5">
              <div className="max-w-3xl mx-auto text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-pip-boy-green">
                  <Radiation className="w-5 h-5 animate-pulse" />
                  <h3 className="text-lg font-mono font-bold">想要更深入的解讀？</h3>
                  <Radiation className="w-5 h-5 animate-pulse" />
                </div>
                <p className="text-pip-boy-green/80 font-mono text-sm leading-relaxed">
                  註冊 Vault 帳號後，你可以：<br />
                  <span className="inline-flex items-center gap-2 mt-2">
                    <Bookmark className="w-4 h-4" /> 收藏卡牌
                  </span>
                  {' | '}
                  <span className="inline-flex items-center gap-2">
                    <Brain className="w-4 h-4" /> AI 深度解讀
                  </span>
                  {' | '}
                  <span className="inline-flex items-center gap-2">
                    <History className="w-4 h-4" /> 保存占卜歷史
                  </span>
                  {' | '}
                  <span className="inline-flex items-center gap-2">
                    <Target className="w-4 h-4" /> 追蹤學習進度
                  </span>
                </p>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/auth/register'}
                    className="px-6 py-3 bg-pip-boy-green text-wasteland-dark font-mono font-bold rounded border-2 border-pip-boy-green hover:bg-transparent hover:text-pip-boy-green transition-all duration-300 shadow-lg shadow-pip-boy-green/20"
                  >
                    立即註冊
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/auth/login'}
                    className="px-6 py-3 border-2 border-pip-boy-green text-pip-boy-green font-mono font-bold rounded hover:bg-pip-boy-green hover:text-wasteland-dark transition-all duration-300"
                  >
                    已有帳號？登入
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Footer */}
          <div className="border-t border-pip-boy-green/30 p-4 bg-pip-boy-green/5">
            <div className="flex justify-between items-center text-xs font-mono text-pip-boy-green/60">
              <div className="flex items-center gap-4">
                <span>VAULT-TEC 塔羅系統 v3.0.0</span>
                <span>輻射等級: {radiationInfo.label}</span>
                {isGuestMode && <span className="text-orange-400">訪客模式</span>}
              </div>
              <div className="flex items-center gap-4">
                {card.created_at && (
                  <span>創建: {new Date(card.created_at).toLocaleDateString()}</span>
                )}
                {!isGuestMode && cardIsBookmarked && <span>★ 已收藏</span>}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}