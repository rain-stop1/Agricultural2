-- 清理 users 表的多余索引
-- 请在 MySQL 客户端中执行此脚本

USE agricultural_disaster_db;

-- 查看当前所有索引
SHOW INDEX FROM users;

-- 删除除了 PRIMARY 和 username 之外的所有索引
-- 注意：根据实际情况调整索引名称

-- 示例：删除可能存在的多余索引
-- ALTER TABLE users DROP INDEX idx_phone;
-- ALTER TABLE users DROP INDEX idx_email;
-- ALTER TABLE users DROP INDEX idx_user_type;
-- ALTER TABLE users DROP INDEX idx_status;

-- 如果有很多索引，可以用以下查询生成删除语句
SELECT CONCAT('ALTER TABLE users DROP INDEX `', INDEX_NAME, '`;')
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'agricultural_disaster_db'
  AND TABLE_NAME = 'users'
  AND INDEX_NAME != 'PRIMARY'
  AND INDEX_NAME != 'username';

-- 执行完上面的查询后，复制生成的 SQL 语句并执行
