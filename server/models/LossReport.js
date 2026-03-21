module.exports = (sequelize, DataTypes) => {
  const LossReport = sequelize.define('LossReport', {
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
    field_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '地块ID'
    },
    disaster_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '灾害类型ID'
    },
    affected_area: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '受灾面积(亩)'
    },
    estimated_loss: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: '预估损失(元)'
    },
    loss_description: {
      type: DataTypes.TEXT,
      comment: '损失描述'
    },
    images: {
      type: DataTypes.JSON,
      comment: '损失照片'
    },
    report_status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '报告状态'
    },
    verified_by: {
      type: DataTypes.INTEGER,
      comment: '审核人ID'
    },
    verified_at: {
      type: DataTypes.DATE,
      comment: '审核时间'
    }
  }, {
    tableName: 'loss_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  })

  return LossReport
}