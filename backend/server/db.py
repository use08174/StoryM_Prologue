from typing import Generator

from sqlalchemy import create_engine, ForeignKey
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[str] = mapped_column(primary_key=True)
    email: Mapped[str]
    password: Mapped[str]  # Hashed password
    
    # Relationship to characters
    characters: Mapped[list["Character"]] = relationship("Character", back_populates="user", cascade="all, delete-orphan")


class Character(Base):
    __tablename__ = "characters"

    character_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.user_id"), nullable=False)
    gender: Mapped[str]
    region: Mapped[str]
    job: Mapped[str]
    
    # Relationship to user
    user: Mapped["User"] = relationship("User", back_populates="characters")


def create_session_maker(database_url: str) -> sessionmaker:
    engine = create_engine(database_url, future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


