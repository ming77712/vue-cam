import { ref } from 'vue'

/**
 * 圖片上傳配置
 */
export interface ImageUploadConfig {
  /** 最大檔案大小（位元組），預設: 5MB */
  maxSize?: number
  /** 允許的圖片類型，預設: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] */
  allowedTypes?: string[]
  /** 錯誤回調函數 */
  onError?: (message: string) => void
}

/**
 * 圖片資料介面
 */
export interface ImageData {
  /** 圖片預覽 URL */
  previewUrl: string | null
  /** 原始檔案 */
  file: File | null
}

/**
 * 圖片上傳處理 Composable
 * 提供圖片上傳、預覽、驗證等功能
 *
 * @param config - 圖片上傳配置（可選）
 * @returns 圖片上傳管理物件
 *
 * @example
 * ```ts
 * const {
 *   imageData,
 *   handleUpload,
 *   clearImage,
 *   validateFile
 * } = useImageUpload({
 *   maxSize: 5 * 1024 * 1024, // 5MB
 *   allowedTypes: ['image/jpeg', 'image/png'],
 *   onError: (message) => ElMessage.error(message)
 * })
 *
 * // 在上傳元件中使用
 * function beforeUpload(file: File): boolean {
 *   return handleUpload(file)
 * }
 * ```
 */
export function useImageUpload(config?: ImageUploadConfig) {
  const defaultConfig: Required<ImageUploadConfig> = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    onError: (message: string) => console.error(message),
  }

  const finalConfig = { ...defaultConfig, ...config }

  /** 圖片資料 */
  const imageData = ref<ImageData>({
    previewUrl: null,
    file: null,
  })

  /**
   * 驗證檔案
   * @param file - 要驗證的檔案
   * @returns 驗證是否通過
   */
  function validateFile(file: File): boolean {
    // 驗證檔案類型
    if (!finalConfig.allowedTypes.includes(file.type)) {
      finalConfig.onError('不支援的圖片格式，請上傳 JPEG、PNG、GIF 或 WebP 格式的圖片')
      return false
    }

    // 驗證檔案大小
    if (file.size > finalConfig.maxSize) {
      const maxSizeMB = (finalConfig.maxSize / (1024 * 1024)).toFixed(1)
      finalConfig.onError(`圖片大小不能超過 ${maxSizeMB}MB`)
      return false
    }

    return true
  }

  /**
   * 處理圖片上傳
   * @param file - 上傳的檔案
   * @returns 是否成功處理
   */
  function handleUpload(file: File): boolean {
    if (!validateFile(file)) {
      return false
    }

    // 建立預覽 URL
    const reader = new FileReader()
    reader.onload = (e) => {
      imageData.value.previewUrl = e.target?.result as string
      imageData.value.file = file
    }
    reader.readAsDataURL(file)

    return false // 阻止自動上傳，由父組件處理
  }

  /**
   * 清除圖片
   */
  function clearImage(): void {
    if (imageData.value.previewUrl) {
      // 如果是 blob URL，需要釋放記憶體
      if (imageData.value.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageData.value.previewUrl)
      }
    }
    imageData.value.previewUrl = null
    imageData.value.file = null
  }

  /**
   * 設定預覽 URL（用於顯示已存在的圖片）
   * @param url - 圖片 URL
   */
  function setPreviewUrl(url: string | null): void {
    imageData.value.previewUrl = url
  }

  return {
    imageData,
    handleUpload,
    clearImage,
    validateFile,
    setPreviewUrl,
  }
}
