# StayFinder

실제 서비스 공개를 목표로 개발 중인 숙소 예약 프로젝트입니다. 날짜별 객실 재고 생성과 배정, 숙소 검색, 예약 요청이 처리되는 흐름을 구현했습니다.

## 주요 흐름

1. **재고 생성** — 배치에서 날짜별 객실 재고와 가용 수량을 생성합니다. 스케줄 실행과 생성할 일수를 지정하는 수동 실행을 지원합니다.
2. **숙소 검색** — 지역, 투숙 기간, 인원 조건으로 숙소를 조회합니다.
3. **예약 및 재고 배정** — 사용자와 투숙 기간을 확인하고 예약을 `PENDING` 상태로 저장합니다. 날짜별 객실 재고를 배정하고 예약·결제 요청 이력을 기록합니다. 연박 예약에서는 전체 기간에 같은 객실 유닛을 우선 탐색합니다.

예약 생성에서 이어지는 결제 처리는 현재 결제 요청 이력과 시도 횟수를 기록하는 단계입니다.

## 모듈 구조

| 모듈 | 역할 |
| --- | --- |
| `api` | 사용자, 로그인·인증, 약관, 결제 요청 이력과 콜백 |
| `corp` | 업체·객실 관리, 숙소 검색, 재고 배정과 예약 |
| `batch` | Quartz 기반 객실 재고 생성과 배치 실행 설정 |
| `frontend` | React·TypeScript·Vite 기반 화면 |

**백엔드** · Java 17, Spring Boot 3.4.1, Gradle Wrapper 8.11.1, Spring Data JPA, Querydsl  
**저장소 및 스케줄링** · MySQL 8, Redis 7, Redisson, Quartz  
**테스트** · JUnit 5, Mockito

## 단위 테스트 실행

JDK 17에서 실행합니다. 이 테스트는 Mockito로 의존성을 대체하므로 MySQL이나 Redis를 띄울 필요가 없습니다.

```bash
./gradlew :corp:test :batch:test
```

Windows PowerShell에서는 아래 명령을 사용합니다.

```powershell
.\gradlew.bat :corp:test :batch:test
```

`corp` 테스트는 객실 재고 생성·배정과 예약 생성을, `batch` 테스트는 재고 생성 조건과 배치 실행 설정을 검증합니다.

## 전체 서비스 구동 환경

백엔드를 실행하려면 MySQL·Redis 접속 정보와 JWT 서명, AES, 문자 인증 연동 설정을 로컬의 `src/main/resources/application.properties`에 준비해야 합니다. [Docker Compose 설정](docker-compose.msa.yml)에서 서비스 구성과 포트를 볼 수 있습니다.

| 서비스 | 포트 |
| --- | --- |
| API | `8081` |
| 숙소·예약 | `8082` |
| 배치 | `8083` |
| 프런트엔드 개발 서버 | `5173` |

백엔드가 실행 중인 상태에서 Node.js 22로 프런트엔드 개발 서버를 시작할 수 있습니다.

```bash
cd frontend
npm ci
npm run dev
```
