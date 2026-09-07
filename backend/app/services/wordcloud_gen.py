import numpy as np
from wordcloud import WordCloud
import io
import base64
import os
import re
from collections import Counter

INDONESIAN_STOPWORDS = {
    "dan", "di", "ke", "dari", "yang", "ini", "itu", "untuk", "pada", 
    "adalah", "dengan", "saya", "kamu", "dia", "mereka", "kita", "kami", "ut", 
    "terbuka", "universitas", "ada", "bisa", "sudah", "akan", "juga", "kau", "mu", "ku",
    "atau", "karena", "agar", "tidak", "gak", "nggak", "tak", "ya", "yaa", "iya",
    "saja", "sih", "dong", "kan", "lah", "deh", "kok", "nih", "kah", "tuh",
    "pun", "nya", "dalam", "bagi", "oleh", "saat", "bila", "jika", "kalau", "klo",
    "yg", "dgn", "dgnnya", "sdh", "tp", "tapi", "utk", "bgt", "dr", "krn",
    "banget", "sangat", "lebih", "paling", "agak", "cukup", "masih", "belum", "amat", "sekali",
    "tau", "tahu", "mau", "ingin", "dapat", "sama", "aja", "cuma", "hanya",
    "biar", "bikin", "buat", "jadi", "menjadi", "sedang", "waktu", "apa", "siapa",
    "mana", "kapan", "mengapa", "kenapa", "bagaimana", "gimana", "berapa",
    "seperti", "sebagai", "bahwa", "sebab", "sehingga", "maka", "supaya",
    "terima", "kasih", "terimakasih", "makasih", "salam", "halo", "min", "admin",
    "minn", "kak", "kakak", "mohon", "tolong", "bapak", "ibu", "selamat",
    "pagi", "siang", "sore", "malam", "assalamualaikum", "wr", "wb", "semoga",
    "kedepannya", "kedepan", "selalu", "makin", "terus", "tambah", "mahasiswa",
    "mhs", "kuliah", "kampus", "upbjj", "salut", "fakultas", "prodi", "jurusan",
    "link", "http", "https", "com", "co", "id", "org", "www", "net", "app",
    "baik", "bagus", "ok", "oke", "mantap", "sip", "jos", "mantul", "keren"
}

STANDARD_UT_PHRASES = [
    "bahan ajar", "biaya kuliah", "ujian online", "layanan akademik", "sistem aplikasi",
    "modul digital", "soal ujian", "tutor ramah", "server down", "nilai uas",
    "registrasi admisi", "fleksibilitas kuliah", "kualitas pendidikan", "jadwal tutorial",
    "aplikasi lemot", "tutor pengampu", "beasiswa prestasi", "situs web", "diskusi tuton",
    "tugas tutorial", "karya ilmiah", "praktik mandiri", "layanan perpustakaan",
    "legalisir ijazah", "kelulusan tepat", "bimbingan dosen", "akses belajar"
]

def extract_smart_frequencies(texts: list[str], target_word_count: int = 180) -> dict[str, int]:
    if not texts:
        return {
            "Layanan Akademik": 85,
            "Bahan Ajar": 80,
            "Sistem Aplikasi": 75,
            "Ujian Online": 70,
            "Registrasi Admisi": 65,
            "Biaya Kuliah": 60,
            "Fleksibilitas Kuliah": 55,
            "Kualitas Pendidikan": 50,
            "Tutor Ramah": 45,
            "Modul Digital": 40
        }

    phrase_counter = Counter()
    unigram_counter = Counter()

    for raw_text in texts:
        if not raw_text:
            continue
        cleaned = raw_text.lower()
        cleaned = re.sub(r'https?://\S+|www\.\S+', ' ', cleaned)
        cleaned = re.sub(r'[^a-zA-Z\s]', ' ', cleaned)
        
        for std_p in STANDARD_UT_PHRASES:
            if std_p in cleaned:
                phrase_counter[std_p.title()] += 3

        words = [w for w in cleaned.split() if len(w) >= 3 and w not in INDONESIAN_STOPWORDS]
        
        for i in range(len(words) - 1):
            w1, w2 = words[i], words[i+1]
            if w1 != w2:
                bigram = f"{w1} {w2}".title()
                phrase_counter[bigram] += 1
                
        for w in words:
            unigram_counter[w.title()] += 1

    combined_counts = Counter()
    
    for phrase, count in phrase_counter.items():
        if count >= 2:
            combined_counts[phrase] = count * 2
            
    for word, count in unigram_counter.items():
        if len(word) >= 4:
            combined_counts[word] = count

    top_candidates = combined_counts.most_common(target_word_count)
    
    if len(top_candidates) < target_word_count:
        more_unigrams = unigram_counter.most_common(target_word_count * 2)
        for word, count in more_unigrams:
            if word not in combined_counts:
                combined_counts[word] = count
        top_candidates = combined_counts.most_common(target_word_count)

    if not top_candidates:
        return {
            "Layanan Akademik": 85,
            "Bahan Ajar": 80,
            "Sistem Aplikasi": 75,
            "Ujian Online": 70,
            "Registrasi Admisi": 65,
            "Biaya Kuliah": 60,
            "Fleksibilitas Kuliah": 55,
            "Kualitas Pendidikan": 50
        }

    max_raw = top_candidates[0][1]
    min_raw = top_candidates[-1][1]
    
    normalized_freqs = {}
    for word, raw_freq in top_candidates:
        if max_raw == min_raw:
            scaled = 60
        else:
            ratio = (raw_freq - min_raw) / (max_raw - min_raw)
            scaled = int(18 + (ratio ** 0.65) * 82)
        normalized_freqs[word] = scaled

    return normalized_freqs

def get_color_func(sentiment: str):
    def color_func(word, font_size, position, orientation, random_state=None, **kwargs):
        if sentiment == 'positif':
            return f"hsl({np.random.randint(135, 165)}, {np.random.randint(55, 85)}%, {np.random.randint(28, 46)}%)"
        elif sentiment == 'negatif':
            return f"hsl({np.random.randint(350, 365)}, {np.random.randint(65, 90)}%, {np.random.randint(40, 56)}%)"
        elif sentiment == 'netral':
            return f"hsl({np.random.randint(205, 225)}, {np.random.randint(30, 55)}%, {np.random.randint(32, 50)}%)"
        else:
            palette_choice = np.random.choice(["navy", "gold", "green", "red", "slate"], p=[0.35, 0.20, 0.20, 0.15, 0.10])
            if palette_choice == "navy":
                return f"hsl(210, {np.random.randint(80, 100)}%, {np.random.randint(20, 34)}%)"
            elif palette_choice == "gold":
                return f"hsl(45, {np.random.randint(90, 100)}%, {np.random.randint(40, 50)}%)"
            elif palette_choice == "green":
                return f"hsl({np.random.randint(135, 165)}, {np.random.randint(60, 80)}%, {np.random.randint(30, 45)}%)"
            elif palette_choice == "red":
                return f"hsl({np.random.randint(350, 365)}, {np.random.randint(70, 90)}%, {np.random.randint(40, 55)}%)"
            else:
                return f"hsl({np.random.randint(205, 225)}, {np.random.randint(30, 50)}%, {np.random.randint(35, 50)}%)"
    return color_func

def generate_wordcloud_base64(word_freqs: dict, sentiment: str, layout: str = "desktop") -> str:
    if not word_freqs:
        word_freqs = {
            "Layanan Akademik": 85,
            "Bahan Ajar": 80,
            "Sistem Aplikasi": 75,
            "Ujian Online": 70,
            "Registrasi Admisi": 65,
            "Biaya Kuliah": 60,
            "Fleksibilitas Kuliah": 55,
            "Kualitas Pendidikan": 50
        }

    font_path = "C:\\Windows\\Fonts\\arialbd.ttf"
    if not os.path.exists(font_path):
        font_path = None
        
    w = 800 if layout == "mobile" else 1600
    h = 800 if layout == "mobile" else 650
    ph = 0.65 if layout == "mobile" else 0.75
        
    wc = WordCloud(
        background_color="rgba(255, 255, 255, 0)",
        mode="RGBA",
        max_words=200,
        color_func=get_color_func(sentiment),
        width=w,
        height=h,
        margin=2,
        prefer_horizontal=ph,
        random_state=42,
        font_path=font_path,
        min_font_size=9,
        max_font_size=115,
        relative_scaling=0.35
    )
    
    wc.generate_from_frequencies(word_freqs)
    
    img = wc.to_image()
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"
