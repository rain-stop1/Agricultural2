const express = require('express')
const { body, validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const { User } = require('../models')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// 登录验证规则
const loginValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度为3-50个字符')
    .notEmpty()
    .withMessage('用户名不能为空'),
  body('password')
    .isLength({ min: 6, max: 20 })
    .withMessage('密码长度为6-20个字符')
    .notEmpty()
    .withMessage('密码不能为空')
]

// 注册验证规则
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度为3-50个字符')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线')
    .notEmpty()
    .withMessage('用户名不能为空'),
  body('password')
    .isLength({ min: 6, max: 20 })
    .withMessage('密码长度为6-20个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('密码必须包含字母和数字')
    .notEmpty()
    .withMessage('密码不能为空'),
  body('real_name')
    .isLength({ min: 2, max: 10 })
    .withMessage('姓名长度为2-10个字符')
    .notEmpty()
    .withMessage('真实姓名不能为空'),
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('user_type')
    .notEmpty()
    .withMessage('用户类型不能为空')
    .isIn(['farmer', 'admin'])
    .withMessage('用户类型必须是farmer或admin')
]

// 生成JWT令牌
const generateToken = (userId, userType) => {
  return jwt.sign(
    { userId, userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  )
}

// 处理验证错误
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log('验证错误:', errors.array())
    return res.status(400).json({
      code: 400,
      message: '数据验证失败: ' + errors.array().map(e => e.msg).join(', '),
      errors: errors.array()
    })
  }
  next()
}

// 用户登录
router.post('/login', loginValidation, handleValidationErrors, async (req, res) => {
  try {
    const { username, password } = req.body

    // 查找用户
    const user = await User.findOne({
      where: { username }
    })

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      })
    }

    // 检查用户状态
    if (user.status === 0) {
      return res.status(401).json({
        code: 401,
        message: '账户已被禁用，请联系管理员'
      })
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password)
    if (!isValidPassword) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误'
      })
    }

    // 生成令牌
    const token = generateToken(user.id, user.user_type)

    // 返回用户信息（不包含密码）
    const userResponse = user.toJSON()
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: userResponse
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 用户注册
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  try {
    console.log('注册请求数据:', req.body)
    const { username, password, real_name, phone, email, user_type, region } = req.body

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: { username }
    })

    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      })
    }

    // 检查手机号是否已存在
    if (phone) {
      const existingPhone = await User.findOne({
        where: { phone }
      })
      
      if (existingPhone) {
        return res.status(400).json({
          code: 400,
          message: '手机号已被注册'
        })
      }
    }

    // 创建用户
    const user = await User.create({
      username,
      password,
      real_name,
      phone,
      email,
      user_type,
      region
    })

    res.status(201).json({
      code: 200,
      message: '注册成功',
      data: {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        user_type: user.user_type
      }
    })
  } catch (error) {
    console.error('注册错误:', error)
    
    // 处理数据库唯一约束错误
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0].path
      let message = '数据重复'
      
      if (field === 'username') {
        message = '用户名已存在'
      } else if (field === 'phone') {
        message = '手机号已被注册'
      } else if (field === 'email') {
        message = '邮箱已被注册'
      }
      
      return res.status(400).json({
        code: 400,
        message
      })
    }
    
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 获取用户信息
router.get('/userinfo', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    })

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: user
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 修改密码
router.post('/change-password', [
  authenticateToken,
  body('oldPassword').notEmpty().withMessage('原密码不能为空'),
  body('newPassword')
    .isLength({ min: 6, max: 20 })
    .withMessage('新密码长度为6-20个字符')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('新密码必须包含字母和数字'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('确认密码与新密码不匹配')
    }
    return true
  })
], handleValidationErrors, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body

    // 获取用户完整信息（包含密码）
    const user = await User.findByPk(req.user.id)

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      })
    }

    // 验证原密码
    const isValidPassword = await user.validatePassword(oldPassword)
    if (!isValidPassword) {
      return res.status(400).json({
        code: 400,
        message: '原密码错误'
      })
    }

    // 更新密码
    await user.update({ password: newPassword })

    res.json({
      code: 200,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 更新用户信息
router.put('/update', [
  authenticateToken,
  body('real_name')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('姓名长度为2-10个字符'),
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
], handleValidationErrors, async (req, res) => {
  try {
    const { real_name, phone, email } = req.body
    const updateData = {}

    // 检查手机号是否已被其他用户使用
    if (phone && phone !== req.user.phone) {
      const existingPhone = await User.findOne({
        where: { 
          phone,
          id: { [require('sequelize').Op.ne]: req.user.id }
        }
      })
      
      if (existingPhone) {
        return res.status(400).json({
          code: 400,
          message: '手机号已被其他用户使用'
        })
      }
      
      updateData.phone = phone
    }

    // 检查邮箱是否已被其他用户使用
    if (email && email !== req.user.email) {
      const existingEmail = await User.findOne({
        where: { 
          email,
          id: { [require('sequelize').Op.ne]: req.user.id }
        }
      })
      
      if (existingEmail) {
        return res.status(400).json({
          code: 400,
          message: '邮箱已被其他用户使用'
        })
      }
      
      updateData.email = email
    }

    if (real_name) {
      updateData.real_name = real_name
    }

    // 更新用户信息
    await User.update(updateData, {
      where: { id: req.user.id }
    })

    // 获取更新后的用户信息
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    })

    res.json({
      code: 200,
      message: '更新成功',
      data: updatedUser
    })
  } catch (error) {
    console.error('更新用户信息错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 更新用户资料（支持region字段）
router.put('/update-profile', [
  authenticateToken,
  body('real_name')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('姓名长度为2-10个字符'),
  body('phone')
    .optional()
    .isMobilePhone('zh-CN')
    .withMessage('请输入有效的手机号码'),
  body('region')
    .optional()
    .isString()
    .withMessage('地区格式不正确')
], handleValidationErrors, async (req, res) => {
  try {
    const { real_name, phone, region } = req.body
    const updateData = {}

    // 检查手机号是否已被其他用户使用
    if (phone && phone !== req.user.phone) {
      const existingPhone = await User.findOne({
        where: { 
          phone,
          id: { [require('sequelize').Op.ne]: req.user.id }
        }
      })
      
      if (existingPhone) {
        return res.status(400).json({
          code: 400,
          message: '手机号已被其他用户使用'
        })
      }
      
      updateData.phone = phone
    }

    if (real_name) {
      updateData.real_name = real_name
    }

    if (region !== undefined) {
      updateData.region = region
    }

    // 更新用户信息
    await User.update(updateData, {
      where: { id: req.user.id }
    })

    // 获取更新后的用户信息
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    })

    res.json({
      code: 200,
      message: '更新成功',
      data: updatedUser
    })
  } catch (error) {
    console.error('更新用户资料错误:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    })
  }
})

// 验证令牌有效性
router.get('/verify-token', authenticateToken, (req, res) => {
  res.json({
    code: 200,
    message: '令牌有效',
    data: {
      user: req.user
    }
  })
})

module.exports = router