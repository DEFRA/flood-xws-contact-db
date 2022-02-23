const {
  CONTACT_SCHEMA_NAME
} = require('../constants')

function addTimestamps (knex, table) {
  table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
}

exports.up = knex => {
  return knex
    .raw(`
      CREATE SCHEMA ${CONTACT_SCHEMA_NAME};
      CREATE EXTENSION IF NOT EXISTS postgis;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `)
    .then(() => {
      return knex.schema.withSchema(CONTACT_SCHEMA_NAME)
        .createTable('type', t => {
          // Columns
          t.string('name').primary()
          addTimestamps(knex, t)
        })
        .createTable('channel', t => {
          // Columns
          t.string('name').primary()
          addTimestamps(knex, t)
        })
        .createTable('contact', t => {
          // Columns
          t.specificType('id', 'uuid').notNullable().primary().defaultTo(knex.raw('uuid_generate_v4()'))
          t.string('email', 320).notNullable().unique()
          t.string('mobile', 20).nullable()
          t.string('landline', 20).nullable()
          t.boolean('email_active').nullable()
          t.boolean('mobile_active').nullable()
          t.boolean('landline_active').nullable()
          t.enu('receive_messages', ['all', 'warnings-only']).nullable()
          t.enu('state', ['active', 'removed']).notNullable()
          t.enu('hazard', ['flood']).notNullable()
          t.string('type_name').references('name').inTable(`${CONTACT_SCHEMA_NAME}.type`).notNullable()
          addTimestamps(knex, t)
        })
        .createTable('location', t => {
          // Columns
          t.specificType('id', 'uuid').notNullable().primary().defaultTo(knex.raw('uuid_generate_v4()'))
          t.string('ref').notNullable()
          t.enu('type', ['uprn', 'osgb']).notNullable()
          t.string('name').notNullable()
          t.specificType('geom', 'geometry').nullable()
          t.specificType('centroid', 'geometry').nullable()
          t.specificType('bounding_box', 'geometry').nullable()
          addTimestamps(knex, t)

          // Constraints
          t.index('ref')
        })
        .createTable('contact_location', t => {
          // Columns
          t.specificType('id', 'uuid').notNullable().primary().defaultTo(knex.raw('uuid_generate_v4()'))
          t.specificType('contact_id', 'uuid').references('id').inTable(`${CONTACT_SCHEMA_NAME}.contact`).notNullable()
          t.specificType('location_id', 'uuid').references('id').inTable(`${CONTACT_SCHEMA_NAME}.location`).notNullable()
          // t.string('channel_name').references('name').inTable(`${CONTACT_SCHEMA_NAME}.channel`).notNullable()
          addTimestamps(knex, t)

          t.unique(['contact_id', 'location_id'])
        })
    })
}

exports.down = function (knex) {
  return knex.raw(`
    DROP SCHEMA ${CONTACT_SCHEMA_NAME} CASCADE;
    DROP EXTENSION IF EXISTS postgis;
    DROP EXTENSION IF EXISTS "uuid-ossp";
  `)
}
