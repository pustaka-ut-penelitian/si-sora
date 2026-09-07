import os
from typing import List, Dict, Any
from datetime import datetime
from apify_client import ApifyClient
from app.services.scrapers.base_scraper import BaseScraper

class ApifyScraper(BaseScraper):
    def fetch_comments(self, target_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        token = os.getenv("APIFY_API_TOKEN")
        if not token:
            raise ValueError("APIFY_API_TOKEN belum di-set di .env")
            
        client = ApifyClient(token)
        
        run_input = {
            "directUrls": [target_id],
            "resultsLimit": limit
        }
        
        run = client.actor("apify/instagram-comment-scraper").call(run_input=run_input)
        
        extracted = []
        dataset_id = getattr(run, 'default_dataset_id', getattr(run, 'defaultDatasetId', None))
        if not dataset_id and hasattr(run, 'model_dump'):
             dataset_id = run.model_dump().get("defaultDatasetId", run.model_dump().get("default_dataset_id"))
        elif not dataset_id and hasattr(run, 'dict'):
             dataset_id = run.dict().get("defaultDatasetId", run.dict().get("default_dataset_id"))
             
        for item in client.dataset(dataset_id).iterate_items():
            posted_str = item.get("timestamp")
            posted_time = datetime.fromisoformat(posted_str.replace('Z', '+00:00')) if posted_str else datetime.now()
            
            extracted.append({
                "platform": "Instagram",
                "source_url": target_id,
                "author_name": item.get("ownerUsername", "anon"),
                "text_content": item.get("text", ""),
                "posted_at": posted_time
            })
            
        return extracted
