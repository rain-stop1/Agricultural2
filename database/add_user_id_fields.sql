-- 添加 user_id 字段到相关表
-- 执行时间: 2026-02-23

-- 1. 应急方案表添加 user_id
ALTER TABLE emergency_plans 
ADD COLUMN user_id INT NOT NULL COMMENT '创建用户ID' AFTER id,
ADD INDEX idx_user_id (user_id);

-- 2. 损失上报表添加 user_id
ALTER TABLE loss_reports 
ADD COLUMN user_id INT NOT NULL COMMENT '上报用户ID' AFTER id,
ADD INDEX idx_user_id (user_id);

-- 3. 资源表添加 user_id
ALTER TABLE resources 
ADD COLUMN user_id INT NOT NULL COMMENT '资源所有者ID' AFTER id,
ADD INDEX idx_user_id (user_id);

-- 4. 资源需求表添加 user_id
ALTER TABLE resource_demands 
ADD COLUMN user_id INT NOT NULL COMMENT '需求发布者ID' AFTER id,
ADD INDEX idx_user_id (user_id);

-- 更新现有数据（将现有数据关联到 farmer1 用户，ID=2）
UPDATE emergency_plans SET user_id = 2 WHERE user_id = 0;
UPDATE loss_reports SET user_id = 2 WHERE user_id = 0;
UPDATE resources SET user_id = 2 WHERE user_id = 0;
UPDATE resource_demands SET user_id = 2 WHERE user_id = 0;

-- 验证更新
SELECT 'emergency_plans' as table_name, COUNT(*) as count FROM emergency_plans;
SELECT 'loss_reports' as table_name, COUNT(*) as count FROM loss_reports;
SELECT 'resources' as table_name, COUNT(*) as count FROM resources;
SELECT 'resource_demands' as table_name, COUNT(*) as count FROM resource_demands;
