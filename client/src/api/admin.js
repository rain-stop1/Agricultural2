import request from './request'

// 用户管理相关API
export const userApi = {
  // 获取用户列表
  getUsers: () => {
    return request({
      url: '/admin/users',
      method: 'get'
    })
  },
  
  // 获取单个用户信息
  getUser: (id) => {
    return request({
      url: `/admin/users/${id}`,
      method: 'get'
    })
  },
  
  // 创建用户
  createUser: (data) => {
    return request({
      url: '/admin/users',
      method: 'post',
      data
    })
  },
  
  // 更新用户信息
  updateUser: (id, data) => {
    return request({
      url: `/admin/users/${id}`,
      method: 'put',
      data
    })
  },
  
  // 删除用户
  deleteUser: (id) => {
    return request({
      url: `/admin/users/${id}`,
      method: 'delete'
    })
  }
}

// 系统管理相关API
export const systemApi = {
  // 获取系统信息
  getSystemInfo: () => {
    return request({
      url: '/admin/system/info',
      method: 'get'
    })
  },
  
  // 获取系统日志
  getSystemLogs: () => {
    return request({
      url: '/admin/system/logs',
      method: 'get'
    })
  }
}

// 数据管理相关API
export const dataApi = {
  // 获取基础数据
  getBasicData: () => {
    return request({
      url: '/admin/data/basic',
      method: 'get'
    })
  },
  
  // 更新基础数据
  updateBasicData: (data) => {
    return request({
      url: '/admin/data/basic',
      method: 'put',
      data
    })
  }
}
