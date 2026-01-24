const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// Helper to format date
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// GET /api/analytics/activity
// Query Params: ?period=week|month|year
router.get('/activity', verifyToken, async (req, res) => {
  try {
    const { period } = req.query;
    // JWT payload usually has 'sub' as ID, or sometimes 'id'.
    // Let's assume 'sub' or 'id'. Let's check what auth.js signs.
    const adminId = req.user.id || req.user.sub; 

    let query = "";
    let data = [];

    if (period === 'week') {
       // Last 7 days (including today)
       // Goal: Return [ { name: 'Mon', views: 10 }, ... ]
       // We use generate_series in Postgres to ensure all days are present, even if 0 views
       query = `
        WITH days AS (
            SELECT generate_series(
                date_trunc('day', NOW() - INTERVAL '6 days'),
                date_trunc('day', NOW()),
                '1 day'::interval
            ) AS day
        )
        SELECT 
            TO_CHAR(days.day, 'Dy') AS name,
            COUNT(vl.id) AS views
        FROM days
        LEFT JOIN visit_logs vl ON date_trunc('day', vl.visited_at) = days.day AND vl.admin_id = $1
        GROUP BY days.day
        ORDER BY days.day ASC;
       `;
    } else if (period === 'month') {
        // Current Month, grouped by Week
        // Weeks 1-4/5
        query = `
        WITH weeks AS (
            SELECT generate_series(
                date_trunc('month', NOW()),
                date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day',
                '1 week'::interval
            ) AS week_start
        )
        SELECT 
            'Week ' || row_number() OVER (ORDER BY weeks.week_start) AS name,
            COUNT(vl.id) AS views
        FROM weeks
        LEFT JOIN visit_logs vl ON date_trunc('week', vl.visited_at) = date_trunc('week', weeks.week_start) 
                               AND vl.visited_at >= date_trunc('month', NOW())
                               AND vl.visited_at < date_trunc('month', NOW()) + INTERVAL '1 month'
                               AND vl.admin_id = $1
        GROUP BY weeks.week_start
        ORDER BY weeks.week_start ASC;
        `;
    } else if (period === 'year') {
        // Current Year, grouped by Month (Jan, Feb...)
        query = `
        WITH months AS (
            SELECT generate_series(
                date_trunc('year', NOW()),
                date_trunc('year', NOW()) + INTERVAL '1 year' - INTERVAL '1 day',
                '1 month'::interval
            ) AS month_start
        )
        SELECT 
            TO_CHAR(months.month_start, 'Mon') AS name,
            COUNT(vl.id) AS views
        FROM months
        LEFT JOIN visit_logs vl ON date_trunc('month', vl.visited_at) = months.month_start AND vl.admin_id = $1
        GROUP BY months.month_start
        ORDER BY months.month_start ASC;
        `;
    } else {
        return res.status(400).json({ message: "Invalid period" });
    }

    const result = await pool.query(query, [adminId]);
    
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
