from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from server.db import User


@dataclass
class UserProfile:
    user_id: str
    gender: str
    region: str
    job: str


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: str) -> Optional[UserProfile]:
        row = self.db.get(User, user_id)
        if not row:
            return None
        return UserProfile(
            user_id=row.user_id,
            gender=row.gender,
            region=row.region,
            job=row.job,
        )

    def exists(self, user_id: str) -> bool:
        return self.db.get(User, user_id) is not None

    def create(self, profile: UserProfile) -> UserProfile:
        row = User(
            user_id=profile.user_id,
            gender=profile.gender,
            region=profile.region,
            job=profile.job,
        )
        self.db.add(row)
        self.db.commit()
        return profile


