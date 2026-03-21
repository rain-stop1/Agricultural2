import request from './request'

// 获取作物列表（农户可访问）
export const getCropList = (params) => {
  return request({
    url: '/farmer/crops',
    method: 'get',
    params
  })
}
