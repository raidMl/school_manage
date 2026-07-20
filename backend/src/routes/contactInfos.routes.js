const createCrudRouter = require('../utils/crudRouter');

module.exports = createCrudRouter({
  table: 'contact_infos',
  fields: [
    'phone_1',
    'phone_2',
    'fixed_phone',
    'emergency_phone',
    'email',
    'address',
    'city',
    'state',
    'postal_code',
    'notes',
    'fb',
    'whatsapp',
    'linkedin',
    'youtube',
    'instagram',
  ],
  searchableFields: ['city', 'state', 'email'],
});