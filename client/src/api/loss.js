import request from './request'

// 获取损失上报列表
export const getLossReports = (params) => {
  return request.get('/loss/reports', { params })
}

// 提交损失上报
export const submitLossReport = (data) => {
  return request.post('/loss/reports', data)
}

// 审核损失上报
export const approveLossReport = (id, data) => {
  return request.put(`/loss/reports/${id}/approve`, data)
}

// 删除损失上报
export const deleteLossReport = (id) => {
  return request.delete(`/loss/reports/${id}`)
}

// 获取统计数据
export const getLossStatistics = () => {
  return request.get('/loss/statistics')
}
