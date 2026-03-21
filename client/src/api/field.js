import request from './request'

// 获取我的地块列表
export const getMyFields = (params) => {
  return request({
    url: '/fields/my',
    method: 'get',
    params
  })
}

// 获取地块详情
export const getFieldDetail = (id) => {
  return request({
    url: `/fields/${id}`,
    method: 'get'
  })
}

// 创建地块
export const createField = (data) => {
  return request({
    url: '/fields',
    method: 'post',
    data
  })
}

// 更新地块
export const updateField = (id, data) => {
  return request({
    url: `/fields/${id}`,
    method: 'put',
    data
  })
}

// 删除地块
export const deleteField = (id) => {
  return request({
    url: `/fields/${id}`,
    method: 'delete'
  })
}
