import request from './request'

// 获取通知列表
export const getNotifications = () => {
  return request.get('/notification')
}

// 标记通知为已读
export const markNotificationAsRead = (notificationId) => {
  return request.put(`/notification/${notificationId}/read`)
}

// 删除通知
export const deleteNotification = (notificationId) => {
  return request.delete(`/notification/${notificationId}`)
}

// 获取未读通知数量
export const getUnreadCount = () => {
  return request.get('/notification/unread-count')
}