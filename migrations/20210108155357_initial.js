const {
  AREA_SCHEMA_NAME,
  CONTACT_SCHEMA_NAME
} = require('../constants')

function addTimestamps (knex, table) {
  table.timestamp('created_at').notNullable().defaultTo(knex.fn.now())
  table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now())
}

exports.up = knex => {
  return knex
    .raw(`
      CREATE SCHEMA ${AREA_SCHEMA_NAME};
      CREATE SCHEMA ${CONTACT_SCHEMA_NAME};
      CREATE EXTENSION IF NOT EXISTS postgis;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `)
    .then(() => {
      return knex.schema.withSchema(AREA_SCHEMA_NAME)
        // Create the xws_area.area_type table
        .createTable('area_type', t => {
          // Add columns
          t.string('ref', 25).notNullable().primary()
          t.string('name', 100).notNullable().unique()
          addTimestamps(knex, t)
        })
        // Create the xws_area.area table
        .createTable('area', t => {
          // Columns
          t.string('code', 40).notNullable().primary()
          t.string('region', 60).notNullable()
          t.string('name', 100).notNullable()
          t.string('description', 255).notNullable()
          t.string('area_type_ref', 25).references('ref')
            .inTable(`${AREA_SCHEMA_NAME}.area_type`).notNullable()
            .index(null, 'btree')
          t.string('parent_area_code', 40).references('code')
            .inTable(`${AREA_SCHEMA_NAME}.area`).nullable()
          t.string('properties').nullable()
          t.specificType('geom', 'geometry').notNullable().index(null, 'gist')
          t.specificType('centroid', 'geometry').nullable()
          t.specificType('bounding_box', 'geometry').nullable()
          addTimestamps(knex, t)
        })
        // Create xws_area views
        .raw(`
          CREATE VIEW xws_area.area_vw_summary AS
          SELECT ar.code, ar.name, ar.region, ar.description, ar.area_type_ref, art.name as "area_type_name"
          FROM xws_area.area ar
          JOIN xws_area.area_type art ON art.ref = ar.area_type_ref;
        `)
    })
    .then(() => {
      return knex.schema.withSchema(CONTACT_SCHEMA_NAME)
        .createTable('contact_type', t => {
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
          t.string('type').references('name').inTable(`${CONTACT_SCHEMA_NAME}.contact_type`).notNullable()
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
    DROP SCHEMA ${AREA_SCHEMA_NAME} CASCADE;
    DROP SCHEMA ${CONTACT_SCHEMA_NAME} CASCADE;
    DROP EXTENSION IF EXISTS postgis;
    DROP EXTENSION IF EXISTS "uuid-ossp";
  `)
}
