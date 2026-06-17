const createCrudRouter = require('../utils/crudRouter');

module.exports = createCrudRouter({
  table: 'schools',
  fields: ['name', 'logo', 'admin_id', 'contact_info_id'],
  requiredFields: ['name', 'admin_id'],
  searchableFields: ['admin_id', 'contact_info_id'],
});