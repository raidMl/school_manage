const createCrudRouter = require('../utils/crudRouter');

module.exports = createCrudRouter({
  table: 'teachers',
  fields: ['user_id', 'employee_number', 'phone', 'speciality', 'diploma', 'national_id', 'social_security_number', 'hire_date', 'staff_type', 'job_title', 'has_quran_access'],
  requiredFields: ['user_id'],
  searchableFields: ['user_id', 'employee_number', 'phone', 'national_id', 'social_security_number', 'job_title'],
});