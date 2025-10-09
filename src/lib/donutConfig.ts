/**
 * Donut 渲染器配置模組
 *
 * 提供 ASCII Donut 渲染器的配置介面、預設值和驗證邏輯
 */

/**
 * Donut 渲染器配置介面
 */
export interface DonutRendererConfig {
  /** ASCII 輸出寬度（字元數） */
  width: number;
  /** ASCII 輸出高度（行數） */
  height: number;
  /** 圓環橫截面半徑 */
  R1: number;
  /** 圓環中心距離 */
  R2: number;
  /** 透視投影距離 */
  K1: number;
  /** 觀察者距離 */
  K2: number;
  /** theta 角度步進（控制密度） */
  thetaSpacing: number;
  /** phi 角度步進（控制密度） */
  phiSpacing: number;
  /** ASCII 亮度字元集（從暗到亮） */
  luminanceChars: string;
}

/**
 * 預設 Donut 配置
 *
 * 適用於標準效能裝置的配置參數
 */
export const DEFAULT_DONUT_CONFIG: DonutRendererConfig = {
  width: 80,
  height: 24,
  R1: 1,
  R2: 2,
  K1: 150, // Projection scale (increased from 30 for better WebGL visibility)
  K2: 5,   // Camera distance
  thetaSpacing: 0.07,
  phiSpacing: 0.02,
  luminanceChars: '.,-~:;=!*#$@',
};

/**
 * 低效能裝置降級配置
 *
 * 減少解析度和計算密度，提升低效能裝置的 FPS
 */
export const LOW_PERFORMANCE_CONFIG: Partial<DonutRendererConfig> = {
  width: 60,
  height: 18,
  thetaSpacing: 0.14, // 2x 步進
  phiSpacing: 0.04, // 2x 步進
};

/**
 * 驗證配置參數是否有效
 *
 * @param key - 配置參數鍵
 * @param value - 配置參數值
 * @returns 是否有效
 */
function isValidConfigValue(key: keyof DonutRendererConfig, value: any): boolean {
  // luminanceChars 必須是非空字串
  if (key === 'luminanceChars') {
    return typeof value === 'string' && value.length > 0;
  }

  // 數值參數必須 > 0
  return typeof value === 'number' && value > 0;
}

/**
 * 合併自訂配置與預設配置
 *
 * 驗證自訂配置的有效性，無效的參數將使用預設值並記錄警告
 *
 * @param custom - 自訂配置（部分）
 * @returns 完整的配置物件
 */
export function mergeDonutConfig(
  custom: Partial<DonutRendererConfig>
): DonutRendererConfig {
  const result = { ...DEFAULT_DONUT_CONFIG };
  const invalidParams: string[] = [];

  // 遍歷自訂配置並驗證
  for (const key in custom) {
    if (Object.prototype.hasOwnProperty.call(custom, key)) {
      const configKey = key as keyof DonutRendererConfig;
      const value = custom[configKey];

      if (value !== undefined && isValidConfigValue(configKey, value)) {
        // 有效配置，合併
        (result[configKey] as any) = value;
      } else if (value !== undefined) {
        // 無效配置，記錄警告
        invalidParams.push(key);
      }
    }
  }

  // 記錄無效參數警告
  if (invalidParams.length > 0) {
    console.warn(
      `[DonutConfig] Invalid configuration parameters detected and ignored: ${invalidParams.join(', ')}. Using default values.`
    );
  }

  return result;
}
