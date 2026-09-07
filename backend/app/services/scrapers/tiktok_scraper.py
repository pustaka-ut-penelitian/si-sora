import os
from typing import List, Dict, Any
from datetime import datetime
from apify_client import ApifyClient
from app.services.scrapers.base_scraper import BaseScraper

class TikTokScraper(BaseScraper):
    def fetch_comments(self, target_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        token = os.getenv("APIFY_API_TOKEN")
        if not token:
            raise ValueError("APIFY_API_TOKEN belum di-set di .env")
            
        client = ApifyClient(token)
        
        run_input = {
            "postURLs": [target_id],
            "commentsPerPost": limit,
            "maxRepliesPerComment": 0
        }
        
        run = client.actor("clockworks/tiktok-comments-scraper").call(run_input=run_input)
        
        extracted = []
        dataset_id = getattr(run, 'default_dataset_id', getattr(run, 'defaultDatasetId', None))
        if not dataset_id and hasattr(run, 'model_dump'):
             dataset_id = run.model_dump().get("defaultDatasetId", run.model_dump().get("default_dataset_id"))
        elif not dataset_id and hasattr(run, 'dict'):
             dataset_id = run.dict().get("defaultDatasetId", run.dict().get("default_dataset_id"))
             
        for item in client.dataset(dataset_id).iterate_items():
            posted_time = datetime.now()
            if "createTime" in item:
                try:
                    posted_time = datetime.fromtimestamp(item["createTime"])
                except Exception:
                    pass
            elif "create_time" in item:
                try:
                    posted_time = datetime.fromtimestamp(item["create_time"])
                except Exception:
                    pass

            text_content = item.get("text", "")
            if not text_content and "comment" in item:
                text_content = item.get("comment", "")

            author_name = "anon"
            if "authorMeta" in item and "name" in item["authorMeta"]:
                author_name = item["authorMeta"]["name"]
            elif "uniqueId" in item:
                author_name = item["uniqueId"]
                
            if not text_content:
                continue

            extracted.append({
                "platform": "TikTok",
                "source_url": target_id,
                "author_name": author_name,
                "text_content": text_content,
                "posted_at": posted_time
            })
            
        return extracted
