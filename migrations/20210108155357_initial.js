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
        // Create the xws_area.category table
        .createTable('category', t => {
          // Add columns
          t.string('id', 25).notNullable().primary()
          t.string('name', 100).notNullable().unique()
          addTimestamps(knex, t)
        })
        // Create the xws_area.type table
        .createTable('type', t => {
          // Add columns
          t.string('id', 1).notNullable().primary()
          t.string('name', 100).notNullable().unique()
          addTimestamps(knex, t)
        })
        // Create the xws_area.ea_area table
        .createTable('ea_area', t => {
          // Add columns
          t.string('id', 50).notNullable().primary()
          t.string('name', 100).notNullable().unique()
          t.string('full_name', 100).notNullable().unique()
          t.string('group', 50).notNullable()
          addTimestamps(knex, t)
        })
        // Create the xws_area.ea_owner table
        .createTable('ea_owner', t => {
          // Add columns
          t.string('id', 50).notNullable().primary()
          t.string('name', 100).notNullable()
          t.string('ea_area_id', 25).references('id')
            .inTable(`${AREA_SCHEMA_NAME}.ea_area`).notNullable()
          addTimestamps(knex, t)
        })
        // Create the xws_area.area table
        .createTable('area', t => {
          // Columns
          t.string('code', 40).notNullable().primary()
          t.string('name', 100).notNullable()
          t.string('description', 255).notNullable()
          t.string('ea_owner_id', 50).references('id')
            .inTable(`${AREA_SCHEMA_NAME}.ea_owner`).notNullable()
          t.string('ea_area_id', 50).references('id')
            .inTable(`${AREA_SCHEMA_NAME}.ea_area`).notNullable()
          t.string('river_sea', 300).nullable()
          t.string('type_id', 1).references('id')
            .inTable(`${AREA_SCHEMA_NAME}.type`).notNullable()
          t.string('category_id', 25).references('id')
            .inTable(`${AREA_SCHEMA_NAME}.category`).notNullable()
            .index(null, 'btree')
          t.string('parent_area_code', 40).references('code')
            .inTable(`${AREA_SCHEMA_NAME}.area`).nullable()
          t.string('local_authority_name', 255).notNullable()
          t.string('quick_dial_code', 255).notNullable()
          t.specificType('geom', 'geometry').notNullable().index(null, 'gist')
          t.specificType('centroid', 'geometry').notNullable()
          t.specificType('bounding_box', 'geometry').notNullable()
          addTimestamps(knex, t)
        })
        // Create xws_area views
        .raw(`
          CREATE VIEW ${AREA_SCHEMA_NAME}.area_vw_summary AS
          SELECT ar.code, ar.name, ar.description, ar.ea_area_id, ar.ea_owner_id, ar.river_sea, ar.category_id, c.name as "category_name"
          FROM ${AREA_SCHEMA_NAME}.area ar
          JOIN ${AREA_SCHEMA_NAME}.category c ON c.id = ar.category_id;
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
