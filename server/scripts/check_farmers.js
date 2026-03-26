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

// 检查农户数量
async function checkFarmers() {
  try {
    // 连接数据库
    await sequelize.authenticate()
    console.log('数据库连接成功')
    
    // 检查所有农户
    const [allFarmers] = await sequelize.query(`
      SELECT id, username, real_name, region
      FROM users
      WHERE user_type = 'farmer'
    `)
    
    console.log(`总共有 ${allFarmers.length} 个农户`)
    console.log('农户列表:')
    allFarmers.forEach(farmer => {
      console.log(`ID: ${farmer.id}, 用户名: ${farmer.username}, 真实姓名: ${farmer.real_name}, 地区: ${farmer.region}`)
    })
    
    // 检查北京市昌平区的农户
    const [changpingFarmers] = await sequelize.query(`
      SELECT id, username, real_name, region
      FROM users
      WHERE user_type = 'farmer' AND region LIKE '%北京市昌平区%'
    `)
    
    console.log(`\n北京市昌平区有 ${changpingFarmers.length} 个农户`)
    
    // 检查北京市市辖区的农户
    const [shixiaquFarmers] = await sequelize.query(`
      SELECT id, username, real_name, region
      FROM users
      WHERE user_type = 'farmer' AND region LIKE '%北京市市辖区%'
    `)
    
    console.log(`北京市市辖区有 ${shixiaquFarmers.length} 个农户`)
    
    // 关闭数据库连接
    await sequelize.close()
    console.log('数据库连接已关闭')
  } catch (error) {
    console.error('操作失败:', error)
    await sequelize.close()
  }
}

// 运行脚本
checkFarmers()