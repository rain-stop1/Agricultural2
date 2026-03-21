require('dotenv').config()
const sequelize = require('./config/database')

async function fixIndexes() {
  try {
    console.log('连接数据库...')
    await sequelize.authenticate()
    
    console.log('查询 users 表的索引...')
    const [indexes] = await sequelize.query('SHOW INDEX FROM users')
    
    console.log(`\n当前索引数量: ${indexes.length}`)
    console.log('\n索引列表:')
    indexes.forEach(idx => {
      console.log(`  - ${idx.Key_name} (${idx.Column_name})`)
    })
    
    // 删除除了主键和必要索引外的所有索引
    console.log('\n开始清理多余索引...')
    
    const indexesToKeep = ['PRIMARY', 'username'] // 只保留主键和 username 唯一索引
    const uniqueIndexes = [...new Set(indexes.map(idx => idx.Key_name))]
    
    for (const indexName of uniqueIndexes) {
      if (!indexesToKeep.includes(indexName)) {
        try {
          console.log(`删除索引: ${indexName}`)
          await sequelize.query(`ALTER TABLE users DROP INDEX \`${indexName}\``)
        } catch (err) {
          console.log(`  跳过: ${err.message}`)
        }
      }
    }
    
    console.log('\n索引清理完成！')
    
    // 再次查询确认
    const [newIndexes] = await sequelize.query('SHOW INDEX FROM users')
    console.log(`\n当前索引数量: ${newIndexes.length}`)
    
  } catch (error) {
    console.error('错误:', error)
  } finally {
    await sequelize.close()
    process.exit(0)
  }
}

fixIndexes()
