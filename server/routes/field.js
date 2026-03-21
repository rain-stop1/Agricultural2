const express = require('express')
const router = express.Router()
const { Field, Crop } = require('../models')
const { authenticateToken } = require('../middleware/auth')

// 获取我的地块列表
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 10 } = req.query
    
    const offset = (page - 1) * limit
    
    const { count, rows } = await Field.findAndCountAll({
      where: { user_id: userId },
      include: [{
        model: Crop,
        as: 'crop',
        attributes: ['id', 'crop_name', 'crop_type']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    })
    
    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('获取地块列表失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

// 获取地块详情
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const fieldId = req.params.id
    
    const field = await Field.findOne({
      where: { 
        id: fieldId,
        user_id: userId 
      },
      include: [{
        model: Crop,
        as: 'crop'
      }]
    })
    
    if (!field) {
      return res.status(404).json({
        code: 404,
        message: '地块不存在或无权限访问'
      })
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: field
    })
  } catch (error) {
    console.error('获取地块详情失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

// 创建地块
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { field_name, location, area, crop_id, planting_date, status } = req.body
    
    // 验证必填字段
    if (!field_name || !location || !area) {
      return res.status(400).json({
        code: 400,
        message: '地块名称、位置和面积为必填项'
      })
    }
    
    const field = await Field.create({
      user_id: userId,
      field_name,
      location,
      area,
      crop_id: crop_id || null,
      planting_date: planting_date || null,
      status: status !== undefined ? status : 1
    })
    
    // 返回包含作物信息的完整数据
    const fieldWithCrop = await Field.findOne({
      where: { id: field.id },
      include: [{
        model: Crop,
        as: 'crop'
      }]
    })
    
    res.json({
      code: 200,
      message: '创建成功',
      data: fieldWithCrop
    })
  } catch (error) {
    console.error('创建地块失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

// 更新地块
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const fieldId = req.params.id
    
    // 检查权限
    const field = await Field.findOne({
      where: { 
        id: fieldId,
        user_id: userId 
      }
    })
    
    if (!field) {
      return res.status(404).json({
        code: 404,
        message: '地块不存在或无权限操作'
      })
    }
    
    // 更新字段
    const { field_name, location, area, crop_id, planting_date, status } = req.body
    
    await field.update({
      field_name: field_name !== undefined ? field_name : field.field_name,
      location: location !== undefined ? location : field.location,
      area: area !== undefined ? area : field.area,
      crop_id: crop_id !== undefined ? crop_id : field.crop_id,
      planting_date: planting_date !== undefined ? planting_date : field.planting_date,
      status: status !== undefined ? status : field.status
    })
    
    // 返回更新后的完整数据
    const updatedField = await Field.findOne({
      where: { id: fieldId },
      include: [{
        model: Crop,
        as: 'crop'
      }]
    })
    
    res.json({
      code: 200,
      message: '更新成功',
      data: updatedField
    })
  } catch (error) {
    console.error('更新地块失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

// 删除地块
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const fieldId = req.params.id
    
    const field = await Field.findOne({
      where: { 
        id: fieldId,
        user_id: userId 
      }
    })
    
    if (!field) {
      return res.status(404).json({
        code: 404,
        message: '地块不存在或无权限操作'
      })
    }
    
    await field.destroy()
    
    res.json({
      code: 200,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除地块失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器错误: ' + error.message
    })
  }
})

module.exports = router
