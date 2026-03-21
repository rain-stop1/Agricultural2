const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const sequelize = require('../config/database')

const router = express.Router()

// 获取损失上报列表
router.get('/reports', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const userType = req.user.user_type
    const { status, disaster_type } = req.query

    let whereClause = 'WHERE 1=1'
    const replacements = []

    // 农户只能看到自己的报告
    if (userType === 'farmer') {
      whereClause += ' AND user_id = ?'
      replacements.push(userId)
    }

    if (status && status !== 'all') {
      whereClause += ' AND status = ?'
      replacements.push(status)
    }

    if (disaster_type && disaster_type !== 'all') {
      whereClause += ' AND disaster_type = ?'
      replacements.push(disaster_type)
    }

    const [reports] = await sequelize.query(`
      SELECT 
        id,
        user_id,
        reporter,
        disaster_type,
        location,
        crop_type,
        total_area,
        loss_area,
        loss_rate,
        loss_amount,
        description,
        images,
        status,
        report_time,
        created_at
      FROM loss_reports
      ${whereClause}
      ORDER BY created_at DESC
    `, {
      replacements
    })

    // 解析 images JSON 字段
    reports.forEach(report => {
      if (report.images) {
        try {
          report.images = JSON.parse(report.images)
        } catch (e) {
          report.images = []
        }
      } else {
        report.images = []
      }
    })

    res.json({
      code: 200,
      message: '获取成功',
      data: reports
    })
  } catch (error) {
    console.error('获取损失上报列表失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取损失上报列表失败'
    })
  }
})

// 提交损失上报
router.post('/reports', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const reporter = req.user.real_name
    
    const { 
      disaster_type, 
      location, 
      crop_type, 
      total_area, 
      loss_area, 
      loss_rate, 
      loss_amount, 
      description,
      images 
    } = req.body

    console.log('收到损失上报请求, 用户ID:', userId)
    console.log('收到图片数量:', images ? images.length : 0)

    // 处理图片：限制大小和数量
    let processedImages = []
    if (images && Array.isArray(images)) {
      // 最多保存3张图片
      const maxImages = 3
      const imagesToProcess = images.slice(0, maxImages)
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        const imageData = imagesToProcess[i]
        
        // 检查是否为base64格式
        if (imageData && imageData.startsWith('data:image')) {
          // 提取base64数据（移除data:image/xxx;base64,前缀）
          const base64Data = imageData.split(',')[1]
          const imageSize = base64Data.length * 0.75 // 估算实际大小（字节）
          
          console.log(`图片${i + 1}大小: ${(imageSize / 1024).toFixed(2)} KB`)
          
          // 如果图片小于300KB，直接存储；否则跳过
          if (imageSize < 300 * 1024) {
            processedImages.push(imageData)
          } else {
            console.log(`图片${i + 1}过大(>${(imageSize / 1024).toFixed(2)}KB)，已跳过`)
          }
        }
      }
    }

    console.log('处理后的图片数量:', processedImages.length)

    // 将 images 数组转换为 JSON 字符串
    const imagesJson = JSON.stringify(processedImages)
    console.log('JSON长度:', imagesJson.length)

    const [result] = await sequelize.query(`
      INSERT INTO loss_reports 
      (user_id, reporter, disaster_type, location, crop_type, total_area, loss_area, loss_rate, loss_amount, description, images, status, report_time, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW(), NOW())
    `, {
      replacements: [userId, reporter, disaster_type, location, crop_type, total_area, loss_area, loss_rate, loss_amount, description, imagesJson]
    })

    console.log('插入成功，ID:', result)

    const responseMessage = processedImages.length < (images?.length || 0)
      ? `损失上报提交成功，已保存${processedImages.length}张图片（${(images?.length || 0) - processedImages.length}张图片因过大被跳过）`
      : '损失上报提交成功'

    res.json({
      code: 200,
      message: responseMessage,
      data: { 
        id: result,
        images_saved: processedImages.length,
        images_skipped: (images?.length || 0) - processedImages.length
      }
    })
  } catch (error) {
    console.error('提交损失上报失败:', error)
    res.status(500).json({
      code: 500,
      message: '提交损失上报失败: ' + error.message
    })
  }
})

// 审核损失上报
router.put('/reports/:id/approve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { result, comment } = req.body

    await sequelize.query(`
      UPDATE loss_reports 
      SET status = ?, approve_comment = ?, updated_at = NOW()
      WHERE id = ?
    `, {
      replacements: [result, comment, id]
    })

    res.json({
      code: 200,
      message: '审核完成'
    })
  } catch (error) {
    console.error('审核失败:', error)
    res.status(500).json({
      code: 500,
      message: '审核失败'
    })
  }
})

// 删除损失上报
router.delete('/reports/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    await sequelize.query(`
      DELETE FROM loss_reports WHERE id = ?
    `, {
      replacements: [id]
    })

    res.json({
      code: 200,
      message: '删除成功'
    })
  } catch (error) {
    console.error('删除失败:', error)
    res.status(500).json({
      code: 500,
      message: '删除失败'
    })
  }
})

// 获取统计数据
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_reports,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_reports,
        COALESCE(SUM(loss_amount), 0) as total_loss
      FROM loss_reports
    `)

    res.json({
      code: 200,
      message: '获取成功',
      data: stats[0]
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({
      code: 500,
      message: '获取统计数据失败'
    })
  }
})

module.exports = router