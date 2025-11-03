from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session
import bcrypt

from server.db import User


@dataclass
class UserProfile:
    user_id: str
    email: str
    password: str  # Hashed password


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, user_id: str) -> Optional[UserProfile]:
        row = self.db.get(User, user_id)
        if not row:
            return None
        return UserProfile(
            user_id=row.user_id,
            email=row.email,
            password=row.password,
        )
    
    def get_by_email(self, email: str) -> Optional[UserProfile]:
        row = self.db.query(User).filter(User.email == email).first()
        if not row:
            return None
        return UserProfile(
            user_id=row.user_id,
            email=row.email,
            password=row.password,
        )

    def exists(self, user_id: str) -> bool:
        return self.db.get(User, user_id) is not None
    
    def exists_by_email(self, email: str) -> bool:
        return self.db.query(User).filter(User.email == email).first() is not None
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        """Verify a password against a hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

    def create(self, profile: UserProfile) -> UserProfile:
        row = User(
            user_id=profile.user_id,
            email=profile.email,
            password=profile.password,  # Should be already hashed
        )
        self.db.add(row)
        self.db.commit()
        return profile


