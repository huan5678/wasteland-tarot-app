/**
 * Study Mode Component
 * Interactive flashcard and quiz system for learning tarot card meanings
 */

'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { DetailedTarotCard } from './CardDetailModal'
import { PixelIcon } from '@/components/ui/icons'
import type { IconName } from '@/types/icons'

export interface StudyQuestion {
  id: string
  type: 'meaning' | 'keywords' | 'suit' | 'element' | 'character_voice'
  question: string
  correctAnswer: string
  options?: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  explanation?: string
}

export interface StudySession {
  cards: DetailedTarotCard[]
  questions: StudyQuestion[]
  currentQuestionIndex: number
  score: number
  timeSpent: number
  mode: 'flashcard' | 'quiz' | 'challenge'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface StudyModeProps {
  card: DetailedTarotCard
  relatedCards?: DetailedTarotCard[]
  onComplete?: (results: StudyResults) => void
  onClose?: () => void
  mode?: 'single' | 'multiple'
  className?: string
}

export interface StudyResults {
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  accuracy: number
  cardsMastered: string[]
  weakAreas: string[]
  suggestions: string[]
}

// Generate study questions for a card
function generateQuestions(card: DetailedTarotCard): StudyQuestion[] {
  const questions: StudyQuestion[] = []

  // Meaning questions
  if (card.upright_meaning) {
    questions.push({
      id: `${card.id}-meaning-upright`,
      type: 'meaning',
      question: `What is the upright meaning of ${card.name}?`,
      correctAnswer: card.upright_meaning,
      difficulty: 'easy',
      explanation: `The upright meaning represents the positive or balanced energy of the card.`
    })
  }

  if (card.reversed_meaning) {
    questions.push({
      id: `${card.id}-meaning-reversed`,
      type: 'meaning',
      question: `What is the reversed meaning of ${card.name}?`,
      correctAnswer: card.reversed_meaning,
      difficulty: 'medium',
      explanation: `The reversed meaning often represents blocked, inverted, or shadow aspects of the card's energy.`
    })
  }

  // Keywords questions
  if (card.keywords && card.keywords.length > 0) {
    const randomKeywords = card.keywords.slice(0, 3)
    const wrongKeywords = ['confusion', 'delay', 'illusion', 'deception', 'fear', 'anxiety']
    const options = [...randomKeywords, ...wrongKeywords.slice(0, 2)].sort(() => Math.random() - 0.5)

    questions.push({
      id: `${card.id}-keywords`,
      type: 'keywords',
      question: `Which keywords are associated with ${card.name}?`,
      correctAnswer: randomKeywords.join(', '),
      options,
      difficulty: 'medium',
      explanation: `These keywords capture the core essence and themes of ${card.name}.`
    })
  }

  // Suit questions
  if (card.suit) {
    const allSuits = ['MAJOR_ARCANA', 'NUKA_COLA_BOTTLES', 'COMBAT_WEAPONS', 'BOTTLE_CAPS', 'RADIATION_RODS']
    const wrongSuits = allSuits.filter(suit => suit !== card.suit).slice(0, 3)
    const options = [card.suit, ...wrongSuits].sort(() => Math.random() - 0.5)

    questions.push({
      id: `${card.id}-suit`,
      type: 'suit',
      question: `What suit does ${card.name} belong to?`,
      correctAnswer: card.suit,
      options,
      difficulty: 'easy',
      explanation: `Each suit represents different aspects of life and energy in the wasteland tarot.`
    })
  }

  // Element questions
  if (card.element) {
    const allElements = ['Fire', 'Water', 'Air', 'Earth', 'Radiation']
    const wrongElements = allElements.filter(element => element !== card.element).slice(0, 3)
    const options = [card.element, ...wrongElements].sort(() => Math.random() - 0.5)

    questions.push({
      id: `${card.id}-element`,
      type: 'element',
      question: `What element is ${card.name} associated with?`,
      correctAnswer: card.element,
      options,
      difficulty: 'medium',
      explanation: `Elements provide additional layers of meaning and energy to card interpretations.`
    })
  }

  // Character voice questions
  if (card.character_voices) {
    const voices = Object.keys(card.character_voices)
    if (voices.length > 0) {
      const randomVoice = voices[Math.floor(Math.random() * voices.length)]
      const interpretation = card.character_voices[randomVoice]
      
      questions.push({
        id: `${card.id}-voice-${randomVoice}`,
        type: 'character_voice',
        question: `According to ${randomVoice.replace('_', ' ').toLowerCase()}, what does ${card.name} represent?`,
        correctAnswer: interpretation,
        difficulty: 'hard',
        explanation: `Different characters provide unique perspectives on the same card's meaning.`
      })
    }
  }

  return questions.slice(0, 5) // Limit to 5 questions per card
}

export function StudyMode({
  card,
  relatedCards = [],
  onComplete,
  onClose,
  mode = 'single',
  className
}: StudyModeProps) {
  const [studyMode, setStudyMode] = useState<'flashcard' | 'quiz'>('flashcard')
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [userAnswer, setUserAnswer] = useState('')
  const [score, setScore] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [answerFeedback, setAnswerFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null)

  // Get all cards for study (main card + related cards)
  const studyCards = useMemo(() => {
    return mode === 'multiple' ? [card, ...relatedCards] : [card]
  }, [card, relatedCards, mode])

  // Generate all questions
  const allQuestions = useMemo(() => {
    return studyCards.flatMap(studyCard => generateQuestions(studyCard))
  }, [studyCards])

  // Current card and question
  const currentCard = studyCards[currentCardIndex] || card
  const currentQuestion = allQuestions[currentQuestionIndex]

  // Timer effect
  useEffect(() => {
    if (isSessionActive && sessionStartTime) {
      const interval = setInterval(() => {
        const now = new Date()
        setTimeSpent(Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000))
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isSessionActive, sessionStartTime])

  // Start study session
  const startSession = useCallback((mode: 'flashcard' | 'quiz') => {
    setStudyMode(mode)
    setIsSessionActive(true)
    setSessionStartTime(new Date())
    setCurrentCardIndex(0)
    setCurrentQuestionIndex(0)
    setScore(0)
    setCorrectAnswers(0)
    setShowAnswer(false)
    setUserAnswer('')
    setSessionComplete(false)
    setSelectedOption(null)
    setAnswerFeedback(null)
  }, [])

  // Handle answer submission
  const handleAnswerSubmit = useCallback(() => {
    if (!currentQuestion) return

    let isCorrect = false
    let feedback = ''

    if (currentQuestion.options) {
      // Multiple choice question
      isCorrect = selectedOption === currentQuestion.correctAnswer
      feedback = isCorrect 
        ? 'Correct! Well done!' 
        : `Incorrect. The correct answer is: ${currentQuestion.correctAnswer}`
    } else {
      // Open-ended question
      const userAnswerLower = userAnswer.toLowerCase().trim()
      const correctAnswerLower = currentQuestion.correctAnswer.toLowerCase()
      isCorrect = userAnswerLower.includes(correctAnswerLower) || 
                  correctAnswerLower.includes(userAnswerLower)
      feedback = isCorrect 
        ? 'Great! Your answer captures the essence of the card.' 
        : `Consider this: ${currentQuestion.correctAnswer}`
    }

    setAnswerFeedback({ isCorrect, message: feedback })
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1)
      setScore(prev => prev + (currentQuestion.difficulty === 'hard' ? 3 : currentQuestion.difficulty === 'medium' ? 2 : 1))
    }

    setShowAnswer(true)
  }, [currentQuestion, selectedOption, userAnswer])

  // Move to next question
  const nextQuestion = useCallback(() => {
    setShowAnswer(false)
    setUserAnswer('')
    setSelectedOption(null)
    setAnswerFeedback(null)

    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Session complete
      setSessionComplete(true)
      setIsSessionActive(false)
      
      const results: StudyResults = {
        totalQuestions: allQuestions.length,
        correctAnswers,
        timeSpent,
        accuracy: (correctAnswers / allQuestions.length) * 100,
        cardsMastered: studyCards
          .filter(card => {
            const cardQuestions = allQuestions.filter(q => q.id.startsWith(card.id.toString()))
            const cardCorrectAnswers = cardQuestions.filter(q => 
              answerFeedback?.isCorrect // This is a simplified check
            ).length
            return (cardCorrectAnswers / cardQuestions.length) >= 0.8
          })
          .map(card => card.name),
        weakAreas: allQuestions
          .filter(q => !answerFeedback?.isCorrect) // Simplified check
          .map(q => q.type),
        suggestions: [
          correctAnswers / allQuestions.length >= 0.8 
            ? 'Excellent work! You have a strong understanding of these cards.' 
            : 'Consider reviewing the card meanings and practicing more.',
          timeSpent < 60 
            ? 'Try taking more time to really absorb the card meanings.' 
            : 'Good pacing through the study session.'
        ]
      }

      onComplete?.(results)
    }
  }, [currentQuestionIndex, allQuestions, correctAnswers, timeSpent, studyCards, answerFeedback, onComplete])

  // Flashcard mode functions
  const flipCard = useCallback(() => {
    setShowAnswer(!showAnswer)
  }, [showAnswer])

  const nextCard = useCallback(() => {
    setShowAnswer(false)
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
    } else {
      setCurrentCardIndex(0) // Loop back to first card
    }
  }, [currentCardIndex, studyCards.length])

  const previousCard = useCallback(() => {
    setShowAnswer(false)
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1)
    } else {
      setCurrentCardIndex(studyCards.length - 1) // Loop to last card
    }
  }, [currentCardIndex, studyCards.length])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get suit icon
  const getSuitIcon = (suit: string): IconName => {
    switch (suit) {
      case 'RADIATION_RODS': return 'zap'
      case 'NUKA_COLA_BOTTLES': return 'heart'
      case 'COMBAT_WEAPONS': return 'sword'
      case 'BOTTLE_CAPS': return 'coin'
      default: return 'star'
    }
  }

  if (sessionComplete) {
    const accuracy = (correctAnswers / allQuestions.length) * 100
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg p-6", className)}
      >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto w-20 h-20 bg-pip-boy-green/20 rounded-full flex items-center justify-center"
          >
            <PixelIcon name="trophy" size={40} className="text-pip-boy-green" decorative />
          </motion.div>

          <div>
            <h3 className="text-2xl font-bold text-pip-boy-green mb-2">Study Session Complete!</h3>
            <p className="text-pip-boy-green/70">Great work on your tarot studies!</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-pip-boy-green">{correctAnswers}</div>
              <div className="text-xs text-pip-boy-green/70">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pip-boy-green numeric tabular-nums">{allQuestions.length}</div>
              <div className="text-xs text-pip-boy-green/70">Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{accuracy.toFixed(0)}%</div>
              <div className="text-xs text-pip-boy-green/70">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">{formatTime(timeSpent)}</div>
              <div className="text-xs text-pip-boy-green/70">Time</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              onClick={() => startSession(studyMode)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-pip-boy-green/20 border border-pip-boy-green text-pip-boy-green rounded hover:bg-pip-boy-green/30 transition-colors flex items-center gap-2"
            >
              <PixelIcon iconName="reload" size={16} decorative />
              Study Again
            </motion.button>
            
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 border border-pip-boy-green/40 text-pip-boy-green/70 rounded hover:bg-pip-boy-green/10 transition-colors"
            >
              Close
            </motion.button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (!isSessionActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg p-6", className)}
      >
        <div className="text-center space-y-6">
          <div>
            <h3 className="text-xl font-bold text-pip-boy-green mb-2 flex items-center justify-center gap-2">
              <PixelIcon iconName="flask" size={24} decorative />
              Card Study Mode
            </h3>
            <p className="text-pip-boy-green/70 text-sm">
              Choose your study method to deepen your understanding of the cards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.button
              onClick={() => startSession('flashcard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-6 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded-lg hover:bg-pip-boy-green/20 transition-colors group"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-pip-boy-green/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PixelIcon iconName="eye" size={24} className="text-pip-boy-green" decorative />
                </div>
                <div>
                  <h4 className="font-bold text-pip-boy-green">Flashcard Mode</h4>
                  <p className="text-xs text-pip-boy-green/70 mt-1">Review cards at your own pace</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              onClick={() => startSession('quiz')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-6 bg-blue-500/10 border border-blue-400/30 rounded-lg hover:bg-blue-500/20 transition-colors group"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <PixelIcon iconName="brain" size={24} className="text-blue-400" decorative />
                </div>
                <div>
                  <h4 className="font-bold text-blue-400">Quiz Mode</h4>
                  <p className="text-xs text-pip-boy-green/70 mt-1">Test your knowledge with questions</p>
                </div>
              </div>
            </motion.button>
          </div>

          <div className="text-xs text-pip-boy-green/60">
            {studyCards.length} card{studyCards.length !== 1 ? 's' : ''} • {allQuestions.length} question{allQuestions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </motion.div>
    )
  }

  // Flashcard Mode Render
  if (studyMode === 'flashcard') {
    const suitIconName = getSuitIcon(currentCard.suit)

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg p-6", className)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <PixelIcon iconName={suitIconName} size={20} className="text-pip-boy-green" decorative />
            <span className="font-bold text-pip-boy-green">Flashcard Mode</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-pip-boy-green/70">
            <div className="flex items-center gap-1">
              <PixelIcon name="clock" size={16} decorative />
              {formatTime(timeSpent)}
            </div>
            <div><span className="numeric tabular-nums">{currentCardIndex + 1}</span> / <span className="numeric tabular-nums">{studyCards.length}</span></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="relative">
          <motion.div
            key={currentCard.id}
            initial={{ rotateY: 180, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-wasteland-dark border-2 border-pip-boy-green/60 rounded-lg aspect-[3/2] flex flex-col justify-center items-center p-8 cursor-pointer"
            onClick={flipCard}
          >
            <AnimatePresence mode="wait">
              {!showAnswer ? (
                <motion.div
                  key="question"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4"
                >
                  <h3 className="text-2xl font-bold text-pip-boy-green">{currentCard.name}</h3>
                  <p className="text-pip-boy-green/70">Click to reveal meaning</p>
                  <PixelIcon iconName="eye-closed" size={48} className="text-pip-boy-green/40 mx-auto" decorative />
                </motion.div>
              ) : (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4"
                >
                  <h3 className="text-xl font-bold text-pip-boy-green">{currentCard.name}</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-pip-boy-green/80 text-sm mb-1">Upright Meaning</h4>
                      <p className="text-pip-boy-green text-sm">
                        {currentCard.upright_meaning || currentCard.meaning_upright || 'No meaning available'}
                      </p>
                    </div>
                    {currentCard.keywords && currentCard.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {currentCard.keywords.slice(0, 4).map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-pip-boy-green/20 text-pip-boy-green text-xs rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-6">
          <motion.button
            onClick={previousCard}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded text-pip-boy-green hover:bg-pip-boy-green/20 transition-colors"
            aria-label="Previous card"
          >
            <PixelIcon iconName="arrow-left" size={20} />
          </motion.button>

          <div className="flex gap-3">
            <motion.button
              onClick={flipCard}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-pip-boy-green/20 border border-pip-boy-green text-pip-boy-green rounded hover:bg-pip-boy-green/30 transition-colors flex items-center gap-2"
            >
              <PixelIcon iconName="reload" size={16} decorative />
              {showAnswer ? 'Hide' : 'Reveal'}
            </motion.button>

            <motion.button
              onClick={() => startSession('quiz')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 border border-blue-400/40 text-blue-400 rounded hover:bg-blue-500/10 transition-colors flex items-center gap-2"
            >
              <PixelIcon iconName="brain" size={16} decorative />
              Quiz Mode
            </motion.button>
          </div>

          <motion.button
            onClick={nextCard}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-pip-boy-green/10 border border-pip-boy-green/30 rounded text-pip-boy-green hover:bg-pip-boy-green/20 transition-colors"
            aria-label="Next card"
          >
            <PixelIcon iconName="arrow-right" size={20} />
          </motion.button>
        </div>
      </motion.div>
    )
  }

  // Quiz Mode Render
  if (studyMode === 'quiz' && currentQuestion) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("bg-pip-boy-green/5 border border-pip-boy-green/20 rounded-lg p-6", className)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <PixelIcon name="brain" size={24} className="text-blue-400" decorative />
            <span className="font-bold text-blue-400">Quiz Mode</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-pip-boy-green/70">
            <div className="flex items-center gap-1">
              <PixelIcon name="clock" size={16} decorative />
              {formatTime(timeSpent)}
            </div>
            <div><span className="numeric tabular-nums">{currentQuestionIndex + 1}</span> / <span className="numeric tabular-nums">{allQuestions.length}</span></div>
            <div className="flex items-center gap-1">
              <PixelIcon name="trophy" size={16} className="text-yellow-400" decorative />
              {score}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-pip-boy-green/20 rounded-full h-2 mb-6">
          <motion.div
            className="bg-pip-boy-green h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div>
            <div className={cn(
              "inline-flex px-2 py-1 rounded text-xs mb-3",
              currentQuestion.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            )}>
              {currentQuestion.difficulty.toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-pip-boy-green mb-4">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Answer Input */}
          {currentQuestion.options ? (
            // Multiple choice
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedOption(option)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full p-4 border rounded-lg text-left text-sm transition-all duration-200",
                    selectedOption === option
                      ? "bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green"
                      : "border-pip-boy-green/30 text-pip-boy-green/70 hover:bg-pip-boy-green/10"
                  )}
                  disabled={showAnswer}
                >
                  <span className="font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </motion.button>
              ))}
            </div>
          ) : (
            // Open-ended question
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-32 bg-wasteland-dark border border-pip-boy-green/30 text-pip-boy-green text-sm p-4 rounded resize-none focus:outline-none focus:border-pip-boy-green/60"
              disabled={showAnswer}
            />
          )}

          {/* Answer Feedback */}
          <AnimatePresence>
            {answerFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "p-4 rounded-lg border flex items-start gap-3",
                  answerFeedback.isCorrect
                    ? "bg-green-500/10 border-green-400/30"
                    : "bg-red-500/10 border-red-400/30"
                )}
              >
                {answerFeedback.isCorrect ? (
                  <PixelIcon iconName="check-circle" size={20} className="text-green-400 flex-shrink-0 mt-0.5" decorative />
                ) : (
                  <PixelIcon iconName="close-circle" size={20} className="text-red-400 flex-shrink-0 mt-0.5" decorative />
                )}
                <div>
                  <p className={cn(
                    "text-sm",
                    answerFeedback.isCorrect ? "text-green-300" : "text-red-300"
                  )}>
                    {answerFeedback.message}
                  </p>
                  {currentQuestion.explanation && (
                    <p className="text-pip-boy-green/70 text-xs mt-2">
                      {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <motion.button
              onClick={() => startSession('flashcard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 border border-pip-boy-green/40 text-pip-boy-green/70 rounded hover:bg-pip-boy-green/10 transition-colors flex items-center gap-2"
            >
              <PixelIcon iconName="eye" size={16} decorative />
              Flashcards
            </motion.button>

            {!showAnswer ? (
              <motion.button
                onClick={handleAnswerSubmit}
                disabled={currentQuestion.options ? !selectedOption : !userAnswer.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-blue-500/20 border border-blue-400 text-blue-400 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <PixelIcon iconName="target" size={16} decorative />
                Submit Answer
              </motion.button>
            ) : (
              <motion.button
                onClick={nextQuestion}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2 bg-pip-boy-green/20 border border-pip-boy-green text-pip-boy-green rounded hover:bg-pip-boy-green/30 transition-colors flex items-center gap-2"
              >
                {currentQuestionIndex < allQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                <PixelIcon iconName="arrow-right" size={16} decorative />
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return null
}

export default StudyMode