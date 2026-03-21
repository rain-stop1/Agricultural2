import request from './request'

// 获取应急方案列表
export const getEmergencyPlans = () => {
  return request.get('/emergency/plans')
}

// 启动应急方案
export const startEmergencyPlan = (data) => {
  return request.post('/emergency/plans', data)
}

// 获取指令列表
export const getCommands = () => {
  return request.get('/emergency/commands')
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
