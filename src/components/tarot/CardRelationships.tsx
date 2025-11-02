/**
 * Card Relationships Component
 * Displays card synergies, connections, and advanced metadata relationships
 */

'use client'

import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { DetailedTarotCard } from './CardDetailModal'
import { PixelIcon } from '@/components/ui/icons'
import type { IconName } from '@/types/icons'

export interface CardSynergy {
  id: string
  primaryCardId: string
  secondaryCardId: string
  synergyType: 'complementary' | 'conflicting' | 'amplifying' | 'neutralizing'
  synergyStrength: number // 0-1
  description: string
  conditions?: string[]
  effects?: string[]
}

export interface CardConnection {
  cardId: string
  name: string
  suit: string
  connectionType: 'sequential' | 'thematic' | 'elemental' | 'numerical'
  relationship: string
  strength: number // 0-1
}

export interface ElementalAssociation {
  element: string
  strength: number
  influence: 'positive' | 'negative' | 'neutral'
  description: string
}

export interface NumericalPattern {
  number: number
  pattern: 'progression' | 'mirror' | 'complement' | 'opposition'
  cards: string[]
  significance: string
}

export interface CardRelationshipsProps {
  card: DetailedTarotCard
  allCards?: DetailedTarotCard[]
  synergies?: CardSynergy[]
  onCardSelect?: (cardId: string) => void
  className?: string
}

// Suit mapping for icons and colors
const SUIT_CONFIG = {
  'MAJOR_ARCANA': { iconName: 'star' as IconName, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  'NUKA_COLA_BOTTLES': { iconName: 'heart' as IconName, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  'COMBAT_WEAPONS': { iconName: 'sword' as IconName, color: 'text-red-400', bg: 'bg-red-500/10' },
  'BOTTLE_CAPS': { iconName: 'coin' as IconName, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  'RADIATION_RODS': { iconName: 'zap' as IconName, color: 'text-pip-boy-green', bg: 'bg-pip-boy-green/10' }
}

const getSynergyIcon = (type: CardSynergy['synergyType']): IconName => {
  switch (type) {
    case 'complementary': return 'plus'
    case 'conflicting': return 'minus'
    case 'amplifying': return 'trending-up'
    case 'neutralizing': return 'trending-down'
    default: return 'share'
  }
}

const getSynergyColor = (type: CardSynergy['synergyType']) => {
  switch (type) {
    case 'complementary': return 'text-green-400'
    case 'conflicting': return 'text-red-400'
    case 'amplifying': return 'text-blue-400'
    case 'neutralizing': return 'text-orange-400'
    default: return 'text-pip-boy-green'
  }
}

export function CardRelationships({
  card,
  allCards = [],
  synergies = [],
  onCardSelect,
  className
}: CardRelationshipsProps) {
  const [activeSection, setActiveSection] = useState<'synergies' | 'connections' | 'patterns'>('synergies')
  const [expandedSynergy, setExpandedSynergy] = useState<string | null>(null)

  // Calculate card connections based on suit, number, and thematic similarities
  const cardConnections = useMemo(() => {
    if (!allCards.length) return []

    const connections: CardConnection[] = []
    const cardSuit = card.suit
    const cardNumber = card.number || card.card_number || 0

    allCards.forEach((otherCard) => {
      if (otherCard.id === card.id) return

      const otherSuit = otherCard.suit
      const otherNumber = otherCard.number || otherCard.card_number || 0

      // Same suit connections
      if (cardSuit === otherSuit) {
        const numberDiff = Math.abs(cardNumber - otherNumber)
        if (numberDiff === 1) {
          connections.push({
            cardId: otherCard.id.toString(),
            name: otherCard.name,
            suit: otherSuit,
            connectionType: 'sequential',
            relationship: `Sequential card in ${cardSuit}`,
            strength: 0.8
          })
        } else if (numberDiff <= 3) {
          connections.push({
            cardId: otherCard.id.toString(),
            name: otherCard.name,
            suit: otherSuit,
            connectionType: 'thematic',
            relationship: `Related card in ${cardSuit}`,
            strength: 0.6
          })
        }
      }

      // Same number connections
      if (cardNumber === otherNumber && cardNumber > 0) {
        connections.push({
          cardId: otherCard.id.toString(),
          name: otherCard.name,
          suit: otherSuit,
          connectionType: 'numerical',
          relationship: `Shares number ${cardNumber}`,
          strength: 0.7
        })
      }

      // Elemental connections
      if (card.element && otherCard.element === card.element) {
        connections.push({
          cardId: otherCard.id.toString(),
          name: otherCard.name,
          suit: otherSuit,
          connectionType: 'elemental',
          relationship: `Shares ${card.element} element`,
          strength: 0.5
        })
      }
    })

    return connections.slice(0, 8) // Limit to top 8 connections
  }, [card, allCards])

  // Calculate elemental associations
  const elementalAssociations = useMemo(() => {
    const associations: ElementalAssociation[] = []

    if (card.element) {
      associations.push({
        element: card.element,
        strength: 1.0,
        influence: 'positive',
        description: `Primary elemental association with ${card.element}`
      })
    }

    // Add derived elemental connections based on suit
    if (card.suit === 'RADIATION_RODS') {
      associations.push({
        element: 'Fire',
        strength: 0.8,
        influence: 'positive',
        description: 'Fire energy from radiation and transformation'
      })
    } else if (card.suit === 'NUKA_COLA_BOTTLES') {
      associations.push({
        element: 'Water',
        strength: 0.7,
        influence: 'positive',
        description: 'Water energy from emotional depth and intuition'
      })
    }

    return associations
  }, [card])

  // Calculate numerical patterns
  const numericalPatterns = useMemo(() => {
    if (!allCards.length) return []

    const cardNumber = card.number || card.card_number || 0
    if (cardNumber <= 0) return []

    const patterns: NumericalPattern[] = []

    // Find progression patterns
    const progressionCards = allCards
      .filter(c => {
        const num = c.number || c.card_number || 0
        return num > 0 && Math.abs(num - cardNumber) <= 2 && c.suit === card.suit
      })
      .sort((a, b) => (a.number || a.card_number || 0) - (b.number || b.card_number || 0))

    if (progressionCards.length >= 3) {
      patterns.push({
        number: cardNumber,
        pattern: 'progression',
        cards: progressionCards.map(c => c.name),
        significance: `Part of a numerical progression in ${card.suit}`
      })
    }

    // Find mirror patterns (complementary numbers)
    const mirrorNumber = 11 - cardNumber // Assuming 1-10 range
    const mirrorCard = allCards.find(c => {
      const num = c.number || c.card_number || 0
      return num === mirrorNumber && c.suit === card.suit
    })

    if (mirrorCard) {
      patterns.push({
        number: cardNumber,
        pattern: 'mirror',
        cards: [card.name, mirrorCard.name],
        significance: `Mirror relationship with ${mirrorCard.name}`
      })
    }

    return patterns
  }, [card, allCards])

  // Get relevant synergies for this card
  const relevantSynergies = useMemo(() => {
    return synergies.filter(s =>
      s.primaryCardId === card.id.toString() || s.secondaryCardId === card.id.toString()
    )
  }, [synergies, card.id])

  const renderSynergies = () => (
    <div className="space-y-4">
      {relevantSynergies.length === 0 ? (
        <div className="text-center py-8 text-pip-boy-green/60">
          <PixelIcon name="share" size={48} className="mx-auto mb-4 opacity-50" decorative />
          <p className="text-sm">暫無已知的卡片協同效應</p>
        </div>
      ) : (
        relevantSynergies.map((synergy) => {
          const synergyIconName = getSynergyIcon(synergy.synergyType)
          const synergyColor = getSynergyColor(synergy.synergyType)
          const isExpanded = expandedSynergy === synergy.id

          return (
            <motion.div
              key={synergy.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedSynergy(isExpanded ? null : synergy.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-pip-boy-green/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <PixelIcon name={synergyIconName} size={20} className={synergyColor} decorative />
                  <div className="text-left">
                    <div className="font-bold text-pip-boy-green capitalize">
                      {synergy.synergyType.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-pip-boy-green/70">
                      強度: {(synergy.synergyStrength * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <PixelIcon name="chevron-down" size={20} className="text-pip-boy-green/60" decorative />
                </motion.div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-pip-boy-green/20"
                  >
                    <div className="p-4 space-y-3">
                      <p className="text-pip-boy-green/90 text-sm leading-relaxed">
                        {synergy.description}
                      </p>

                      {synergy.conditions && synergy.conditions.length > 0 && (
                        <div>
                          <h5 className="text-pip-boy-green/80 font-bold text-xs mb-2">觸發條件</h5>
                          <ul className="space-y-1">
                            {synergy.conditions.map((condition, idx) => (
                              <li key={idx} className="text-pip-boy-green/70 text-xs flex items-start gap-2">
                                <PixelIcon name="target" size={12} className="mt-0.5 flex-shrink-0" decorative />
                                <span>{condition}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {synergy.effects && synergy.effects.length > 0 && (
                        <div>
                          <h5 className="text-pip-boy-green/80 font-bold text-xs mb-2">協同效果</h5>
                          <ul className="space-y-1">
                            {synergy.effects.map((effect, idx) => (
                              <li key={idx} className="text-pip-boy-green/70 text-xs flex items-start gap-2">
                                <PixelIcon name="bulb" size={12} className="mt-0.5 flex-shrink-0 text-yellow-400" decorative />
                                <span>{effect}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })
      )}
    </div>
  )

  const renderConnections = () => (
    <div className="space-y-4">
      {cardConnections.length === 0 ? (
        <div className="text-center py-8 text-pip-boy-green/60">
          <PixelIcon name="users" size={48} className="mx-auto mb-4 opacity-50" decorative />
          <p className="text-sm">暫無相關卡片連結</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cardConnections.map((connection, index) => {
            const suitConfig = SUIT_CONFIG[connection.suit as keyof typeof SUIT_CONFIG] || SUIT_CONFIG.MAJOR_ARCANA

            return (
              <motion.div
                key={`${connection.cardId}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 border rounded-lg hover:scale-105 transition-all duration-200 cursor-pointer",
                  suitConfig.bg,
                  "border-current/20 hover:border-current/40"
                )}
                onClick={() => onCardSelect?.(connection.cardId)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PixelIcon name={suitConfig.iconName} size={16} className={suitConfig.color} decorative />
                    <span className={cn("font-bold text-sm", suitConfig.color)}>
                      {connection.name}
                    </span>
                  </div>
                  <PixelIcon name="arrow-right" size={16} className={suitConfig.color} decorative />
                </div>

                <p className="text-pip-boy-green/80 text-xs mb-2">
                  {connection.relationship}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-pip-boy-green/60 text-xs capitalize">
                    {connection.connectionType}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-20 bg-pip-boy-green/20 rounded-full h-1">
                      <motion.div
                        className={cn("h-1 rounded-full", suitConfig.color.replace('text-', 'bg-'))}
                        initial={{ width: 0 }}
                        animate={{ width: `${connection.strength * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>
                    <span className={cn("text-xs", suitConfig.color)}>
                      {(connection.strength * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderPatterns = () => (
    <div className="space-y-6">
      {/* Elemental Associations */}
      {elementalAssociations.length > 0 && (
        <div>
          <h4 className="text-pip-boy-green font-bold mb-3 flex items-center gap-2">
            <PixelIcon name="reload" size={24} decorative />
            元素關聯
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {elementalAssociations.map((association, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-pip-boy-green">{association.element}</span>
                  <div className={cn(
                    "px-2 py-1 rounded text-xs",
                    association.influence === 'positive' ? 'bg-green-500/20 text-green-400' :
                    association.influence === 'negative' ? 'bg-red-500/20 text-red-400' :
                    'bg-pip-boy-green/20 text-pip-boy-green'
                  )}>
                    {association.influence}
                  </div>
                </div>
                <p className="text-pip-boy-green/80 text-xs mb-2">
                  {association.description}
                </p>
                <div className="w-full bg-pip-boy-green/20 rounded-full h-1">
                  <motion.div
                    className="bg-pip-boy-green h-1 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${association.strength * 100}%` }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Numerical Patterns */}
      {numericalPatterns.length > 0 && (
        <div>
          <h4 className="text-pip-boy-green font-bold mb-3 flex items-center gap-2">
            <PixelIcon name="brain" size={24} decorative />
            數字規律
          </h4>
          <div className="space-y-3">
            {numericalPatterns.map((pattern, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-pip-boy-green/20 rounded-full flex items-center justify-center">
                    <span className="text-pip-boy-green font-bold text-sm">{pattern.number}</span>
                  </div>
                  <div>
                    <span className="text-pip-boy-green font-bold capitalize">
                      {pattern.pattern.replace('_', ' ')} Pattern
                    </span>
                    <p className="text-pip-boy-green/70 text-xs">
                      {pattern.significance}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pattern.cards.map((cardName, idx) => (
                    <span
                      key={idx}
                      className={cn(
                        "px-2 py-1 rounded text-xs",
                        cardName === card.name
                          ? "bg-pip-boy-green text-wasteland-dark"
                          : "bg-pip-boy-green/20 text-pip-boy-green"
                      )}
                    >
                      {cardName}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {elementalAssociations.length === 0 && numericalPatterns.length === 0 && (
        <div className="text-center py-8 text-pip-boy-green/60">
          <PixelIcon name="brain" size={48} className="mx-auto mb-4 opacity-50" decorative />
          <p className="text-sm">暫無發現的規律模式</p>
        </div>
      )}
    </div>
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* Section Tabs */}
      <div className="flex bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg p-1">
        {[
          { id: 'synergies', label: '協同效應', iconName: 'share' as IconName },
          { id: 'connections', label: '卡片連結', iconName: 'users' as IconName },
          { id: 'patterns', label: '規律模式', iconName: 'brain' as IconName }
        ].map((section) => {
          const isActive = activeSection === section.id
          return (
            <motion.button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded text-sm transition-all duration-200",
                isActive
                  ? "bg-pip-boy-green text-wasteland-dark shadow-lg"
                  : "text-pip-boy-green/70 hover:text-pip-boy-green hover:bg-pip-boy-green/10"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <PixelIcon name={section.iconName} size={16} decorative />
              <span>{section.label}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeSection === 'synergies' && renderSynergies()}
          {activeSection === 'connections' && renderConnections()}
          {activeSection === 'patterns' && renderPatterns()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default CardRelationships