import configparser
import logging
import os
import pickle
import sys
from contextlib import asynccontextmanager
from typing import List

# backend 디렉토리를 Python 경로에 추가
# 이 작업은 모듈 import 전에 수행해야 합니다
current_file_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_file_dir)

# 디버깅: 경로 확인
if __name__ == "__main__":
    print(f"Debug: current_file_dir = {current_file_dir}")
    print(f"Debug: backend_dir = {backend_dir}")
    print(f"Debug: backend_dir exists = {os.path.exists(backend_dir)}")
    print(f"Debug: llm dir exists = {os.path.exists(os.path.join(backend_dir, 'llm'))}")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
    if __name__ == "__main__":
        print(f"Debug: Added {backend_dir} to sys.path")
elif __name__ == "__main__":
    print(f"Debug: {backend_dir} already in sys.path")

from aiohttp import ClientSession  # noqa: E402
from fastapi import FastAPI, Request  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi_limiter import FastAPILimiter  # type: ignore  # noqa: E402
from redis.asyncio import Redis  # noqa: E402

from llm.openai import OpenAIInterface  # noqa: E402
from server.context import SessionsType  # noqa: E402
from server.router import (  # noqa: E402
    llm_handlers,
    youth_policy_handlers,
    auth_simple_handlers,
)
from server.util.sso import generate_github_sso, generate_google_sso  # noqa: E402
from server.db import create_session_maker  # noqa: E402

# TODO: Add this to a config file


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Use FakeRedis for development if real Redis is not available
    is_fake_redis = False
    try:
        redis_client: Redis[bytes] = Redis(
            host="localhost",
            port=6379,
        )
        # Test connection
        await redis_client.ping()
    except Exception:
        # Fallback to FakeRedis
        from fakeredis import aioredis
        redis_client = aioredis.FakeRedis()
        is_fake_redis = True
        print("Warning: Using FakeRedis. FastAPILimiter will be disabled.")
    
    sessions: SessionsType = {}
    parser = configparser.ConfigParser()
    # config.ini 경로를 안정적으로 찾기
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(current_dir)
    config_path = os.path.join(backend_dir, "config.ini")
    parser.read(config_path)

    use_local_llm = parser.getboolean("llm", "use_local_llm", fallback=False)
    api_base = "http://localhost:8080/v1" if use_local_llm else None

    key = parser.get("llm", "openai_api_key", fallback="")
    # 환경 변수에서도 확인
    if not key or key == "your_openai_api_key_here" or key == "Dummy key":
        key = os.getenv("OPENAI_API_KEY", "")
    
    if not key:
        print("Warning: OPENAI_API_KEY is not set. LLM features will not work.")
        print("Please set openai_api_key in config.ini or set OPENAI_API_KEY environment variable.")
        # 더미 LLM 객체를 만들 수 없다면 None으로 설정하고 나중에 처리
        llm = None
        openai_http_client = None
    else:
        chat_model = parser.get("llm", "chat_model", fallback="gpt-4o")
        embedding_size = parser.getint("llm", "embedding_size", fallback=1536)

        try:
            openai_http_client = ClientSession()
            llm = OpenAIInterface(
                api_key=key,
                model=chat_model,
                api_base=api_base,
                embedding_size=embedding_size,
                client_session=openai_http_client,
            )
        except Exception as e:
            print(f"Error initializing OpenAIInterface: {e}")
            print("LLM features will be disabled.")
            llm = None
            openai_http_client = None

    google_sso = generate_google_sso(parser=parser)
    github_sso = generate_github_sso(parser=parser)

    # FastAPILimiter는 실제 Redis가 필요함 (FakeRedis는 script 명령을 지원하지 않음)
    if not is_fake_redis:
        try:
            await FastAPILimiter.init(redis_client)  # type: ignore
        except Exception as e:
            print(f"Warning: FastAPILimiter initialization failed: {e}")
            print("Rate limiting will be disabled.")
    else:
        print("Note: FastAPILimiter is disabled because FakeRedis is being used.")

    dev_mode = parser.getboolean("server", "dev_mode", fallback=False)
    if dev_mode:
        # getLogger returns the same singleton everywhere, so usages in
        # controllers should log to this stdout stream handler as well
        logger = logging.getLogger()
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        logger.addHandler(handler)

        resp = await redis_client.get("sessions")
        if resp:
            sessions = pickle.loads(resp)

    yield {
        "redis_client": redis_client,
        "sessions": sessions,
        "parser": parser,
        "llm": llm,
        "google_sso": google_sso,
        "github_sso": github_sso,
        "db_sessionmaker": create_session_maker(
            parser.get("database", "url", fallback=f"sqlite:///{os.path.join(backend_dir, 'app.db')}" )
        ),
    }

    if dev_mode:
        await redis_client.set("sessions", pickle.dumps(sessions))

    await redis_client.close()
    if openai_http_client:
        await openai_http_client.close()


def get_redis(request: Request):
    return request.state.redis_client


app = FastAPI(
    title="eastworld",
    version="0.0.1",
    description="generative game agents",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(llm_handlers.router)
app.include_router(youth_policy_handlers.router)
app.include_router(auth_simple_handlers.router)


if __name__ == "__main__":
    import uvicorn
    
    # config.ini 경로를 찾기 위해 현재 파일의 위치 기준으로 상위 디렉토리로 이동
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(current_dir)
    config_path = os.path.join(backend_dir, "config.ini")
    
    # config.ini 파일이 있는지 확인
    if not os.path.exists(config_path):
        print(f"Warning: config.ini not found at {config_path}")
        print("Please make sure config.ini exists in the backend directory.")
    
    # 개발 모드로 실행 (--reload 활성화)
    # 포트는 8000, 호스트는 127.0.0.1로 설정 (브라우저에서 접속 가능)
    print("\n" + "="*60)
    print("🚀 FastAPI 서버 시작 중...")
    print("="*60)
    print("\n브라우저에서 다음 주소로 접속하세요:")
    print("  📖 API 문서: http://localhost:8000/docs")
    print("  🌐 기본 페이지: http://localhost:8000")
    print("  📊 대체 문서: http://localhost:8000/redoc")
    print("\n" + "="*60 + "\n")
    uvicorn.run(
        "server.main:app",
        host="127.0.0.1",  # 개발용: localhost로 설정
        port=8000,
        reload=True,
        reload_dirs=[backend_dir] if os.path.exists(config_path) else None,
    )