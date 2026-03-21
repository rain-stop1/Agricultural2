module.exports = (sequelize, DataTypes) => {
  const ResourceMatch = sequelize.define('ResourceMatch', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    demand_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '需求ID'
    },
    resource_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资源ID'
    },
    matched_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '匹配数量'
    },
    match_status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rejected', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
      comment: '匹配状态'
    },
    match_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '匹配时间'
    },
    notes: {
      type: DataTypes.TEXT,
      comment: '备注'
    }
  }, {
    tableName: 'resource_matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  })

  return ResourceMatch
}