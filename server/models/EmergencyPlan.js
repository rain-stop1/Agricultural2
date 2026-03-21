module.exports = (sequelize, DataTypes) => {
  const EmergencyPlan = sequelize.define('EmergencyPlan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    disaster_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '灾害类型ID'
    },
    plan_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '应急方案名称'
    },
    plan_content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '应急方案内容'
    },
    execution_steps: {
      type: DataTypes.JSON,
      comment: '执行步骤'
    },
    resource_requirements: {
      type: DataTypes.JSON,
      comment: '所需资源'
    },
    applicable_regions: {
      type: DataTypes.JSON,
      comment: '适用区域'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '1:启用 0:禁用'
    }
  }, {
    tableName: 'emergency_plans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  })

  return EmergencyPlan
}