CREATE TABLE IF NOT EXISTS scraper_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    comments_count INTEGER DEFAULT 0,
    execution_time_sec FLOAT DEFAULT 0.0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_logs_created_at_desc ON scraper_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_platform ON scraper_logs(platform);

UPDATE raw_comments 
SET platform = 'Instagram' 
WHERE platform ILIKE '%instagram%apify%' OR platform = 'apify';

UPDATE raw_comments 
SET platform = 'TikTok' 
WHERE platform ILIKE '%tiktok%apify%';

UPDATE scraper_targets 
SET platform = 'instagram' 
WHERE platform = 'apify';
