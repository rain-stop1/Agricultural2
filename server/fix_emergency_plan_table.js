require('dotenv').config()
const sequelize = require('./config/database')

async function fixEmergencyPlanTable() {
  try {
    console.log('开始检查并修复 emergency_plans 表...')
    
    // 检查表是否存在
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'emergency_plans'")
    
    if (tables.length === 0) {
      console.log('表 emergency_plans 不存在，创建表...')
      
      // 创建表
      await sequelize.query(`
        CREATE TABLE emergency_plans (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          disaster_type VARCHAR(100) NOT NULL,
          plan_name VARCHAR(255) NOT NULL,
          target_area VARCHAR(255) NOT NULL,
          priority ENUM('low', 'medium', 'high') NOT NULL,
          description TEXT,
          status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
          response_count INT DEFAULT 0,
          progress INT DEFAULT 0,
          start_time DATETIME,
          cancel_reason TEXT,
          cancel_time DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)
      
      console.log('表 emergency_plans 创建成功')
    } else {
      console.log('表 emergency_plans 已存在，检查字段...')
      
      // 检查 user_id 字段是否存在
      const [columns] = await sequelize.query("SHOW COLUMNS FROM emergency_plans LIKE 'user_id'")
      
      if (columns.length === 0) {
        console.log('字段 user_id 不存在，添加字段...')
        
        // 添加 user_id 字段
        await sequelize.query("ALTER TABLE emergency_plans ADD COLUMN user_id INT NOT NULL")
        
        console.log('字段 user_id 添加成功')
      } else {
        console.log('字段 user_id 已存在')
      }
    }
    
    console.log('修复完成')
    process.exit(0)
  } catch (error) {
    console.error('修复过程中出现错误:', error)
    process.exit(1)
  }
}

fixEmergencyPlanTable()