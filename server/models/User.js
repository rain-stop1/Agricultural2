module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],
        notEmpty: true
      }
    },
    real_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      validate: {
        is: /^1[3-9]\d{9}$/
      }
    },
    email: {
      type: DataTypes.STRING(100),
      validate: {
        isEmail: true
      }
    },
    user_type: {
      type: DataTypes.ENUM('farmer', 'admin'),
      allowNull: false,
      defaultValue: 'farmer'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '1:启用 0:禁用'
    },
    avatar: {
      type: DataTypes.STRING(255),
      comment: '头像URL'
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '所在地区'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  })

  // 实例方法：验证密码（明文比对）
  User.prototype.validatePassword = function(password) {
    return this.password === password
  }

  // 实例方法：转换为JSON时隐藏敏感信息
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get())
    delete values.password
    return values
  }

  return User
}