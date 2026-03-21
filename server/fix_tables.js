const { Sequelize } = require('sequelize')

const sequelize = new Sequelize({
  host: 'localhost',
  port: 3306,
  database: 'agricultural_disaster_db',
  username: 'root',
  password: '8022',
  dialect: 'mysql',
  logging: false
})

async function fixTables() {
  try {
    console.log('开始修复数据库表...')
    await sequelize.authenticate()
    console.log('✓ 数据库连接成功\n')
    
    // 删除所有相关表（按依赖顺序）
    console.log('删除旧表...')
    const tablesToDrop = [
      'resource_matches',  // 先删除有外键的表
      'emergency_feedbacks',
      'emergency_commands',
      'emergency_plans',
      'resource_demands',
      'resources',
      'loss_reports'
    ]
    
    for (const table of tablesToDrop) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS ${table}`)
        console.log(`✓ 删除表: ${table}`)
      } catch (error) {
        console.log(`⚠ 删除表失败: ${table} - ${error.message}`)
      }
    }
    
    console.log('\n创建新表...')
    
    // 创建应急方案表
    await sequelize.query(`
      CREATE TABLE emergency_plans (
        id INT PRIMARY KEY AUTO_INCREMENT,
        disaster_type VARCHAR(50) NOT NULL COMMENT '灾害类型',
        plan_name VARCHAR(200) NOT NULL COMMENT '方案名称',
        target_area VARCHAR(200) NOT NULL COMMENT '目标区域',
        priority VARCHAR(20) NOT NULL COMMENT '优先级',
        description TEXT COMMENT '方案描述',
        status VARCHAR(20) DEFAULT 'active' COMMENT '状态',
        response_count INT DEFAULT 0 COMMENT '响应人数',
        progress INT DEFAULT 0 COMMENT '进度百分比',
        start_time DATETIME COMMENT '启动时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应急方案表'
    `)
    console.log('✓ 创建表: emergency_plans')
    
    // 创建应急指令表
    await sequelize.query(`
      CREATE TABLE emergency_commands (
        id INT PRIMARY KEY AUTO_INCREMENT,
        plan_id INT COMMENT '关联的方案ID',
        target_area VARCHAR(200) NOT NULL COMMENT '目标区域',
        priority VARCHAR(20) NOT NULL COMMENT '优先级',
        command_content TEXT NOT NULL COMMENT '指令内容',
        status VARCHAR(20) DEFAULT 'published' COMMENT '状态',
        publish_time DATETIME COMMENT '发布时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应急指令表'
    `)
    console.log('✓ 创建表: emergency_commands')
    
    // 创建执行反馈表
    await sequelize.query(`
      CREATE TABLE emergency_feedbacks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        command_id INT COMMENT '关联的指令ID',
        executor VARCHAR(100) NOT NULL COMMENT '执行人',
        feedback_content TEXT NOT NULL COMMENT '反馈内容',
        status VARCHAR(20) NOT NULL COMMENT '状态',
        feedback_time DATETIME COMMENT '反馈时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='执行反馈表'
    `)
    console.log('✓ 创建表: emergency_feedbacks')
    
    // 创建资源表
    await sequelize.query(`
      CREATE TABLE resources (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type VARCHAR(50) NOT NULL COMMENT '资源类型',
        name VARCHAR(200) NOT NULL COMMENT '资源名称',
        owner VARCHAR(100) NOT NULL COMMENT '所有者',
        location VARCHAR(200) NOT NULL COMMENT '位置',
        quantity DECIMAL(10,2) NOT NULL COMMENT '数量',
        unit VARCHAR(20) NOT NULL COMMENT '单位',
        status VARCHAR(20) DEFAULT 'available' COMMENT '状态',
        remark TEXT COMMENT '备注',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源表'
    `)
    console.log('✓ 创建表: resources')
    
    // 创建资源需求表
    await sequelize.query(`
      CREATE TABLE resource_demands (
        id INT PRIMARY KEY AUTO_INCREMENT,
        resource_type VARCHAR(50) NOT NULL COMMENT '资源类型',
        title VARCHAR(200) NOT NULL COMMENT '需求标题',
        requester VARCHAR(100) NOT NULL COMMENT '需求方',
        location VARCHAR(200) NOT NULL COMMENT '位置',
        quantity DECIMAL(10,2) NOT NULL COMMENT '需求量',
        unit VARCHAR(20) NOT NULL COMMENT '单位',
        urgency INT DEFAULT 3 COMMENT '紧急程度',
        description TEXT COMMENT '需求描述',
        matched TINYINT DEFAULT 0 COMMENT '是否已匹配',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源需求表'
    `)
    console.log('✓ 创建表: resource_demands')
    
    // 创建损失上报表
    await sequelize.query(`
      CREATE TABLE loss_reports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        reporter VARCHAR(100) NOT NULL COMMENT '上报人',
        disaster_type VARCHAR(50) NOT NULL COMMENT '灾害类型',
        location VARCHAR(200) NOT NULL COMMENT '受灾地块',
        crop_type VARCHAR(100) NOT NULL COMMENT '作物类型',
        total_area DECIMAL(10,2) NOT NULL COMMENT '地块面积',
        loss_area DECIMAL(10,2) NOT NULL COMMENT '损失面积',
        loss_rate INT NOT NULL COMMENT '损失程度',
        loss_amount DECIMAL(12,2) NOT NULL COMMENT '损失金额',
        description TEXT COMMENT '损失描述',
        images JSON COMMENT '现场照片',
        status VARCHAR(20) DEFAULT 'pending' COMMENT '状态',
        approve_comment TEXT COMMENT '审核意见',
        report_time DATETIME COMMENT '上报时间',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='损失上报表'
    `)
    console.log('✓ 创建表: loss_reports')
    
    console.log('\n插入测试数据...')
    
    // 插入资源测试数据
    await sequelize.query(`
      INSERT INTO resources (type, name, owner, location, quantity, unit, status, remark) VALUES
      ('machinery', '拖拉机', '张三', '江苏省南京市江宁区', 2, '台', 'available', '50马力，状态良好'),
      ('machinery', '收割机', '李四', '江苏省苏州市吴中区', 1, '台', 'in_use', '联合收割机'),
      ('material', '化肥', '王五', '河北省石家庄市藁城区', 500, '公斤', 'available', '复合肥')
    `)
    console.log('✓ 插入资源测试数据')
    
    // 插入需求测试数据
    await sequelize.query(`
      INSERT INTO resource_demands (resource_type, title, requester, location, quantity, unit, urgency, description, matched) VALUES
      ('machinery', '急需拖拉机进行翻耕', '孙七', '江苏省南京市浦口区', 1, '台', 5, '50亩地需要翻耕', 0),
      ('material', '需要化肥用于追肥', '周八', '河北省石家庄市正定县', 200, '公斤', 3, '小麦追肥期', 0)
    `)
    console.log('✓ 插入需求测试数据')
    
    console.log('\n✅ 所有表创建成功！现在可以刷新页面测试API了')
    
  } catch (error) {
    console.error('\n❌ 修复失败:', error.message)
  } finally {
    await sequelize.close()
  }
}

fixTables()
