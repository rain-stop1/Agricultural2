const { WeatherData } = require('../models')

// 尝试不同的fetch实现
let fetch
try {
  fetch = require('node-fetch')
} catch (error) {
  console.log('⚠️  node-fetch未安装，将使用模拟天气数据')
  fetch = null
}

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY || 'demo'
    this.baseURL = 'https://api.openweathermap.org/data/2.5'
  }

  // 获取实时天气数据
  async getRealWeather(location) {
    try {
      // 如果node-fetch未安装，返回模拟数据
      if (!fetch) {
        return this.getMockWeatherData(location)
      }

      // 获取当前天气
      const weatherUrl = `${this.baseURL}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric&lang=zh_cn`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

      const response = await fetch(weatherUrl, { 
        signal: controller.signal,
        timeout: 10000
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.cod !== 200) {
        throw new Error(data.message || `天气API错误代码: ${data.cod}`)
      }

      // 获取降雨量（通过One Call API获取更详细的数据）
      let rainfall = 0
      try {
        const lat = data.coord.lat
        const lon = data.coord.lon
        const oneCallUrl = `${this.baseURL}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&exclude=minutely,hourly,daily,alerts`
        
        const oneCallResponse = await fetch(oneCallUrl, { 
          signal: controller.signal,
          timeout: 5000
        })
        
        if (oneCallResponse.ok) {
          const oneCallData = await oneCallResponse.json()
          // 当前小时的降雨量（mm）
          rainfall = oneCallData.current?.rain?.['1h'] || oneCallData.current?.snow?.['1h'] || 0
        }
      } catch (rainError) {
        console.log('获取降雨量数据失败，使用默认值:', rainError.message)
        rainfall = Math.random() * 10 // 备用模拟值
      }

      return {
        region: location,
        temperature: parseFloat(data.main.temp),
        humidity: parseFloat(data.main.humidity),
        rainfall: parseFloat(rainfall),
        wind_speed: parseFloat(data.wind?.speed || 0),
        wind_direction: this.getWindDirection(data.wind?.deg || 0),
        air_pressure: parseFloat(data.main.pressure),
        record_time: new Date(),
        source: 'openweather_api',
        weather_text: data.weather[0]?.description || '',
        weather_code: data.weather[0]?.id?.toString() || ''
      }
    } catch (error) {
      console.error(`获取${location}真实天气数据失败:`, error.message)
      
      // 如果是网络错误，返回模拟数据
      if (error.message.includes('ECONNREFUSED') || 
          error.message.includes('ENOTFOUND') || 
          error.message.includes('timeout') ||
          error.message.includes('401') ||
          error.message.includes('403')) {
        console.log('🔄 API错误，使用模拟天气数据')
        return this.getMockWeatherData(location)
      }
      
      throw error
    }
  }

  // 将风向角度转换为方向文字
  getWindDirection(degree) {
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
    const index = Math.round(degree / 45) % 8
    return directions[index]
  }

  // 获取模拟天气数据（备用方案）
  getMockWeatherData(location) {
    const weatherConditions = [
      { text: '晴', code: '0', tempRange: [20, 35] },
      { text: '多云', code: '1', tempRange: [18, 30] },
      { text: '阴', code: '2', tempRange: [15, 25] },
      { text: '小雨', code: '12', tempRange: [12, 22] },
      { text: '中雨', code: '13', tempRange: [10, 20] }
    ]

    const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]
    const temperature = Math.floor(Math.random() * (condition.tempRange[1] - condition.tempRange[0]) + condition.tempRange[0])

    return {
      region: location,
      temperature: temperature,
      humidity: Math.floor(Math.random() * 60 + 30),
      rainfall: Math.random() * 30,
      wind_speed: Math.random() * 15,
      wind_direction: ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][Math.floor(Math.random() * 8)],
      air_pressure: Math.floor(Math.random() * 50 + 980),
      record_time: new Date(),
      source: 'mock_data',
      weather_text: condition.text,
      weather_code: condition.code
    }
  }

  // 获取天气预报
  async getWeatherForecast(location, days = 3) {
    try {
      // 如果node-fetch未安装，返回模拟数据
      if (!fetch) {
        return this.getMockForecastData(location, days)
      }

      // 首先获取城市坐标
      const geoUrl = `${this.baseURL}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const geoResponse = await fetch(geoUrl, { 
        signal: controller.signal,
        timeout: 5000
      })
      
      if (!geoResponse.ok) {
        throw new Error(`获取城市坐标失败: HTTP ${geoResponse.status}`)
      }

      const geoData = await geoResponse.json()
      
      if (geoData.cod !== 200) {
        throw new Error(geoData.message || `天气API错误代码: ${geoData.cod}`)
      }

      const { lat, lon } = geoData.coord

      // 使用One Call API获取天气预报
      const forecastUrl = `${this.baseURL}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&exclude=current,minutely,hourly,alerts`

      const forecastResponse = await fetch(forecastUrl, { 
        signal: controller.signal,
        timeout: 10000
      })
      
      clearTimeout(timeoutId)

      if (!forecastResponse.ok) {
        throw new Error(`获取天气预报失败: HTTP ${forecastResponse.status}`)
      }

      const forecastData = await forecastResponse.json()

      return forecastData.daily.slice(0, days).map(day => {
        const date = new Date(day.dt * 1000).toISOString().split('T')[0]
        return {
          date: date,
          temperature_high: parseFloat(day.temp.max),
          temperature_low: parseFloat(day.temp.min),
          humidity: parseFloat(day.humidity),
          rainfall: parseFloat(day.rain?.['24h'] || day.snow?.['24h'] || 0),
          wind_speed: parseFloat(day.wind_speed),
          wind_direction: this.getWindDirection(day.wind_deg),
          weather_text: day.weather[0]?.description || '',
          weather_code: day.weather[0]?.id?.toString() || ''
        }
      })
    } catch (error) {
      console.error('获取天气预报失败:', error.message)
      
      // 网络错误时返回模拟数据
      if (error.message.includes('ECONNREFUSED') || 
          error.message.includes('ENOTFOUND') || 
          error.message.includes('timeout') ||
          error.message.includes('401') ||
          error.message.includes('403')) {
        console.log('🔄 API错误，使用模拟天气预报数据')
        return this.getMockForecastData(location, days)
      }
      
      throw error
    }
  }

  // 获取模拟天气预报数据（备用方案）
  getMockForecastData(location, days) {
    const forecast = []
    const today = new Date()
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      const tempHigh = Math.floor(Math.random() * 15 + 20)
      const tempLow = Math.floor(Math.random() * 10 + 10)
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        temperature_high: tempHigh,
        temperature_low: tempLow,
        humidity: Math.floor(Math.random() * 40 + 40),
        rainfall: Math.random() * 20,
        wind_speed: Math.random() * 12,
        wind_direction: ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][Math.floor(Math.random() * 8)],
        weather_text: ['晴', '多云', '阴', '小雨'][Math.floor(Math.random() * 4)],
        weather_code: Math.floor(Math.random() * 20).toString()
      })
    }
    
    return forecast
  }

  // 自动同步天气数据到数据库
  async syncWeatherData(locations) {
    const results = []
    
    for (const location of locations) {
      try {
        const weatherData = await this.getRealWeather(location)
        
        // 检查是否已存在相同时间的记录（避免重复）
        const existing = await WeatherData.findOne({
          where: {
            region: location,
            record_time: {
              [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 60 * 1000) // 30分钟内
            }
          }
        })

        if (!existing) {
          await WeatherData.create(weatherData)
          results.push({ location, success: true, data: weatherData })
          console.log(`✅ ${location} 天气数据同步成功`)
        } else {
          results.push({ location, success: true, message: '数据已是最新' })
          console.log(`⏭️  ${location} 数据已是最新，跳过`)
        }
      } catch (error) {
        console.error(`❌ ${location} 天气数据同步失败:`, error.message)
        results.push({ location, success: false, error: error.message })
      }
    }

    return results
  }

  // 检测潜在灾害（基于数据库配置）
  async detectDisasters(weatherData) {
    const risks = []
    
    try {
      // 从数据库获取所有灾害类型及其阈值配置
      const { DisasterType } = require('../models')
      const disasterTypes = await DisasterType.findAll({
        where: {
          warning_criteria: {
            [require('sequelize').Op.ne]: null
          }
        }
      })
      
      // 遍历每个灾害类型，检查是否满足预警条件
      for (const disasterType of disasterTypes) {
        if (!disasterType.warning_criteria) continue
        
        let criteria = disasterType.warning_criteria
        
        // 如果是字符串，尝试解析为JSON
        if (typeof criteria === 'string') {
          try {
            criteria = JSON.parse(criteria)
          } catch (error) {
            console.error(`解析灾害类型 ${disasterType.type_name} 的阈值配置失败:`, error)
            continue
          }
        }
        
        // 检查是否满足所有条件
        const result = this.evaluateCriteria(criteria, weatherData)
        
        if (result.matched) {
          // 将城市代码转换为中文名称
          const cityName = this.getCityName(weatherData.region) || weatherData.region
          
          risks.push({
            type: disasterType.type_code,
            type_id: disasterType.id,
            type_name: disasterType.type_name,
            level: result.level,
            message: `检测到${cityName}存在${disasterType.type_name}风险：${result.reason}`,
            details: result.details
          })
        }
      }
      
      return risks
    } catch (error) {
      console.error('检测灾害失败:', error)
      // 如果数据库查询失败，返回空数组而不是抛出错误
      return []
    }
  }

  // 评估预警条件
  evaluateCriteria(criteria, weatherData) {
    // 支持两种格式：
    // 1. 数组格式（多个条件）: [{ type, operator, value, level }]
    // 2. 对象格式（按级别分组）: { severe: [...], moderate: [...], light: [...] }
    
    if (Array.isArray(criteria)) {
      return this.evaluateArrayCriteria(criteria, weatherData)
    } else if (typeof criteria === 'object') {
      return this.evaluateLeveledCriteria(criteria, weatherData)
    }
    
    return { matched: false }
  }

  // 评估数组格式的条件
  evaluateArrayCriteria(conditions, weatherData) {
    const details = []
    let allMatched = true
    let maxLevel = 'light'
    
    for (const condition of conditions) {
      const { type, operator, value, level = 'moderate' } = condition
      const actualValue = this.getWeatherValue(type, weatherData)
      
      if (actualValue === null) {
        allMatched = false
        continue
      }
      
      const matched = this.compareValues(actualValue, operator, value)
      details.push({
        parameter: type,
        expected: `${operator} ${value}`,
        actual: actualValue,
        matched
      })
      
      if (!matched) {
        allMatched = false
      } else {
        // 更新最高级别
        if (this.getLevelPriority(level) > this.getLevelPriority(maxLevel)) {
          maxLevel = level
        }
      }
    }
    
    if (allMatched && details.length > 0) {
      const reason = details
        .filter(d => d.matched)
        .map(d => `${this.getParameterName(d.parameter)}${d.expected}(实际${d.actual})`)
        .join('，')
      
      return {
        matched: true,
        level: maxLevel,
        reason,
        details
      }
    }
    
    return { matched: false }
  }

  // 评估分级格式的条件
  evaluateLeveledCriteria(criteria, weatherData) {
    // 按优先级检查：severe > moderate > light
    const levels = ['severe', 'moderate', 'light']
    
    for (const level of levels) {
      if (criteria[level] && Array.isArray(criteria[level])) {
        const result = this.evaluateArrayCriteria(criteria[level], weatherData)
        if (result.matched) {
          return {
            ...result,
            level
          }
        }
      }
    }
    
    return { matched: false }
  }

  // 获取天气参数值
  getWeatherValue(type, weatherData) {
    const mapping = {
      'temperature': weatherData.temperature,
      'humidity': weatherData.humidity,
      'rainfall': weatherData.rainfall,
      'wind_speed': weatherData.wind_speed,
      'air_pressure': weatherData.air_pressure
    }
    
    return mapping[type] !== undefined ? mapping[type] : null
  }

  // 比较值
  compareValues(actual, operator, expected) {
    switch (operator) {
      case '>':
        return actual > expected
      case '<':
        return actual < expected
      case '>=':
        return actual >= expected
      case '<=':
        return actual <= expected
      case '=':
      case '==':
        return actual === expected
      case '!=':
        return actual !== expected
      default:
        return false
    }
  }

  // 获取级别优先级
  getLevelPriority(level) {
    const priorities = {
      'light': 1,
      'moderate': 2,
      'severe': 3
    }
    return priorities[level] || 0
  }

  // 获取参数中文名称
  getParameterName(type) {
    const names = {
      'temperature': '温度',
      'humidity': '湿度',
      'rainfall': '降雨量',
      'wind_speed': '风速',
      'air_pressure': '气压'
    }
    return names[type] || type
  }

  // 获取支持的城市列表
  getSupportedCities() {
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

  // 根据城市代码获取中文名称
  getCityName(code) {
    const city = this.getSupportedCities().find(c => c.code === code)
    return city ? city.name : code
  }
}

module.exports = new WeatherService()
