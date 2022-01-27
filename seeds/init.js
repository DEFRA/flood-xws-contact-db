exports.seed = async function (knex) {
  await knex('xws_area.area_type').insert([
    { ref: 'faa', name: 'Flood alert area' },
    { ref: 'fwa', name: 'Flood warning area' }
  ])

  await knex('xws_contact.contact_type').insert([
    { name: 'public' },
    { name: 'partner' },
    { name: 'staff' },
    { name: 'edw' },
    { name: 'system' }
  ])

  return knex('xws_contact.channel').insert([
    { name: 'sms' },
    { name: 'voice' },
    { name: 'email' },
    { name: 'whatsapp' },
    { name: 'xml' }
  ])
}
