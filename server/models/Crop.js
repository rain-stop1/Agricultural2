module.exports = (sequelize, DataTypes) => {
  const Crop = sequelize.define('Crop', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    crop_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '作物名称'
    },
    crop_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '作物类型'
    },
    growth_cycle: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '生长周期(天)'
    },
    disaster_tolerance: {
      type: DataTypes.JSON,
      comment: '灾害耐受性配置'
    }
  }, {
    tableName: 'crops',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  })

  return Crop
}