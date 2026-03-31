const { WarningRecord } = require('./models');
const { Op } = require('sequelize');

async function checkWarnings() {
  try {
    // 检查北京的预警数量
    const beijingCount = await WarningRecord.count({
      where: {
        status: 'active',
        region: {
          [Op.like]: '%北京%'
        }
      }
    });
    
    // 检查深圳的预警数量
    const shenzhenCount = await WarningRecord.count({
      where: {
        status: 'active',
        region: {
          [Op.like]: '%深圳%'
        }
      }
    });
    
    // 检查所有活跃预警数量
    const totalCount = await WarningRecord.count({
      where: {
        status: 'active'
      }
    });
    
    console.log('北京的活跃预警数量:', beijingCount);
    console.log('深圳的活跃预警数量:', shenzhenCount);
    console.log('所有活跃预警数量:', totalCount);
    console.log('北京和深圳的活跃预警总数:', beijingCount + shenzhenCount);
  } catch (error) {
    console.error('检查预警数量失败:', error);
  } finally {
    process.exit();
  }
}

checkWarnings();