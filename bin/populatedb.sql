TRUNCATE xws_area.area RESTART IDENTITY CASCADE;

-- Insert the faa into the area table
INSERT INTO xws_area.area(code, region, name, description, area_type_ref, geom, centroid, bounding_box)
SELECT fws_tacode AS code,
       area,
       ta_name AS name,
       descrip AS description,
       'faa' AS area_type_ref,
       geom,
       ST_Centroid(geom) AS centroid,
       ST_Envelope(geom) AS bounding_box
FROM xws_area.faa;

-- Insert the fwa into the area table
INSERT INTO xws_area.area(code, region, name, description, area_type_ref, parent_area_code, geom, centroid, bounding_box)
SELECT fws_tacode AS code,
       area,
       ta_name AS name,
       descrip AS description,
       'fwa' AS area_type_ref,
       (SELECT code FROM xws_area.area WHERE area_type_ref = 'faa' AND xws_area.area.code = parent) AS parent_area_code,
       geom,
       ST_Centroid(geom) AS centroid,
       ST_Envelope(geom) AS bounding_box
FROM xws_area.fwa;

-- Clean up the temporary "faa" and "fwa" tables
DROP TABLE xws_area.faa;
DROP TABLE xws_area.fwa;