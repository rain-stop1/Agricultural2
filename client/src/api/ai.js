import request from './request'

// AI相关API
export const aiApi = {
  // 发送消息给AI
  sendMessage: (data) => {
    return request({
      url: '/ai/chat',
      method: 'post',
      data
    })
  }
}