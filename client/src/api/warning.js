import request from './request'

// 获取预警列表
export const getWarningList = (params) => {
  return request({
    url: '/warning',
    method: 'get',
    params
  })
}

// 获取预警详情
export const getWarningDetail = (id) => {
  return request({
    url: `/warning/${id}`,
    method: 'get'
  })
}

// 创建预警
export const createWarning = (data) => {
  return request({
    url: '/warning',
    method: 'post',
    data
  })
}

// 更新预警
export const updateWarning = (id, data) => {
  return request({
    url: `/warning/${id}`,
    method: 'put',
    data
  })
}

// 取消预警
export const cancelWarningRecord = (id) => {
  return request({
    url: `/warning/${id}`,
    method: 'put',
    data: {
      status: 'cancelled'
    }
  })
}

// 删除预警
export const deleteWarning = (id) => {
  return request({
    url: `/warning/${id}`,
    method: 'delete'
  })
}

// 获取预警统计
export const getWarningStatistics = () => {
  return request({
    url: '/warning/statistics/overview',
    method: 'get'
  })
}