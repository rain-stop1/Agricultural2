-- 农业灾害预警与应急响应系统数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS agricultural_disaster_db 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE agricultural_disaster_db;

-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    user_type ENUM('farmer', 'admin') NOT NULL DEFAULT 'farmer',
    status TINYINT(1) DEFAULT 1 COMMENT '1:启用 0:禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 作物表
CREATE TABLE crops (
    id INT PRIMARY KEY AUTO_INCREMENT,
    crop_name VARCHAR(100) NOT NULL COMMENT '作物名称',
    crop_type VARCHAR(50) NOT NULL COMMENT '作物类型',
    growth_cycle INT NOT NULL COMMENT '生长周期(天)',
    disaster_tolerance JSON COMMENT '灾害耐受性配置',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 地块表
CREATE TABLE fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    area DECIMAL(10,2) NOT NULL COMMENT '面积(亩)',
    crop_id INT NOT NULL,
    planting_date DATE,
    status TINYINT(1) DEFAULT 1 COMMENT '1:种植中 0:休耕',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (crop_id) REFERENCES crops(id)
);

-- 气象数据表
CREATE TABLE weather_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    region VARCHAR(100) NOT NULL,
    temperature DECIMAL(5,2) COMMENT '温度(°C)',
    humidity DECIMAL(5,2) COMMENT '湿度(%)',
    rainfall DECIMAL(8,2) COMMENT '降雨量(mm)',
    wind_speed DECIMAL(5,2) COMMENT '风速(m/s)',
    wind_direction VARCHAR(10) COMMENT '风向',
    air_pressure DECIMAL(7,2) COMMENT '气压(hPa)',
    record_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_region_time (region, record_time)
);

-- 灾害类型表
CREATE TABLE disaster_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL COMMENT '灾害类型名称',
    type_code VARCHAR(20) UNIQUE NOT NULL COMMENT '灾害类型编码',
    description TEXT COMMENT '灾害描述',
    warning_criteria JSON COMMENT '预警判定标准',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 预警记录表
CREATE TABLE warning_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_type_id INT NOT NULL,
    region VARCHAR(100) NOT NULL,
    warning_level ENUM('light', 'moderate', 'severe') NOT NULL COMMENT '预警等级',
    warning_content TEXT NOT NULL COMMENT '预警内容',
    affected_fields JSON COMMENT '影响地块列表',
    start_time TIMESTAMP NOT NULL COMMENT '预警开始时间',
    end_time TIMESTAMP NULL COMMENT '预警结束时间',
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disaster_type_id) REFERENCES disaster_types(id)
);

-- 应急方案表
CREATE TABLE emergency_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_type_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    plan_content TEXT NOT NULL COMMENT '应急方案内容',
    execution_steps JSON COMMENT '执行步骤',
    resource_requirements JSON COMMENT '所需资源',
    applicable_regions JSON COMMENT '适用区域',
    status TINYINT(1) DEFAULT 1 COMMENT '1:启用 0:禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (disaster_type_id) REFERENCES disaster_types(id)
);

-- 资源表
CREATE TABLE resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    resource_name VARCHAR(100) NOT NULL COMMENT '资源名称',
    resource_type ENUM('machinery', 'materials', 'service') NOT NULL COMMENT '资源类型',
    owner_id INT NOT NULL COMMENT '所有者ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT '数量',
    unit VARCHAR(20) NOT NULL COMMENT '单位',
    location VARCHAR(255) NOT NULL COMMENT '位置',
    description TEXT COMMENT '资源描述',
    contact_info VARCHAR(100) COMMENT '联系方式',
    availability TINYINT(1) DEFAULT 1 COMMENT '1:可用 0:不可用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 资源需求表
CREATE TABLE resource_demands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    demand_user_id INT NOT NULL,
    disaster_id INT NULL COMMENT '关联的灾害ID',
    resource_type ENUM('machinery', 'materials', 'service') NOT NULL,
    resource_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(20) NOT NULL,
    urgency ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    location VARCHAR(255) NOT NULL,
    description TEXT,
    contact_info VARCHAR(100),
    status ENUM('pending', 'matched', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (demand_user_id) REFERENCES users(id)
);

-- 资源匹配记录表
CREATE TABLE resource_matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    demand_id INT NOT NULL,
    resource_id INT NOT NULL,
    matched_quantity INT NOT NULL,
    match_status ENUM('pending', 'confirmed', 'rejected', 'completed') DEFAULT 'pending',
    match_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (demand_id) REFERENCES resource_demands(id),
    FOREIGN KEY (resource_id) REFERENCES resources(id)
);

-- 损失上报表
CREATE TABLE loss_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    field_id INT NOT NULL,
    disaster_type_id INT NOT NULL,
    affected_area DECIMAL(10,2) NOT NULL COMMENT '受灾面积(亩)',
    estimated_loss DECIMAL(12,2) NOT NULL COMMENT '预估损失(元)',
    loss_description TEXT COMMENT '损失描述',
    images JSON COMMENT '损失照片',
    report_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    verified_by INT NULL COMMENT '审核人ID',
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (field_id) REFERENCES fields(id),
    FOREIGN KEY (disaster_type_id) REFERENCES disaster_types(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- 评估报告表
CREATE TABLE assessment_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    disaster_id INT NULL COMMENT '关联灾害ID',
    region VARCHAR(100) NOT NULL,
    total_affected_area DECIMAL(12,2) NOT NULL COMMENT '总受灾面积',
    total_economic_loss DECIMAL(15,2) NOT NULL COMMENT '总经济损失',
    affected_households INT NOT NULL COMMENT '受灾户数',
    crop_damage_rate DECIMAL(5,2) COMMENT '作物受灾率(%)',
    recovery_recommendations TEXT COMMENT '恢复建议',
    report_date DATE NOT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 系统日志表
CREATE TABLE system_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL COMMENT '操作类型',
    module VARCHAR(50) NOT NULL COMMENT '操作模块',
    description TEXT COMMENT '操作描述',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 插入初始数据

-- 插入灾害类型
INSERT INTO disaster_types (type_name, type_code, description, warning_criteria) VALUES
('干旱', 'drought', '持续缺水导致作物生长受阻的灾害', JSON_OBJECT(
  'rainfall', JSON_OBJECT('max', 5),
  'temperature', JSON_OBJECT('min', 30),
  'humidity', JSON_OBJECT('max', 40)
)),
('洪涝', 'flood', '降水量过大导致农田被淹的灾害', JSON_OBJECT(
  'rainfall', JSON_OBJECT('min', 50)
)),
('冰雹', 'hail', '冰雹天气造成作物物理损伤的灾害', JSON_OBJECT(
  'temperature', JSON_OBJECT('min', 25),
  'humidity', JSON_OBJECT('min', 70),
  'air_pressure', JSON_OBJECT('max', 1000)
)),
('台风', 'typhoon', '强风暴雨造成的综合灾害', JSON_OBJECT(
  'wind_speed', JSON_OBJECT('min', 17)
)),
('病虫害', 'pest', '病虫害导致的作物减产灾害', JSON_OBJECT(
  'temperature', JSON_OBJECT('min', 20, 'max', 35),
  'humidity', JSON_OBJECT('min', 60)
));

-- 插入作物数据
INSERT INTO crops (crop_name, crop_type, growth_cycle) VALUES
('水稻', '粮食作物', 120),
('小麦', '粮食作物', 90),
('玉米', '粮食作物', 100),
('大豆', '经济作物', 110),
('棉花', '经济作物', 150),
('蔬菜', '蔬菜作物', 60);

-- 插入默认管理员账号（密码：admin123）
INSERT INTO users (username, password, real_name, user_type, phone, email) VALUES
('admin', '$2a$12$PaW7AwDnKJ42ioD/ppsfQO9L71gXYaN4ys/ozgfS7HCYJ29rZAJnK', '系统管理员', 'admin', '13800138000', 'admin@example.com');

-- 插入测试农户账号（密码：farmer123）
INSERT INTO users (username, password, real_name, user_type, phone, email) VALUES
('farmer1', '$2a$12$JBoPU/26ltMS316oC1BwI.0QOPeTV5b0s2Wrt58bMFpX8r4Hd3hh6', '张三', 'farmer', '13900139000', 'farmer1@example.com');

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_fields_user_id ON fields(user_id);
CREATE INDEX idx_warning_records_region ON warning_records(region);
CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resource_demands_status ON resource_demands(status);
CREATE INDEX idx_loss_reports_status ON loss_reports(report_status);