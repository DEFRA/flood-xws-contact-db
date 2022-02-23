const {
  CONTACT_SCHEMA_NAME
} = require('../constants')

exports.seed = async function (knex) {
  await knex(`${CONTACT_SCHEMA_NAME}.type`).insert([
    { name: 'public' },
    { name: 'partner' },
    { name: 'staff' },
    { name: 'edw' },
    { name: 'system' }
  ])

  return knex(`${CONTACT_SCHEMA_NAME}.channel`).insert([
    { name: 'sms' },
    { name: 'voice' },
    { name: 'email' },
    { name: 'whatsapp' },
    { name: 'xml' }
  ])
}
