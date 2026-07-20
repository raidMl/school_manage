const createCrudRouter = require('../utils/crudRouter');

module.exports = createCrudRouter({
  table: 'students',
  fields: ['user_id', 'registration_number', 'parent_name', 'parent_phone', 'enrollment_date'],
  requiredFields: ['user_id', 'registration_number'],
  searchableFields: ['user_id', 'registration_number'],
});