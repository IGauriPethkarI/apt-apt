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


app.listen(3000, () => console.log('Server running on port 3000'));
