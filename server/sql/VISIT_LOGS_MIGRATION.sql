CREATE TABLE IF NOT EXISTS visit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_logs_admin_id ON visit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_visit_logs_visited_at ON visit_logs(visited_at);
