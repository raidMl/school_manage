const createCrudRouter = require('../utils/crudRouter');

module.exports = createCrudRouter({
  table: 'groups',
  fields: ['formation_id', 'name'],
  requiredFields: ['formation_id', 'name'],
  searchableFields: ['formation_id'],
});