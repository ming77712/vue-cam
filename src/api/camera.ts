import http from './http'

export interface CameraItem {
  id: number
  name: string
  pushEnabled: boolean
  panTime: number
  preset: string
}

/**
 * 取得攝影機列表
 * @returns 攝影機陣列
 */
export async function fetchCameras(): Promise<CameraItem[]> {
  const response = await http.get<CameraItem[]>('/cameras')
  return response.data
}

/**
 * 儲存攝影機變更
 * @param formData - 包含變更資料和圖片的 FormData
 * @returns Promise
 */
export async function saveCameraChanges(formData: FormData): Promise<void> {
  await http.post('/cameras/save', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}


