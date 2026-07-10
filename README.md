# AI Speaking PT · 영어 스피킹 자동채점 플랫폼

IELTS · TOEFL · TOEIC · OPIc 스피킹 시험을 **AI가 출제 → 실전과 동일한 시간으로 응시 →
발음·유창성·어휘·문법·논리성 5개 영역 자동 채점 → 만점 첨삭·모범답안 → 대시보드 피드백**까지
자동화하는 웹 서비스입니다. (비지리츠 Speaking PT 사업계획서 M1~M5 파이프라인 구현)

## 특징
- **4종 시험**: 각 시험의 실제 파트 구성·준비/발화 제한시간을 그대로 재현
- **AI 채점**: OpenAI Whisper(STT) + Claude(채점·첨삭·모범답안·피드백)
- **성장 대시보드**: 점수 추이·영역별 분석·학습 이력 (Supabase)
- **결제**: 포트원(PortOne) 국내 카드·간편결제 (이용권/구독)
- **데모 모드**: API 키가 없어도 전체 기능이 즉시 동작 (키 연결 시 실제 서비스로 자동 전환)

## 빠른 시작 (로컬)
```bash
npm install
npm run dev      # http://localhost:3000
```
키를 하나도 넣지 않아도 **데모 모드**로 로그인·응시·채점·결제까지 모두 체험할 수 있습니다.

## 실제 서비스 연결
`.env.example`를 `.env.local`로 복사하고 키를 채우면 각 기능이 자동 전환됩니다.

| 기능 | 환경변수 | 발급처 |
|---|---|---|
| 계정·DB·저장 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | supabase.com |
| 음성→텍스트(STT) | `OPENAI_API_KEY` | platform.openai.com |
| AI 채점·첨삭 | `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` | console.anthropic.com |
| 결제 | `NEXT_PUBLIC_PORTONE_STORE_ID`, `NEXT_PUBLIC_PORTONE_CHANNEL_KEY`, `PORTONE_API_SECRET` | portone.io |

### Supabase 설정
1. 프로젝트 생성 → `supabase/schema.sql`을 SQL Editor에서 실행 (테이블·RLS·가입 트리거 생성)
2. Authentication → Email 로그인 활성화 (원하면 Google OAuth 추가)
3. Storage에 `answers` 버킷 생성(음성 저장, 선택)

## 배포 (Vercel)
1. 이 저장소를 GitHub에 push → Vercel에서 Import
2. 위 환경변수를 Vercel Project Settings에 등록
3. PortOne 콘솔의 웹훅 URL을 `https://<도메인>/api/webhooks/portone`로 설정
4. Deploy

## 기술 스택
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Recharts · Supabase ·
OpenAI Whisper · Anthropic Claude · PortOne

## 구조
```
src/
  app/              # 라우트 (랜딩, 로그인, 대시보드, 응시, 결과, 리포트, 이력, 요금제, 설정, API)
  components/       # UI (사이드바, 응시 세션, 차트, 점수 카드 등)
  lib/
    exams.ts        # 4종 시험 정의·제한시간·점수 환산
    questions.ts    # 문항 은행·세션 생성
    grader.ts       # Claude/데모 채점 엔진
    metrics.ts      # 발화 객관 지표 (WPM·필러워드·멈춤)
    store.ts        # 데이터 저장 (Supabase/데모)
    payments.ts     # 결제 주문·혜택
supabase/schema.sql # DB 스키마
```

© 2026 (주)비지리츠 · AI Speaking PT
