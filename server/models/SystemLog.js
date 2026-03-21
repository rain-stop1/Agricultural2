module.exports = (sequelize, DataTypes) => {
  const SystemLog = sequelize.define('SystemLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      comment: '用户ID'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '操作类型'
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作模块'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '操作描述'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      comment: 'IP地址'
    },
    user_agent: {
      type: DataTypes.TEXT,
      comment: '用户代理'
    }
  }, {
    tableName: 'system_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  })

  return SystemLog
}