'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { animated, useSpring, useTransition } from '@react-spring/web';
import { MobileTarotCard } from './MobileTarotCard';
import { useAdvancedDeviceCapabilities } from '@/hooks/useAdvancedGestures';
import { PixelIcon } from '@/components/ui/icons';import { Button } from "@/components/ui/button";

interface TarotCard {
  id: number;
  name: string;
  suit: string;
  number?: number;
  meaning_upright: string;
  meaning_reversed: string;
  image_url: string;
  keywords: string[];
  position: 'upright' | 'reversed';
}

interface Reading {
  id: string;
  title: string;
  spreadType: string;
  cards: TarotCard[];
  interpretation: string;
  timestamp: Date;
  notes?: string;
}

interface MobileReadingInterfaceProps {
  reading: Reading;
  onClose: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  enableVoice?: boolean;
  className?: string;
}

export function MobileReadingInterface({
  reading,
  onClose,
  onShare,
  onSave,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  enableVoice = true,
  className = ''
}: MobileReadingInterfaceProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'single' | 'interpretation'>('overview');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [notes, setNotes] = useState(reading.notes || '');
  const [showNotes, setShowNotes] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const { isTouchDevice, screenSize, isIOS } = useAdvancedDeviceCapabilities();

  // Animation springs
  const [controlsSpring, controlsApi] = useSpring(() => ({
    opacity: showControls ? 1 : 0,
    transform: showControls ? 'translateY(0px)' : 'translateY(20px)',
    config: { tension: 300, friction: 30 }
  }));

  const [menuSpring, menuApi] = useSpring(() => ({
    transform: showMenu ? 'translateX(0%)' : 'translateX(100%)',
    config: { tension: 300, friction: 30 }
  }));

  const cardTransitions = useTransition(currentCardIndex, {
    from: { opacity: 0, transform: 'scale(0.8) translateX(50px)' },
    enter: { opacity: 1, transform: 'scale(1) translateX(0px)' },
    leave: { opacity: 0, transform: 'scale(0.8) translateX(-50px)' },
    config: { tension: 300, friction: 25 }
  });

  // Auto-hide controls
  useEffect(() => {
    controlsApi.start({
      opacity: showControls ? 1 : 0,
      transform: showControls ? 'translateY(0px)' : 'translateY(20px)'
    });
  }, [showControls, controlsApi]);

  useEffect(() => {
    menuApi.start({
      transform: showMenu ? 'translateX(0%)' : 'translateX(100%)'
    });
  }, [showMenu, menuApi]);

  // Reset controls timeout when user interacts
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isFullscreen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isFullscreen]);

  // Handle card navigation
  const navigateCard = useCallback((direction: 'next' | 'prev') => {
    const newIndex = direction === 'next' ?
    Math.min(currentCardIndex + 1, reading.cards.length - 1) :
    Math.max(currentCardIndex - 1, 0);
    setCurrentCardIndex(newIndex);
    resetControlsTimeout();
  }, [currentCardIndex, reading.cards.length, resetControlsTimeout]);

  // Voice synthesis functions
  const speakText = useCallback((text: string) => {
    if (!enableVoice || !speechSynthesis) return;

    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  }, [enableVoice, speechSynthesis]);

  const stopSpeaking = useCallback(() => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [speechSynthesis]);

  // P3.5: Voice Recording Implementation
  const startRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Start recording
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize MediaRecorder for audio recording
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Create audio blob from recorded chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Optional: Save audio blob for future processing
        // You could upload to server or save locally
        console.log('Audio recorded:', audioBlob.size, 'bytes');

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());

        // Clear refs
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);

      // Initialize Web Speech API for speech-to-text (if available)
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = 'zh-TW';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update notes with recognized text
          if (finalTranscript) {
            setNotes((prev) => prev + finalTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          // Continue with audio recording even if speech-to-text fails
        };

        recognition.onend = () => {
          recognitionRef.current = null;
        };

        try {
          recognition.start();
        } catch (error) {
          console.warn('Speech recognition not available:', error);
          // Continue with audio recording only
        }
      }

    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);

      // Show user-friendly error message
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        alert('無法存取麥克風。請允許麥克風權限以使用語音筆記功能。');
      } else {
        alert('無法啟動錄音功能。請確認您的裝置支援麥克風錄音。');
      }
    }
  }, [isRecording]);

  // Gesture handlers
  const handleCardSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down', card: TarotCard) => {
    switch (direction) {
      case 'left':
        if (currentCardIndex < reading.cards.length - 1) {
          navigateCard('next');
        }
        break;
      case 'right':
        if (currentCardIndex > 0) {
          navigateCard('prev');
        }
        break;
      case 'up':
        setViewMode('interpretation');
        break;
      case 'down':
        if (viewMode === 'interpretation') {
          setViewMode('single');
        } else if (viewMode === 'single') {
          setViewMode('overview');
        }
        break;
    }
  }, [currentCardIndex, reading.cards.length, navigateCard, viewMode]);

  const handleCardDoubleTap = useCallback(() => {
    setIsFullscreen((prev) => !prev);
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const handleCardLongPress = useCallback((card: TarotCard) => {
    const text = `${card.name}：${card.position === 'upright' ? card.meaning_upright : card.meaning_reversed}`;
    speakText(text);
  }, [speakText]);

  // Screen tap handler for showing/hiding controls
  const handleScreenTap = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      stopSpeaking();

      // P3.5: Cleanup voice recording resources
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [stopSpeaking]);

  const currentCard = reading.cards[currentCardIndex];

  return (
    <div
      className={`
        fixed inset-0 bg-black z-50 overflow-hidden
        ${className}
      `}
      onClick={handleScreenTap}>

      {/* Background with dynamic gradient based on card suit */}
      <div className="absolute inset-0 bg-gradient-to-br from-wasteland-darker via-wasteland-dark to-black" />

      {/* Top Controls Bar */}
      <animated.div
        style={controlsSpring}
        className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent p-4">

        <div className="flex items-center justify-between">
          <Button size="icon" variant="link"
          onClick={onClose}
          className="p-2 transition-colors"
          aria-label="關閉閱讀">

            <PixelIcon iconName="close" size={24} />
          </Button>

          <div className="flex items-center gap-2">
            <h2 className="text-pip-boy-green text-lg font-bold truncate max-w-40">
              {reading.title}
            </h2>
            <div className="text-pip-boy-green/60 text-sm">
              {currentCardIndex + 1}/{reading.cards.length}
            </div>
          </div>

          <Button size="icon" variant="link"
          onClick={() => setShowMenu(true)}
          className="p-2 transition-colors"
          aria-label="選單">

            <PixelIcon iconName="menu" size={24} />
          </Button>
        </div>

        {/* View mode selector */}
        <div className="flex justify-center mt-4">
          <div className="flex bg-black/60 rounded-full p-1">
            {['overview', 'single', 'interpretation'].map((mode) =>
            <Button size="icon" variant="default"
            key={mode}
            onClick={() => setViewMode(mode as any)}
            className="{expression}">







                {mode === 'overview' && '總覽'}
                {mode === 'single' && '單卡'}
                {mode === 'interpretation' && '解讀'}
              </Button>
            )}
          </div>
        </div>
      </animated.div>

      {/* Main Content Area */}
      <div className="pt-32 pb-24 px-4 h-full overflow-hidden">
        {viewMode === 'overview' &&
        <div className="h-full overflow-y-auto">
            <div className="grid gap-4 justify-items-center">
              {reading.cards.map((card, index) =>
            <div
              key={card.id}
              onClick={() => {
                setCurrentCardIndex(index);
                setViewMode('single');
              }}
              className="transform transition-all duration-200 hover:scale-105">

                  <MobileTarotCard
                card={card}
                isRevealed={true}
                position={card.position}
                size="medium"
                showKeywords={true}
                onClick={() => {
                  setCurrentCardIndex(index);
                  setViewMode('single');
                }}
                onLongPress={handleCardLongPress}
                enableHaptic={true} />

                  <div className="text-center mt-2 text-pip-boy-green/70 text-sm">
                    位置 {index + 1}
                  </div>
                </div>
            )}
            </div>
          </div>
        }

        {viewMode === 'single' && currentCard &&
        <div className="h-full flex items-center justify-center">
            {cardTransitions((style, cardIndex) =>
          cardIndex === currentCardIndex ?
          <animated.div style={style} className="flex justify-center">
                  <MobileTarotCard
              card={currentCard}
              isRevealed={true}
              position={currentCard.position}
              size={isFullscreen ? 'fullscreen' : 'large'}
              showKeywords={true}
              onSwipe={handleCardSwipe}
              onDoubleTap={handleCardDoubleTap}
              onLongPress={handleCardLongPress}
              enableZoom={isFullscreen}
              enableRotation={isFullscreen}
              enableHaptic={true} />

                </animated.div> :
          null
          )}
          </div>
        }

        {viewMode === 'interpretation' &&
        <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto prose prose-invert prose-green">
              <div className="bg-black/60 rounded-lg p-6 border border-pip-boy-green/30">
                <h3 className="text-pip-boy-green text-xl mb-4">整體解讀</h3>
                <p className="text-pip-boy-green/90 leading-relaxed">
                  {reading.interpretation}
                </p>

                {/* Individual card interpretations */}
                <div className="mt-8 space-y-6">
                  {reading.cards.map((card, index) =>
                <div key={card.id} className="border-t border-pip-boy-green/20 pt-4">
                      <h4 className="text-pip-boy-green text-lg mb-2">
                        {card.name} - 位置 {index + 1}
                      </h4>
                      <p className="text-pip-boy-green/80 text-sm">
                        {card.position === 'upright' ? card.meaning_upright : card.meaning_reversed}
                      </p>
                    </div>
                )}
                </div>

                {/* Voice controls */}
                {enableVoice &&
              <div className="mt-8 flex justify-center gap-4">
                    {!isSpeaking ?
                <Button size="default" variant="link"
                onClick={() => speakText(reading.interpretation)}
                className="flex items-center gap-2 px-4 py-2">

                        <PixelIcon iconName="volume" size={16} decorative />
                        朗讀解讀
                      </Button> :

                <Button size="default" variant="link"
                onClick={stopSpeaking}
                className="flex items-center gap-2 px-4 py-2">

                        <PixelIcon iconName="volume-x" size={16} decorative />
                        停止朗讀
                      </Button>
                }
                  </div>
              }
              </div>
            </div>
          </div>
        }
      </div>

      {/* Bottom Navigation Bar */}
      <animated.div
        style={controlsSpring}
        className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/80 to-transparent p-4">

        <div className="flex justify-between items-center">
          {/* Previous Card */}
          <Button size="icon" variant="default"
          onClick={() => navigateCard('prev')}
          disabled={currentCardIndex === 0}
          className="{expression}"






          aria-label="上一張">

            <PixelIcon iconName="arrow-left" size={24} />
          </Button>

          {/* Card indicator dots */}
          <div className="flex gap-2">
            {reading.cards.map((_, index) =>
            <Button size="icon" variant="default"
            key={index}
            onClick={() => setCurrentCardIndex(index)}
            className="{expression}"






            aria-label={`跳到第 ${index + 1} 張`} />

            )}
          </div>

          {/* Next Card */}
          <Button size="icon" variant="default"
          onClick={() => navigateCard('next')}
          disabled={currentCardIndex === reading.cards.length - 1}
          className="{expression}"






          aria-label="下一張">

            <PixelIcon iconName="arrow-right" size={24} />
          </Button>
        </div>

        {/* Swipe hint for mobile */}
        {isTouchDevice && viewMode === 'single' &&
        <div className="text-center text-pip-boy-green/50 text-xs mt-2">
            滑動切換卡牌 • 雙擊進入全螢幕 • 長按語音朗讀
          </div>
        }
      </animated.div>

      {/* Side Menu */}
      <animated.div
        style={menuSpring}
        className="absolute top-0 right-0 bottom-0 w-80 bg-black/95 backdrop-blur-sm border-l border-pip-boy-green/30 z-50">

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-pip-boy-green text-lg">選項</h3>
            <Button size="icon" variant="link"
            onClick={() => setShowMenu(false)}
            className="p-2"
            aria-label="關閉選單">

              <PixelIcon iconName="close" size={20} />
            </Button>
          </div>

          <div className="space-y-4">
            {onShare &&
            <Button size="default" variant="link"
            onClick={() => {
              onShare();
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-3 p-3 transition-colors">

                <PixelIcon iconName="share" size={20} decorative />
                分享閱讀
              </Button>
            }

            {onSave &&
            <Button size="default" variant="link"
            onClick={() => {
              onSave();
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-3 p-3 transition-colors">

                <PixelIcon iconName="bookmark" size={20} decorative />
                儲存閱讀
              </Button>
            }

            <Button size="icon" variant="link"
            onClick={() => setShowNotes(!showNotes)}
            className="w-full flex items-center gap-3 p-3 transition-colors">

              {isRecording ? <PixelIcon iconName="microphone-off" size={20} decorative /> : <PixelIcon iconName="microphone" size={20} decorative />}
              {showNotes ? '隱藏筆記' : '顯示筆記'}
            </Button>

            {/* Notes section */}
            {showNotes &&
            <div className="bg-wasteland-dark/60 rounded-lg p-4 border border-pip-boy-green/20">
                <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="在此添加您的筆記..."
                className="w-full h-32 bg-transparent text-pip-boy-green placeholder-pip-boy-green/50
                           border border-pip-boy-green/30 rounded-lg p-3 resize-none text-sm
                           focus:outline-none focus:ring-2 focus:ring-pip-boy-green/50" />



                {enableVoice &&
              <div className="flex gap-2 mt-3">
                    <Button size="icon" variant="default"
                onClick={startRecording}
                disabled={isRecording}
                className="{expression}">







                      {isRecording ? <PixelIcon iconName="microphone-off" size={16} decorative /> : <PixelIcon iconName="microphone" size={16} decorative />}
                      {isRecording ? '錄音中...' : '語音筆記'}
                    </Button>
                  </div>
              }
              </div>
            }
          </div>
        </div>
      </animated.div>

      {/* Menu overlay */}
      {showMenu &&
      <div
        className="absolute inset-0 bg-black/50 z-40"
        onClick={() => setShowMenu(false)} />

      }
    </div>);

}