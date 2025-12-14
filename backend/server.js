const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const app = express();
app.use(cors()); // allow Angular frontend to fetch

// Data Handling
const DATA_DIR = path.join(__dirname, '../data');
let geometries = [];
let simulations = [];
let rankings = [];

// Helper to load a CSV file into an array
const loadCsv = (filename) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const filePath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            resolve([]); // Return empty if missing, or reject based on strictness
            return;
        }

        fs.createReadStream(filePath)
            .pipe(csv({
                mapHeaders: ({ header, index }) => header.trim().replace(/^\uFEFF/, '')
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => {
                console.log(`Loaded ${results.length} records from ${filename}`);
                resolve(results);
            })
            .on('error', (err) => reject(err));
    });
};

// Initialize Data
const initializeData = async () => {
    try {
        console.log("Loading data...");
        const [geoData, simData, rankData] = await Promise.all([
            loadCsv('geometries.csv'),
            loadCsv('simulations.csv'),
            loadCsv('apartment_rankings.csv')
        ]);
        geometries = geoData;
        simulations = simData;
        rankings = rankData;
        console.log("Data loading complete.");
    } catch (err) {
        console.error("Failed to load data:", err);
        process.exit(1); // Exit if data fails to load
    }
};

// --- API Endpoints ---

// Get all buildings
app.get('/api/buildings', (req, res) => {
    try {
        // Extract distinct building_ids
        const buildings = [...new Set(geometries.map(g => g.building_id))]
            .filter(b => b) // remove empty/undefined
            .sort((a, b) => a - b); // numeric sort if possible, or string sort
        res.json(buildings);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Get all floors for a building
app.get('/api/floors/:buildingId', (req, res) => {
    const { buildingId } = req.params;
    try {
        const floors = [...new Set(
            geometries
                .filter(g => g.building_id == buildingId)
                .map(g => g.floor_id)
        )].sort((a, b) => a - b);
        res.json(floors);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// Get all apartments for a building and floor
app.get('/api/apartments/:buildingId/:floorId', (req, res) => {
    const { buildingId, floorId } = req.params;
    try {
        const apartments = [...new Set(
            geometries
                .filter(g => g.building_id == buildingId && g.floor_id == floorId)
                .map(g => g.apartment_id)
        )].sort();
        res.json(apartments);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


app.get('/api/apartments', (req, res) => {
    try {
        const apartments = [...new Set(geometries.map(g => g.apartment_id))];
        // The original returned an array of objects { apartment_id: "..." } ??
        // Looking at line 76 in original: SELECT distinct [apartment_id] -> returns recordset i.e. [{apartment_id: "..."}]
        // We should format it similarly to maintain compatibility if the frontend expects objects
        const formatted = apartments.map(id => ({ apartment_id: id }));
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

app.get('/api/building/:building/:floor', (req, res) => {
    try {
        const { building, floor } = req.params;
        // The original query was: SELECT * FROM geometries WHERE building_id = @building and floor_id = @floor
        const result = geometries.filter(g => g.building_id == building && g.floor_id == floor);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

app.get('/api/apartmentDetails/:id', (req, res) => {
    try {
        const id = req.params.id;
        // Original: SELECT * FROM geometries WHERE apartment_id = @id
        // Since apartment_id acts as a key for multiple rows (geometry chunks maybe?), filtered by it.
        // Wait, geometries usually means shapes. Does one apartment have multiple geometry rows?
        // CSV Viewer showed distinct rows. Let's return all matches.
        const result = geometries.filter(g => g.apartment_id == id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});


app.get('/api/simulationsDetails/:id', (req, res) => {
    try {
        const id = req.params.id;
        // Original: SELECT * FROM simulations where apartment_id = @id
        const result = simulations.filter(s => s.apartment_id == id);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

// New endpoint for apartment rankings and comparative analysis
app.get('/api/apartment-rankings/:id', (req, res) => {
    try {
        const apartmentId = req.params.id;

        // The original SQL did a complex calculate-on-the-fly or query-from-view 'ApartmentRankings'
        // and calculated percentile/ranks. 
        // We now have 'apartment_rankings.csv' which seems to contain pre-calculated ranks?
        // Let's check the CSV header again: 
        // apartment_id,building_id,total_size,room_count,quality_score,size_rank,quality_rank,total_apartments,floor_id
        // It seems the ranks are already there! Fantastic.

        // We need to return:
        // {
        //     current: currentApartment object,
        //     all_apartments: [list of all apartments with ranks],
        //     total_count: number
        // }

        // The original SQL returned a list of all apartments, with an 'is_current' flag.
        // And the code did: 
        // const allApartments = result.recordset;
        // const currentApartment = allApartments.find(apt => apt.is_current === 1);

        // So we need to map our rankings data to include 'is_current'.

        // Optimization: sending 40k records over JSON might be heavy but that's what the original did.
        // We will replicate exact behavior.

        const allApartments = rankings.map(r => ({
            ...r,
            is_current: (r.apartment_id === apartmentId) ? 1 : 0
        }));

        // Sort by quality_rank, size_rank as in original SQL: ORDER BY quality_rank, size_rank
        // Note: CSV data comes in string, need to ensure numeric sort if they are numbers.
        allApartments.sort((a, b) => {
            const qRankA = parseInt(a.quality_rank);
            const qRankB = parseInt(b.quality_rank);
            if (qRankA !== qRankB) return qRankA - qRankB;

            const sRankA = parseInt(a.size_rank);
            const sRankB = parseInt(b.size_rank);
            return sRankA - sRankB;
        });

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


// Start server only after data is loaded
initializeData().then(() => {
    app.listen(3000, () => console.log('Server running on port 3000'));
});
