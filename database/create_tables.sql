-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 应急方案表
CREATE TABLE IF NOT EXISTS emergency_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  disaster_type VARCHAR(50) NOT NULL COMMENT '灾害类型',
  plan_name VARCHAR(200) NOT NULL COMMENT '方案名称',
  target_area VARCHAR(200) NOT NULL COMMENT '目标区域',
  priority VARCHAR(20) NOT NULL COMMENT '优先级',
  description TEXT COMMENT '方案描述',
  status VARCHAR(20) DEFAULT 'active' COMMENT '状态: active-进行中, completed-已完成',
  response_count INT DEFAULT 0 COMMENT '响应人数',
  progress INT DEFAULT 0 COMMENT '进度百分比',
  start_time DATETIME COMMENT '启动时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应急方案表';

-- 应急指令表
CREATE TABLE IF NOT EXISTS emergency_commands (
  id INT PRIMARY KEY AUTO_INCREMENT,
  plan_id INT COMMENT '关联的方案ID',
  target_area VARCHAR(200) NOT NULL COMMENT '目标区域',
  priority VARCHAR(20) NOT NULL COMMENT '优先级',
  command_content TEXT NOT NULL COMMENT '指令内容',
  status VARCHAR(20) DEFAULT 'published' COMMENT '状态',
  publish_time DATETIME COMMENT '发布时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES emergency_plans(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应急指令表';

-- 执行反馈表
CREATE TABLE IF NOT EXISTS emergency_feedbacks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  command_id INT COMMENT '关联的指令ID',
  executor VARCHAR(100) NOT NULL COMMENT '执行人',
  feedback_content TEXT NOT NULL COMMENT '反馈内容',
  status VARCHAR(20) NOT NULL COMMENT '状态: completed-已完成, in_progress-进行中',
  feedback_time DATETIME COMMENT '反馈时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (command_id) REFERENCES emergency_commands(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='执行反馈表';

-- 资源表
CREATE TABLE IF NOT EXISTS resources (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50) NOT NULL COMMENT '资源类型: machinery-农机, material-农资, service-农技服务',
  name VARCHAR(200) NOT NULL COMMENT '资源名称',
  owner VARCHAR(100) NOT NULL COMMENT '所有者',
  location VARCHAR(200) NOT NULL COMMENT '位置',
  quantity DECIMAL(10,2) NOT NULL COMMENT '数量',
  unit VARCHAR(20) NOT NULL COMMENT '单位',
  status VARCHAR(20) DEFAULT 'available' COMMENT '状态: available-可用, in_use-使用中',
  remark TEXT COMMENT '备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源表';

-- 资源需求表
CREATE TABLE IF NOT EXISTS resource_demands (
  id INT PRIMARY KEY AUTO_INCREMENT,
  resource_type VARCHAR(50) NOT NULL COMMENT '资源类型',
  title VARCHAR(200) NOT NULL COMMENT '需求标题',
  requester VARCHAR(100) NOT NULL COMMENT '需求方',
  location VARCHAR(200) NOT NULL COMMENT '位置',
  quantity DECIMAL(10,2) NOT NULL COMMENT '需求量',
  unit VARCHAR(20) NOT NULL COMMENT '单位',
  urgency INT DEFAULT 3 COMMENT '紧急程度 1-5',
  description TEXT COMMENT '需求描述',
  matched TINYINT DEFAULT 0 COMMENT '是否已匹配 0-否 1-是',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资源需求表';

-- 损失上报表
CREATE TABLE IF NOT EXISTS loss_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  reporter VARCHAR(100) NOT NULL COMMENT '上报人',
  disaster_type VARCHAR(50) NOT NULL COMMENT '灾害类型',
  location VARCHAR(200) NOT NULL COMMENT '受灾地块',
  crop_type VARCHAR(100) NOT NULL COMMENT '作物类型',
  total_area DECIMAL(10,2) NOT NULL COMMENT '地块面积(亩)',
  loss_area DECIMAL(10,2) NOT NULL COMMENT '损失面积(亩)',
  loss_rate INT NOT NULL COMMENT '损失程度(%)',
  loss_amount DECIMAL(12,2) NOT NULL COMMENT '损失金额(元)',
  description TEXT COMMENT '损失描述',
  images JSON COMMENT '现场照片(JSON数组)',
  status VARCHAR(20) DEFAULT 'pending' COMMENT '状态: pending-待审核, approved-已审核, rejected-已驳回',
  approve_comment TEXT COMMENT '审核意见',
  report_time DATETIME COMMENT '上报时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='损失上报表';

-- 插入测试数据
INSERT INTO resources (type, name, owner, location, quantity, unit, status, remark) VALUES
('machinery', '拖拉机', '张三', '江苏省南京市江宁区', 2, '台', 'available', '50马力，状态良好'),
('machinery', '收割机', '李四', '江苏省苏州市吴中区', 1, '台', 'in_use', '联合收割机'),
('material', '化肥', '王五', '河北省石家庄市藁城区', 500, '公斤', 'available', '复合肥'),
('material', '农药', '赵六', '山东省济南市历城区', 100, '升', 'available', '杀虫剂'),
('service', '农技指导', '农技站', '浙江省杭州市余杭区', 10, '次', 'available', '提供病虫害防治指导');

INSERT INTO resource_demands (resource_type, title, requester, location, quantity, unit, urgency, description, matched) VALUES
('machinery', '急需拖拉机进行翻耕', '孙七', '江苏省南京市浦口区', 1, '台', 5, '50亩地需要翻耕，急需拖拉机', 0),
('material', '需要化肥用于追肥', '周八', '河北省石家庄市正定县', 200, '公斤', 3, '小麦追肥期，需要复合肥', 0),
('service', '病虫害防治咨询', '吴九', '浙江省杭州市萧山区', 1, '次', 4, '作物出现病虫害，需要专家指导', 1);

-- 启用外键检查
SET FOREIGN_KEY_CHECKS = 1;
