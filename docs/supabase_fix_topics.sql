UPDATE ai_analysis a
SET topic_tags = '["Bahan Ajar & Modul"]'::jsonb
FROM raw_comments r
WHERE a.comment_id = r.id 
  AND (r.text_content ILIKE '%modul%' 
    OR r.text_content ILIKE '%buku%' 
    OR r.text_content ILIKE '%rbv%' 
    OR r.text_content ILIKE '%bmp%' 
    OR r.text_content ILIKE '%bahan ajar%');

UPDATE ai_analysis a
SET topic_tags = '["Sistem & Aplikasi"]'::jsonb
FROM raw_comments r
WHERE a.comment_id = r.id 
  AND (r.text_content ILIKE '%sia%' 
    OR r.text_content ILIKE '%lms%' 
    OR r.text_content ILIKE '%elearning%' 
    OR r.text_content ILIKE '%silayar%' 
    OR r.text_content ILIKE '%server%' 
    OR r.text_content ILIKE '%login%' 
    OR r.text_content ILIKE '%error%' 
    OR r.text_content ILIKE '%eror%' 
    OR r.text_content ILIKE '%down%' 
    OR r.text_content ILIKE '%aplikasi%' 
    OR r.text_content ILIKE '%app%');

UPDATE ai_analysis a
SET topic_tags = '["Biaya Pendidikan"]'::jsonb
FROM raw_comments r
WHERE a.comment_id = r.id 
  AND (r.text_content ILIKE '%biaya%' 
    OR r.text_content ILIKE '%spp%' 
    OR r.text_content ILIKE '%bayar%' 
    OR r.text_content ILIKE '%tagihan%' 
    OR r.text_content ILIKE '%lip%' 
    OR r.text_content ILIKE '%murah%' 
    OR r.text_content ILIKE '%mahal%' 
    OR r.text_content ILIKE '%beasiswa%' 
    OR r.text_content ILIKE '%kip%');

UPDATE ai_analysis a
SET topic_tags = '["Ujian & Penilaian"]'::jsonb
FROM raw_comments r
WHERE a.comment_id = r.id 
  AND (r.text_content ILIKE '%ujian%' 
    OR r.text_content ILIKE '% uo %' 
    OR r.text_content ILIKE '%the%' 
    OR r.text_content ILIKE '%uas%' 
    OR r.text_content ILIKE '%uts%' 
    OR r.text_content ILIKE '%nilai%' 
    OR r.text_content ILIKE '%ipk%' 
    OR r.text_content ILIKE '%tuton%' 
    OR r.text_content ILIKE '%tuweb%' 
    OR r.text_content ILIKE '%yudisium%' 
    OR r.text_content ILIKE '%lulus%');

UPDATE ai_analysis a
SET topic_tags = '["Fleksibilitas Kuliah"]'::jsonb
FROM raw_comments r
WHERE a.comment_id = r.id 
  AND (r.text_content ILIKE '%kerja%' 
    OR r.text_content ILIKE '%karyawan%' 
    OR r.text_content ILIKE '%fleksibel%' 
    OR r.text_content ILIKE '%waktu%' 
    OR r.text_content ILIKE '%mandiri%' 
    OR r.text_content ILIKE '%jarak jauh%' 
    OR r.text_content ILIKE '%pjj%');

UPDATE ai_analysis a
SET topic_tags = '["Registrasi & Admisi"]'::jsonb
FROM raw_comments r
WHERE a.comment_id = r.id 
  AND (r.text_content ILIKE '%daftar%' 
    OR r.text_content ILIKE '%pendaftaran%' 
    OR r.text_content ILIKE '%registrasi%' 
    OR r.text_content ILIKE '%maba%' 
    OR r.text_content ILIKE '%admisi%' 
    OR r.text_content ILIKE '%berkas%' 
    OR r.text_content ILIKE '%prodi%' 
    OR r.text_content ILIKE '%jurusan%');

UPDATE ai_analysis a
SET topic_tags = '["Layanan Akademik"]'::jsonb
FROM raw_comments r
WHERE a.comment_id = r.id 
  AND (r.text_content ILIKE '%tutor%' 
    OR r.text_content ILIKE '%dosen%' 
    OR r.text_content ILIKE '%upbjj%' 
    OR r.text_content ILIKE '%salut%' 
    OR r.text_content ILIKE '%sentra%' 
    OR r.text_content ILIKE '%cs%' 
    OR r.text_content ILIKE '%halo ut%' 
    OR r.text_content ILIKE '%admin%' 
    OR r.text_content ILIKE '%pelayanan%' 
    OR r.text_content ILIKE '%ramah%' 
    OR r.text_content ILIKE '%lambat%');

UPDATE ai_analysis a
SET topic_tags = '["Kualitas Pendidikan"]'::jsonb
FROM raw_comments r
WHERE a.comment_id = r.id 
  AND (r.text_content ILIKE '%akreditasi%' 
    OR r.text_content ILIKE '%mutu%' 
    OR r.text_content ILIKE '%reputasi%' 
    OR r.text_content ILIKE '%kampus%' 
    OR r.text_content ILIKE '%negeri%' 
    OR r.text_content ILIKE '%ptn%' 
    OR r.text_content ILIKE '%ptnbh%' 
    OR r.text_content ILIKE '%kuliah%' 
    OR r.text_content ILIKE '%gelar%' 
    OR r.text_content ILIKE '%sarjana%')
  AND a.topic_tags = '["umum"]'::jsonb;

UPDATE ai_analysis
SET emotion = 'senang'
WHERE sentiment = 'POSITIF' AND emotion = 'netral';

UPDATE ai_analysis
SET emotion = 'kecewa'
WHERE sentiment = 'NEGATIF' AND emotion = 'netral';
