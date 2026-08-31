from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseScraper(ABC):
    
    @abstractmethod
    def fetch_comments(self, target_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Setiap scraper harus mengembalikan daftar dictionary dengan struktur:
        [
            {
                "platform": str,
                "source_url": str,
                "author_name": str,
                "text_content": str,
                "posted_at": datetime
            },
            ...
        ]
        """
        pass
