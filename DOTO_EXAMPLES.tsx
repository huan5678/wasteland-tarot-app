/**
 * Doto Font 實際應用範例
 *
 * 這個檔案包含多個實用的 Doto 字體使用範例
 * 可以直接複製到專案中使用
 */

import { doto } from '@/lib/fonts';
import { useState } from 'react';

// ============================================
// 範例 1：基本數字顯示
// ============================================
export function BasicNumericDisplay({ value }: { value: number }) {
  return (
    <div className={doto.className} style={{ fontSize: '2rem' }}>
      {value.toLocaleString()}
    </div>
  );
}

// ============================================
// 範例 2：互動式圓角度調整器
// ============================================
export function RoundnessAdjuster() {
  const [roundness, setRoundness] = useState(0);
  const [weight, setWeight] = useState(400);

  return (
    <div className="space-y-6 p-8 bg-gray-900 rounded-lg">
      {/* 數字顯示 */}
      <div
        className={doto.className}
        style={{
          fontVariationSettings: `"ROND" ${roundness}, "wght" ${weight}`,
          fontSize: '6rem',
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        12345
      </div>

      {/* 圓角度控制 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Roundness (ROND): {roundness}
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={roundness}
          onChange={(e) => setRoundness(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* 字重控制 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Weight (wght): {weight}
        </label>
        <input
          type="range"
          min="100"
          max="900"
          step="100"
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* CSS 程式碼顯示 */}
      <pre className="bg-black p-4 rounded text-xs overflow-x-auto">
        {`font-variation-settings: "ROND" ${roundness}, "wght" ${weight};`}
      </pre>
    </div>
  );
}

// ============================================
// 範例 3：計時器/碼表
// ============================================
export function StopwatchDisplay() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  React.useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 p-8 bg-gray-900 rounded-lg">
      {/* 碼表顯示 */}
      <div
        className={doto.className}
        style={{
          fontSize: '4rem',
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'center',
          letterSpacing: '0.1em',
        }}
      >
        {formatTime(seconds)}
      </div>

      {/* 控制按鈕 */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => setSeconds(0)}
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ============================================
// 範例 4：分數/統計數據卡片
// ============================================
interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  roundness?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({
  label,
  value,
  suffix = '',
  roundness = 0,
  trend = 'neutral',
}: StatCardProps) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-400',
  };

  const trendIcons = {
    up: '▲',
    down: '▼',
    neutral: '●',
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div
        className={`${doto.className} text-4xl font-bold`}
        style={{
          fontVariationSettings: `"ROND" ${roundness}`,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value.toLocaleString()}
        {suffix && <span className="text-2xl ml-1">{suffix}</span>}
      </div>
      <div className={`text-sm mt-2 ${trendColors[trend]}`}>
        {trendIcons[trend]} Trend
      </div>
    </div>
  );
}

// 使用範例
export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Total Users" value={12345} roundness={30} trend="up" />
      <StatCard label="Revenue" value={98765} suffix="$" roundness={50} trend="up" />
      <StatCard label="Active Sessions" value={432} roundness={75} trend="neutral" />
    </div>
  );
}

// ============================================
// 範例 5：動態變化的數字（動畫效果）
// ============================================
export function AnimatedNumber({
  value,
  duration = 1000,
}: {
  value: number;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  React.useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const delta = value - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(startValue + delta * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span
      className={doto.className}
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontSize: '3rem',
      }}
    >
      {displayValue.toLocaleString()}
    </span>
  );
}

// ============================================
// 範例 6：倒數計時器
// ============================================
export function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex gap-4 justify-center">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div
            className={doto.className}
            style={{
              fontSize: '3rem',
              fontVariantNumeric: 'tabular-nums',
              fontVariationSettings: '"ROND" 40',
            }}
          >
            {value.toString().padStart(2, '0')}
          </div>
          <div className="text-sm text-gray-400 uppercase">{unit}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// 範例 7：分數顯示（適用於遊戲）
// ============================================
export function GameScore({
  score,
  highScore,
  lives,
}: {
  score: number;
  highScore: number;
  lives: number;
}) {
  return (
    <div className="bg-black p-6 rounded-lg border-4 border-green-500">
      {/* 分數 */}
      <div className="mb-4">
        <div className="text-green-500 text-sm mb-1">SCORE</div>
        <div
          className={`${doto.className} text-green-500`}
          style={{
            fontSize: '3rem',
            fontVariantNumeric: 'tabular-nums',
            fontVariationSettings: '"ROND" 0',
            letterSpacing: '0.1em',
          }}
        >
          {score.toString().padStart(8, '0')}
        </div>
      </div>

      {/* 最高分 */}
      <div className="mb-4">
        <div className="text-yellow-500 text-sm mb-1">HIGH SCORE</div>
        <div
          className={`${doto.className} text-yellow-500`}
          style={{
            fontSize: '2rem',
            fontVariantNumeric: 'tabular-nums',
            fontVariationSettings: '"ROND" 0',
            letterSpacing: '0.1em',
          }}
        >
          {highScore.toString().padStart(8, '0')}
        </div>
      </div>

      {/* 生命值 */}
      <div>
        <div className="text-red-500 text-sm mb-1">LIVES</div>
        <div
          className={`${doto.className} text-red-500`}
          style={{
            fontSize: '2rem',
            fontVariationSettings: '"ROND" 100',
          }}
        >
          {'●'.repeat(lives)}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 範例 8：進度百分比
// ============================================
export function ProgressPercentage({ percentage }: { percentage: number }) {
  const roundness = Math.min(percentage, 100);

  return (
    <div className="space-y-2">
      {/* 百分比數字 */}
      <div
        className={doto.className}
        style={{
          fontSize: '4rem',
          fontVariationSettings: `"ROND" ${roundness}`,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {Math.round(percentage)}
        <span className="text-2xl">%</span>
      </div>

      {/* 進度條 */}
      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <p className="text-xs text-gray-400">
        Roundness increases with progress (0-100)
      </p>
    </div>
  );
}

// ============================================
// CSS-in-JS 樣式範例（如果需要）
// ============================================
export const dotoStyles = {
  // 基本數字樣式
  numeric: {
    fontFamily: 'var(--font-doto)',
    fontVariantNumeric: 'tabular-nums',
  },

  // 方形像素（retro style）
  retro: {
    fontFamily: 'var(--font-doto)',
    fontVariationSettings: '"ROND" 0',
  },

  // 圓形像素（modern style）
  modern: {
    fontFamily: 'var(--font-doto)',
    fontVariationSettings: '"ROND" 100',
  },

  // 中等圓角（balanced style）
  balanced: {
    fontFamily: 'var(--font-doto)',
    fontVariationSettings: '"ROND" 50',
  },
};

// ============================================
// Tailwind 工具類別建議（加到 globals.css）
// ============================================
/*
@layer utilities {
  .font-doto {
    font-family: var(--font-doto);
  }

  .font-doto-tabular {
    font-family: var(--font-doto);
    font-variant-numeric: tabular-nums;
  }

  .font-doto-retro {
    font-family: var(--font-doto);
    font-variation-settings: "ROND" 0;
  }

  .font-doto-modern {
    font-family: var(--font-doto);
    font-variation-settings: "ROND" 100;
  }

  .font-doto-balanced {
    font-family: var(--font-doto);
    font-variation-settings: "ROND" 50;
  }
}
*/
