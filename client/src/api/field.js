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

// 管理员：获取所有地块
export const getFields = (params) => {
  return request({
    url: '/fields/admin/all',
    method: 'get',
    params
  })
}

// 管理员：获取地块详情
export const getFieldById = (id) => {
  return request({
    url: `/fields/admin/${id}`,
    method: 'get'
  })
}

// 管理员：更新地块
export const updateFieldAdmin = (id, data) => {
  return request({
    url: `/fields/admin/${id}`,
    method: 'put',
    data
  })
}

// 管理员：删除地块
export const deleteFieldAdmin = (id) => {
  return request({
    url: `/fields/admin/${id}`,
    method: 'delete'
  })
}
