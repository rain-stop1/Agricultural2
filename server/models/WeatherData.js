module.exports = (sequelize, DataTypes) => {
  const WeatherData = sequelize.define('WeatherData', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '地区'
    },
    temperature: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '温度(°C)'
    },
    humidity: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '湿度(%)'
    },
    rainfall: {
      type: DataTypes.DECIMAL(8, 2),
      comment: '降雨量(mm)'
    },
    wind_speed: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '风速(m/s)'
    },
    wind_direction: {
      type: DataTypes.STRING(10),
      comment: '风向'
    },
    air_pressure: {
      type: DataTypes.DECIMAL(7, 2),
      comment: '气压(hPa)'
    },
    record_time: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '记录时间'
    }
  }, {
    tableName: 'weather_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['region', 'record_time']
      }
    ]
  })

  return WeatherData
}