const express = require('express')
const { body, validationResult } = require('express-validator')
const { WeatherData } = require('../models')
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
  body('air_pressure').optional().isFloat({ min: 800, max: 1200 }).withMessage('气压必须在800hPa到1200hPa之间'),
  body('record_time').isISO8601().withMessage('记录时间格式不正确')
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
  authenticateToken,
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
      air_pressure,
      record_time
    } = req.body

    // 创建气象数据记录
    const weatherData = await WeatherData.create({
      region,
      temperature,
      humidity,
      rainfall,
      wind_speed,
      wind_direction,
      air_pressure,
      record_time: new Date(record_time)
    })

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
      whereClause.region = { [require('sequelize').Op.like]: `%${region}%` }
    }
    
    if (start_date && end_date) {
      whereClause.record_time = {
        [require('sequelize').Op.between]: [new Date(start_date), new Date(end_date)]
      }
    } else if (start_date) {
      whereClause.record_time = {
        [require('sequelize').Op.gte]: new Date(start_date)
      }
    } else if (end_date) {
      whereClause.record_time = {
        [require('sequelize').Op.lte]: new Date(end_date)
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

module.exports = router