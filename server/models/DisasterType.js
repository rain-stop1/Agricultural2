module.exports = (sequelize, DataTypes) => {
  const DisasterType = sequelize.define('DisasterType', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '灾害类型名称'
    },
    type_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '灾害类型编码'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '灾害描述'
    },
    warning_criteria: {
      type: DataTypes.JSON,
      comment: '预警判定标准'
    }
  }, {
    tableName: 'disaster_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  })

  return DisasterType
}