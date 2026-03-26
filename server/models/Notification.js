module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '通知标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '通知内容'
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'info',
      comment: '通知类型：info, success, warning, error'
    },
    user_id: {
      type: DataTypes.INTEGER,
      comment: '接收用户ID，null表示所有管理员'
    },
    read_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '阅读状态'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  })

  return Notification
}