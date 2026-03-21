-- 更新灾害类型，添加分级预警阈值配置
-- 使用方法: mysql -u root -p agricultural_disaster_db < database/update_disaster_types_with_levels.sql

USE agricultural_disaster_db;

-- 更新干旱灾害类型（分级配置）
UPDATE disaster_types 
SET warning_criteria = JSON_OBJECT(
  'severe', JSON_ARRAY(
    JSON_OBJECT('type', 'humidity', 'operator', '<', 'value', 30),
    JSON_OBJECT('type', 'temperature', 'operator', '>', 'value', 35),
    JSON_OBJECT('type', 'rainfall', 'operator', '<', 'value', 5)
  ),
  'moderate', JSON_ARRAY(
    JSON_OBJECT('type', 'humidity', 'operator', '<', 'value', 40),
    JSON_OBJECT('type', 'temperature', 'operator', '>', 'value', 30)
  ),
  'light', JSON_ARRAY(
    JSON_OBJECT('type', 'humidity', 'operator', '<', 'value', 50),
    JSON_OBJECT('type', 'temperature', 'operator', '>', 'value', 28)
  )
),
description = '长期缺水导致的农业灾害。重度：湿度<30%且温度>35°C且降雨<5mm；中度：湿度<40%且温度>30°C；轻度：湿度<50%且温度>28°C'
WHERE type_code = 'drought';

-- 更新洪涝灾害类型（分级配置）
UPDATE disaster_types 
SET warning_criteria = JSON_OBJECT(
  'severe', JSON_ARRAY(
    JSON_OBJECT('type', 'rainfall', 'operator', '>', 'value', 100)
  ),
  'moderate', JSON_ARRAY(
    JSON_OBJECT('type', 'rainfall', 'operator', '>', 'value', 50)
  ),
  'light', JSON_ARRAY(
    JSON_OBJECT('type', 'rainfall', 'operator', '>', 'value', 25)
  )
),
description = '降雨过多导致的农业灾害。重度：24小时降雨量>100mm；中度：24小时降雨量>50mm；轻度：24小时降雨量>25mm'
WHERE type_code = 'flood';

-- 更新冻害灾害类型（分级配置）
UPDATE disaster_types 
SET warning_criteria = JSON_OBJECT(
  'severe', JSON_ARRAY(
    JSON_OBJECT('type', 'temperature', 'operator', '<', 'value', -10)
  ),
  'moderate', JSON_ARRAY(
    JSON_OBJECT('type', 'temperature', 'operator', '<', 'value', -5)
  ),
  'light', JSON_ARRAY(
    JSON_OBJECT('type', 'temperature', 'operator', '<', 'value', 0)
  )
),
description = '低温导致的农作物冻伤。重度：温度<-10°C；中度：温度<-5°C；轻度：温度<0°C'
WHERE type_code = 'freeze';

-- 更新高温灾害类型（分级配置）
UPDATE disaster_types 
SET warning_criteria = JSON_OBJECT(
  'severe', JSON_ARRAY(
    JSON_OBJECT('type', 'temperature', 'operator', '>', 'value', 40)
  ),
  'moderate', JSON_ARRAY(
    JSON_OBJECT('type', 'temperature', 'operator', '>', 'value', 38)
  ),
  'light', JSON_ARRAY(
    JSON_OBJECT('type', 'temperature', 'operator', '>', 'value', 35)
  )
),
description = '高温导致的农作物热害。重度：温度>40°C；中度：温度>38°C；轻度：温度>35°C'
WHERE type_code = 'heat';

-- 更新大风灾害类型（分级配置）
UPDATE disaster_types 
SET warning_criteria = JSON_OBJECT(
  'severe', JSON_ARRAY(
    JSON_OBJECT('type', 'wind_speed', 'operator', '>', 'value', 32)
  ),
  'moderate', JSON_ARRAY(
    JSON_OBJECT('type', 'wind_speed', 'operator', '>', 'value', 20)
  ),
  'light', JSON_ARRAY(
    JSON_OBJECT('type', 'wind_speed', 'operator', '>', 'value', 17)
  )
),
description = '强风导致的农作物倒伏。重度：风速>32m/s(12级风)；中度：风速>20m/s(9级风)；轻度：风速>17m/s(8级风)'
WHERE type_code = 'wind';

-- 更新病虫害灾害类型（分级配置）
UPDATE disaster_types 
SET warning_criteria = JSON_OBJECT(
  'severe', JSON_ARRAY(
    JSON_OBJECT('type', 'humidity', 'operator', '>', 'value', 85),
    JSON_OBJECT('type', 'temperature', 'operator', '>', 'value', 25)
  ),
  'moderate', JSON_ARRAY(
    JSON_OBJECT('type', 'humidity', 'operator', '>', 'value', 80)
  ),
  'light', JSON_ARRAY(
    JSON_OBJECT('type', 'humidity', 'operator', '>', 'value', 75)
  )
),
description = '高湿环境易引发的病虫害。重度：湿度>85%且温度>25°C；中度：湿度>80%；轻度：湿度>75%'
WHERE type_code = 'pest';

-- 查看更新结果
SELECT 
  id,
  type_name,
  type_code,
  description,
  JSON_PRETTY(warning_criteria) as warning_criteria
FROM disaster_types
ORDER BY id;
