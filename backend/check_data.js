const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

const loadCsv = (filename) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const filePath = path.join(DATA_DIR, filename);
        fs.createReadStream(filePath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, '')
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};

async function checkConsistency() {
    console.log('Loading CSVs...');
    const [rankings, geometries, simulations] = await Promise.all([
        loadCsv('apartment_rankings.csv'),
        loadCsv('geometries.csv'),
        loadCsv('simulations.csv')
    ]);

    console.log(`Loaded:
    Rankings: ${rankings.length}
    Geometries: ${geometries.length}
    Simulations: ${simulations.length}`);

    const geoMap = new Map();
    geometries.forEach(g => {
        if (!geoMap.has(g.apartment_id)) {
            geoMap.set(g.apartment_id, { building: g.building_id, floor: g.floor_id });
        }
    });

    const simAptIds = new Set(simulations.map(s => s.apartment_id));

    let missingInGeo = 0;
    let missingInSim = 0;
    let mismatchMetadata = 0;

    rankings.forEach(r => {
        if (!geoMap.has(r.apartment_id)) {
            missingInGeo++;
            if (missingInGeo <= 5) console.log(`Missing in Geometries: ${r.apartment_id}`);
        } else {
            const g = geoMap.get(r.apartment_id);
            // Loose comparison for string/number differences
            if (r.building_id != g.building || r.floor_id != g.floor) {
                mismatchMetadata++;
                if (mismatchMetadata <= 5) {
                    console.log(`Mismatch Metadata for ${r.apartment_id}:
                    Rankings: B=${r.building_id}, F=${r.floor_id}
                    Geometries: B=${g.building}, F=${g.floor}`);
                }
            }
        }
        if (!simAptIds.has(r.apartment_id)) {
            missingInSim++;
            if (missingInSim <= 5) console.log(`Missing in Simulations: ${r.apartment_id}`);
        }
    });

    console.log(`
    Analysis Result:
    Apartments in Rankings missing from Geometries: ${missingInGeo}
    Apartments in Rankings missing from Simulations: ${missingInSim}
    Metadata Mismatches (Building/Floor): ${mismatchMetadata}
    `);
}

checkConsistency();
