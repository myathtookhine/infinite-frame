const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// Helper to format date
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// GET /api/analytics/activity
// Query Params: ?period=week|month|year&timezone=...
router.get('/activity', verifyToken, async (req, res) => {
  try {
    const { period, timezone } = req.query;
    // Default to UTC if no timezone provided. 
    // Format: 'Asia/Bangkok', 'UTC', etc.
    const tz = timezone || 'UTC';
    
    // JWT payload usually has 'sub' as ID, or sometimes 'id'.
    // Let's assume 'sub' or 'id'. Let's check what auth.js signs.
    const adminId = req.user.id || req.user.sub; 

    let query = "";
    let data = [];

    // Note: We use AT TIME ZONE to convert:
    // 1. NOW() to Client Time (to determine range)
    // 2. visited_at (UTC) to Client Time (to bucket correctly)

    if (period === 'today') {
        // Current Day (Client Time), grouped by Hour
        query = `
        WITH hours AS (
            SELECT generate_series(
                date_trunc('day', NOW() AT TIME ZONE $2),
                date_trunc('day', NOW() AT TIME ZONE $2) + INTERVAL '1 day' - INTERVAL '1 hour',
                '1 hour'::interval
            ) AS hour_start
        )
        SELECT 
            TO_CHAR(hours.hour_start, 'FMHH12 AM') AS name,
            COALESCE(COUNT(vl.id), 0) AS views
        FROM hours
        LEFT JOIN visit_logs vl ON date_trunc('hour', vl.visited_at AT TIME ZONE $2) = hours.hour_start 
                               AND vl.admin_id = $1
        GROUP BY hours.hour_start
        ORDER BY hours.hour_start ASC;
        `;
    } else if (period === 'week') {
       // Last 7 days
       query = `
        WITH days AS (
            SELECT generate_series(
                date_trunc('day', (NOW() AT TIME ZONE $2) - INTERVAL '6 days'),
                date_trunc('day', NOW() AT TIME ZONE $2),
                '1 day'::interval
            ) AS day
        )
        SELECT 
            TO_CHAR(days.day, 'Dy') AS name,
            COUNT(vl.id) AS views
        FROM days
        LEFT JOIN visit_logs vl ON date_trunc('day', vl.visited_at AT TIME ZONE $2) = days.day AND vl.admin_id = $1
        GROUP BY days.day
        ORDER BY days.day ASC;
       `;
    } else if (period === 'month') {
        // Current Month
        query = `
        WITH weeks AS (
            SELECT generate_series(
                date_trunc('month', NOW() AT TIME ZONE $2),
                date_trunc('month', NOW() AT TIME ZONE $2) + INTERVAL '1 month' - INTERVAL '1 day',
                '1 week'::interval
            ) AS week_start
        )
        SELECT 
            'Week ' || row_number() OVER (ORDER BY weeks.week_start) AS name,
            COUNT(vl.id) AS views
        FROM weeks
        LEFT JOIN visit_logs vl ON date_trunc('week', vl.visited_at AT TIME ZONE $2) = date_trunc('week', weeks.week_start) 
                               AND vl.visited_at AT TIME ZONE $2 >= date_trunc('month', NOW() AT TIME ZONE $2)
                               AND vl.visited_at AT TIME ZONE $2 < date_trunc('month', NOW() AT TIME ZONE $2) + INTERVAL '1 month'
                               AND vl.admin_id = $1
        GROUP BY weeks.week_start
        ORDER BY weeks.week_start ASC;
        `;
    } else if (period === 'year') {
        // Current Year
        query = `
        WITH months AS (
            SELECT generate_series(
                date_trunc('year', NOW() AT TIME ZONE $2),
                date_trunc('year', NOW() AT TIME ZONE $2) + INTERVAL '1 year' - INTERVAL '1 day',
                '1 month'::interval
            ) AS month_start
        )
        SELECT 
            TO_CHAR(months.month_start, 'Mon') AS name,
            COUNT(vl.id) AS views
        FROM months
        LEFT JOIN visit_logs vl ON date_trunc('month', vl.visited_at AT TIME ZONE $2) = months.month_start AND vl.admin_id = $1
        GROUP BY months.month_start
        ORDER BY months.month_start ASC;
        `;
    } else {
        return res.status(400).json({ message: "Invalid period" });
    }

    // Pass $2 as timezone
    console.log(`Analytics Query: Period=${period}, Timezone=${tz}, AdminID=${adminId}`);
    
    // Safety check for UUID
    if (!adminId) {
       return res.status(400).json({ message: "Invalid User ID" });
    }

    const result = await pool.query(query, [adminId, tz]);
    
    // Format for Recharts
    // Recharts expects numbers for values
    data = result.rows.map(row => ({
        name: row.name,
        views: parseInt(row.views)
    }));

    res.json(data);

  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
