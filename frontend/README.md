# Stayfinder Frontend

React 기반 Stayfinder 화면 서비스입니다.

## Local Dev

```bash
npm install
npm run dev
```

기본 주소는 `http://localhost:5173`입니다. Vite proxy는 다음 백엔드 포트로 라우팅합니다.

- API: `http://localhost:8081`
- Corp: `http://localhost:8082`
- Batch: `http://localhost:8083`

## Build

```bash
npm run build
```

## Docker

프로젝트 루트에서 실행합니다.

```bash
docker build -f Dockerfile_front -t stayfinder-front:latest .
```
