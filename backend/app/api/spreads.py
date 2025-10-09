"""牌陣模板 API - 目前為唯讀模式"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.reading_enhanced import SpreadTemplate

router = APIRouter(prefix="/spread-templates", tags=["spreads"]) 

@router.get("/", response_model=List[Dict[str, Any]])
async def list_spread_templates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SpreadTemplate).where(SpreadTemplate.is_active == True))
    templates = result.scalars().all()
    return [t.to_dict() for t in templates]

@router.get("/{template_id}", response_model=Dict[str, Any])
async def get_spread_template(template_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SpreadTemplate).where(SpreadTemplate.id == template_id))
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="找不到牌陣模板")
    return template.to_dict()
