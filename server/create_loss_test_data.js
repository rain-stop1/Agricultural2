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

async function createTestData() {
  try {
    console.log('开始插入损失上报测试数据...')
    await sequelize.authenticate()
    console.log('✓ 数据库连接成功\n')
    
    // 损失上报测试数据
    const lossReports = [
      {
        reporter: '张三',
        disaster_type: 'flood',
        location: '江苏省南京市江宁区东山街道',
        crop_type: '水稻',
        total_area: 50,
        loss_area: 35,
        loss_rate: 70,
        loss_amount: 28000,
        description: '连续暴雨导致农田积水严重，水稻大面积倒伏，部分稻田被淹没超过48小时',
        images: JSON.stringify([
          'https://picsum.photos/400/300?random=1',
          'https://picsum.photos/400/300?random=2'
        ]),
        status: 'pending',
        report_time: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        reporter: '李四',
        disaster_type: 'drought',
        location: '河北省石家庄市藁城区',
        crop_type: '小麦',
        total_area: 80,
        loss_area: 60,
        loss_rate: 75,
        loss_amount: 45000,
        description: '持续干旱40天，土壤严重缺水，小麦出现大面积枯萎现象，产量预计减少75%',
        images: JSON.stringify([
          'https://picsum.photos/400/300?random=3',
          'https://picsum.photos/400/300?random=4',
          'https://picsum.photos/400/300?random=5'
        ]),
        status: 'approved',
        approve_comment: '情况属实，已核实现场，建议尽快启动应急灌溉',
        report_time: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        reporter: '王五',
        disaster_type: 'freeze',
        location: '山东省济南市历城区',
        crop_type: '蔬菜',
        total_area: 30,
        loss_area: 25,
        loss_rate: 83,
        loss_amount: 35000,
        description: '突发寒潮，气温骤降至-5℃，大棚蔬菜受冻严重，番茄、黄瓜等作物大量冻伤',
        images: JSON.stringify([
          'https://picsum.photos/400/300?random=6'
        ]),
        status: 'approved',
        approve_comment: '已审核通过，损失情况严重，建议申请灾害补助',
        report_time: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      {
        reporter: '赵六',
        disaster_type: 'heat',
        location: '浙江省杭州市余杭区',
        crop_type: '水稻',
        total_area: 45,
        loss_area: 20,
        loss_rate: 44,
        loss_amount: 18000,
        description: '连续高温天气，最高温度达到39℃，水稻出现热害，部分稻穗空壳率增加',
        images: JSON.stringify([
          'https://picsum.photos/400/300?random=7',
          'https://picsum.photos/400/300?random=8'
        ]),
        status: 'pending',
        report_time: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        reporter: '孙七',
        disaster_type: 'wind',
        location: '江苏省苏州市吴中区',
        crop_type: '果树',
        total_area: 25,
        loss_area: 18,
        loss_rate: 72,
        loss_amount: 52000,
        description: '强风天气导致果园大量果树倒伏，枝条折断，即将成熟的苹果大量掉落',
        images: JSON.stringify([
          'https://picsum.photos/400/300?random=9',
          'https://picsum.photos/400/300?random=10',
          'https://picsum.photos/400/300?random=11'
        ]),
        status: 'rejected',
        approve_comment: '经核实，损失程度与实际情况不符，请重新评估后再次上报',
        report_time: new Date(Date.now() - 48 * 60 * 60 * 1000)
      },
      {
        reporter: '周八',
        disaster_type: 'pest',
        location: '安徽省合肥市肥西县',
        crop_type: '玉米',
        total_area: 60,
        loss_area: 40,
        loss_rate: 67,
        loss_amount: 32000,
        description: '玉米螟虫害爆发，大面积玉米茎秆被蛀空，玉米棒发育不良，产量严重下降',
        images: JSON.stringify([
          'https://picsum.photos/400/300?random=12'
        ]),
        status: 'pending',
        report_time: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        reporter: '吴九',
        disaster_type: 'flood',
        location: '湖北省武汉市江夏区',
        crop_type: '蔬菜',
        total_area: 35,
        loss_area: 30,
        loss_rate: 86,
        loss_amount: 42000,
        description: '暴雨引发内涝，蔬菜大棚进水，茄子、辣椒等蔬菜根系腐烂，基本绝收',
        images: JSON.stringify([
          'https://picsum.photos/400/300?random=13',
          'https://picsum.photos/400/300?random=14'
        ]),
        status: 'approved',
        approve_comment: '损失情况核实无误，已列入灾害补助名单',
        report_time: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        reporter: '郑十',
        disaster_type: 'drought',
        location: '河南省郑州市中牟县',
        crop_type: '大蒜',
        total_area: 40,
        loss_area: 28,
        loss_rate: 70,
        loss_amount: 38000,
        description: '春季干旱少雨，大蒜生长期缺水严重，蒜头普遍偏小，品质下降明显',
        images: JSON.stringify([
          'https://picsum.photos/400/300?random=15',
          'https://picsum.photos/400/300?random=16',
          'https://picsum.photos/400/300?random=17'
        ]),
        status: 'pending',
        report_time: new Date(Date.now() - 30 * 60 * 1000)
      }
    ]
    
    // 插入数据
    for (const report of lossReports) {
      await sequelize.query(`
        INSERT INTO loss_reports 
        (reporter, disaster_type, location, crop_type, total_area, loss_area, loss_rate, 
         loss_amount, description, images, status, approve_comment, report_time, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          report.reporter,
          report.disaster_type,
          report.location,
          report.crop_type,
          report.total_area,
          report.loss_area,
          report.loss_rate,
          report.loss_amount,
          report.description,
          report.images,
          report.status,
          report.approve_comment || null,
          report.report_time
        ]
      })
      console.log(`✓ 插入: ${report.reporter} - ${report.location} - ${report.crop_type}`)
    }
    
    console.log(`\n✅ 成功插入 ${lossReports.length} 条损失上报测试数据！`)
    
    // 显示统计
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(loss_amount) as total_loss
      FROM loss_reports
    `)
    
    console.log('\n📊 数据统计:')
    console.log(`  总上报数: ${stats[0].total}`)
    console.log(`  待审核: ${stats[0].pending}`)
    console.log(`  已通过: ${stats[0].approved}`)
    console.log(`  已驳回: ${stats[0].rejected}`)
    console.log(`  总损失金额: ¥${stats[0].total_loss.toLocaleString()}`)
    
  } catch (error) {
    console.error('\n❌ 插入数据失败:', error.message)
  } finally {
    await sequelize.close()
  }
}

createTestData()
