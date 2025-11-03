'use client';

import { useBingoStore } from '@/lib/stores/bingoStore';
import { motion } from 'motion/react';
import { useState } from 'react';
import { PixelIcon } from '@/components/ui/icons';
import { PipBoyButton } from '@/components/ui/pipboy';
import NumberPickerModal from '@/components/bingo/NumberPickerModal';

/**
 * 賓果卡設定元件 - 全新 Grid 佈局設計
 *
 * 功能:
 * - 顯示 5x5 空白 Grid，使用者點擊每個格子選擇數字
 * - 每個格子可以選擇 1-25 的任一數字
 * - 即時驗證與錯誤提示
 * - 提交建立賓果卡
 *
 * 設計風格: Fallout/Wasteland
 */import { Button } from "@/components/ui/button";
export default function BingoCardSetup() {
  const {
    validationError,
    isLoading,
    error,
    createCard
  } = useBingoStore();

  // 5x5 Grid 狀態 (初始為空，值為 null)
  const [gridNumbers, setGridNumbers] = useState<(number | null)[][]>(
    Array.from({ length: 5 }, () => Array(5).fill(null))
  );

  // 目前選擇的 cell 位置 (用於彈窗選擇數字)
  const [selectedCell, setSelectedCell] = useState<{row: number;col: number;} | null>(null);

  // Modal 開啟狀態
  const [showNumberPicker, setShowNumberPicker] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  /**
   * 處理 Grid Cell 點擊 - 彈出 NumberPickerModal
   */
  const handleCellClick = (row: number, col: number) => {
    if (isLoading || isSubmitting) return;
    setSelectedCell({ row, col });
    setShowNumberPicker(true); // 開啟 modal
    setLocalError(null);
  };

  /**
   * 處理數字選擇（從 Modal 回調）
   */
  const handleNumberSelect = (num: number) => {
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    // 檢查這個數字是否已經被使用
    const isNumberUsed = gridNumbers.some((row) => row.includes(num));
    if (isNumberUsed) {
      setLocalError(`數字 ${num} 已經被使用了！`);
      setShowNumberPicker(false); // 關閉 modal
      return;
    }

    // 更新 grid
    const newGrid = gridNumbers.map((r, rIndex) =>
    rIndex === row ?
    r.map((c, cIndex) => cIndex === col ? num : c) :
    r
    );
    setGridNumbers(newGrid);
    setSelectedCell(null);
    setShowNumberPicker(false); // 關閉 modal
    setLocalError(null);
  };

  /**
   * 移除 Cell 中的數字
   */
  const handleClearCell = (row: number, col: number) => {
    if (isLoading || isSubmitting) return;

    const newGrid = gridNumbers.map((r, rIndex) =>
    rIndex === row ?
    r.map((c, cIndex) => cIndex === col ? null : c) :
    r
    );
    setGridNumbers(newGrid);
    setLocalError(null);
  };

  /**
   * 處理提交
   */
  const handleSubmit = async () => {
    if (isLoading || isSubmitting) return;

    // 驗證所有格子都已填入數字
    const flatGrid = gridNumbers.flat();
    const filledCount = flatGrid.filter((n) => n !== null).length;

    if (filledCount < 25) {
      setLocalError(`還有 ${25 - filledCount} 個格子未填入數字！`);
      return;
    }

    // 驗證所有數字都不重複（應該不會發生，但還是檢查一下）
    const uniqueNumbers = new Set(flatGrid.filter((n) => n !== null));
    if (uniqueNumbers.size !== 25) {
      setLocalError('數字有重複，請檢查！');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      // 將 5x5 grid 展平為一維陣列 (row by row)
      const numbers = flatGrid as number[];
      await createCard(numbers);
      // 建立成功，狀態會自動更新並顯示遊戲介面
    } catch (err: any) {
      // 顯示錯誤訊息
      setLocalError(err.message || '建立賓果卡失敗，請稍後再試');
      console.error('建立賓果卡錯誤:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 處理清除 Grid
   */
  const handleClearGrid = () => {
    if (isLoading || isSubmitting) return;
    setGridNumbers(Array.from({ length: 5 }, () => Array(5).fill(null)));
    setLocalError(null);
  };

  /**
   * 自動填充隨機號碼
   * 邏輯：
   * - 如果有空格子：只填充空格子，保留已填的數字
   * - 如果全部已滿：重新洗牌全部數字
   */
  const handleAutoFill = () => {
    if (isLoading || isSubmitting) return;

    // 收集已填入的數字
    const usedNumbers = new Set<number>();
    gridNumbers.flat().forEach((num) => {
      if (num !== null) {
        usedNumbers.add(num);
      }
    });

    const emptyCount = 25 - usedNumbers.size;

    if (emptyCount > 0) {
      // 情況 1：有空格子 → 只填充空格子
      // 找出未使用的數字
      const availableNumbers: number[] = [];
      for (let i = 1; i <= 25; i++) {
        if (!usedNumbers.has(i)) {
          availableNumbers.push(i);
        }
      }

      // Fisher-Yates shuffle 未使用的數字
      for (let i = availableNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
      }

      // 填充空格子（保留已有數字）
      let availableIndex = 0;
      const newGrid = gridNumbers.map((row) =>
      row.map((cell) => {
        if (cell !== null) {
          return cell; // 保留已填的數字
        } else {
          return availableNumbers[availableIndex++]; // 填入隨機數字
        }
      })
      );
      setGridNumbers(newGrid);
      setLocalError(null);
    } else {
      // 情況 2：全部已滿 → 重新洗牌全部數字
      const numbers = Array.from({ length: 25 }, (_, i) => i + 1);

      // Fisher-Yates shuffle
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }

      // 填充到 5x5 grid
      const newGrid = Array.from({ length: 5 }, (_, row) =>
      Array.from({ length: 5 }, (_, col) => numbers[row * 5 + col])
      );
      setGridNumbers(newGrid);
      setLocalError(null);
    }
  };

  const filledCount = gridNumbers.flat().filter((n) => n !== null).length;
  const canSubmit = filledCount === 25 && !isLoading && !isSubmitting;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6 text-center">

        <h2 className="text-3xl font-bold text-pip-boy-green mb-2 tracking-wider">
          設定你的賓果卡
        </h2>
        <p className="text-terminal-green text-sm">
          點擊格子選擇 1-25 的號碼，排列出你獨一無二的廢土賓果卡
        </p>
        <div className="mt-3 text-pip-boy-green-dark">
          已填入: <span className="text-2xl font-bold text-pip-boy-green">{filledCount}</span> / 25
        </div>
      </motion.div>

      {/* 錯誤訊息 */}
      {(localError || validationError || error) &&
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 p-3 bg-rust-red/20 border-2 border-rust-red rounded text-radiation-orange text-sm flex items-center gap-2">

          <PixelIcon name="alert-triangle" sizePreset="sm" variant="error" decorative />
          {localError || validationError || error}
        </motion.div>
      }

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: 5x5 賓果卡 Grid */}
        <div className="lg:col-span-2">
          <div className="p-6 bg-wasteland-dark/80 border-2 border-pip-boy-green/50 rounded-lg backdrop-blur-sm">
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {gridNumbers.map((row, rowIndex) =>
              row.map((num, colIndex) =>
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                      relative aspect-square rounded-lg text-2xl sm:text-3xl font-bold
                      transition-all duration-200 border-2
                      ${num !== null ?
                'bg-pip-boy-green/20 border-pip-boy-green text-pip-boy-green shadow-lg shadow-pip-boy-green/30' :
                'bg-metal-gray/80 border-metal-gray-light text-wasteland-lighter hover:border-pip-boy-green/50 hover:bg-pip-boy-green/10'}
                      ${
                isLoading || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}>

                    {/* 主要點擊區域 */}
                    <Button size="icon" variant="ghost"
                onClick={() => handleCellClick(rowIndex, colIndex)}
                disabled={isLoading || isSubmitting}
                className="absolute inset-0 w-full h-full flex items-center justify-center disabled:pointer-events-none"
                aria-label={num !== null ? `已選擇數字 ${num}` : '選擇數字'}>

                      {num !== null ?
                  num :

                  <PixelIcon name="plus" sizePreset="md" variant="muted" decorative />
                  }
                    </Button>

                    {/* 清除按鈕 (只在有數字時顯示) */}
                    {num !== null &&
                <Button size="icon" variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearCell(rowIndex, colIndex);
                }}
                disabled={isLoading || isSubmitting}
                className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center transition-colors z-10 disabled:pointer-events-none"
                aria-label={`清除數字 ${num}`}>

                        <PixelIcon name="close" size={12} className="text-black" decorative />
                      </Button>
                }
                  </motion.div>
              )
              )}
            </div>
          </div>
        </div>

        {/* 右側: 操作按鈕 */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-wasteland-dark/80 border-2 border-vault-blue-light/50 rounded-lg backdrop-blur-sm">
            <h3 className="text-lg font-bold text-vault-blue-light mb-4 flex items-center gap-2">
              <PixelIcon name="grid" sizePreset="sm" variant="info" decorative />
              快速操作
            </h3>

            {/* 操作按鈕 */}
            <div className="space-y-2">
              <PipBoyButton
                onClick={handleAutoFill}
                disabled={isLoading || isSubmitting}
                variant="secondary"
                size="default"
                className="w-full">

                <PixelIcon name="shuffle" sizePreset="sm" decorative />
                {filledCount === 25 ? '重新洗牌' : '隨機填充'}
              </PipBoyButton>

              <PipBoyButton
                onClick={handleClearGrid}
                disabled={isLoading || isSubmitting || filledCount === 0}
                variant="destructive"
                size="default"
                className="w-full">

                <PixelIcon name="trash" sizePreset="sm" decorative />
                清空格子
              </PipBoyButton>

              <PipBoyButton
                onClick={handleSubmit}
                disabled={!canSubmit}
                variant="default"
                size="lg"
                className="w-full">

                <PixelIcon name="check" sizePreset="sm" decorative />
                {isSubmitting ? '建立中...' : '確認建立'}
              </PipBoyButton>
            </div>
          </div>
        </div>
      </div>

      {/* 說明文字 */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 p-4 bg-vault-blue-deep/50 border border-vault-blue rounded text-wasteland-lighter text-sm">

        <p className="mb-2 flex items-center gap-2">
          <PixelIcon name="info" sizePreset="xs" variant="info" decorative />
          <span className="text-vault-blue-light font-bold">操作提示:</span>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-6">
          <li>點擊左側空格子，會彈出數字選擇視窗</li>
          <li>每個數字只能使用一次，已使用的數字會標示為不可選</li>
          <li>點擊格子右上角的 × 可以移除該數字</li>
          <li>「隨機填充」會自動填滿空格子（已填數字會保留）</li>
          <li>全部填滿後，「重新洗牌」會重新隨機排列所有數字</li>
          <li>每月只能建立一張賓果卡，建立後無法修改，請謹慎選擇！</li>
        </ul>
      </motion.div>

      {/* 數字選擇 Modal */}
      <NumberPickerModal
        isOpen={showNumberPicker}
        onClose={() => {
          setShowNumberPicker(false);
          setSelectedCell(null);
        }}
        onSelectNumber={handleNumberSelect}
        usedNumbers={new Set(gridNumbers.flat().filter((n): n is number => n !== null))}
        cardNumbers={new Set()} />

    </div>);

}