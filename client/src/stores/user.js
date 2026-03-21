import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, getUserInfo } from '@/api/auth'
import { ElMessage } from 'element-plus'

// 存储配置：使用 sessionStorage 支持多标签页独立登录
// 如果需要标签页共享登录，改为 localStorage
const storage = sessionStorage

export const useUserStore = defineStore('user', () => {
  const token = ref(storage.getItem('token') || '')
  const user = ref(JSON.parse(storage.getItem('user') || 'null'))
  const loading = ref(false)
  const initialized = ref(false) // 添加初始化标记
  const initializing = ref(false) // 添加初始化中标记，防止重复调用
  const emergencyRefreshFlag = ref(0) // 应急响应刷新标记

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.user_type === 'admin')

  // 登录
  const login = async (loginForm) => {
    try {
      loading.value = true
      const response = await loginApi(loginForm)
      
      if (response.code === 200) {
        token.value = response.data.token
        storage.setItem('token', response.data.token)
        
        // 获取用户信息
        await fetchUserInfo()
        
        ElMessage.success('登录成功')
        return true
      } else {
        ElMessage.error(response.message || '登录失败')
        return false
      }
    } catch (error) {
      console.error('登录错误:', error)
      ElMessage.error('登录失败，请检查网络连接')
      return false
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (registerForm) => {
    try {
      loading.value = true
      const response = await registerApi(registerForm)
      
      if (response.code === 200) {
        ElMessage.success('注册成功，请登录')
        return true
      } else {
        ElMessage.error(response.message || '注册失败')
        return false
      }
    } catch (error) {
      console.error('注册错误:', error)
      ElMessage.error('注册失败，请检查网络连接')
      return false
    } finally {
      loading.value = false
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    console.log('=== fetchUserInfo 开始 ===')
    try {
      const response = await getUserInfo()
      console.log('getUserInfo 响应:', response)
      
      if (response.code === 200) {
        console.log('用户信息:', response.data)
        console.log('用户地区:', response.data.region)
        
        user.value = response.data
        storage.setItem('user', JSON.stringify(response.data))
        
        console.log('已保存到 storage')
        console.log('storage 中的 user:', storage.getItem('user'))
        
        initialized.value = true
        return true
      }
      console.warn('获取用户信息失败，code:', response.code)
      return false
    } catch (error) {
      console.error('获取用户信息错误:', error)
      initialized.value = true // 即使失败也标记为已初始化
      return false
    }
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    user.value = null
    initialized.value = false
    initializing.value = false
    storage.removeItem('token')
    storage.removeItem('user')
    ElMessage.success('已退出登录')
  }

  // 检查token有效性
  const checkToken = async () => {
    // 如果正在初始化，等待完成
    if (initializing.value) {
      while (initializing.value) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      return
    }
    
    // 如果已经初始化过，直接返回
    if (initialized.value) {
      return
    }
    
    initializing.value = true
    
    try {
      if (token.value) {
        const success = await fetchUserInfo()
        if (!success) {
          logout()
        }
      } else {
        initialized.value = true // 没有token也标记为已初始化
      }
    } finally {
      initializing.value = false
    }
  }

  // 触发应急响应页面刷新
  const triggerEmergencyRefresh = () => {
    emergencyRefreshFlag.value++
  }

  return {
    token,
    user,
    loading,
    initialized,
    initializing,
    emergencyRefreshFlag,
    isLoggedIn,
    isAdmin,
    login,
    register,
    logout,
    fetchUserInfo,
    checkToken,
    triggerEmergencyRefresh
  }
})