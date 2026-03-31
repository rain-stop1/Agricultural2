module.exports = (sequelize, DataTypes) => {
  const Field = sequelize.define('Field', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    field_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '地块名称'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '位置'
    },
    area: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '面积(亩)'
    },
    crop_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '作物ID'
    },
    planting_date: {
      type: DataTypes.DATEONLY,
      comment: '种植日期'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '1:种植中 0:休耕'
    }
  }, {
    tableName: 'fields',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  })

  return Field
}