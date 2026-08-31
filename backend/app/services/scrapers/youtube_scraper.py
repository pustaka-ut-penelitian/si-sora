import itertools
from typing import List, Dict, Any
from datetime import datetime
from youtube_comment_downloader import YoutubeCommentDownloader
from app.services.scrapers.base_scraper import BaseScraper

class YouTubeScraper(BaseScraper):
    def fetch_comments(self, target_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        downloader = YoutubeCommentDownloader()
        generator = downloader.get_comments_from_url(target_id, sort_by=1)
        
        extracted = []
        for comment in itertools.islice(generator, limit):
            timestamp = comment.get("time_parsed", datetime.now().timestamp())
            posted_time = datetime.fromtimestamp(timestamp) if isinstance(timestamp, (int, float)) else datetime.now()
            
            extracted.append({
                "platform": "YouTube",
                "source_url": target_id,
                "author_name": comment.get("author", "anon"),
                "text_content": comment.get("text", ""),
                "posted_at": posted_time
            })
            
        return extracted
