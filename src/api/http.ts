import axios from 'axios'
import Cookies from 'js-cookie'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
})

// 請求攔截器：自動帶上 token
http.interceptors.request.use(
  (config) => {
    // 從 cookie 讀取 token
    const token = Cookies.get('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 回應攔截器：處理 401 錯誤自動登出
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 過期或無效，清除認證資訊
      Cookies.remove('auth_token')
      delete http.defaults.headers.common['Authorization']
      // 導向登入頁（需要在 router 中處理）
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export { http }
export default http


