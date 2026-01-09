import { createRouter, createWebHashHistory } from 'vue-router'
// import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import CameraTableView from '../views/CameraTableView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/cameras',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: '/cameras',
    name: 'cameras',
    component: CameraTableView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

/**
 * 路由守衛：檢查使用者是否已登入
 */
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 如果路由需要認證
  if (to.meta.requiresAuth) {
    // 檢查是否已登入
    if (authStore.isAuthenticated) {
      next()
    } else {
      // 未登入，導向登入頁
      next({ name: 'login', query: { redirect: to.fullPath } })
    }
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    // 如果已經登入卻要進入登入頁，導向到攝影機頁面
    next({ name: 'cameras' })
  } else {
    next()
  }
})

export default router
