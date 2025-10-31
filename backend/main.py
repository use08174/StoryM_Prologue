"""
간단한 실행 진입점
backend 디렉토리에서 python main.py로 서버를 실행할 수 있습니다.

필요한 패키지 설치:
    pip install -r requirements.txt
"""
import os
import sys

# 현재 파일의 디렉토리(backend)를 Python 경로에 추가
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# 필요한 패키지 체크 (선택적)
def check_dependencies():
    """필요한 패키지가 설치되었는지 체크"""
    missing = []
    required = [
        "fastapi",
        "fastapi_sso",
        "uvicorn",
        "openai",
        "redis",
        "fakeredis",
        "httpx",
    ]
    for pkg in required:
        try:
            __import__(pkg.replace("-", "_"))
        except ImportError:
            missing.append(pkg)
    
    if missing:
        print("\n⚠️  다음 패키지들이 설치되지 않았습니다:")
        for pkg in missing:
            print(f"   - {pkg}")
        print("\n다음 명령어로 설치하세요:")
        print("   pip install -r requirements.txt")
        return False
    return True

if __name__ == "__main__":
    import uvicorn
    
    # 의존성 체크 (경고만 표시, 실행은 계속)
    if not check_dependencies():
        print("\n경고: 일부 패키지가 누락되었지만 실행을 시도합니다...\n")
    
    uvicorn.run(
        "server.main:app",
        host="127.0.0.1",  # 개발용: localhost로 설정 (브라우저에서 접속 가능)
        port=8000,
        reload=True,
    )
    print("\n서버가 시작되었습니다!")
    print("브라우저에서 다음 주소로 접속하세요:")
    print("  - http://localhost:8000/docs (API 문서)")
    print("  - http://localhost:8000 (기본)")

