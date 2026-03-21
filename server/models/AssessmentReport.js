module.exports = (sequelize, DataTypes) => {
  const AssessmentReport = sequelize.define('AssessmentReport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    disaster_id: {
      type: DataTypes.INTEGER,
      comment: '关联灾害ID'
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '区域'
    },
    total_affected_area: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: '总受灾面积'
    },
    total_economic_loss: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: '总经济损失'
    },
    affected_households: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '受灾户数'
    },
    crop_damage_rate: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '作物受灾率(%)'
    },
    recovery_recommendations: {
      type: DataTypes.TEXT,
      comment: '恢复建议'
    },
    report_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '报告日期'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '创建者ID'
    }
  }, {
    tableName: 'assessment_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  })

  return AssessmentReport
}