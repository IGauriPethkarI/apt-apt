USE [apt-apt];
GO

drop table if exists geometries
CREATE TABLE geometries (
    apartment_id VARCHAR(MAX),
    area_id VARCHAR(MAX),
    building_id VARCHAR(255),
    entity_subtype VARCHAR(255),
    entity_type VARCHAR(255),
    floor_id VARCHAR(255),
    geometry VARCHAR(MAX),   -- use MAX in case geometries are long
    site_id VARCHAR(255),
    unit_id NVARCHAR(MAX)
);
GO

-- 2?? Import CSV into the table
BULK INSERT geometries
FROM 'C:\Users\gauri\Downloads\7070952\geometries.csv'
WITH (
    FIRSTROW = 2,          -- skip header
    FIELDTERMINATOR = ',',  -- comma-separated
    ROWTERMINATOR = '\n',   -- each line = new row
    TABLOCK
);
GO

-- 3?? Check first 10 rows
SELECT TOP 10 * FROM geometries;
