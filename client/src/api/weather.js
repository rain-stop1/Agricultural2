import request from './request'

// 获取实时天气（走后端 OpenWeather 接口）
export const getRealWeather = (location) => {
  return request({
    url: `/weather/real/${location}`,
    method: 'get'
  })
}

// 获取多日天气预报（走后端 OpenWeather 接口）
export const getWeatherForecast = (location, days = 3) => {
  return request({
    url: `/weather/forecast/${location}`,
    method: 'get',
    params: { days }
  })
}

// 提交实时天气数据到后端
export const submitRealWeatherData = (weatherData) => {
  return request({
    url: '/weather',
    method: 'post',
    data: weatherData
  })
}

// 获取支持的地区列表
export const getSupportedRegions = () => {
  return [
    { code: 'beijing', name: '北京' },
    { code: 'shanghai', name: '上海' },
    { code: 'guangzhou', name: '广州' },
    { code: 'shenzhen', name: '深圳' },
    { code: 'hangzhou', name: '杭州' },
    { code: 'nanjing', name: '南京' },
    { code: 'wuhan', name: '武汉' },
    { code: 'chengdu', name: '成都' },
    { code: 'xian', name: '西安' },
    { code: 'tianjin', name: '天津' },
    { code: 'chongqing', name: '重庆' },
    { code: 'shijiazhuang', name: '石家庄' },
    { code: 'jinan', name: '济南' },
    { code: 'qingdao', name: '青岛' },
    { code: 'dalian', name: '大连' },
    { code: 'xiamen', name: '厦门' },
    { code: 'suzhou', name: '苏州' },
    { code: 'zhengzhou', name: '郑州' },
    { code: 'changsha', name: '长沙' },
    { code: 'hefei', name: '合肥' }
  ]
}