from typing import Optional
from pydantic import BaseModel


class DatabaseItem(BaseModel):
    id: str
    title: str
    url: str


class PageItem(BaseModel):
    id: str
    title: str
    url: str


class SyncRequest(BaseModel):
    database_id: Optional[str] = None  # overrides the session's stored database


class SyncResponse(BaseModel):
    notion_page_id: str
    notion_page_url: str
