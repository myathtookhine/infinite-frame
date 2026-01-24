const pool = require('./db');
require('dotenv').config();

const reset = async () => {
    try {
        console.log("Resetting analytics data...");

        // 1. DELETE all visit logs
        await pool.query("DELETE FROM visit_logs");
        console.log("✅ Cleared visit_logs table.");

        // 2. Reset page_views column in admins table
        await pool.query("UPDATE admins SET page_views = 0");
        console.log("✅ Reset page_views to 0 for all admins.");

    } catch (err) {
        console.error("Error resetting stats:", err);
    } finally {
        pool.end();
    }
};

reset();
