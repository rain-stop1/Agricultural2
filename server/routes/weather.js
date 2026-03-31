const express = require('express')
const { body, validationResult } = require('express-validator')
const { WeatherData } = require('../models')
const { Op } = require('sequelize')
const { authenticateToken } = require('../middleware/auth')
const weatherService = require('../services/weatherService')

const router = express.Router()

// 气象数据验证规则
const weatherValidation = [
  body('region').notEmpty().withMessage('地区不能为空').isLength({ max: 100 }).withMessage('地区名称不能超过100个字符'),
  body('temperature').optional().isFloat({ min: -50, max: 60 }).withMessage('温度必须在-50°C到60°C之间'),
  body('humidity').optional().isFloat({ min: 0, max: 100 }).withMessage('湿度必须在0%到100%之间'),
  body('rainfall').optional().isFloat({ min: 0 }).withMessage('降雨量不能为负数'),
  body('wind_speed').optional().isFloat({ min: 0 }).withMessage('风速不能为负数'),
  body('wind_direction').optional().isLength({ max: 10 }).withMessage('风向不能超过10个字符'),
  body('air_pressure').optional().isFloat({ min: 800, max: 1200 }).withMessage('气压必须在800hPa到1200hPa之间')
  // 移除 record_time 验证，使用当前时间
]

// 处理验证错误
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      errors: errors.array()
    })
  }
  next()
}

// 提交气象数据
router.post('/', [
  // 暂时移除认证，方便测试
  // authenticateToken,
  weatherValidation,
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      region,
      temperature,
      humidity,
      rainfall,
      wind_speed,
      wind_direction,
      air_pressure
    } = req.body

    // 创建气象数据记录，使用当前时间作为 record_time
    const weatherData = await WeatherData.create({
      region,
      temperature,
      humidity,
      rainfall,
      wind_speed,
      wind_direction,
      air_pressure,
      record_time: new Date()
    })

    // 自动触发预警检测
    try {
      const { WarningRecord, DisasterType } = require('../models')
      
      // 获取当前最大批序
      let currentBatchOrder = 1
      try {
        const maxBatch = await WarningRecord.max('batch_order')
        if (maxBatch) {
          currentBatchOrder = maxBatch + 1
        }
        console.log(`当前批序: ${currentBatchOrder}`)
      } catch (error) {
        console.error('获取批序失败:', error.message)
      }
      
      // 获取所有灾害类型
      const disasterTypes = await DisasterType.findAll()
      
      // 分析当前天气数据
      const detectedWarnings = []
      for (const disasterType of disasterTypes) {
        const warning = await analyzeWeatherForDisaster(weatherData, disasterType, region)
        if (warning) {
          detectedWarnings.push(warning)
        }
      }
      
      // 批量创建预警记录
      const createdWarnings = []
      for (const warningData of detectedWarnings) {
        try {
          // 移除重复预警检查，直接创建预警记录
          // 添加预警来源和批序
          warningData.source = 'threshold'
          warningData.batch_order = currentBatchOrder
          const createdWarning = await WarningRecord.create(warningData)
          
          // 获取完整的预警信息
          const fullWarning = await WarningRecord.findByPk(createdWarning.id, {
            include: [
              {
                model: DisasterType,
                as: 'disasterType',
                attributes: ['id', 'type_name', 'type_code']
              }
            ]
          })
          
          // 添加来源信息
          fullWarning.source = 'threshold'
          createdWarnings.push(fullWarning)
        } catch (error) {
          console.error('创建预警记录错误:', error)
        }
      }
      
      console.log(`预警检测完成: 检测到 ${detectedWarnings.length} 条预警，创建 ${createdWarnings.length} 条记录`)
    } catch (error) {
      console.error('自动预警检测失败:', error.message)
      // 不影响天气数据提交的成功响应
    }

    res.status(201).json({
      code: 200,
      message: '气象数据提交成功',
      data: weatherData
    })
  } catch (error) {
    console.error('提交气象数据错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 分析气象数据判断是否触发预警（使用数据库阈值配置）
async function analyzeWeatherForDisaster(weatherData, disasterType, region) {
  const criteria = disasterType.warning_criteria || {}
  
  // 将字符串转换为数值
  const temp = parseFloat(weatherData.temperature || 0)
  const humidity = parseFloat(weatherData.humidity || 0)
  const rainfall = parseFloat(weatherData.rainfall || 0)
  const windSpeed = parseFloat(weatherData.wind_speed || 0)
  const airPressure = parseFloat(weatherData.air_pressure || 0)
  
  // 按严重程度顺序检查：severe > moderate > light
  const levels = ['severe', 'moderate', 'light']
  
  for (const level of levels) {
    if (criteria[level] && Array.isArray(criteria[level])) {
      const levelCriteria = criteria[level]
      let allConditionsMet = true
      
      for (const condition of levelCriteria) {
        const { type, operator, value } = condition
        let actualValue = null
        
        switch (type) {
          case 'temperature':
            actualValue = temp
            break
          case 'humidity':
            actualValue = humidity
            break
          case 'rainfall':
            actualValue = rainfall
            break
          case 'wind_speed':
            actualValue = windSpeed
            break
          case 'air_pressure':
            actualValue = airPressure
            break
          default:
            actualValue = null
        }
        
        if (actualValue === null) {
          allConditionsMet = false
          break
        }
        
        // 检查条件
        let conditionMet = false
        switch (operator) {
          case '>':
            conditionMet = actualValue > value
            break
          case '<':
            conditionMet = actualValue < value
            break
          case '>=':
            conditionMet = actualValue >= value
            break
          case '<=':
            conditionMet = actualValue <= value
            break
          case '=':
          case '==':
            conditionMet = actualValue == value
            break
          default:
            conditionMet = false
        }
        
        if (!conditionMet) {
          allConditionsMet = false
          break
        }
      }
      
      if (allConditionsMet) {
        // 生成预警内容
        let warningContent = `检测到${region}地区出现${disasterType.type_name}风险`
        
        // 根据灾害类型添加详细信息
        switch (disasterType.type_code) {
          case 'drought':
            warningContent = `检测到${region}地区出现${disasterType.type_name}风险：温度${temp}°C，湿度${humidity}%，24小时降雨量${rainfall}mm，请做好防旱准备。`
            break
          case 'flood':
            warningContent = `检测到${region}地区出现${disasterType.type_name}风险：24小时降雨量${rainfall}mm，湿度${humidity}%，请做好防汛准备。`
            break
          case 'typhoon':
            warningContent = `检测到${region}地区出现${disasterType.type_name}风险：风速${windSpeed}m/s，风向${weatherData.wind_direction}，请做好防台准备。`
            break
          case 'hail':
            warningContent = `检测到${region}地区出现${disasterType.type_name}风险：温度${temp}°C，湿度${humidity}%，请做好防护准备。`
            break
          case 'pest':
            warningContent = `检测到${region}地区出现${disasterType.type_name}风险：温度${temp}°C，湿度${humidity}%，请做好病虫害防治。`
            break
        }
        
        return {
          disaster_type_id: disasterType.id,
          region,
          warning_level: level,
          warning_content: warningContent,
          start_time: new Date(),
          status: 'active'
        }
      }
    }
  }
  
  return null
}

// 评估自定义预警标准
function evaluateCustomCriteria(weatherData, criteria) {
  for (const [key, condition] of Object.entries(criteria)) {
    const weatherValue = weatherData[key]
    if (weatherValue === undefined || weatherValue === null) continue
    
    if (condition.min && weatherValue < condition.min) return true
    if (condition.max && weatherValue > condition.max) return true
    if (condition.equals && weatherValue !== condition.equals) return true
    if (condition.not_equals && weatherValue === condition.not_equals) return true
  }
  
  return false
}

// 获取气象数据列表
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const offset = (page - 1) * limit
    const { region, start_date, end_date } = req.query

    // 构建查询条件
    const whereClause = {}
    
    if (region) {
      whereClause.region = { [Op.like]: `%${region}%` }
    }
    
    if (start_date && end_date) {
      whereClause.record_time = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      }
    } else if (start_date) {
      whereClause.record_time = {
        [Op.gte]: new Date(start_date)
      }
    } else if (end_date) {
      whereClause.record_time = {
        [Op.lte]: new Date(end_date)
      }
    }

    const { count, rows: weatherData } = await WeatherData.findAndCountAll({
      where: whereClause,
      order: [['record_time', 'DESC']],
      limit,
      offset
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        weatherData,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取气象数据错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 获取最新气象数据
router.get('/latest/:region', async (req, res) => {
  try {
    const { region } = req.params

    const latestWeather = await WeatherData.findOne({
      where: { region },
      order: [['record_time', 'DESC']]
    })

    if (!latestWeather) {
      return res.status(404).json({
        code: 404,
        message: '未找到该地区的气象数据'
      })
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: latestWeather
    })
  } catch (error) {
    console.error('获取最新气象数据错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 获取真实天气数据
router.get('/real/:location', async (req, res) => {
  try {
    const { location } = req.params
    
    const weatherData = await weatherService.getRealWeather(location)
    
    res.json({
      code: 200,
      message: '获取成功',
      data: weatherData
    })
  } catch (error) {
    console.error('获取真实天气数据错误:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取天气数据失败'
    })
  }
})

// 获取天气预报
router.get('/forecast/:location', async (req, res) => {
  try {
    const { location } = req.params
    const { days = 3 } = req.query
    
    const forecastData = await weatherService.getWeatherForecast(location, parseInt(days))
    
    res.json({
      code: 200,
      message: '获取成功',
      data: forecastData
    })
  } catch (error) {
    console.error('获取天气预报错误:', error)
    res.status(500).json({
      code: 500,
      message: error.message || '获取天气预报失败'
    })
  }
})

// 同步天气数据（批量）
router.post('/sync', [
  authenticateToken
], async (req, res) => {
  try {
    const { locations } = req.body
    
    if (!locations || !Array.isArray(locations)) {
      return res.status(400).json({
        code: 400,
        message: '请提供要同步的地区列表'
      })
    }

    const results = await weatherService.syncWeatherData(locations)
    
    res.json({
      code: 200,
      message: '天气数据同步完成',
      data: results
    })
  } catch (error) {
    console.error('同步天气数据错误:', error)
    res.status(500).json({
      code: 500,
      message: '同步天气数据失败'
    })
  }
})

// 获取支持的城市列表
router.get('/cities', async (req, res) => {
  try {
    const cities = weatherService.getSupportedCities()
    
    res.json({
      code: 200,
      message: '获取成功',
      data: cities
    })
  } catch (error) {
    console.error('获取城市列表错误:', error)
    res.status(500).json({
      code: 500,
      message: '获取城市列表失败'
    })
  }
})

// 灾害风险检测
router.post('/detect-disasters', async (req, res) => {
  try {
    const { location } = req.body
    
    const weatherData = await weatherService.getRealWeather(location)
    const risks = await weatherService.detectDisasters(weatherData)
    
    res.json({
      code: 200,
      message: '检测完成',
      data: {
        weather: weatherData,
        risks
      }
    })
  } catch (error) {
    console.error('灾害风险检测错误:', error)
    res.status(500).json({
      code: 500,
      message: '灾害风险检测失败'
    })
  }
})

// 批量提交天气数据（统一批序）
router.post('/batch', [
  // authenticateToken,
  handleValidationErrors
], async (req, res) => {
  try {
    const { weatherDataList } = req.body
    
    if (!weatherDataList || !Array.isArray(weatherDataList) || weatherDataList.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供天气数据列表'
      })
    }
    
    const { WarningRecord, DisasterType } = require('../models')
    
    // 获取当前最大批序（只获取一次）
    let currentBatchOrder = 1
    try {
      const maxBatch = await WarningRecord.max('batch_order')
      if (maxBatch) {
        currentBatchOrder = maxBatch + 1
      }
      console.log(`批量提交 - 统一批序: ${currentBatchOrder}`)
    } catch (error) {
      console.error('获取批序失败:', error.message)
    }
    
    // 获取所有灾害类型
    const disasterTypes = await DisasterType.findAll()
    
    const results = []
    const allWarnings = []
    
    // 处理每个城市的天气数据
    for (const weatherData of weatherDataList) {
      try {
        const {
          region,
          temperature,
          humidity,
          rainfall,
          wind_speed,
          wind_direction,
          air_pressure
        } = weatherData
        
        // 创建天气数据记录
        const createdWeatherData = await WeatherData.create({
          region,
          temperature,
          humidity,
          rainfall,
          wind_speed,
          wind_direction,
          air_pressure,
          record_time: new Date()
        })
        
        // 分析天气数据，检测预警
        const detectedWarnings = []
        for (const disasterType of disasterTypes) {
          const warning = await analyzeWeatherForDisaster(weatherData, disasterType, region)
          if (warning) {
            detectedWarnings.push(warning)
          }
        }
        
        // 创建预警记录（使用统一的批序）
        const createdWarnings = []
        for (const warningData of detectedWarnings) {
          try {
            warningData.source = 'threshold'
            warningData.batch_order = currentBatchOrder  // 使用统一的批序
            const createdWarning = await WarningRecord.create(warningData)
            createdWarnings.push(createdWarning)
            allWarnings.push(createdWarning)
          } catch (error) {
            console.error(`创建预警记录错误 (${region}):`, error)
          }
        }
        
        results.push({
          region,
          weatherDataId: createdWeatherData.id,
          warningCount: createdWarnings.length
        })
        
      } catch (error) {
        console.error(`处理 ${weatherData.region} 天气数据失败:`, error)
        results.push({
          region: weatherData.region,
          error: error.message
        })
      }
    }
    
    console.log(`批量提交完成: ${weatherDataList.length} 个城市, ${allWarnings.length} 条预警, 批序: ${currentBatchOrder}`)
    
    res.status(201).json({
      code: 200,
      message: '批量提交成功',
      data: {
        batchOrder: currentBatchOrder,
        cityCount: weatherDataList.length,
        warningCount: allWarnings.length,
        results
      }
    })
  } catch (error) {
    console.error('批量提交天气数据错误:', error)
    res.status(500).json({
      code: 500,
      message: '批量提交失败'
    })
  }
})

module.exports = router