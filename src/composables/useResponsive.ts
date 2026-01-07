import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 響應式斷點配置
 */
export interface ResponsiveBreakpoints {
  /** 行動裝置斷點 (預設: 768px) */
  mobile: number
  /** 平板裝置斷點 (預設: 1024px) */
  tablet: number
}

/**
 * 響應式視窗大小偵測 Composable
 * 監聽視窗大小變化，提供當前裝置類型判斷
 *
 * @param breakpoints - 自訂斷點配置（可選）
 * @returns 響應式裝置狀態物件
 *
 * @example
 * ```ts
 * // 使用預設斷點
 * const { isMobile, isTablet, isDesktop, windowWidth } = useResponsive()
 *
 * // 自訂斷點
 * const { isMobile } = useResponsive({
 *   mobile: 640,
 *   tablet: 1280
 * })
 * ```
 */
export function useResponsive(breakpoints?: Partial<ResponsiveBreakpoints>) {
  const defaultBreakpoints: ResponsiveBreakpoints = {
    mobile: 768,
    tablet: 1024,
  }

  const config = { ...defaultBreakpoints, ...breakpoints }

  /** 視窗寬度 */
  const windowWidth = ref(0)

  /** 是否為行動裝置 */
  const isMobile = ref(false)

  /** 是否為平板裝置 */
  const isTablet = ref(false)

  /** 是否為桌面裝置 */
  const isDesktop = ref(false)

  /**
   * 更新響應式狀態
   */
  function updateResponsiveState(): void {
    if (typeof window !== 'undefined') {
      windowWidth.value = window.innerWidth
      isMobile.value = window.innerWidth < config.mobile
      isTablet.value = window.innerWidth >= config.mobile && window.innerWidth < config.tablet
      isDesktop.value = window.innerWidth >= config.tablet
    }
  }

  onMounted(() => {
    updateResponsiveState()
    window.addEventListener('resize', updateResponsiveState)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateResponsiveState)
  })

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
  }
}
