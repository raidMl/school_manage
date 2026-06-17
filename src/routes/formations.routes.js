const createCrudRouter = require('../utils/crudRouter');

module.exports = createCrudRouter({
  table: 'formations',
  fields: ['school_id', 'title', 'description', 'teacher_id', 'classroom_id', 'start_date', 'end_date'],
  requiredFields: ['school_id', 'title', 'teacher_id', 'classroom_id'],
  searchableFields: ['school_id', 'teacher_id', 'classroom_id'],
});