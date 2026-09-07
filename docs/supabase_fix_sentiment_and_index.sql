CREATE INDEX IF NOT EXISTS idx_raw_comments_posted_at_desc ON raw_comments (posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_raw_comments_platform ON raw_comments (platform);
CREATE INDEX IF NOT EXISTS idx_raw_comments_status ON raw_comments (status);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_comment_id ON ai_analysis (comment_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_sentiment ON ai_analysis (sentiment);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_emotion ON ai_analysis (emotion);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_topic_tags ON ai_analysis USING gin (topic_tags);

UPDATE ai_analysis
SET sentiment = 'POSITIF',
    emotion = 'senang',
    ai_reasoning = 'Komentar mengandung apresiasi positif terhadap pola pikir dan motivasi berkuliah di UT.'
FROM raw_comments
WHERE ai_analysis.comment_id = raw_comments.id
  AND ai_analysis.sentiment = 'NEGATIF'
  AND (
    raw_comments.text_content ILIKE '%suka%'
    OR raw_comments.text_content ILIKE '%mindset%'
    OR raw_comments.text_content ILIKE '%keren%'
    OR raw_comments.text_content ILIKE '%mantap%'
  )
  AND raw_comments.text_content NOT ILIKE '%tidak suka%'
  AND raw_comments.text_content NOT ILIKE '%nggak suka%'
  AND raw_comments.text_content NOT ILIKE '%gak suka%';

UPDATE ai_analysis
SET sentiment = 'POSITIF',
    emotion = 'bangga',
    ai_reasoning = 'Komentar mengekspresikan rasa kagum dan bangga atas reputasi UT sebagai PTN terbesar dengan akreditasi unggul.'
FROM raw_comments
WHERE ai_analysis.comment_id = raw_comments.id
  AND ai_analysis.sentiment = 'NEGATIF'
  AND (
    raw_comments.text_content ILIKE '%terbesar%'
    OR (raw_comments.text_content ILIKE '%akreditasi%' AND raw_comments.text_content ILIKE '%A%')
    OR raw_comments.text_content ILIKE '%unggul%'
  )
  AND raw_comments.text_content NOT ILIKE '%kecewa%'
  AND raw_comments.text_content NOT ILIKE '%buruk%'
  AND raw_comments.text_content NOT ILIKE '%dipersulit%'
  AND raw_comments.text_content NOT ILIKE '%ribet%';

UPDATE ai_analysis
SET sentiment = 'NEGATIF',
    emotion = 'kecewa',
    ai_reasoning = 'Keluhan mahasiswa mengenai kendala pengajuan layanan akademik, ketiadaan progres, dan kesulitan birokrasi.'
FROM raw_comments
WHERE ai_analysis.comment_id = raw_comments.id
  AND (
    raw_comments.text_content ILIKE '%dipersulit%'
    OR raw_comments.text_content ILIKE '%gak ada progres%'
    OR raw_comments.text_content ILIKE '%tidak ada progres%'
    OR raw_comments.text_content ILIKE '%gak konsisten%'
    OR raw_comments.text_content ILIKE '%tidak konsisten%'
    OR raw_comments.text_content ILIKE '%ribet banget%'
  );
