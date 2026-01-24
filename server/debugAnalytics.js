const pool = require('./db');
require('dotenv').config();

const run = async () => {
    try {
        // 1. Get a Super Admin ID
        // const adminRes = await pool.query("SELECT id FROM admins WHERE role = 'super_admin' LIMIT 1");
        // const adminId = adminRes.rows[0].id;
        const adminId = '4bd1f075-4616-4b0e-ae38-3b4f35c390f1'; // UUID from logs
        console.log("Testing with Admin ID:", adminId);
        
        // Dump existing logs
        const logs = await pool.query("SELECT * FROM visit_logs ORDER BY visited_at DESC LIMIT 5");
        console.log("Existing Logs:", JSON.stringify(logs.rows, null, 2));

        // 2. Define Timezone

        // 2. Define Timezone
        const tz = 'Asia/Bangkok';

        // 3. Run Query
        const query = `
        WITH hours AS (
            SELECT generate_series(
                date_trunc('day', NOW() AT TIME ZONE $2),
                date_trunc('day', NOW() AT TIME ZONE $2) + INTERVAL '1 day' - INTERVAL '1 hour',
                '1 hour'::interval
            ) AS hour_start
        )
        SELECT 
            TO_CHAR(hours.hour_start, 'FMHH12 AM') AS name,
            COALESCE(COUNT(vl.id), 0) AS views,
            hours.hour_start
        FROM hours
        LEFT JOIN visit_logs vl ON date_trunc('hour', vl.visited_at AT TIME ZONE $2) = hours.hour_start 
                               AND vl.admin_id = $1
        GROUP BY hours.hour_start
        ORDER BY hours.hour_start ASC;
        `;

        const res = await pool.query(query, [adminId, tz]);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
};

run();
