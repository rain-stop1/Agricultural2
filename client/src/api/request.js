import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

// 创建axios实例
const request = axios.create({
  baseURL: '/api',  // 使用Vite代理
  timeout: 60000,  // 增加到60秒，适应AI API的响应时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 从sessionStorage直接获取token，避免在拦截器中使用useUserStore
const getToken = () => {
  return sessionStorage.getItem('token') || ''
}

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response
    
    // 如果响应包含code字段，按照统一格式处理
    if (data.code !== undefined) {
      if (data.code === 200) {
        return data
      } else if (data.code === 401) {
        // 检查是否是登录接口的错误
        if (response.config.url.includes('/auth/login')) {
          // 登录接口的 401 是用户名或密码错误，不是登录过期
          ElMessage.error(data.message || '用户名或密码错误')
          return Promise.reject(new Error(data.message || '用户名或密码错误'))
        } else {
          // 其他接口的 401 是登录过期或 token 无效
          const userStore = useUserStore()
          userStore.logout()
          router.push('/login')
          ElMessage.error('登录已过期，请重新登录')
          return Promise.reject(new Error('未授权'))
        }
      } else {
        // 其他错误
        ElMessage.error(data.message || '请求失败')
        return Promise.reject(new Error(data.message || '请求失败'))
      }
    }
    
    // 如果没有code字段，直接返回data
    return data
  },
  (error) => {
    console.error('响应错误:', error)
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 检查是否是登录接口的错误
          if (error.config.url.includes('/auth/login')) {
            // 登录接口的 401 是用户名或密码错误，不是登录过期
            ElMessage.error(data?.message || '用户名或密码错误')
          } else {
            // 其他接口的 401 是登录过期或 token 无效
            const userStore = useUserStore()
            userStore.logout()
            router.push('/login')
            ElMessage.error('登录已过期，请重新登录')
          }
          break
        case 403:
          ElMessage.error('没有访问权限')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || '网络错误')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default request