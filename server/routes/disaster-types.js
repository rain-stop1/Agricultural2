const express = require('express')
const { DisasterType } = require('../models')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// 获取灾害类型列表
router.get('/', async (req, res) => {
  try {
    const disasterTypes = await DisasterType.findAll({
      order: [['created_at', 'ASC']]
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: disasterTypes
    })
  } catch (error) {
    console.error('获取灾害类型错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 获取单个灾害类型详情
router.get('/:id', async (req, res) => {
  try {
    const disasterType = await DisasterType.findByPk(req.params.id)

    if (!disasterType) {
      return res.status(404).json({
        code: 404,
        message: '灾害类型不存在'
      })
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: disasterType
    })
  } catch (error) {
    console.error('获取灾害类型详情错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 创建灾害类型（管理员权限）
router.post('/', [
  authenticateToken,
  // requireAdmin, // 暂时注释
], async (req, res) => {
  try {
    const { type_name, type_code, description, warning_criteria } = req.body

    // 检查类型编码是否已存在
    const existingType = await DisasterType.findOne({ where: { type_code } })
    if (existingType) {
      return res.status(400).json({ 
        code: 400, 
        message: '灾害类型编码已存在' 
      })
    }

    const disasterType = await DisasterType.create({
      type_name,
      type_code,
      description,
      warning_criteria
    })

    res.status(201).json({
      code: 200,
      message: '灾害类型创建成功',
      data: disasterType
    })
  } catch (error) {
    console.error('创建灾害类型错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 更新灾害类型（管理员权限）
router.put('/:id', [
  authenticateToken,
  // requireAdmin, // 暂时注释
], async (req, res) => {
  try {
    const { type_name, type_code, description, warning_criteria } = req.body
    const disasterType = await DisasterType.findByPk(req.params.id)

    if (!disasterType) {
      return res.status(404).json({ 
        code: 404, 
        message: '灾害类型不存在' 
      })
    }

    // 检查类型编码是否已被其他灾害类型使用
    if (type_code && type_code !== disasterType.type_code) {
      const existingType = await DisasterType.findOne({ where: { type_code } })
      if (existingType) {
        return res.status(400).json({ 
          code: 400, 
          message: '灾害类型编码已存在' 
        })
      }
    }

    await disasterType.update({
      type_name: type_name || disasterType.type_name,
      type_code: type_code || disasterType.type_code,
      description: description || disasterType.description,
      warning_criteria: warning_criteria || disasterType.warning_criteria
    })

    res.json({
      code: 200,
      message: '灾害类型更新成功',
      data: disasterType
    })
  } catch (error) {
    console.error('更新灾害类型错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 删除灾害类型（管理员权限）
router.delete('/:id', [
  authenticateToken,
  // requireAdmin, // 暂时注释
], async (req, res) => {
  try {
    const disasterType = await DisasterType.findByPk(req.params.id)

    if (!disasterType) {
      return res.status(404).json({ 
        code: 404, 
        message: '灾害类型不存在' 
      })
    }

    await disasterType.destroy()

    res.json({
      code: 200,
      message: '灾害类型删除成功'
    })
  } catch (error) {
    console.error('删除灾害类型错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

module.exports = router