from dataclasses import dataclass
from typing import Optional, List

from sqlalchemy.orm import Session

from server.db import Character


@dataclass
class CharacterProfile:
    character_id: int
    user_id: str
    gender: str
    region: str
    job: str


class CharacterRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, character_id: int) -> Optional[CharacterProfile]:
        row = self.db.get(Character, character_id)
        if not row:
            return None
        return CharacterProfile(
            character_id=row.character_id,
            user_id=row.user_id,
            gender=row.gender,
            region=row.region,
            job=row.job,
        )

    def get_by_user_id(self, user_id: str) -> List[CharacterProfile]:
        rows = self.db.query(Character).filter(Character.user_id == user_id).all()
        return [
            CharacterProfile(
                character_id=row.character_id,
                user_id=row.user_id,
                gender=row.gender,
                region=row.region,
                job=row.job,
            )
            for row in rows
        ]

    def create(self, user_id: str, gender: str, region: str, job: str) -> CharacterProfile:
        row = Character(
            user_id=user_id,
            gender=gender,
            region=region,
            job=job,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)  # Refresh to get the generated character_id
        return CharacterProfile(
            character_id=row.character_id,
            user_id=row.user_id,
            gender=row.gender,
            region=row.region,
            job=row.job,
        )

    def update(self, character_id: int, gender: Optional[str] = None, 
               region: Optional[str] = None, job: Optional[str] = None) -> Optional[CharacterProfile]:
        row = self.db.get(Character, character_id)
        if not row:
            return None
        
        if gender is not None:
            row.gender = gender
        if region is not None:
            row.region = region
        if job is not None:
            row.job = job
        
        self.db.commit()
        self.db.refresh(row)
        return CharacterProfile(
            character_id=row.character_id,
            user_id=row.user_id,
            gender=row.gender,
            region=row.region,
            job=row.job,
        )

    def delete(self, character_id: int) -> bool:
        row = self.db.get(Character, character_id)
        if not row:
            return False
        self.db.delete(row)
        self.db.commit()
        return True

