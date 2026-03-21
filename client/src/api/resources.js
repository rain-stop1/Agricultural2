import request from './request'

// 获取资源列表
export const getResources = (params) => {
  return request.get('/resources/resources', { params })
}

// 添加资源
export const addResource = (data) => {
  return request.post('/resources/resources', data)
}

// 获取需求列表
export const getDemands = () => {
  return request.get('/resources/demands')
}

// 发布需求
export const addDemand = (data) => {
  return request.post('/resources/demands', data)
}

// 匹配资源
export const matchDemand = (demandId, resourceId) => {
  return request.post(`/resources/demands/${demandId}/match`, { resource_id: resourceId })
}

// 获取统计数据
export const getResourceStatistics = () => {
  return request.get('/resources/statistics')
}
