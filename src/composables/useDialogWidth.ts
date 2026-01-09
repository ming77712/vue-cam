import { computed } from 'vue'

/**
 * 對話框響應式寬度配置
 */
export interface DialogWidthBreakpoints {
  /** 小螢幕寬度 (預設: '95%') */
  small: string
  /** 中等螢幕寬度 (預設: '90%') */
  medium: string
  /** 大螢幕寬度 (預設: '400px', '500px', '800px' 等) */
  large: string
  /** 小螢幕斷點 (預設: 640px) */
  smallBreakpoint: number
  /** 中等螢幕斷點 (預設: 768px) */
  mediumBreakpoint: number
}

/**
 * 響應式對話框寬度 Composable
 * 根據視窗寬度自動調整對話框寬度
 *
 * @param breakpoints - 自訂斷點配置（可選）
 * @returns 響應式的對話框寬度值
 *
 * @example
 * ```ts
 * // 使用預設配置（適合小型對話框）
 * const dialogWidth = useDialogWidth()
 *
 * // 自訂配置（適合大型對話框）
 * const dialogWidth = useDialogWidth({
 *   small: '95%',
 *   medium: '90%',
 *   large: '800px',
 *   smallBreakpoint: 640,
 *   mediumBreakpoint: 768
 * })
 * ```
 */
export function useDialogWidth(breakpoints?: Partial<DialogWidthBreakpoints>) {
  const defaultBreakpoints: DialogWidthBreakpoints = {
    small: '95%',
    medium: '90%',
    large: '400px',
    smallBreakpoint: 640,
    mediumBreakpoint: 768,
  }

  const config = { ...defaultBreakpoints, ...breakpoints }

  /**
   * 計算對話框寬度
   */
  const dialogWidth = computed(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < config.smallBreakpoint) {
        return config.small
      } else if (window.innerWidth < config.mediumBreakpoint) {
        return config.medium
      }
      return config.large
    }
    return config.large
  })

  return dialogWidth
}
