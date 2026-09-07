import os
import json
from groq import AsyncGroq
from dotenv import load_dotenv
from app.schemas.ai_schemas import AIAnalysisResult
from pydantic import ValidationError

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = "openai/gpt-oss-20b"

client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

SYSTEM_PROMPT_BATCH = """Anda adalah ahli analisis sentimen dan opini publik bahasa Indonesia untuk ekosistem Universitas Terbuka (UT).
Tugas Anda menganalisis daftar komentar sosial media secara akurat, kontekstual, dan memahami bahasa gaul, singkatan, serta sarkasme.

Panduan Topik Utama UT untuk topic_tags:
Utamakan mengelompokkan topik ke dalam 1 sampai 2 klaster payung standar berikut jika relevan, agar data opini teragregasi dengan baik:
- "Bahan Ajar & Modul" (terkait buku materi pokok, modul cetak, digital, pengiriman)
- "Biaya Pendidikan" (terkait SPP, pembayaran, tagihan LIP, biaya terjangkau atau mahal, beasiswa)
- "Sistem & Aplikasi" (terkait website UT, SIA, LMS elearning, Silayar, server down, error, login, aplikasi mobile)
- "Ujian & Penilaian" (terkait ujian online UO, THE, tugas tuton, nilai akhir, IPK, kelulusan)
- "Registrasi & Admisi" (terkait pendaftaran mahasiswa baru, validasi berkas, pemilihan prodi)
- "Layanan Akademik" (terkait respon admin UPBJJ atau SALUT, CS Halo UT, pelayanan dosen atau tutor)
- "Fleksibilitas Kuliah" (terkait kuliah sambil kerja, waktu mandiri, kuliah online jarak jauh)
- "Kualitas Pendidikan" (terkait reputasi kampus PTN-BH, akreditasi, kualitas pembelajaran)

Jika komentar membahas topik spesifik di luar daftar di atas, Anda bebas membuat frasa 2 kata baru yang padat dan bermakna jelas (contoh: 'Kegiatan Mahasiswa', 'Info Wisuda'). JANGAN gunakan kata tunggal ambigu seperti 'ut' atau 'dan'. JANGAN gunakan label generik 'Umum'.

Output Anda HARUS berupa JSON object murni dengan kunci "results" yang berisi array hasil, berstruktur berikut:
{
  "results": [
    {
      "id": "indeks_atau_id_string",
      "sentiment": "POSITIF atau NEGATIF atau NETRAL",
      "emotion": "emosi dominan (contoh: senang, bangga, puas, marah, kecewa, khawatir, netral)",
      "topic_tags": ["topik_standar_atau_frasa_ringkas"],
      "ai_reasoning": "alasan analisis ringkas 1-2 kalimat"
    }
  ]
}
JANGAN tambahkan teks apapun selain JSON murni.
"""

async def analyze_comment(text: str) -> AIAnalysisResult:
    results = await analyze_comments_batch([{"id": "0", "text": text}])
    if results and "0" in results:
        return results["0"]
    raise ValueError("Failed to analyze comment")

async def analyze_comments_batch(comments: list[dict]) -> dict:
    if not client:
        raise ValueError("GROQ_API_KEY is not configured")
        
    if not comments:
        return {}

    user_content = json.dumps(comments, ensure_ascii=False)

    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_BATCH},
                {"role": "user", "content": f"Daftar Komentar: {user_content}"}
            ],
            model=MODEL_NAME,
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        raw_content = response.choices[0].message.content
        parsed_data = json.loads(raw_content)
        
        result_map = {}
        for item in parsed_data.get("results", []):
            try:
                validated_result = AIAnalysisResult(
                    sentiment=item.get("sentiment", "NETRAL"),
                    emotion=item.get("emotion", "netral"),
                    topic_tags=item.get("topic_tags", []),
                    ai_reasoning=item.get("ai_reasoning", "")
                )
                result_map[str(item.get("id"))] = validated_result
            except ValidationError:
                continue
                
        return result_map
    
    except Exception as e:
        import logging
        logging.error(f"Groq API Error: {e}")
        return {}

async def generate_executive_summary(stats_json: dict) -> str:
    if not client:
        return "Insight tidak tersedia (API Key tidak dikonfigurasi)."

    prompt = f"""Anda adalah Senior Executive AI Analyst & Kebijakan Publik di Universitas Terbuka (UT).
Tugas Anda adalah menyusun "Laporan Wawasan Sentimen Publik Eksekutif" yang presisi, berbobot, berbasis bukti nyata (evidence-based), dan bernilai strategis tinggi bagi Pimpinan Universitas.

Gunakan metode HYBRID HIERARCHICAL ANALYSIS:
1. Setiap isu di data masukan telah dipasangkan secara deterministik antara topik makro, frekuensi data, dan kutipan riil mahasiswa (exemplar).
2. Analisis setiap topik tersebut secara mendalam: jelaskan tidak hanya apa yang terjadi, tetapi mengapa hal itu dirasakan mahasiswa dan apa implikasi operasionalnya bagi UT.
3. DILARANG membuat tabel markdown menggunakan karakter pipe (|). Gunakan format daftar butir (bullet lists), teks tebal, dan blockquote (>) untuk mengutip opini.

WAJIB GUNAKAN STRUKTUR MARKDOWN BERIKUT (Format Heading 3):

### Ringkasan Eksekutif
[1 paragraf wawasan naratif tajam mengenai iklim persepsi publik terkini dan momentum institusi]

### Metrik Kunci & Distribusi
- **Total Opini Dianalisis:** [Total data] opini publik lintas saluran.
- **Keseimbangan Sentimen:** [Persentase Positif] Positif | [Persentase Negatif] Negatif | [Persentase Netral] Netral.
- **Sentimen Dominan:** [Sentimen dominan dan tafsiran strategisnya].

### Analisis Faktor Pengungkit Kepuasan Publik
[Bedah setiap topik kepuasan dari top_positive_issues secara berurutan. Paparkan mengapa aspek tersebut memicu kepuasan mahasiswa, dan cantumkan bukti kutipan riil mahasiswa dari exemplar.quote menggunakan format blockquote (> "kutipan...")]

### Analisis Titik Kritis & Isu Mendesak
[Bedah setiap isu keluhan dari top_negative_issues secara berurutan. Paparkan akar masalah dan dampak operasionalnya bagi UT, dan cantumkan bukti kutipan riil mahasiswa dari exemplar.quote menggunakan format blockquote (> "kutipan...")]

### Rekomendasi Strategis Pimpinan (Actionable Directives)
1. **[Nama Aksi 1 - Bidang Akademik/Layanan]:** [Rekomendasi taktis konkret berbasis data]
2. **[Nama Aksi 2 - Bidang Infrastruktur/Sistem]:** [Rekomendasi taktis konkret berbasis data]
3. **[Nama Aksi 3 - Bidang Komunikasi/Finansial]:** [Rekomendasi taktis konkret berbasis data]

ATURAN KETAT:
- Gunakan bahasa Indonesia baku, lugas, elegan, dan profesional setingkat laporan dewan pimpinan rektorat.
- JANGAN gunakan tag HTML.
- JANGAN membuat tabel markdown dengan karakter pipe (|).
- JANGAN halusinasi data statistik atau membuat kutipan fiktif. Gunakan HANYA data dan kutipan yang disediakan di bawah ini.

DATA ANALITIK & PASANGAN ISU BUKTI RIIL:
{json.dumps(stats_json, indent=2, ensure_ascii=False)}
"""

    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "Anda adalah Senior Executive AI Analyst spesialis analisis persepsi publik akademik."},
                {"role": "user", "content": prompt}
            ],
            model=MODEL_NAME,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        import logging
        logging.error(f"Error generating insight: {e}")
        return "Tidak dapat memuat rangkuman AI saat ini (Terjadi gangguan pada koneksi AI Engine)."
