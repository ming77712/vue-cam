import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Cookies from 'js-cookie'
import { http } from '../api/http'
import router from '../router'

export type UserRole = 'operator' | 'admin'

interface LoginResponse {
  token: string
  role: UserRole
  username: string
}

interface DecodedToken {
  role: UserRole
  username: string
  exp: number
}

/**
 * 解析 JWT token 的 payload
 * @param token - JWT token 字串
 * @returns 解析後的 payload 物件，若解析失敗則返回 null
 */
function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/**
 * 檢查 token 是否已過期
 * @param token - JWT token 字串
 * @returns 若 token 過期或無效則返回 true，否則返回 false
 */
function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true
  return Date.now() >= decoded.exp * 1000
}

const TOKEN_COOKIE_NAME = 'auth_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(Cookies.get(TOKEN_COOKIE_NAME) || null)
  const role = ref<UserRole | null>(null)
  const username = ref<string>('')

  /**
   * 檢查使用者是否已登入
   */
  const isAuthenticated = computed(() => {
    if (!token.value) return false
    if (isTokenExpired(token.value)) {
      logout()
      return false
    }
    return true
  })

  /**
   * 檢查使用者是否為管理者
   */
  const isAdmin = computed(() => role.value === 'admin')

  /**
   * 檢查使用者是否為操作者
   */
  const isOperator = computed(() => role.value === 'operator')

  /**
   * 初始化認證狀態（從 cookie 讀取 token 並解析）
   */
  function initAuth(): void {
    const storedToken = Cookies.get(TOKEN_COOKIE_NAME)
    if (storedToken && !isTokenExpired(storedToken)) {
      token.value = storedToken
      const decoded = decodeToken(storedToken)
      if (decoded) {
        role.value = decoded.role
        username.value = decoded.username || ''
      }
    } else {
      logout()
    }
  }

  /**
   * 執行登入
   * @param userInput - 使用者名稱
   * @param password - 密碼
   * @returns Promise，成功時 resolve，失敗時 reject
   */
  async function login(userInput: string, password: string): Promise<void> {
    try {
      // 測試帳號（如果後端 API 尚未準備好，可以使用這些測試帳號）
      const testAccounts: Record<
        string,
        { password: string; role: UserRole; username: string }
      > = {
        admin: {
          password: 'admin123',
          role: 'admin',
          username: '管理者',
        },
        operator: {
          password: 'operator123',
          role: 'operator',
          username: '操作者',
        },
      }

      // 檢查是否為測試帳號
      if (testAccounts[userInput] && testAccounts[userInput].password === password) {
        const testAccount = testAccounts[userInput]
        // 建立測試用的 JWT token（簡化版，實際應由後端產生）
        const testToken = createTestToken(testAccount.username, testAccount.role)

        token.value = testToken
        role.value = testAccount.role
        username.value = testAccount.username

        // 將 token 存入 cookie，設定 7 天過期
        Cookies.set(TOKEN_COOKIE_NAME, testToken, {
          expires: 7,
          secure: window.location.protocol === 'https:',
          sameSite: 'strict',
        })

        // 導向到攝影機頁面
        router.push('/cameras')
        return
      }

      // 如果不是測試帳號，嘗試呼叫後端 API
      const response = await http.post<LoginResponse>('/auth/login', {
        username: userInput,
        password,
      })

      token.value = response.data.token
      role.value = response.data.role
      username.value = response.data.username

      // 將 token 存入 cookie，設定 7 天過期
      Cookies.set(TOKEN_COOKIE_NAME, response.data.token, {
        expires: 7,
        secure: window.location.protocol === 'https:',
        sameSite: 'strict',
      })

      // 導向到攝影機頁面
      router.push('/cameras')
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * 將字串轉換為 base64 編碼（支援 UTF-8）
   * @param str - 要編碼的字串
   * @returns base64 編碼後的字串
   */
  function base64UrlEncode(str: string): string {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(Number('0x' + p1))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * 建立測試用的 JWT token（簡化版，僅供開發測試使用）
   * @param username - 使用者名稱
   * @param role - 使用者角色
   * @returns 測試用的 JWT token
   */
  function createTestToken(username: string, role: UserRole): string {
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = base64UrlEncode(
      JSON.stringify({
        username,
        role,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 天後過期
      }),
    )
    // 簡化版 token，實際應由後端簽名
    return `${header}.${payload}.test-signature`
  }

  /**
   * 執行登出
   */
  function logout(): void {
    token.value = null
    role.value = null
    username.value = ''
    Cookies.remove(TOKEN_COOKIE_NAME)
    router.push('/login')
  }

  // 初始化時檢查 token
  initAuth()

  return {
    token,
    role,
    username,
    isAuthenticated,
    isAdmin,
    isOperator,
    login,
    logout,
    initAuth,
  }
})

