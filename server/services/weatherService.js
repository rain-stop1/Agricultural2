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
    this.apiKey = process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY'
    this.baseURL = 'https://api.openweathermap.org/data/2.5'
  }

  // 获取实时天气数据
  async getRealWeather(location) {
    try {
      // 如果node-fetch未安装，返回模拟数据
      if (!fetch) {
        return this.getMockWeatherData(location)
      }

      // 使用OpenWeather API接口
      const weatherUrl = `${this.baseURL}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric&lang=zh_cn`
      
      console.log(`调用实时天气API: ${weatherUrl}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

      const weatherResponse = await fetch(weatherUrl, { 
        signal: controller.signal,
        timeout: 10000
      })
      
      clearTimeout(timeoutId)

      console.log(`实时天气API响应状态: ${weatherResponse.status} ${weatherResponse.statusText}`)
      
      if (!weatherResponse.ok) {
        const errorText = await weatherResponse.text()
        console.log(`实时天气API错误响应: ${errorText}`)
        throw new Error(`HTTP ${weatherResponse.status}: ${weatherResponse.statusText} - ${errorText}`)
      }

      const weatherData = await weatherResponse.json()
      console.log(`实时天气API响应数据:`, weatherData)

      if (!weatherData.main) {
        throw new Error('天气API返回数据格式错误')
      }

      // 构建返回数据 - 使用中文城市名称
      const cityName = this.getCityName(location) || location
      
      return {
        region: cityName,
        temperature: parseFloat(weatherData.main.temp || 0),
        humidity: parseFloat(weatherData.main.humidity || 0),
        rainfall: 0, // OpenWeather API需要单独调用降水API
        wind_speed: parseFloat(weatherData.wind.speed || 0),
        wind_direction: this.getWindDirection(weatherData.wind.deg || 0),
        air_pressure: parseFloat(weatherData.main.pressure || 0),
        record_time: new Date(),
        source: 'openweather_api',
        is_mock: false,
        weather_text: weatherData.weather[0].description || '未知',
        weather_code: weatherData.weather[0].id || '0',
        alerts: []
      }
    } catch (error) {
      console.error(`获取${location}真实天气数据失败:`, error.message)
      
      // 所有错误都返回模拟数据
      console.log('🔄 API错误，使用模拟天气数据')
      return this.getMockWeatherData(location)
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

    // 使用中文城市名称
    const cityName = this.getCityName(location) || location

    return {
      region: cityName,
      temperature: temperature,
      humidity: Math.floor(Math.random() * 60 + 30),
      rainfall: Math.random() * 30,
      wind_speed: Math.random() * 15,
      wind_direction: ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][Math.floor(Math.random() * 8)],
      air_pressure: Math.floor(Math.random() * 50 + 980),
      record_time: new Date(),
      source: 'mock_data',
      is_mock: true,
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

      // 使用OpenWeather API的forecast接口
      const forecastUrl = `${this.baseURL}/forecast?q=${encodeURIComponent(location)}&appid=${this.apiKey}&units=metric&lang=zh_cn`
      
      console.log(`调用天气预报API: ${forecastUrl}`)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

      const forecastResponse = await fetch(forecastUrl, { 
        signal: controller.signal,
        timeout: 30000
      })
      
      clearTimeout(timeoutId)

      console.log(`天气预报API响应状态: ${forecastResponse.status} ${forecastResponse.statusText}`)
      
      if (!forecastResponse.ok) {
        const errorText = await forecastResponse.text()
        console.log(`天气预报API错误响应: ${errorText}`)
        throw new Error(`HTTP ${forecastResponse.status}: ${forecastResponse.statusText} - ${errorText}`)
      }

      const forecastData = await forecastResponse.json()
      console.log(`天气预报API响应数据:`, forecastData)

      if (!forecastData.list || forecastData.list.length === 0) {
        throw new Error('天气API返回数据格式错误')
      }

      // 处理OpenWeather API的3小时预报数据，转换为每日预报
      const dailyForecasts = {}
      
      forecastData.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0]
        if (!dailyForecasts[date]) {
          dailyForecasts[date] = {
            date,
            temps: [],
            humidity: [],
            wind_speeds: [],
            rainfall: [],
            rain_probability: [], // 降雨概率
            weather: null
          }
        }
        dailyForecasts[date].temps.push(item.main.temp)
        dailyForecasts[date].humidity.push(item.main.humidity)
        dailyForecasts[date].wind_speeds.push(item.wind.speed)
        // 提取降雨量数据（rain字段包含3h表示3小时的降雨量，单位mm）
        const rainAmount = item.rain && item.rain['3h'] ? item.rain['3h'] : 0
        dailyForecasts[date].rainfall.push(rainAmount)
        // 提取降雨概率（pop字段，取值0-1，转换为百分比）
        const pop = item.pop !== undefined ? item.pop : 0
        dailyForecasts[date].rain_probability.push(pop)
        if (!dailyForecasts[date].weather) {
          dailyForecasts[date].weather = item.weather[0]
        }
      })

      // 转换为所需格式
      return Object.values(dailyForecasts)
        .slice(0, days)
        .map(day => {
          // 计算总降雨量（将所有3小时段的降雨量相加）
          const totalRainfall = day.rainfall.reduce((a, b) => a + b, 0)
          // 计算最大降雨概率（取一天中的最大值，转换为百分比）
          const maxRainProbability = day.rain_probability.length > 0 
            ? Math.max(...day.rain_probability) * 100 
            : 0
          return {
            date: day.date,
            temperature_high: Math.max(...day.temps),
            temperature_low: Math.min(...day.temps),
            humidity: day.humidity.length > 0 ? Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length) : 0,
            rainfall: parseFloat(totalRainfall.toFixed(2)), // 总降雨量（mm）
            rain_probability: Math.round(maxRainProbability), // 降雨概率（%）
            wind_speed: day.wind_speeds.length > 0 ? day.wind_speeds.reduce((a, b) => a + b, 0) / day.wind_speeds.length : 0,
            wind_direction: '无', // OpenWeather API返回的是角度，需要转换
            weather_text: day.weather ? day.weather.description : '未知',
            weather_code: day.weather ? day.weather.id.toString() : '0'
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
    
    // 获取当前最大批序
    let currentBatchOrder = 1
    try {
      const { WarningRecord } = require('../models')
      const maxBatch = await WarningRecord.max('batch_order')
      if (maxBatch) {
        currentBatchOrder = maxBatch + 1
      }
      console.log(`当前批序: ${currentBatchOrder}`)
    } catch (error) {
      console.error('获取批序失败:', error.message)
    }
    
    for (const location of locations) {
      try {
        const weatherData = await this.getRealWeather(location)
        
        // 移除防重复检查，直接创建天气数据记录
        await WeatherData.create(weatherData)
        results.push({ location, success: true, data: weatherData })
        console.log(`✅ ${location} 天气数据同步成功`)
        
        // 自动获取气象局预警
        if (weatherData.alerts && weatherData.alerts.length > 0) {
          console.log(`⚠️ ${location} 检测到 ${weatherData.alerts.length} 条气象局预警`)
          
          // 导入模型
          const { WarningRecord, DisasterType } = require('../models')
          
          // 处理每个预警
          for (const alert of weatherData.alerts) {
            try {
              // 查找对应的灾害类型
              let disasterType = await DisasterType.findOne({
                where: {
                  type_name: alert.type_name
                }
              })
              
              // 如果没有找到，创建新的灾害类型
              if (!disasterType) {
                disasterType = await DisasterType.create({
                  type_name: alert.type_name,
                  type_code: alert.type.toLowerCase(),
                  description: alert.message,
                  warning_criteria: JSON.stringify({})
                })
              }
              
              // 移除重复预警检查，直接创建预警记录
              // 创建预警记录
              const warningData = {
                disaster_type_id: disasterType.id,
                region: alert.city,
                warning_level: alert.level,
                warning_content: alert.message,
                start_time: new Date(alert.effective_time || Date.now()),
                end_time: alert.expire_time ? new Date(alert.expire_time) : null,
                status: 'active',
                batch_order: currentBatchOrder,
                source: 'meteorological_bureau'
              }
              
              await WarningRecord.create(warningData)
              console.log(`✅ 创建气象局预警: ${alert.type_name} - ${alert.city} (批序: ${currentBatchOrder})`)
            } catch (error) {
              console.error(`❌ 创建气象局预警失败:`, error.message)
            }
          }
        }
      } catch (error) {
        console.error(`❌ ${location} 天气数据同步失败:`, error.message)
        results.push({ location, success: false, error: error.message })
      }
      
      // 避免API调用过于频繁
      await new Promise(resolve => setTimeout(resolve, 1000))
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

  // 获取支持的城市列表（117个城市）
  getSupportedCities() {
    return [
      // 直辖市
      { code: 'beijing', name: '北京' },
      { code: 'shanghai', name: '上海' },
      { code: 'tianjin', name: '天津' },
      { code: 'chongqing', name: '重庆' },
      
      // 省会及重点城市
    { code: 'shijiazhuang', name: '石家庄' },
    { code: 'taiyuan', name: '太原' },
    { code: 'hohhot', name: '呼和浩特' },
    { code: 'shenyang', name: '沈阳' },
    { code: 'dalian', name: '大连' },
    { code: 'changchun', name: '长春' },
    { code: 'harbin', name: '哈尔滨' },
    { code: 'nanjing', name: '南京' },
    { code: 'suzhou', name: '苏州' },
    { code: 'hangzhou', name: '杭州' },
    { code: 'hefei', name: '合肥' },
    { code: 'fuzhou', name: '福州' },
    { code: 'xiamen', name: '厦门' },
    { code: 'nanchang', name: '南昌' },
    { code: 'jinan', name: '济南' },
    { code: 'qingdao', name: '青岛' },
    { code: 'zhengzhou', name: '郑州' },
    { code: 'wuhan', name: '武汉' },
    { code: 'changsha', name: '长沙' },
    { code: 'guangzhou', name: '广州' },
    { code: 'shenzhen', name: '深圳' },
    { code: 'nanning', name: '南宁' },
    { code: 'haikou', name: '海口' },
    { code: 'chengdu', name: '成都' },
    { code: 'guiyang', name: '贵阳' },
    { code: 'kunming', name: '昆明' },
    { code: 'lhasa', name: '拉萨' },
    { code: 'xian', name: '西安' },
    { code: 'lanzhou', name: '兰州' },
    { code: 'xining', name: '西宁' },
    { code: 'yinchuan', name: '银川' },
    { code: 'urumqi', name: '乌鲁木齐' },
      
      // 河北省地级市
      { code: 'tangshan', name: '唐山' },
      { code: 'qinhuangdao', name: '秦皇岛' },
      { code: 'handan', name: '邯郸' },
      { code: 'baoding', name: '保定' },
      { code: 'zhangjiakou', name: '张家口' },
      { code: 'chengde', name: '承德' },
      { code: 'cangzhou', name: '沧州' },
      { code: 'langfang', name: '廊坊' },
      { code: 'hengshui', name: '衡水' },
      
      // 山西省地级市
    { code: 'datong', name: '大同' },
    { code: 'yangquan', name: '阳泉' },
    { code: 'changzhi', name: '长治' },
    { code: 'jincheng', name: '晋城' },
    { code: 'shuozhou', name: '朔州' },
    { code: 'jinzhong', name: '晋中' },
    { code: 'yuncheng', name: '运城' },
    { code: 'xinzhou', name: '忻州' },
    { code: 'linfen', name: '临汾' },
    { code: 'lvliang', name: '吕梁' },
      
      // 辽宁省地级市
      { code: 'anshan', name: '鞍山' },
      { code: 'fushun', name: '抚顺' },
      { code: 'benxi', name: '本溪' },
      { code: 'dandong', name: '丹东' },
      { code: 'jinzhou', name: '锦州' },
      { code: 'yingkou', name: '营口' },
      { code: 'fuxin', name: '阜新' },
      { code: 'liaoyang', name: '辽阳' },
      { code: 'panjin', name: '盘锦' },
      { code: 'tieling', name: '铁岭' },
      { code: 'chaoyang', name: '朝阳' },
      { code: 'huludao', name: '葫芦岛' },
      
      // 江苏省地级市
      { code: 'wuxi', name: '无锡' },
      { code: 'xuzhou', name: '徐州' },
      { code: 'changzhou', name: '常州' },
      { code: 'nantong', name: '南通' },
      { code: 'lianyungang', name: '连云港' },
      { code: 'huaian', name: '淮安' },
      { code: 'yancheng', name: '盐城' },
      { code: 'yangzhou', name: '扬州' },
      { code: 'zhenjiang', name: '镇江' },
      { code: 'taizhou', name: '泰州' },
      { code: 'suqian', name: '宿迁' },
      
      // 浙江省地级市
      { code: 'ningbo', name: '宁波' },
      { code: 'wenzhou', name: '温州' },
      { code: 'jiaxing', name: '嘉兴' },
      { code: 'huzhou', name: '湖州' },
      { code: 'shaoxing', name: '绍兴' },
      { code: 'jinhua', name: '金华' },
      { code: 'quzhou', name: '衢州' },
      { code: 'zhoushan', name: '舟山' },
      { code: 'taizhou', name: '台州' },
      { code: 'lishui', name: '丽水' },
      
      // 山东省地级市
      { code: 'zibo', name: '淄博' },
      { code: 'zaozhuang', name: '枣庄' },
      { code: 'dongying', name: '东营' },
      { code: 'yantai', name: '烟台' },
      { code: 'weifang', name: '潍坊' },
      { code: 'jining', name: '济宁' },
      { code: 'taian', name: '泰安' },
      { code: 'weihai', name: '威海' },
      { code: 'rizhao', name: '日照' },
      { code: 'linyi', name: '临沂' },
      { code: 'dezhou', name: '德州' },
      { code: 'liaocheng', name: '聊城' },
      { code: 'binzhou', name: '滨州' },
      { code: 'heze', name: '菏泽' },
      
      // 广东省地级市
      { code: 'zhuhai', name: '珠海' },
      { code: 'shantou', name: '汕头' },
      { code: 'foshan', name: '佛山' },
      { code: 'jiangmen', name: '江门' },
      { code: 'zhanjiang', name: '湛江' },
      { code: 'maoming', name: '茂名' },
      { code: 'zhaoqing', name: '肇庆' },
      { code: 'huizhou', name: '惠州' },
      { code: 'meizhou', name: '梅州' },
      { code: 'shanwei', name: '汕尾' },
      { code: 'dongguan', name: '东莞' },
      { code: 'zhongshan', name: '中山' },
      { code: 'chaozhou', name: '潮州' },
      { code: 'jieyang', name: '揭阳' },
      { code: 'yunfu', name: '云浮' }
    ]
  }

  // 获取城市代码获取中文名称
  getCityName(code) {
    const city = this.getSupportedCities().find(c => c.code === code)
    return city ? city.name : code
  }

  // 获取气象局发布的灾害预警
  async getMeteorologicalAlerts(location) {
    try {
      // OpenWeather API 没有直接提供气象灾害预警的接口
      console.log(`OpenWeather API 不支持直接获取气象局灾害预警，返回空数组`)
      return []
    } catch (error) {
      console.error(`获取${location}气象局灾害预警失败:`, error.message)
      return []
    }
  }

  // 映射预警级别
  mapAlarmLevel(level) {
    const levelMap = {
      'blue': 'light',
      'yellow': 'moderate',
      'orange': 'severe',
      'red': 'severe'
    }
    return levelMap[level] || 'moderate'
  }
}

module.exports = new WeatherService()
