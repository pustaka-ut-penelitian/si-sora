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

SYSTEM_PROMPT_BATCH = """Anda adalah ahli analisis sentimen bahasa Indonesia.
Tugas Anda menganalisis daftar komentar sosial media.
Pahami konteks, sarkasme, dan bahasa gaul Indonesia.

Output Anda HARUS berupa JSON object murni dengan kunci "results" yang berisi array hasil, berstruktur berikut:
{
  "results": [
    {
      "id": "indeks_atau_id_string",
      "sentiment": "POSITIF atau NEGATIF atau NETRAL",
      "emotion": "emosi dominan (contoh: senang, bangga, puas, marah, kecewa, khawatir, netral)",
      "topic_tags": ["frasa 2 kata berkonteks, contoh: 'biaya terjangkau', 'sistem error', 'kuliah fleksibel', 'pelayanan ramah', 'modul lambat', 'jadwal bentrok'"],
      "ai_reasoning": "alasan analisis max 2 kalimat"
    }
  ]
}
Catatan untuk topic_tags: Ekstrak 1 sampai 3 frasa ringkas 2 kata (Aspek + Sifat/Kondisi) agar memiliki konteks yang jelas. JANGAN gunakan kata tunggal yang ambigu seperti 'biaya' atau 'ujian' saja.
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

    prompt = f"""Anda adalah AI Data Analyst Eksekutif di Universitas Terbuka. 
Diberikan data statistik analisis sentimen terkini, buatlah Laporan Wawasan Eksekutif yang mendalam, terstruktur, dan sangat bermanfaat bagi Pimpinan.

WAJIB GUNAKAN FORMAT MARKDOWN (MD) BERIKUT UNTUK OUTPUT ANDA:

### Ringkasan Eksekutif
[1 paragraf ringkasan singkat tentang situasi sentimen publik secara keseluruhan dari rentang waktu yang tersedia]

### Metrik Utama
- **Total Data Diproses:** [Jumlah total data] opini publik.
- **Distribusi Sentimen:** [Persentase Positif] Positif, [Persentase Negatif] Negatif, [Persentase Netral] Netral.
- **Sentimen Dominan:** [Sebutkan sentimen dominan dan implikasinya secara singkat].

### Sorotan Topik Ekstrem
- **Faktor Kepuasan Tertinggi:** [Sebutkan apa yang paling diapresiasi berdasarkan data topik positif, dan mengapa]
- **Faktor Keluhan Utama:** [Sebutkan topik negatif yang paling mendesak dan apa masalahnya]

### Rekomendasi Strategis
1. [Rekomendasi 1 yang paling krusial, spesifik, dan dapat ditindaklanjuti (actionable) berdasarkan data]
2. [Rekomendasi 2]
3. [Rekomendasi 3]

Gunakan bahasa Indonesia yang profesional, tajam, elegan dan lugas. JANGAN gunakan tag HTML. HANYA gunakan format markdown standar (Heading 3, Bold, List).
JANGAN halusinasi data, JANGAN merekomendasikan hal yang tidak didukung oleh data. Gunakan HANYA data yang diberikan di bawah ini. Jika ada informasi yang kosong, nyatakan belum cukup data.

Data statistik:
{json.dumps(stats_json, indent=2)}
"""

    try:
        response = await client.chat.completions.create(
            messages=[
                {"role": "system", "content": "Anda adalah Executive Analyst spesialis data sosial media."},
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
