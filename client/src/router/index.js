import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register', 
    component: () => import('@/views/auth/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页概览' }
      },
      {
        path: '/warning',
        name: 'Warning',
        component: () => import('@/views/warning/Enhanced.vue'),
        meta: { title: '灾害预警' }
      },
      {
        path: '/emergency',
        name: 'Emergency',
        component: () => import('@/views/emergency/Index.vue'),
        meta: { title: '应急指挥' }
      },
      {
        path: '/resources',
        name: 'Resources',
        component: () => import('@/views/resources/Index.vue'),
        meta: { title: '资源调度' }
      },
      {
        path: '/loss',
        name: 'Loss',
        component: () => import('@/views/loss/Index.vue'),
        meta: { title: '损失上报' }
      },
      {
        path: '/profile',
        name: 'Profile',
        component: () => import('@/views/user/Profile.vue'),
        meta: { title: '个人中心' }
      },
      // 管理员专用路由
      {
        path: '/admin/users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理', requiresAdmin: true }
      },
      { path: '/admin/system', name: 'AdminSystem', component: () => import('@/views/admin/System.vue'), meta: { title: '系统管理', requiresAdmin: true } },
      { path: '/admin/fields', name: 'AdminFields', component: () => import('@/views/admin/Fields.vue'), meta: { title: '地块管理', requiresAdmin: true } },
      { path: '/admin/disaster-types', name: 'AdminDisasterTypes', component: () => import('@/views/admin/DisasterTypes.vue'), meta: { title: '灾害类型管理', requiresAdmin: true } },
      { path: '/admin/reports', name: 'AdminReports', component: () => import('@/views/admin/Reports.vue'), meta: { title: '统计报表', requiresAdmin: true } },
      // 普通用户地块管理
      { path: '/fields', name: 'Fields', component: () => import('@/views/fields/Index.vue'), meta: { title: '地块管理' } },
      // AI对话功能
      {
        path: '/ai/chat',
        name: 'AIChat',
        component: () => import('@/views/ai/Chat.vue'),
        meta: { title: 'AI 智能助手' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
    return
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && userStore.user?.user_type !== 'admin') {
    ElMessage.error('您没有访问权限')
    next('/')
    return
  }
  
  // 如果已登录访问登录页，重定向到首页
  if ((to.path === '/login' || to.path === '/register') && userStore.token) {
    next('/')
    return
  }
  
  next()
})

export default router
