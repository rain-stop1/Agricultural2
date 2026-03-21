const express = require('express')
const router = express.Router()
const { Field, Crop, LossReport, EmergencyPlan, WarningRecord, DisasterType, WeatherData } = require('../models')
const { authenticateToken } = require('../middleware/auth')
const { Op } = require('sequelize')

// 获取工作台统计数据
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const userRegion = req.user.region
    
    // 地块数量
    const fieldCount = await Field.count({ 
      where: { user_id: userId } 
    })
    
    // 作物数量
    const cropCount = await Crop.count({ 
      where: { user_id: userId } 
    })
    
    // 损失报告数量
    const lossReportCount = await LossReport.count({ 
      where: { user_id: userId } 
    })
    
    // 应急预案数量
    const emergencyCount = await EmergencyPlan.count({ 
      where: { user_id: userId } 
    })
    
    // 统计用户所在地区的活跃预警
    let warningCount = 0
    if (userRegion) {
      // 提取省份和城市
      const provinceMatch = userRegion.match(/([\u4e00-\u9fa5]+省)/)
      const cityMatch = userRegion.match(/([\u4e00-\u9fa5]+市)/)
      
      const conditions = []
      if (provinceMatch) {
        conditions.push({ [Op.like]: `%${provinceMatch[0]}%` })
      }
      if (cityMatch) {
        conditions.push({ [Op.like]: `%${cityMatch[0]}%` })
      }
      
      if (conditions.length > 0) {
        warningCount = await WarningRecord.count({
          where: {
            status: 'active',
            region: { [Op.or]: conditions }
          }
        })
      }
    }
    
    // 资源需求数量(TODO: 实现资源管理后更新)
    const resourceCount = 0
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        fieldCount,
        cropCount,
        warningCount,
        lossReportCount,
        resourceCount,
        emergencyCount
      }
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

// 获取地块概况
router.get('/dashboard/fields', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { limit = 5 } = req.query
    
    const fields = await Field.findAll({
      where: { user_id: userId },
      include: [{
        model: Crop,
        as: 'crop',
        attributes: ['id', 'crop_name']
      }],
      limit: parseInt(limit),
      order: [['created_at', 'DESC']]
    })
    
    // 简化版：暂时不做预警匹配，避免错误
    const fieldsWithWarning = fields.map(field => {
      const fieldData = field.toJSON()
      fieldData.hasWarning = false
      fieldData.cropName = fieldData.crop?.crop_name || null
      return fieldData
    })
    
    res.json({
      code: 200,
      message: '获取成功',
      data: fieldsWithWarning
    })
  } catch (error) {
    console.error('获取地块概况失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

// 获取待办事项
router.get('/dashboard/todos', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const todos = []
    
    // 检查未读预警
    const activeWarnings = await WarningRecord.count({
      where: { status: 'active' }
    })
    
    if (activeWarnings > 0) {
      todos.push({
        id: 1,
        text: `查看 ${activeWarnings} 条活跃预警`,
        icon: 'Warning',
        color: '#F56C6C',
        path: '/warning'
      })
    }
    
    // 检查待审核的损失报告
    const pendingReports = await LossReport.count({
      where: { 
        user_id: userId,
        status: 'pending'
      }
    })
    
    if (pendingReports > 0) {
      todos.push({
        id: 2,
        text: `${pendingReports} 份损失报告待审核`,
        icon: 'Document',
        color: '#E6A23C',
        path: '/loss'
      })
    }
    
    // 检查未完成的应急预案
    const pendingEmergency = await EmergencyPlan.count({
      where: { 
        user_id: userId,
        status: { [Op.ne]: 'completed' }
      }
    })
    
    if (pendingEmergency > 0) {
      todos.push({
        id: 3,
        text: `${pendingEmergency} 个应急预案待处理`,
        icon: 'List',
        color: '#409EFF',
        path: '/emergency'
      })
    }
    
    // 如果没有待办事项
    if (todos.length === 0) {
      todos.push({
        id: 4,
        text: '暂无待办事项',
        icon: 'CircleCheck',
        color: '#67C23A',
        path: '/dashboard'
      })
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: todos
    })
  } catch (error) {
    console.error('获取待办事项失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

// 获取数据趋势
router.get('/dashboard/trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { period = 'week' } = req.query
    
    const dates = []
    const warningCounts = []
    const lossReportCounts = []
    const emergencyCounts = []
    
    const days = period === 'week' ? 7 : 30
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      // 日期标签
      if (period === 'week') {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        dates.push(weekdays[date.getDay()])
      } else {
        dates.push((date.getMonth() + 1) + '-' + date.getDate())
      }
      
      // 预警数量(全局)
      const warningCount = await WarningRecord.count({
        where: {
          created_at: {
            [Op.gte]: date,
            [Op.lt]: nextDate
          }
        }
      })
      warningCounts.push(warningCount)
      
      // 损失报告数量(个人)
      const lossCount = await LossReport.count({
        where: {
          user_id: userId,
          created_at: {
            [Op.gte]: date,
            [Op.lt]: nextDate
          }
        }
      })
      lossReportCounts.push(lossCount)
      
      // 应急预案数量(个人)
      const emergencyCount = await EmergencyPlan.count({
        where: {
          user_id: userId,
          created_at: {
            [Op.gte]: date,
            [Op.lt]: nextDate
          }
        }
      })
      emergencyCounts.push(emergencyCount)
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        dates,
        warnings: warningCounts,
        lossReports: lossReportCounts,
        emergencies: emergencyCounts
      }
    })
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

// 获取当前天气
router.get('/dashboard/weather', authenticateToken, async (req, res) => {
  try {
    // 获取最新的天气数据
    const weather = await WeatherData.findOne({
      order: [['record_time', 'DESC']],
      limit: 1
    })
    
    if (weather) {
      res.json({
        code: 200,
        message: '获取成功',
        data: {
          temperature: weather.temperature,
          humidity: weather.humidity,
          weather_text: weather.weather_text,
          region: weather.region
        }
      })
    } else {
      res.json({
        code: 200,
        message: '暂无天气数据',
        data: null
      })
    }
  } catch (error) {
    console.error('获取天气数据失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

// 获取作物列表（农户可访问）
router.get('/crops', authenticateToken, async (req, res) => {
  try {
    const { search = '' } = req.query
    
    const where = {}
    if (search) {
      where.crop_name = { [Op.like]: `%${search}%` }
    }
    
    const crops = await Crop.findAll({
      where,
      attributes: ['id', 'crop_name', 'crop_type'],
      order: [['crop_name', 'ASC']]
    })
    
    res.json({
      code: 200,
      message: '获取成功',
      data: crops
    })
  } catch (error) {
    console.error('获取作物列表失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

module.exports = router

// 获取作物列表（农户可访问）
router.get('/crops', authenticateToken, async (req, res) => {
  try {
    const { search = '' } = req.query

    const where = {}
    if (search) {
      where.crop_name = { [Op.like]: `%${search}%` }
    }

    const crops = await Crop.findAll({
      where,
      attributes: ['id', 'crop_name', 'crop_type'],
      order: [['crop_name', 'ASC']]
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: crops
    })
  } catch (error) {
    console.error('获取作物列表失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

