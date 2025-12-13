const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors()); // allow Angular frontend to fetch

const config = {
    user: "general",
    password: "",
    server: 'Gaurii',
    database: 'apt-apt',
    options: {
        encrypt: false, // if using Azure
        trustServerCertificate: true, // for local dev
    },
    port: 1433
};

// Endpoint to get all apartment data
// Get all buildings
app.get('/api/buildings', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT DISTINCT building_id 
            FROM [apt-apt].[dbo].[geometries] order by building_id
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

// Get all floors for a building
app.get('/api/floors/:buildingId', async (req, res) => {
    const { buildingId } = req.params;
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT DISTINCT floor_id
            FROM [apt-apt].[dbo].[geometries]
            WHERE building_id = '${buildingId}'
            order by floor_id
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

// Get all apartments for a building and floor
app.get('/api/apartments/:buildingId/:floorId', async (req, res) => {
    const { buildingId, floorId } = req.params;
    try {
        await sql.connect(config);
        const result = await sql.query(`
            SELECT DISTINCT apartment_id
            FROM [apt-apt].[dbo].[geometries]
            WHERE building_id = '${buildingId}' AND floor_id = '${floorId}'
            order by apartment_id
        `);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});


app.get('/api/apartments', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query('SELECT distinct [apartment_id] FROM [apt-apt].[dbo].[geometries]');
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

app.get('/api/building/:building/:floor', async (req, res) => {
    try {

        const building = req.params.building;
        const floor = req.params.floor;
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('building', sql.VarChar, building)
            .input('floor', sql.VarChar, floor)
            .query(`
            SELECT * 
            FROM [apt-apt].[dbo].[geometries]
            WHERE [building_id] = @building and [floor_id] = @floor
        `);

        res.json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

app.get('/api/apartmentDetails/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('apartment_id', sql.VarChar, id)
            .query(`
            SELECT * 
            FROM [apt-apt].[dbo].[geometries]
            WHERE [apartment_id] = @apartment_id
        `);

        res.json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});


app.get('/api/simulationsDetails/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const pool = await sql.connect(config);

        const result = await pool.request()
            .input('apartment_id', sql.VarChar, id)
            .query(`
                SELECT * 
                FROM [apt-apt].[dbo].[simulations]
                where apartment_id = @apartment_id
            `);

        res.json(result.recordset);

    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

// New endpoint for apartment rankings and comparative analysis
app.get('/api/apartment-rankings/:id', async (req, res) => {
    try {
        const apartmentId = req.params.id;
        const pool = await sql.connect(config);

        // Calculate scores for all apartments
        // Scoring: Sun(20%) + Views(15%) + Connectivity(15%) + Noise(15%) + Size(20%) + Rooms(10%)
        const result = await pool.request()
            .input('current_apartment_id', sql.VarChar, apartmentId)
            .query(`
                    WITH PercentileData AS (
                        SELECT   apartment_id,
                        building_id, floor_id,
                        total_size,
                        room_count,
                        quality_score,
                            COUNT(*) OVER() AS total_apartments_calc,  -- renamed to avoid conflict
                            RANK() OVER(ORDER BY total_size DESC) AS size_rank,
                            RANK() OVER(ORDER BY quality_score DESC) AS quality_rank
                        FROM dbo.ApartmentRankings
                    )
                    SELECT
                        apartment_id,
                        building_id,
                        floor_id,
                        total_size,
                        room_count,
                        quality_score,
                        size_rank,
                        quality_rank,
                        total_apartments_calc AS total_apartments,
                        CASE WHEN apartment_id = @current_apartment_id THEN 1 ELSE 0 END AS is_current
                    FROM PercentileData
                    ORDER BY quality_rank, size_rank;

            `);

        // Separate current apartment from all data
        const allApartments = result.recordset;
        const currentApartment = allApartments.find(apt => apt.is_current === 1);

        res.json({
            current: currentApartment || null,
            all_apartments: allApartments,
            total_count: allApartments.length
        });

    } catch (err) {
        console.error('Error in apartment-rankings endpoint:', err);
        res.status(500).json({ error: err.message });
    }
});


app.listen(3000, () => console.log('Server running on port 3000'));
