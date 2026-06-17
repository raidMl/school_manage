const createCrudRouter = require('../utils/crudRouter');

module.exports = createCrudRouter({
  table: 'teachers',
  fields: ['user_id', 'employee_number', 'speciality', 'diploma', 'hire_date'],
  requiredFields: ['user_id'],
  searchableFields: ['user_id', 'employee_number'],
});