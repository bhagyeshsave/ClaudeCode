const sequelize = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const BulkUploadJob = require('./BulkUploadJob');
const ReportJob = require('./ReportJob');

// Associations
Category.hasMany(Product, {
  foreignKey: 'categoryId',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
Product.belongsTo(Category, {
  foreignKey: 'categoryId',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  BulkUploadJob,
  ReportJob,
};
