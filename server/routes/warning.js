const express = require('express')
const { body, query, validationResult } = require('express-validator')
const { WarningRecord, DisasterType, Field, User, WeatherData } = require('../models')
const { authenticateToken, optionalAuth } = require('../middleware/auth')

const router = express.Router()

// 预警记录验证规则
const warningValidation = [
  body('disaster_type_id').isInt({ min: 1 }).withMessage('灾害类型ID必须是正整数'),
  body('region').notEmpty().withMessage('预警区域不能为空').isLength({ max: 100 }).withMessage('区域名称不能超过100个字符'),
  body('warning_level').isIn(['light', 'moderate', 'severe']).withMessage('预警等级必须是light、moderate或severe'),
  body('warning_content').notEmpty().withMessage('预警内容不能为空'),
  body('affected_fields').optional().isArray().withMessage('影响地块必须是数组'),
  body('start_time').isISO8601().withMessage('开始时间格式不正确'),
  body('end_time').optional().isISO8601().withMessage('结束时间格式不正确')
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

// 获取预警记录列表
router.get('/', [
  optionalAuth,
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('region').optional().isLength({ max: 100 }).withMessage('区域名称不能超过100个字符'),
  query('level').optional().isIn(['light', 'moderate', 'severe']).withMessage('预警等级不正确'),
  query('status').optional().isIn(['active', 'expired', 'cancelled']).withMessage('状态不正确')
], handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    // 构建查询条件
    const whereClause = {}
    
    if (req.query.region) {
      whereClause.region = { [require('sequelize').Op.like]: `%${req.query.region}%` }
    }
    
    if (req.query.level) {
      whereClause.warning_level = req.query.level
    }
    
    if (req.query.status) {
      whereClause.status = req.query.status
    } else {
      // 默认只返回有效预警
      whereClause.status = 'active'
    }

    const { count, rows: warnings } = await WarningRecord.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: DisasterType,
          as: 'disasterType',
          attributes: ['id', 'type_name', 'type_code']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        warnings,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      }
    })
  } catch (error) {
    console.error('获取预警列表错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 获取预警详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const warning = await WarningRecord.findByPk(req.params.id, {
      include: [
        {
          model: DisasterType,
          as: 'disasterType',
          attributes: ['id', 'type_name', 'type_code', 'description']
        }
      ]
    })

    if (!warning) {
      return res.status(404).json({
        code: 404,
        message: '预警记录不存在'
      })
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: warning
    })
  } catch (error) {
    console.error('获取预警详情错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 创建预警记录（管理员权限）
router.post('/', [
  authenticateToken,
  // requireAdmin, // 暂时注释，后续根据需要开启
  warningValidation,
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      disaster_type_id,
      region,
      warning_level,
      warning_content,
      affected_fields,
      start_time,
      end_time
    } = req.body

    // 验证灾害类型是否存在
    const disasterType = await DisasterType.findByPk(disaster_type_id)
    if (!disasterType) {
      return res.status(400).json({
        code: 400,
        message: '灾害类型不存在'
      })
    }

    // 创建预警记录
    const warning = await WarningRecord.create({
      disaster_type_id,
      region,
      warning_level,
      warning_content,
      affected_fields: affected_fields || [],
      start_time: new Date(start_time),
      end_time: end_time ? new Date(end_time) : null,
      status: 'active'
    })

    // 获取完整的预警信息
    const createdWarning = await WarningRecord.findByPk(warning.id, {
      include: [
        {
          model: DisasterType,
          as: 'disasterType',
          attributes: ['id', 'type_name', 'type_code']
        }
      ]
    })

    res.status(201).json({
      code: 200,
      message: '预警创建成功',
      data: createdWarning
    })
  } catch (error) {
    console.error('创建预警错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 更新预警记录
router.put('/:id', [
  authenticateToken,
  // requireAdmin, // 暂时注释
  body('warning_level').optional().isIn(['light', 'moderate', 'severe']).withMessage('预警等级不正确'),
  body('warning_content').optional().notEmpty().withMessage('预警内容不能为空'),
  body('end_time').optional().isISO8601().withMessage('结束时间格式不正确'),
  body('status').optional().isIn(['active', 'expired', 'cancelled']).withMessage('状态不正确')
], handleValidationErrors, async (req, res) => {
  try {
    const warning = await WarningRecord.findByPk(req.params.id)

    if (!warning) {
      return res.status(404).json({
        code: 404,
        message: '预警记录不存在'
      })
    }

    // 更新字段
    const updateData = {}
    const allowedFields = ['warning_level', 'warning_content', 'end_time', 'status']
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = field === 'end_time' && req.body[field] 
          ? new Date(req.body[field]) 
          : req.body[field]
      }
    })

    await warning.update(updateData)

    // 获取更新后的预警信息
    const updatedWarning = await WarningRecord.findByPk(warning.id, {
      include: [
        {
          model: DisasterType,
          as: 'disasterType',
          attributes: ['id', 'type_name', 'type_code']
        }
      ]
    })

    res.json({
      code: 200,
      message: '预警更新成功',
      data: updatedWarning
    })
  } catch (error) {
    console.error('更新预警错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 删除预警记录
router.delete('/:id', [
  authenticateToken,
  // requireAdmin // 暂时注释
], async (req, res) => {
  try {
    const warning = await WarningRecord.findByPk(req.params.id)

    if (!warning) {
      return res.status(404).json({
        code: 404,
        message: '预警记录不存在'
      })
    }

    await warning.destroy()

    res.json({
      code: 200,
      message: '预警删除成功'
    })
  } catch (error) {
    console.error('删除预警错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 获取预警统计信息
router.get('/statistics/overview', optionalAuth, async (req, res) => {
  try {
    // 获取各等级预警数量
    const levelStats = await WarningRecord.findAll({
      attributes: [
        'warning_level',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: {
        status: 'active'
      },
      group: ['warning_level']
    })

    // 获取今日新增预警数量
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayWarningCount = await WarningRecord.count({
      where: {
        created_at: {
          [require('sequelize').Op.gte]: today
        }
      }
    })

    // 获取活跃预警总数
    const activeWarningCount = await WarningRecord.count({
      where: {
        status: 'active'
      }
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        levelStats: levelStats.map(stat => ({
          level: stat.warning_level,
          count: parseInt(stat.dataValues.count)
        })),
        todayWarningCount,
        activeWarningCount
      }
    })
  } catch (error) {
    console.error('获取预警统计错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 智能预警检测
router.post('/auto-detect', [
  authenticateToken
], async (req, res) => {
  try {
    const detectedWarnings = []

    // 获取最近的气象数据（过去24小时）
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const recentWeatherData = await WeatherData.findAll({
      where: {
        record_time: {
          [require('sequelize').Op.gte]: twentyFourHoursAgo
        }
      },
      order: [['record_time', 'DESC']]
    })

    // 获取所有灾害类型及其预警标准
    const disasterTypes = await DisasterType.findAll()
    
    // 按地区分组气象数据
    const weatherByRegion = {}
    recentWeatherData.forEach(weather => {
      if (!weatherByRegion[weather.region]) {
        weatherByRegion[weather.region] = []
      }
      weatherByRegion[weather.region].push(weather)
    })

    // 遍历每个地区的气象数据进行灾害检测
    for (const [region, weatherList] of Object.entries(weatherByRegion)) {
      const latestWeather = weatherList[0] // 最新的气象数据

      for (const disasterType of disasterTypes) {
        const warning = await analyzeWeatherForDisaster(latestWeather, disasterType, region)
        if (warning) {
          detectedWarnings.push(warning)
        }
      }
    }

    // 批量创建预警记录
    const createdWarnings = []
    for (const warningData of detectedWarnings) {
      try {
        // 检查是否已存在相同区域和类型的有效预警
        const existingWarning = await WarningRecord.findOne({
          where: {
            region: warningData.region,
            disaster_type_id: warningData.disaster_type_id,
            status: 'active',
            created_at: {
              [require('sequelize').Op.gte]: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6小时内
            }
          }
        })

        if (!existingWarning) {
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
          
          createdWarnings.push(fullWarning)
        }
      } catch (error) {
        console.error('创建预警记录错误:', error)
      }
    }

    res.json({
      code: 200,
      message: '智能预警检测完成',
      data: {
        warnings: createdWarnings,
        totalDetected: detectedWarnings.length,
        totalCreated: createdWarnings.length
      }
    })
  } catch (error) {
    console.error('智能预警检测错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 分析气象数据判断是否触发预警
async function analyzeWeatherForDisaster(weatherData, disasterType, region) {
  const criteria = disasterType.warning_criteria || {}
  
  switch (disasterType.type_code) {
    case 'drought':
      // 干旱预警：连续无降雨、高温、低湿度
      if (weatherData.rainfall < 5 && weatherData.temperature > 30 && weatherData.humidity < 40) {
        return {
          disaster_type_id: disasterType.id,
          region,
          warning_level: weatherData.temperature > 35 ? 'severe' : 'moderate',
          warning_content: `检测到${region}地区出现干旱风险：温度${weatherData.temperature}°C，湿度${weatherData.humidity}%，24小时降雨量${weatherData.rainfall}mm，请做好防旱准备。`,
          start_time: new Date(),
          status: 'active'
        }
      }
      break
      
    case 'flood':
      // 洪涝预警：强降雨
      if (weatherData.rainfall > 50) {
        return {
          disaster_type_id: disasterType.id,
          region,
          warning_level: weatherData.rainfall > 100 ? 'severe' : weatherData.rainfall > 80 ? 'moderate' : 'light',
          warning_content: `检测到${region}地区出现洪涝风险：24小时降雨量${weatherData.rainfall}mm，请做好防汛准备。`,
          start_time: new Date(),
          status: 'active'
        }
      }
      break
      
    case 'typhoon':
      // 台风预警：强风
      if (weatherData.wind_speed > 17) {
        return {
          disaster_type_id: disasterType.id,
          region,
          warning_level: weatherData.wind_speed > 32 ? 'severe' : weatherData.wind_speed > 24 ? 'moderate' : 'light',
          warning_content: `检测到${region}地区出现台风风险：风速${weatherData.wind_speed}m/s，风向${weatherData.wind_direction}，请做好防台准备。`,
          start_time: new Date(),
          status: 'active'
        }
      }
      break
      
    case 'hail':
      // 冰雹预警：强对流天气（高温高湿、低气压）
      if (weatherData.temperature > 25 && weatherData.humidity > 70 && weatherData.air_pressure < 1000) {
        return {
          disaster_type_id: disasterType.id,
          region,
          warning_level: 'moderate',
          warning_content: `检测到${region}地区可能出现冰雹天气：当前气象条件适合冰雹形成，请做好防护准备。`,
          start_time: new Date(),
          status: 'active'
        }
      }
      break
      
    default:
      // 使用自定义预警标准
      if (criteria && Object.keys(criteria).length > 0) {
        const shouldWarn = evaluateCustomCriteria(weatherData, criteria)
        if (shouldWarn) {
          return {
            disaster_type_id: disasterType.id,
            region,
            warning_level: 'light',
            warning_content: `检测到${region}地区出现${disasterType.type_name}风险，请密切关注。`,
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

module.exports = router