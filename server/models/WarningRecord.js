module.exports = (sequelize, DataTypes) => {
  const WarningRecord = sequelize.define('WarningRecord', {
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
    region: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '预警区域'
    },
    warning_level: {
      type: DataTypes.ENUM('light', 'moderate', 'severe'),
      allowNull: false,
      comment: '预警等级：light轻度，moderate中度，severe重度'
    },
    warning_content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '预警内容'
    },
    affected_fields: {
      type: DataTypes.JSON,
      comment: '影响地块列表'
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '预警开始时间'
    },
    end_time: {
      type: DataTypes.DATE,
      comment: '预警结束时间'
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      defaultValue: 'active',
      comment: '预警状态：active有效，expired已过期，cancelled已取消'
    },
    batch_order: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '预警批序，每半小时为一批'
    },
    // 暂时注释掉source字段，因为数据库中可能还没有这个字段
    // source: {
    //   type: DataTypes.ENUM('meteorological_bureau', 'threshold'),
    //   defaultValue: 'threshold',
    //   comment: '预警来源：meteorological_bureau气象局，threshold阈值设定'
    // }
  }, {
    tableName: 'warning_records',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['region']
      },
      {
        fields: ['status']
      },
      {
        fields: ['start_time']
      }
    ]
  })

  return WarningRecord
}