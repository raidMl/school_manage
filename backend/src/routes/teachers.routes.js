const createCrudRouter = require('../utils/crudRouter');

module.exports = createCrudRouter({
  table: 'teachers',
  fields: ['user_id', 'employee_number', 'phone', 'speciality', 'diploma', 'national_id', 'social_security_number', 'hire_date'],
  requiredFields: ['user_id'],
  searchableFields: ['user_id', 'employee_number', 'phone', 'national_id', 'social_security_number'],
});