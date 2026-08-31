from typing import List, Dict, Any
from datetime import datetime
from google_play_scraper import reviews, Sort
from app.services.scrapers.base_scraper import BaseScraper

class PlayStoreScraper(BaseScraper):
    def fetch_comments(self, target_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        result, _ = reviews(
            target_id,
            lang='id',
            country='id',
            sort=Sort.NEWEST,
            count=limit
        )
        
        extracted = []
        for item in result:
            extracted.append({
                "platform": "PlayStore",
                "source_url": f"playstore://{target_id}",
                "author_name": item.get("userName", "anon"),
                "text_content": item.get("content", ""),
                "posted_at": item.get("at", datetime.now())
            })
            
        return extracted
