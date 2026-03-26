const sequelize = require('../config/database')
const { DataTypes } = require('sequelize')

// 导入模型
const User = require('./User')(sequelize, DataTypes)
const Crop = require('./Crop')(sequelize, DataTypes)
const Field = require('./Field')(sequelize, DataTypes)
const WeatherData = require('./WeatherData')(sequelize, DataTypes)
const DisasterType = require('./DisasterType')(sequelize, DataTypes)
const WarningRecord = require('./WarningRecord')(sequelize, DataTypes)
const EmergencyPlan = require('./EmergencyPlan')(sequelize, DataTypes)
const Resource = require('./Resource')(sequelize, DataTypes)
const ResourceDemand = require('./ResourceDemand')(sequelize, DataTypes)
const ResourceMatch = require('./ResourceMatch')(sequelize, DataTypes)
const LossReport = require('./LossReport')(sequelize, DataTypes)
const AssessmentReport = require('./AssessmentReport')(sequelize, DataTypes)
const SystemLog = require('./SystemLog')(sequelize, DataTypes)
const Notification = require('./Notification')(sequelize, DataTypes)

// 定义关联关系
const models = {
  User,
  Crop,
  Field,
  WeatherData,
  DisasterType,
  WarningRecord,
  EmergencyPlan,
  Resource,
  ResourceDemand,
  ResourceMatch,
  LossReport,
  AssessmentReport,
  SystemLog,
  Notification
}

// 设置关联关系
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models)
  }
})

// 用户与地块关联
User.hasMany(Field, { foreignKey: 'user_id', as: 'fields' })
Field.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// 作物与地块关联
Crop.hasMany(Field, { foreignKey: 'crop_id', as: 'fields' })
Field.belongsTo(Crop, { foreignKey: 'crop_id', as: 'crop' })

// 灾害类型与预警记录关联
DisasterType.hasMany(WarningRecord, { foreignKey: 'disaster_type_id', as: 'warnings' })
WarningRecord.belongsTo(DisasterType, { foreignKey: 'disaster_type_id', as: 'disasterType' })

// 灾害类型与应急方案关联
DisasterType.hasMany(EmergencyPlan, { foreignKey: 'disaster_type_id', as: 'emergencyPlans' })
EmergencyPlan.belongsTo(DisasterType, { foreignKey: 'disaster_type_id', as: 'disasterType' })

// 用户与资源关联
User.hasMany(Resource, { foreignKey: 'owner_id', as: 'resources' })
Resource.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' })

// 用户与资源需求关联
User.hasMany(ResourceDemand, { foreignKey: 'demand_user_id', as: 'demands' })
ResourceDemand.belongsTo(User, { foreignKey: 'demand_user_id', as: 'demandUser' })

// 资源需求与资源匹配关联
ResourceDemand.hasMany(ResourceMatch, { foreignKey: 'demand_id', as: 'matches' })
ResourceMatch.belongsTo(ResourceDemand, { foreignKey: 'demand_id', as: 'demand' })

// 资源与资源匹配关联
Resource.hasMany(ResourceMatch, { foreignKey: 'resource_id', as: 'matches' })
ResourceMatch.belongsTo(Resource, { foreignKey: 'resource_id', as: 'resource' })

// 用户与损失报告关联
User.hasMany(LossReport, { foreignKey: 'user_id', as: 'lossReports' })
LossReport.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// 地块与损失报告关联
Field.hasMany(LossReport, { foreignKey: 'field_id', as: 'lossReports' })
LossReport.belongsTo(Field, { foreignKey: 'field_id', as: 'field' })

// 灾害类型与损失报告关联
DisasterType.hasMany(LossReport, { foreignKey: 'disaster_type_id', as: 'lossReports' })
LossReport.belongsTo(DisasterType, { foreignKey: 'disaster_type_id', as: 'disasterType' })

// 用户与评估报告关联
User.hasMany(AssessmentReport, { foreignKey: 'created_by', as: 'assessmentReports' })
AssessmentReport.belongsTo(User, { foreignKey: 'created_by', as: 'creator' })

// 用户与系统日志关联
User.hasMany(SystemLog, { foreignKey: 'user_id', as: 'logs' })
SystemLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

// 用户与通知关联
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' })
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

module.exports = {
  sequelize,
  ...models
}