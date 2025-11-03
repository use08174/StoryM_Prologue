import os
import sys
import configparser
from sqlalchemy import create_engine

print("🚀 데이터베이스 초기화 스크립트 시작...")

# --- main.py의 경로 설정 로직을 가져옵니다 ---
# 이 스크립트를 'backend' 디렉토리에 저장했다고 가정합니다.
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

print(f"프로젝트 경로: {backend_dir}")

# --- main.py의 DB 설정 로직을 가져옵니다 ---
parser = configparser.ConfigParser()
config_path = os.path.join(backend_dir, "config.ini")
if not os.path.exists(config_path):
    print(f"🚨 '{config_path}'에서 config.ini 파일을 찾을 수 없습니다!")
    sys.exit(1)
parser.read(config_path)

db_url = parser.get("database", "url", fallback=f"sqlite:///{os.path.join(backend_dir, 'app.db')}")
print(f"데이터베이스 URL: {db_url}")

# --- [매우 중요] 모델과 Base를 import 합니다 ---
try:
    # 1. Base 객체를 import 합니다. (아마 server.db 또는 server.models.base에 있을 것입니다)
    #    경로를 실제 프로젝트에 맞게 수정하세요.
    from server.db import Base 
    
    # 2. 'User' 모델이 정의된 파일을 import 합니다.
    #    (이 import 문이 있어야 SQLAlchemy가 'Base'에 테이블을 등록합니다)
    #    경로를 실제 프로젝트에 맞게 수정하세요.
    import server.db  # 'users' 테이블 모델이 있는 파일

    # ❗ 만약 다른 모델(캐릭터 등)도 있다면 모두 import 해야 합니다.
    # import server.models.character 
    
except ImportError as e:
    print(f"🚨 모델 또는 Base import 실패: {e}")
    print("스크립트 상단의 'server.db' 또는 'server.models.user_simple' 경로를 확인하세요.")
    sys.exit(1)

# --- 테이블 생성 ---
try:
    engine = create_engine(db_url)
    print("엔진 생성 완료. 테이블 생성 시도...")
    
    # Base.metadata에 등록된 모든 테이블을 생성합니다.
    Base.metadata.create_all(engine)
    
    print("✅ 성공! 'users' 테이블을 포함한 모든 테이블이 생성되었습니다.")
    
except Exception as e:
    print(f"🚨 테이블 생성 중 오류 발생: {e}")