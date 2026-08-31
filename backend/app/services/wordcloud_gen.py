import numpy as np
from wordcloud import WordCloud
import io
import base64
import os

def get_color_func(sentiment: str):
    def color_func(word, font_size, position, orientation, random_state=None, **kwargs):
        if sentiment == 'positif':
            return f"hsl({np.random.randint(95, 135)}, {np.random.randint(45, 75)}%, {np.random.randint(25, 48)}%)"
        elif sentiment == 'negatif':
            return f"hsl({np.random.randint(0, 15)}, {np.random.randint(65, 90)}%, {np.random.randint(35, 55)}%)"
        elif sentiment == 'netral':
            return f"hsl({np.random.randint(200, 225)}, {np.random.randint(25, 50)}%, {np.random.randint(30, 55)}%)"
        else:
            palette_choice = np.random.choice(["green", "red", "slate", "navy", "gold"], p=[0.25, 0.25, 0.2, 0.2, 0.1])
            if palette_choice == "green":
                return f"hsl({np.random.randint(95, 135)}, {np.random.randint(50, 75)}%, {np.random.randint(28, 45)}%)"
            elif palette_choice == "red":
                return f"hsl({np.random.randint(0, 15)}, {np.random.randint(65, 90)}%, {np.random.randint(35, 55)}%)"
            elif palette_choice == "slate":
                return f"hsl({np.random.randint(200, 225)}, {np.random.randint(25, 50)}%, {np.random.randint(30, 50)}%)"
            elif palette_choice == "navy":
                return f"hsl(210, {np.random.randint(75, 95)}%, {np.random.randint(20, 32)}%)"
            else:
                return f"hsl(45, {np.random.randint(85, 100)}%, {np.random.randint(40, 50)}%)"
    return color_func

def generate_wordcloud_base64(word_freqs: dict, sentiment: str, layout: str = "desktop") -> str:
    if not word_freqs:
        word_freqs = {"KOSONG": 10, "DATA": 8, "MENUNGGU": 5, "ANALISIS": 5}
        
    if len(word_freqs) < 40:
        base_freqs = list(word_freqs.items())
        for i in range(40 - len(word_freqs)):
            k, v = base_freqs[i % len(base_freqs)]
            word_freqs[f"{k}_{i}"] = v

    font_path = "C:\\Windows\\Fonts\\arialbd.ttf"
    if not os.path.exists(font_path):
        font_path = None
        
    w = 800 if layout == "mobile" else 1600
    h = 800 if layout == "mobile" else 600
    ph = 0.5 if layout == "mobile" else 0.8
        
    wc = WordCloud(
        background_color="rgba(255, 255, 255, 0)",
        mode="RGBA",
        max_words=200,
        color_func=get_color_func(sentiment),
        width=w,
        height=h,
        margin=20,
        prefer_horizontal=ph,
        random_state=42,
        font_path=font_path,
        min_font_size=12,
        max_font_size=100,
        relative_scaling=0.5
    )
    
    clean_freqs = {}
    for k, v in word_freqs.items():
        base_word = k.rsplit('_', 1)[0] if '_' in k and k.rsplit('_', 1)[1].isdigit() else k
        formatted_word = base_word.replace('_', ' ').strip().title()
        clean_freqs[formatted_word] = clean_freqs.get(formatted_word, 0) + v
    
    wc.generate_from_frequencies(clean_freqs)
    
    img = wc.to_image()
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_str}"
