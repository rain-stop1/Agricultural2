import request from './request'

// 灾害类型相关API
export const disasterTypeApi = {
  // 获取灾害类型列表
  getDisasterTypes: () => {
    return request({
      url: '/disaster-types',
      method: 'get'
    })
  },
  
  // 获取单个灾害类型详情
  getDisasterType: (id) => {
    return request({
      url: `/disaster-types/${id}`,
      method: 'get'
    })
  },
  
  // 创建灾害类型
  createDisasterType: (data) => {
    return request({
      url: '/disaster-types',
      method: 'post',
      data
    })
  },
  
  // 更新灾害类型
  updateDisasterType: (id, data) => {
    return request({
      url: `/disaster-types/${id}`,
      method: 'put',
      data
    })
  },
  
  // 删除灾害类型
  deleteDisasterType: (id) => {
    return request({
      url: `/disaster-types/${id}`,
      method: 'delete'
    })
  }
}
