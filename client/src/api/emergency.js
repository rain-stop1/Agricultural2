import request from './request'

// 获取应急方案列表
export const getEmergencyPlans = (params) => {
  return request.get('/emergency/plans', { params })
}

// 创建预案
export const createEmergencyTemplate = (data) => {
  return request.post('/emergency/plans/template', data)
}

// 激活预案
export const activateEmergencyPlan = (planId, targetArea) => {
  return request.post(`/emergency/plans/${planId}/activate`, { target_area: targetArea })
}

// 启动应急方案
export const startEmergencyPlan = (data) => {
  return request.post('/emergency/plans', data)
}

// 获取指令列表
export const getCommands = (params) => {
  return request.get('/emergency/commands', { params })
}

// 发布指令
export const publishCommand = (data) => {
  return request.post('/emergency/commands', data)
}

// 获取执行反馈列表
export const getFeedbacks = () => {
  return request.get('/emergency/feedbacks')
}

// 提交执行反馈
export const submitFeedback = (data) => {
  return request.post('/emergency/feedbacks', data)
}

// 取消应急方案
export const cancelEmergencyPlan = (planId, data) => {
  return request.post(`/emergency/plans/${planId}/cancel`, data)
}

// 完成应急方案
export const completeEmergencyPlan = (planId, data) => {
  return request.post(`/emergency/plans/${planId}/complete`, data)
}
