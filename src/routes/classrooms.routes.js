const createCrudRouter = require('../utils/crudRouter');

module.exports = createCrudRouter({
  table: 'classrooms',
  fields: ['school_id', 'name', 'capacity'],
  requiredFields: ['school_id', 'name'],
  searchableFields: ['school_id'],
});