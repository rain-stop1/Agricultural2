module.exports = (sequelize, DataTypes) => {
  const ResourceDemand = sequelize.define('ResourceDemand', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    demand_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '需求用户ID'
    },
    disaster_id: {
      type: DataTypes.INTEGER,
      comment: '关联的灾害ID'
    },
    resource_type: {
      type: DataTypes.ENUM('machinery', 'materials', 'service'),
      allowNull: false,
      comment: '资源类型'
    },
    resource_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '资源名称'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '数量'
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '单位'
    },
    urgency: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium',
      comment: '紧急程度'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '位置'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '描述'
    },
    contact_info: {
      type: DataTypes.STRING(100),
      comment: '联系方式'
    },
    status: {
      type: DataTypes.ENUM('pending', 'matched', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '状态'
    }
  }, {
    tableName: 'resource_demands',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  })

  return ResourceDemand
}