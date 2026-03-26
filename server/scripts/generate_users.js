const { Sequelize } = require('sequelize')

// 直接配置数据库连接
const sequelize = new Sequelize({
  host: 'localhost',
  port: 3306,
  database: 'agricultural_disaster_db',
  username: 'root',
  password: '8022', // 直接使用密码
  dialect: 'mysql',
  timezone: '+08:00',
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: console.log
})

// 定义用户模型
const User = sequelize.define('User', {
  id: {
    type: require('sequelize').DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: require('sequelize').DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  password: {
    type: require('sequelize').DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255],
      notEmpty: true
    }
  },
  real_name: {
    type: require('sequelize').DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true
    }
  },
  phone: {
    type: require('sequelize').DataTypes.STRING(20),
    validate: {
      is: /^1[3-9]\d{9}$/
    }
  },
  email: {
    type: require('sequelize').DataTypes.STRING(100),
    validate: {
      isEmail: true
    }
  },
  user_type: {
    type: require('sequelize').DataTypes.ENUM('farmer', 'admin'),
    allowNull: false,
    defaultValue: 'farmer'
  },
  status: {
    type: require('sequelize').DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '1:启用 0:禁用'
  },
  avatar: {
    type: require('sequelize').DataTypes.STRING(255),
    comment: '头像URL'
  },
  region: {
    type: require('sequelize').DataTypes.STRING(100),
    allowNull: true,
    comment: '所在地区'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

// 地区数据
const regions = [
  '江苏省南京市',
  '江苏省苏州市',
  '江苏省无锡市',
  '江苏省常州市',
  '江苏省南通市',
  '江苏省连云港市',
  '江苏省淮安市',
  '江苏省盐城市',
  '江苏省扬州市',
  '江苏省镇江市',
  '河北省石家庄市',
  '河北省唐山市',
  '河北省秦皇岛市',
  '河北省邯郸市',
  '河北省邢台市',
  '河北省保定市',
  '河北省张家口市',
  '河北省承德市',
  '河北省沧州市',
  '河北省廊坊市',
  '山东省济南市',
  '山东省青岛市',
  '山东省淄博市',
  '山东省枣庄市',
  '山东省东营市',
  '山东省烟台市',
  '山东省潍坊市',
  '山东省济宁市',
  '山东省泰安市',
  '山东省威海市',
  '浙江省杭州市',
  '浙江省宁波市',
  '浙江省温州市',
  '浙江省嘉兴市',
  '浙江省湖州市',
  '浙江省绍兴市',
  '浙江省金华市',
  '浙江省衢州市',
  '浙江省舟山市',
  '浙江省台州市'
]

// 姓氏
const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹']

// 名字
const names = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平', '刚', '桂英', '桂兰', '建华', '建国', '建军', '建强', '建民', '建忠', '建明']

// 生成随机手机号
function generatePhone() {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
  return prefix + suffix
}

// 生成随机邮箱
function generateEmail(username) {
  const domains = ['qq.com', '163.com', '126.com', 'gmail.com', 'sina.com', 'sohu.com']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  return `${username}@${domain}`
}

// 生成随机用户数据
function generateUser(index) {
  const surname = surnames[Math.floor(Math.random() * surnames.length)]
  const name = names[Math.floor(Math.random() * names.length)]
  const realName = surname + name
  const username = `user${index}`
  const password = '123456' // 默认密码
  const phone = generatePhone()
  const email = generateEmail(username)
  const userType = index === 0 ? 'admin' : 'farmer' // 第一个用户为管理员
  const region = regions[Math.floor(Math.random() * regions.length)]
  
  return {
    username,
    password,
    real_name: realName,
    phone,
    email,
    user_type: userType,
    status: 1,
    region
  }
}

// 生成用户数据
async function generateUsers(count) {
  try {
    // 连接数据库
    await sequelize.authenticate()
    console.log('数据库连接成功')
    
    // 同步模型
    await User.sync()
    console.log('用户表同步成功')
    
    // 生成用户数据
    const users = []
    for (let i = 0; i < count; i++) {
      users.push(generateUser(i))
    }
    
    // 批量插入用户数据
    const result = await User.bulkCreate(users)
    console.log(`成功生成 ${result.length} 个用户`)
    
    // 关闭数据库连接
    await sequelize.close()
    console.log('数据库连接已关闭')
  } catch (error) {
    console.error('生成用户数据失败:', error)
    await sequelize.close()
  }
}

// 运行脚本
if (require.main === module) {
  const count = process.argv[2] ? parseInt(process.argv[2]) : 50
  console.log(`开始生成 ${count} 个用户数据...`)
  generateUsers(count)
}

module.exports = generateUsers