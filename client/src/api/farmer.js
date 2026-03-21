import request from './request'

// 获取农户工作台统计数据
export const getFarmerStats = () => {
  return request({
    url: '/farmer/dashboard/stats',
    method: 'get'
  })
}

// 获取我的地块概况
export const getMyFieldsSummary = (limit = 5) => {
  return request({
    url: '/farmer/dashboard/fields',
    method: 'get',
    params: { limit }
  })
}

// 获取我的待办事项
export const getMyTodos = () => {
  return request({
    url: '/farmer/dashboard/todos',
    method: 'get'
  })
}

// 获取我的数据趋势
export const getMyTrends = (period = 'week') => {
  return request({
    url: '/farmer/dashboard/trends',
    method: 'get',
    params: { period }
  })
}

// 获取当前天气
export const getCurrentWeather = () => {
  return request({
    url: '/farmer/dashboard/weather',
    method: 'get'
  })
}
