module.exports = (sequelize, DataTypes) => {
  const Resource = sequelize.define('Resource', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    resource_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '资源名称'
    },
    resource_type: {
      type: DataTypes.ENUM('machinery', 'materials', 'service'),
      allowNull: false,
      comment: '资源类型：machinery农机，materials农资，service服务'
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '所有者ID'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '数量'
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '单位'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '位置'
    },
    description: {
      type: DataTypes.TEXT,
      comment: '资源描述'
    },
    contact_info: {
      type: DataTypes.STRING(100),
      comment: '联系方式'
    },
    availability: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '1:可用 0:不可用'
    }
  }, {
    tableName: 'resources',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['resource_type']
      },
      {
        fields: ['owner_id']
      },
      {
        fields: ['availability']
      }
    ]
  })

  return Resource
}