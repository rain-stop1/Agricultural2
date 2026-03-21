-- 系统管理模块测试数据
-- 使用方法: mysql -u root -p disaster_warning < database/insert_admin_test_data.sql

USE disaster_warning;

-- 插入作物测试数据
INSERT INTO crops (crop_name, crop_type, growth_cycle, disaster_tolerance, created_at, updated_at) VALUES
('小麦', '粮食作物', 180, '{"drought": "中", "flood": "低", "freeze": "高"}', NOW(), NOW()),
('水稻', '粮食作物', 150, '{"drought": "低", "flood": "中", "freeze": "低"}', NOW(), NOW()),
('玉米', '粮食作物', 120, '{"drought": "中", "flood": "中", "freeze": "中"}', NOW(), NOW()),
('大豆', '经济作物', 100, '{"drought": "中", "flood": "低", "freeze": "中"}', NOW(), NOW()),
('棉花', '经济作物', 180, '{"drought": "高", "flood": "低", "freeze": "低"}', NOW(), NOW()),
('番茄', '蔬菜', 90, '{"drought": "低", "flood": "低", "freeze": "低"}', NOW(), NOW()),
('黄瓜', '蔬菜', 60, '{"drought": "低", "flood": "低", "freeze": "低"}', NOW(), NOW()),
('苹果', '水果', 365, '{"drought": "中", "flood": "中", "freeze": "中"}', NOW(), NOW())
ON DUPLICATE KEY UPDATE crop_name=crop_name;

-- 插入灾害类型测试数据
INSERT INTO disaster_types (type_name, type_code, description, warning_criteria, created_at, updated_at) VALUES
('干旱', 'drought', '长期缺水导致的农业灾害，影响作物生长和产量', '[{"type":"rainfall","operator":"<","value":10}]', NOW(), NOW()),
('洪涝', 'flood', '降雨过多导致的农业灾害，造成农田积水和作物损失', '[{"type":"rainfall","operator":">","value":100}]', NOW(), NOW()),
('冻害', 'freeze', '低温导致的农作物冻伤，严重影响作物生长', '[{"type":"temperature","operator":"<","value":0}]', NOW(), NOW()),
('高温', 'heat', '高温导致的农作物热害，影响作物正常生长发育', '[{"type":"temperature","operator":">","value":35}]', NOW(), NOW()),
('大风', 'wind', '强风导致的农作物倒伏，造成产量损失', '[{"type":"wind_speed","operator":">","value":20}]', NOW(), NOW()),
('病虫害', 'pest', '病虫害导致的农作物损失，需要及时防治', '[{"type":"humidity","operator":">","value":80}]', NOW(), NOW())
ON DUPLICATE KEY UPDATE type_name=type_name;

-- 查看插入结果
SELECT '作物数据:' as info;
SELECT id, crop_name, crop_type, growth_cycle FROM crops;

SELECT '灾害类型数据:' as info;
SELECT id, type_name, type_code, description FROM disaster_types;

SELECT '数据统计:' as info;
SELECT 
  (SELECT COUNT(*) FROM crops) as crops_count,
  (SELECT COUNT(*) FROM disaster_types) as disaster_types_count,
  (SELECT COUNT(*) FROM users) as users_count;
