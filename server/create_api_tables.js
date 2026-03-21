const fs = require('fs')
const path = require('path')
const { Sequelize } = require('sequelize')

// 直接创建数据库连接（使用硬编码配置）
const sequelize = new Sequelize({
  host: 'localhost',
  port: 3306,
  database: 'agricultural_disaster_db',
  username: 'root',
  password: '8022',
  dialect: 'mysql',
  logging: false
})

async function createTables() {
  try {
    console.log('开始连接数据库...')
    await sequelize.authenticate()
    console.log('✓ 数据库连接成功')
    
    console.log('\n开始创建数据库表...')
    
    // 读取SQL文件
    const sqlFile = path.join(__dirname, '..', 'database', 'create_tables.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')
    
    // 分割SQL语句（按分号分割）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    // 执行每条SQL语句
    for (const statement of statements) {
      if (statement) {
        try {
          await sequelize.query(statement)
          const preview = statement.substring(0, 60).replace(/\n/g, ' ')
          console.log('✓ 执行成功:', preview + '...')
        } catch (error) {
          // 如果表已存在或数据重复，忽略错误
          if (error.message.includes('already exists') || error.message.includes('Duplicate entry')) {
            const preview = statement.substring(0, 60).replace(/\n/g, ' ')
            console.log('⚠ 已存在，跳过:', preview + '...')
          } else {
            const preview = statement.substring(0, 60).replace(/\n/g, ' ')
            console.error('✗ 执行失败:', preview + '...')
            console.error('错误:', error.message)
          }
        }
      }
    }
    
    console.log('\n数据库表创建完成！')
    
    // 验证表是否创建成功
    console.log('\n验证表结构...')
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN (
        'emergency_plans', 
        'emergency_commands', 
        'emergency_feedbacks',
        'resources',
        'resource_demands',
        'loss_reports'
      )
    `)
    
    console.log('\n已创建的表:')
    tables.forEach(table => {
      console.log('  ✓', table.TABLE_NAME)
    })
    
    if (tables.length === 6) {
      console.log('\n✅ 所有表创建成功！现在可以刷新页面测试API了')
    } else {
      console.log(`\n⚠ 只创建了 ${tables.length}/6 个表，请检查错误信息`)
    }
    
  } catch (error) {
    console.error('\n❌ 创建表失败:', error.message)
  } finally {
    await sequelize.close()
    console.log('\n数据库连接已关闭')
  }
}

createTables()
