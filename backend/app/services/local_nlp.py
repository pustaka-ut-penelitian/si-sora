import re
import csv
import os

LEXICON_DIR = os.path.join(os.path.dirname(__file__), "lexicon")

POSITIVE_LEXICON = {}
NEGATIVE_LEXICON = {}
SLANG_DICT = {}

NEGATION_WORDS = {
    "tidak", "tdk", "nggak", "ga", "gak", "g", "bukan", "kurang", "jangan", "belum"
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

load_lexicons()

def analyze_sentiment_local(text: str) -> str:
    text_clean = text.lower()
    raw_words = re.findall(r'\b[a-z0-9]+\b', text_clean)
    
    normalized_words = []
    for w in raw_words:
        normalized_words.append(SLANG_DICT.get(w, w))
        
    score = 0
    i = 0
    
    while i < len(normalized_words):
        word = normalized_words[i]
        
        is_negated = False
        if i > 0 and normalized_words[i-1] in NEGATION_WORDS:
            is_negated = True
        elif i > 1 and normalized_words[i-2] in NEGATION_WORDS:
            is_negated = True
            
        word_val = 0
        if word in POSITIVE_LEXICON:
            word_val = POSITIVE_LEXICON[word]
        elif word in NEGATIVE_LEXICON:
            word_val = NEGATIVE_LEXICON[word]
            
        if is_negated:
            word_val = -word_val
            
        score += word_val
        i += 1
        
    if score > 0:
        return "POSITIF"
    elif score < 0:
        return "NEGATIF"
    else:
        return "NETRAL"
