import re
import csv
import os

LEXICON_DIR = os.path.join(os.path.dirname(__file__), "lexicon")

POSITIVE_LEXICON = {}
NEGATIVE_LEXICON = {}
SLANG_DICT = {}

FALLBACK_SLANG = {
    "mantul": "bagus",
    "mantap": "bagus",
    "mantapp": "bagus",
    "mantulll": "bagus",
    "keren": "bagus",
    "kerenn": "bagus",
    "top": "bagus",
    "gacor": "bagus",
    "juara": "bagus",
    "jos": "bagus",
    "josss": "bagus",
    "asik": "bagus",
    "asikkk": "bagus",
    "bapuk": "jelek",
    "ampas": "buruk",
    "parah": "buruk",
    "parahh": "buruk",
    "lemot": "lambat",
    "lelet": "lambat",
    "error": "rusak",
    "eror": "rusak",
    "down": "rusak",
    "ancur": "hancur",
    "hancur": "hancur",
    "nyesel": "kecewa",
    "ribet": "sulit",
    "susah": "sulit",
    "mudah": "gampang",
    "gampang": "gampang",
    "gercep": "cepat",
    "fastrespon": "cepat",
    "fast response": "cepat",
    "fast respon": "cepat",
    "slowrespon": "lambat",
    "slow response": "lambat",
    "slow respon": "lambat",
    "slow": "lambat",
    "responsif": "cepat",
    "oke": "bagus",
    "sip": "bagus",
    "bgt": "banget",
    "beneran": "sungguh",
    "recommended": "bagus",
    "rekomen": "bagus",
    "gak": "tidak",
    "ga": "tidak",
    "nggak": "tidak",
    "ngga": "tidak",
    "tdk": "tidak",
    "tak": "tidak",
    "blm": "belum",
    "yg": "yang",
    "dgn": "dengan",
    "utk": "untuk",
    "sy": "saya",
    "dr": "dari",
    "dri": "dari",
    "sdh": "sudah",
    "udh": "sudah",
    "klo": "kalo",
    "tp": "tapi"
}

COMPOUND_PHRASES_POSITIVE = {
    "sangat baik": 5,
    "sangat memuaskan": 6,
    "pelayanan baik": 4,
    "pelayanan ramah": 5,
    "sangat ramah": 5,
    "sangat membantu": 5,
    "sangat cepat": 5,
    "sangat mudah": 5,
    "biaya terjangkau": 5,
    "biaya murah": 4,
    "sangat fleksibel": 5,
    "bintang lima": 5,
    "worth it": 4,
    "good job": 4,
    "tetap semangat": 3,
    "maju terus": 3,
    "terima kasih banyak": 4,
    "sukses selalu": 4,
    "tingkatkan terus": 3,
    "sangat informatif": 4,
    "penjelasan jelas": 4,
    "mudah dipahami": 5,
    "kualitas bagus": 4,
    "dosen komunikatif": 4,
    "tutor komunikatif": 4,
    "fast respon": 4,
    "fast response": 4,
    "pelayanan prima": 5,
    "sangat puas": 6,
    "luar biasa": 5,
    "sangat recomended": 5,
    "sangat direkomendasikan": 5,
    "tidak mengecewakan": 5,
    "tidak ribet": 4,
    "tidak lambat": 4,
    "tidak mahal": 4,
    "tidak ada kendala": 5,
    "tidak mengalami kendala": 5,
    "belum ada kendala": 4,
    "belum mengalami kendala": 4,
    "tidak ada masalah": 5,
    "tidak mengalami masalah": 5,
    "belum ada masalah": 4,
    "tanpa kendala": 5,
    "tanpa masalah": 5,
    "tanpa hambatan": 5,
    "berjalan lancar": 5,
    "sangat lancar": 5,
    "sangat profesional": 5,
    "responsif sekali": 5,
    "sangat responsif": 5
}

COMPOUND_PHRASES_NEGATIVE = {
    "slow respon": -6,
    "slow response": -6,
    "kurang fast respon": -5,
    "kurang fast response": -5,
    "sangat lambat": -5,
    "sangat buruk": -6,
    "sangat jelek": -6,
    "sangat kecewa": -6,
    "sangat lamban": -5,
    "sangat sulit": -5,
    "sangat mahal": -5,
    "kurang memuaskan": -4,
    "kurang ramah": -4,
    "kurang responsif": -4,
    "kurang jelas": -4,
    "kurang baik": -4,
    "kurang cepat": -4,
    "kurang transparan": -5,
    "kurang informasi": -4,
    "kurangnya informasi": -5,
    "minim informasi": -4,
    "kurang penjelasan": -4,
    "kurangnya penjelasan": -4,
    "tidak responsif": -5,
    "tidak memuaskan": -5,
    "tidak ramah": -5,
    "tidak jelas": -4,
    "tidak ada respon": -6,
    "tidak direspon": -6,
    "tidak di respon": -6,
    "tidak dibalas": -6,
    "tidak di balas": -6,
    "tidak pernah dibalas": -6,
    "tidak pernah di balas": -6,
    "tidak dijawab": -6,
    "tidak di jawab": -6,
    "tidak pernah dijawab": -6,
    "tidak pernah di jawab": -6,
    "tidak diangkat": -6,
    "tidak di angkat": -6,
    "tidak pernah diangkat": -6,
    "tidak pernah di angkat": -6,
    "tidak ada jawaban": -6,
    "tidak ada balasan": -6,
    "tidak ada tanggapan": -5,
    "tidak bisa dihubungi": -5,
    "susah dihubungi": -5,
    "sulit dihubungi": -5,
    "tidak bagus": -6,
    "kurang bagus": -5,
    "jaringan tidak bagus": -6,
    "jaringan kurang bagus": -5,
    "jaringan jelek": -6,
    "jaringan buruk": -6,
    "jaringan lemot": -6,
    "sinyal jelek": -6,
    "sinyal buruk": -6,
    "sinyal lemah": -5,
    "sinyal tidak bagus": -6,
    "sinyal kurang bagus": -5,
    "terlalu sibuk": -5,
    "sangat sibuk": -4,
    "pengurus sibuk": -4,
    "admin sibuk": -4,
    "terlalu lama": -5,
    "sangat lama": -5,
    "lama sekali": -5,
    "respon lama": -5,
    "respon sangat lama": -6,
    "server sering down": -6,
    "sering error": -5,
    "sering eror": -5,
    "sering down": -6,
    "force close": -5,
    "lemot parah": -6,
    "parah banget": -6,
    "bapuk banget": -6,
    "kecewa berat": -6,
    "mengecewakan sekali": -6,
    "sangat ribet": -5,
    "pelayanan buruk": -5,
    "pelayanan lelet": -5,
    "lambat sekali": -5,
    "lambat respon": -5,
    "admin lelet": -5,
    "admin judes": -5,
    "pelayanan judes": -5,
    "tidak membantu": -5,
    "kurang membantu": -4,
    "bikin pusing": -5,
    "bikin emosi": -6,
    "buang waktu": -5,
    "sulit diakses": -6,
    "susah diakses": -6,
    "sulit di akses": -6,
    "susah di akses": -6,
    "tidak bisa login": -6,
    "gagal login": -6,
    "sulit login": -6,
    "susah login": -6,
    "tidak sesuai": -5,
    "kurang sesuai": -5,
    "tidak transparan": -5,
    "tetap tidak dikirim": -6,
    "tidak dikirim": -5,
    "belum dikirim": -5,
    "belum di kirim": -5,
    "belum diterima": -5,
    "belum di terima": -5,
    "belum sampai": -5,
    "keterlambatan modul": -6,
    "modul terlambat": -6,
    "buku terlambat": -6,
    "web sering down": -6,
    "web down": -6,
    "sering gangguan": -6,
    "gangguan sistem": -5,
    "sulit dipahami": -5,
    "susah dipahami": -5,
    "kurang paham": -4,
    "kurang komunikatif": -4,
    "tidak komunikatif": -5,
    "tidak puas": -6,
    "kurang puas": -5,
    "tidak ramah": -5,
    "tidak sopan": -5,
    "kurang sopan": -4,
    "tidak profesional": -5,
    "kurang profesional": -5,
    "tidak ada kejelasan": -5,
    "belum ada kejelasan": -5,
    "tidak ada solusi": -5,
    "belum ada solusi": -5,
    "mohon diperbaiki": -4,
    "tolong diperbaiki": -4,
    "mohon ditingkatkan": -3,
    "tolong ditingkatkan": -3,
    "banyak kendala": -5,
    "banyak masalah": -5,
    "banyak kekurangan": -4,
    "sangat mengecewakan": -6,
    "tidak ada perubahan": -5
}

INTENSIFIER_WORDS = {
    "banget": 2.0,
    "bgt": 2.0,
    "sekali": 1.8,
    "skali": 1.8,
    "amat": 1.7,
    "sangat": 1.9,
    "super": 2.0,
    "parah": 2.0,
    "pol": 2.0,
    "sungguh": 1.6,
    "bener": 1.5,
    "beneran": 1.6,
    "bener-bener": 2.0,
    "ekstrem": 2.0,
    "terlalu": 1.6
}

NEGATION_WORDS = {
    "tidak", "tdk", "nggak", "ngga", "ga", "gak", "g", "bukan", 
    "kurang", "jangan", "belum", "blm", "tak", "minus", "tanpa"
}

NEGATION_SKIP_TOKENS = {
    "pernah", "bisa", "ada", "lagi", "pun", "di", "ter", "ke", 
    "secara", "yang", "yg", "juga", "bakal", "selalu", "sudah", 
    "sdh", "akan", "telah", "sama", "malah", "bahkan",
    "mengalami", "merasakan", "menemui", "menghadapi", "menjumpai", 
    "terdapat", "punya", "memiliki"
}

CONTRAST_WORDS = {
    "tapi", "tetapi", "namun", "melainkan", "sedangkan", "padahal", 
    "walaupun", "meskipun", "kendati", "kecuali", "terkecuali", "hanya", "cuma"
}

STOPWORDS = {
    "dan", "di", "ke", "dari", "yang", "ini", "itu", "untuk", "pada", "adalah", 
    "dengan", "saya", "kamu", "dia", "mereka", "kita", "ut", "terbuka", "universitas", 
    "ada", "bisa", "sudah", "akan", "juga", "atau", "karena", "agar", "tidak", "gak", 
    "nggak", "tak", "ya", "saja", "sih", "dong", "kan", "lah", "deh", "kok", "nih", 
    "kah", "pun", "nya", "dalam", "bagi", "oleh", "saat", "bila", "jika", "yg", "dgn", 
    "sdh", "tp", "tapi", "klo", "kalo", "utk", "banget", "sangat", "lebih", "paling", 
    "agak", "masih", "belum", "tau", "tahu", "mau", "ingin", "dapat", "sama", "aja", 
    "ku", "mu", "si", "hai", "halo", "min", "admin", "oh", "eh", "ah", "dong", "yuk",
    "apa", "apakah", "siapa", "siapakah", "kapan", "kapankah", "dimana", "kemana", 
    "bagaimana", "gimana", "berapa", "berapakah", "kenapa", "mengapa"
}

DOMAIN_TOPICS = {
    "Bahan Ajar & Modul": {
        "modul", "buku", "rbv", "bmp", "pustaka", "cetak", "diktat", "materi", "bacaan", "bahan", "ajar"
    },
    "Biaya Pendidikan": {
        "biaya", "spp", "bayar", "tagihan", "lip", "uang", "murah", "mahal", "cicil", 
        "cicilan", "gratis", "beasiswa", "kip", "payment", "tarif", "angsuran", "ekonomis"
    },
    "Sistem & Aplikasi": {
        "sia", "lms", "elearning", "silayar", "website", "web", "login", "server", 
        "error", "down", "lemot", "aplikasi", "app", "portal", "bug", "sistem", "crash", 
        "password", "akun", "jaringan", "loading", "force", "close", "lelet"
    },
    "Ujian & Penilaian": {
        "ujian", "uo", "the", "uas", "uts", "nilai", "ipk", "remedial", "esai", "tugas", 
        "tuton", "tuweb", "yudisium", "kelulusan", "transkrip", "skor", "lulus", "wisuda"
    },
    "Registrasi & Admisi": {
        "daftar", "pendaftaran", "registrasi", "maba", "admisi", "berkas", "validasi", 
        "formulir", "prodi", "jurusan", "fakultas", "syarat", "ijazah"
    },
    "Layanan Akademik": {
        "tutor", "dosen", "upbjj", "salut", "sentra", "cs", "halo", "staf", "whatsapp", 
        "wa", "respon", "bantuan", "ramah", "lambat", "pelayanan", "layanan", "hubungi", "petugas"
    },
    "Fleksibilitas Kuliah": {
        "kerja", "karyawan", "fleksibel", "waktu", "mandiri", "online", "santai", 
        "sibuk", "jarak", "jauh", "pjj", "rumah", "luar", "negeri"
    },
    "Kualitas Pendidikan": {
        "akreditasi", "mutu", "reputasi", "kampus", "negeri", "ptn", "ptnbh", 
        "kurikulum", "almamater", "kuliah", "belajar", "ilmu", "gelar", "sarjana", "mitra", "kerjasama"
    }
}

EMOTION_MAP = {
    "senang": {
        "senang", "bahagia", "suka", "gembira", "mantap", "mantul", "keren", "jos", 
        "asik", "alhamdulillah", "terimakasih", "makasih", "love", "hebat", "seru", 
        "semangat", "terbaik", "apresiasi", "kagum", "mindset", "berkah"
    },
    "bangga": {
        "bangga", "almamater", "wisuda", "sarjana", "lulus", "toga", "berprestasi", 
        "juara", "sukses", "jaya", "terbesar", "unggul", "akreditasi", "akreditasinya", "reputasi"
    },
    "puas": {
        "puas", "terjangkau", "fleksibel", "mudah", "cepat", "lancar", "membantu", 
        "ramah", "rapi", "jelas", "solutif", "responsif", "prima", "praktis"
    },
    "kecewa": {
        "kecewa", "nyesel", "ampas", "bapuk", "parah", "lambat", "lemot", "rugi", 
        "sia-sia", "payah", "buruk", "jelek", "ancur", "hancur", "ribet", "susah",
        "dipersulit", "berbelit", "mengecewakan", "lelet"
    },
    "marah": {
        "marah", "kesal", "emosi", "ngamuk", "bobrok", "penipu", "manipulasi", 
        "benci", "geram", "muak", "pusing", "kapok"
    },
    "khawatir": {
        "khawatir", "takut", "cemas", "bingung", "gimana", "tolong", 
        "help", "ragu", "panik", "waswas", "terkendala"
    }
}

def load_lexicons():
    global POSITIVE_LEXICON, NEGATIVE_LEXICON, SLANG_DICT
    
    pos_path = os.path.join(LEXICON_DIR, "positive.tsv")
    if os.path.exists(pos_path):
        with open(pos_path, "r", encoding="utf-8") as f:
            next(f)
            for line in f:
                parts = line.strip().split('\t')
                if len(parts) == 2:
                    POSITIVE_LEXICON[parts[0]] = int(parts[1])
                    
    neg_path = os.path.join(LEXICON_DIR, "negative.tsv")
    if os.path.exists(neg_path):
        with open(neg_path, "r", encoding="utf-8") as f:
            next(f)
            for line in f:
                parts = line.strip().split('\t')
                if len(parts) == 2:
                    NEGATIVE_LEXICON[parts[0]] = int(parts[1])
                    
    slang_path = os.path.join(LEXICON_DIR, "slang.csv")
    if os.path.exists(slang_path):
        with open(slang_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader)
            for row in reader:
                if len(row) >= 2:
                    slang = row[0].strip()
                    formal = row[1].strip()
                    SLANG_DICT[slang] = formal

    for k, v in FALLBACK_SLANG.items():
        if k not in SLANG_DICT:
            SLANG_DICT[k] = v

    true_positive_words = {
        "bagus", "baik", "cepat", "lancar", "mudah", "ramah", "puas", "hebat", 
        "mantap", "mantul", "keren", "top", "gacor", "jos", "josss", "rapi", 
        "jelas", "bermanfaat", "responsif", "profesional", "terjangkau", "unggul", 
        "berkualitas", "solutif", "optimal", "prima", "senang", "bangga", "sukses", 
        "gampang", "suka", "kagum", "terbesar", "rekomendasi", "informatif", 
        "komunikatif", "fleksibel", "praktis", "ekonomis", "membantu", "terbaik", 
        "apresiasi", "berkah", "memuaskan", "teratur"
    }

    true_negative_words = {
        "buruk", "jelek", "rusak", "lambat", "lelet", "lemot", "sulit", "susah", 
        "kecewa", "parah", "error", "eror", "down", "bapuk", "ampas", "ribet", 
        "dipersulit", "mahal", "judes", "mengecewakan", "bermasalah", "terkendala", 
        "terhambat", "tertunda", "kacau", "hancur", "rugi", "masalah", "keluhan", 
        "terlambat", "keterlambatan", "keberatan", "berat", "kurang", "payah", 
        "ancur", "nyesel", "kesal", "emosi", "bobrok", "marah", "benci", "muak", 
        "pusing", "kapok", "ngamuk", "kendala", "hambatan", "kekurangan", "gangguan"
    }

    non_sentiment_entities = {
        "jaringan", "sinyal", "internet", "sistem", "server", "kadang", "pengurus", 
        "staf", "pokjar", "admin", "dosen", "mahasiswa", "kampus", "telpon", "hp", 
        "telepon", "respon", "jawaban", "tanya", "pertanyaan", "balas", "balasan", 
        "angkat", "nomor", "informasi", "pesan", "waktu", "hari", "minggu", "bulan", 
        "tahun", "jam", "biaya", "uang", "aplikasi", "web", "website", "portal", 
        "link", "tugas", "tuton", "the", "ujian", "nilai", "ipk", "modul", "buku", 
        "slow", "sibuk", "upbjj", "salut", "sentra", "admisi", "registrasi", 
        "semester", "pindah", "survei", "kegiatan", "kuliah", "belajar", "kelas", 
        "jurusan", "prodi", "fakultas", "universitas", "pendidikan", "gelar", 
        "sarjana", "mitra", "kerjasama", "kontak", "email", "data", "dokumen", 
        "persyaratan", "mekanisme", "tatacara", "tata", "cara", "hasil", "surabaya", 
        "kuningan", "merauke", "bengkulu", "ipuh", "masukan", "evaluasi", "pelayanan", 
        "layanan", "umum", "pembelajaran", "kurikulum", "lulusan", "praktik",
        "menurut", "terkadang", "chat", "jawab", "menjawab", "kualitas", "kasih"
    }

    for w in true_positive_words:
        NEGATIVE_LEXICON.pop(w, None)

    for w in true_negative_words:
        POSITIVE_LEXICON.pop(w, None)

    for w in non_sentiment_entities:
        POSITIVE_LEXICON.pop(w, None)
        NEGATIVE_LEXICON.pop(w, None)

    for term in STOPWORDS:
        POSITIVE_LEXICON.pop(term, None)
        NEGATIVE_LEXICON.pop(term, None)

    POSITIVE_LEXICON.update({
        "fleksibel": 3,
        "praktis": 3,
        "terjangkau": 3,
        "ekonomis": 3,
        "responsif": 3,
        "profesional": 3,
        "bermanfaat": 3,
        "membantu": 3,
        "senang": 3,
        "bangga": 3,
        "sukses": 3,
        "berkualitas": 3,
        "mudah": 2,
        "gampang": 2,
        "lancar": 3,
        "suka": 3,
        "kagum": 3,
        "terbesar": 3,
        "akreditasi": 2,
        "akreditasinya": 2,
        "unggul": 3,
        "mindset": 2,
        "rekomendasi": 3,
        "bagus": 3,
        "mantap": 3,
        "mantul": 3,
        "keren": 3,
        "top": 3,
        "gacor": 3,
        "jos": 3,
        "hebat": 3,
        "terbaik": 3,
        "puas": 3,
        "memuaskan": 3,
        "informatif": 3,
        "komunikatif": 3,
        "ramah": 3,
        "jelas": 2,
        "solutif": 3,
        "prima": 3,
        "cepat": 2,
        "optimal": 3,
        "rapi": 2
    })

    NEGATIVE_LEXICON.update({
        "rusak": -3,
        "hancur": -3,
        "buruk": -3,
        "jelek": -3,
        "lambat": -3,
        "lelet": -3,
        "sulit": -3,
        "susah": -3,
        "kecewa": -3,
        "parah": -3,
        "error": -3,
        "eror": -3,
        "down": -3,
        "bapuk": -3,
        "ampas": -3,
        "lemot": -3,
        "dipersulit": -3,
        "ribet": -3,
        "mahal": -2,
        "judes": -3,
        "mengecewakan": -3,
        "bermasalah": -3,
        "kendala": -2,
        "tertunda": -2,
        "terhambat": -2,
        "terkendala": -2,
        "kurang": -2,
        "masalah": -3,
        "keluhan": -3,
        "terlambat": -3,
        "keterlambatan": -3,
        "keberatan": -3,
        "berat": -2,
        "payah": -3,
        "ancur": -3,
        "nyesel": -3,
        "kesal": -3,
        "emosi": -3,
        "bobrok": -3,
        "marah": -3,
        "benci": -3,
        "pusing": -3,
        "gangguan": -3
    })

load_lexicons()

CRITICAL_PROBLEM_WORDS = {
    "sulit", "susah", "kendala", "masalah", "lambat", "lelet", "lemot", 
    "kecewa", "rusak", "down", "error", "eror", "terlambat", "keterlambatan", 
    "parah", "jelek", "buruk", "bermasalah", "terhambat", "terkendala", 
    "keberatan", "keluhan", "kurang", "payah", "ancur", "hancur", "bapuk", 
    "ampas", "dipersulit", "ribet", "judes", "gangguan"
}

KNOWN_STEMS = set(POSITIVE_LEXICON.keys()) | set(NEGATIVE_LEXICON.keys()) | CRITICAL_PROBLEM_WORDS

def strip_indonesian_affixes(w: str) -> str:
    for suffix in ("nya", "lah", "kah", "pun", "ku", "mu"):
        if len(w) > len(suffix) + 2 and w.endswith(suffix):
            candidate = w[:-len(suffix)]
            if candidate in KNOWN_STEMS:
                return candidate

    if w.startswith("per") and w.endswith("an") and len(w) > 6:
        candidate = w[3:-2]
        if candidate in KNOWN_STEMS:
            return candidate

    if w.startswith("ke") and w.endswith("an") and len(w) > 5:
        candidate = w[2:-2]
        if candidate in KNOWN_STEMS:
            return candidate
        if candidate.startswith("ter") and len(candidate) > 5:
            cand_root = candidate[3:]
            if cand_root in KNOWN_STEMS:
                return cand_root

    if w.startswith("ber") and len(w) > 5:
        candidate = w[3:]
        if candidate in KNOWN_STEMS:
            return candidate

    if w.startswith("ter") and len(w) > 5:
        candidate = w[3:]
        if candidate in KNOWN_STEMS:
            return candidate

    if w.startswith("di") and len(w) > 4:
        candidate = w[2:]
        if candidate in KNOWN_STEMS:
            return candidate
        if candidate.endswith("kan") and len(candidate) > 5:
            cand_root = candidate[:-3]
            if cand_root in KNOWN_STEMS:
                return cand_root
        if candidate.endswith("i") and len(candidate) > 3:
            cand_root = candidate[:-1]
            if cand_root in KNOWN_STEMS:
                return cand_root
        if candidate.startswith("per") and len(candidate) > 5:
            cand_root = candidate[3:]
            if cand_root in KNOWN_STEMS:
                return cand_root

    return w

strip_indonesian_suffix = strip_indonesian_affixes

def normalize_text_tokens(text: str) -> list[str]:
    text_clean = text.lower()
    raw_words = re.findall(r'\b[a-z0-9]+\b', text_clean)
    normalized = []
    for w in raw_words:
        slang_w = SLANG_DICT.get(w, w)
        stemmed_w = strip_indonesian_affixes(slang_w)
        normalized.append(stemmed_w)
    return normalized

def analyze_sentiment_local(text: str) -> str:
    lower_text = text.lower()
    compound_score = 0
    has_compound_negative = False
    
    for phrase, p_val in COMPOUND_PHRASES_POSITIVE.items():
        if phrase in lower_text:
            compound_score += p_val

    for phrase, n_val in COMPOUND_PHRASES_NEGATIVE.items():
        if phrase in lower_text:
            compound_score += n_val
            has_compound_negative = True

    normalized_words = normalize_text_tokens(text)
    token_score = 0
    i = 0
    multiplier = 1.0
    
    while i < len(normalized_words):
        word = normalized_words[i]
        
        if word in CONTRAST_WORDS:
            token_score = token_score * 0.4
            multiplier = 1.5
            i += 1
            continue

        is_negated = False
        for k in range(i - 1, max(-1, i - 5), -1):
            prev_token = normalized_words[k]
            if prev_token in NEGATION_WORDS:
                is_negated = True
                break
            elif prev_token in NEGATION_SKIP_TOKENS:
                continue
            else:
                break

        current_intensifier = 1.0
        if i > 0 and normalized_words[i - 1] in INTENSIFIER_WORDS:
            current_intensifier = INTENSIFIER_WORDS[normalized_words[i - 1]]
        elif i + 1 < len(normalized_words) and normalized_words[i + 1] in INTENSIFIER_WORDS:
            current_intensifier = INTENSIFIER_WORDS[normalized_words[i + 1]]

        word_val = 0
        if word in NEGATIVE_LEXICON and word not in POSITIVE_LEXICON:
            word_val = NEGATIVE_LEXICON[word]
        elif word in POSITIVE_LEXICON and word not in NEGATIVE_LEXICON:
            word_val = POSITIVE_LEXICON[word]
        elif word in NEGATIVE_LEXICON and word in POSITIVE_LEXICON:
            pos_score = POSITIVE_LEXICON[word]
            neg_score = abs(NEGATIVE_LEXICON[word])
            word_val = pos_score if pos_score > neg_score else -neg_score
            
        if is_negated:
            if word_val > 0:
                word_val = -(word_val * 1.2)
            elif word_val < 0:
                word_val = abs(word_val) * 0.8
            
        token_score += (word_val * current_intensifier * multiplier)
        i += 1
        
    total_score = compound_score + token_score

    has_unnegated_problem = False
    for idx, w in enumerate(normalized_words):
        if w in CRITICAL_PROBLEM_WORDS:
            negated = False
            for k in range(idx - 1, max(-1, idx - 5), -1):
                prev = normalized_words[k]
                if prev in NEGATION_WORDS:
                    negated = True
                    break
                elif prev in NEGATION_SKIP_TOKENS:
                    continue
                else:
                    break
            if not negated:
                has_unnegated_problem = True
                break

    if has_compound_negative:
        if total_score <= 0:
            return "NEGATIF"
        return "NETRAL"

    if has_unnegated_problem:
        if total_score <= -0.5 or compound_score < 0:
            return "NEGATIF"
        return "NETRAL"

    if total_score >= 1.5:
        return "POSITIF"
    elif total_score <= -1.5:
        return "NEGATIF"
    else:
        return "NETRAL"

def detect_emotion_local(text: str, sentiment: str) -> str:
    tokens = set(normalize_text_tokens(text))
    
    if sentiment == "POSITIF":
        for emotion_name in ["bangga", "puas", "senang"]:
            if tokens.intersection(EMOTION_MAP.get(emotion_name, set())):
                return emotion_name
        return "puas"
    elif sentiment == "NEGATIF":
        for emotion_name in ["marah", "kecewa", "khawatir"]:
            if tokens.intersection(EMOTION_MAP.get(emotion_name, set())):
                return emotion_name
        return "kecewa"
    return "netral"

def extract_topics_local(text: str, sentiment: str = "NETRAL") -> list[str]:
    tokens = set(normalize_text_tokens(text))
    matched_topics = []
    
    for topic_name, keywords in DOMAIN_TOPICS.items():
        if tokens.intersection(keywords):
            matched_topics.append(topic_name)
            if len(matched_topics) >= 2:
                break
                
    if matched_topics:
        return matched_topics
        
    meaningful_words = [
        w for w in normalize_text_tokens(text)
        if w not in STOPWORDS and len(w) >= 3 and not w.isdigit()
    ]
    
    if meaningful_words:
        chosen_word = meaningful_words[0].title()
        if len(meaningful_words) >= 2:
            return [f"{chosen_word} {meaningful_words[1].title()}"]
        return [chosen_word]
        
    if sentiment == "POSITIF":
        return ["Apresiasi Umum"]
    elif sentiment == "NEGATIF":
        return ["Keluhan Layanan"]
    return ["Layanan Umum"]

def generate_reasoning_local(text: str, sentiment: str, emotion: str, topics: list[str]) -> str:
    topic_str = ", ".join(topics) if topics else "Layanan Akademik"
    tokens = normalize_text_tokens(text)
    
    found_pos = [w for w in tokens if w in POSITIVE_LEXICON]
    found_neg = [w for w in tokens if w in NEGATIVE_LEXICON]
    
    if sentiment == "POSITIF":
        key_words = ", ".join(found_pos[:3]) if found_pos else "respon positif"
        return f"Terdeteksi sentimen positif berbasis indikasi kepuasan ('{key_words}') dan emosi {emotion} pada klaster {topic_str}."
    elif sentiment == "NEGATIF":
        key_words = ", ".join(found_neg[:3]) if found_neg else "kendala operasional"
        return f"Terdeteksi sentimen negatif dengan keluhan ('{key_words}') yang menunjukkan emosi {emotion} terkait {topic_str}."
    else:
        return f"Komentar bersifat objektif dan informatif terkait {topic_str} tanpa polaritas emosi ekstrem."
