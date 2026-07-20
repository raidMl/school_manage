const createCrudRouter = require('../utils/crudRouter');

module.exports = createCrudRouter({
  table: 'users',
  fields: [
    'first_name',
    'last_name',
    'email',
    'password',
    'role',
    'gender',
    'birth_date',
    'photo',
    'is_active',
  ],
  requiredFields: ['first_name', 'last_name', 'email', 'password', 'role'],
  searchableFields: ['role', 'email', 'is_active'],
});