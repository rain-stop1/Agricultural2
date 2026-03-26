const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// 配置multer上传
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许上传图片
    const filetypes = /jpeg|jpg|png|gif/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    
    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('只允许上传图片文件'))
  }
})

// 上传文件
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的文件'
      })
    }
    
    // 生成文件的访问URL（使用相对路径）
    const fileUrl = `/uploads/${req.file.filename}`
    
    res.json({
      code: 200,
      message: '上传成功',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        path: req.file.path
      }
    })
  } catch (error) {
    console.error('上传失败:', error)
    res.status(500).json({
      code: 500,
      message: '上传失败',
      error: error.message
    })
  }
})

// 删除文件
router.delete('/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(__dirname, '..', 'uploads', filename)
    
    // 检查文件是否存在
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({
        code: 200,
        message: '删除成功'
      })
    } else {
      res.status(404).json({
        code: 404,
        message: '文件不存在'
      })
    }
  } catch (error) {
    console.error('删除失败:', error)
    res.status(500).json({
      code: 500,
      message: '删除失败',
      error: error.message
    })
  }
})

module.exports = router
