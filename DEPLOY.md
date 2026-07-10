# 배포 가이드 (Vercel)

앱은 이미 **git 커밋**까지 완료되어 있고, 로컬에서 전 기능이 검증되었습니다.
아래 중 한 방법으로 라이브 URL을 만들 수 있습니다.

## 방법 A. GitHub → Vercel (권장, 가장 안정적)

1) GitHub에 빈 저장소를 하나 만든 뒤, 이 폴더에서:
```bash
git remote add origin https://github.com/<계정>/<저장소>.git
git branch -M main
git push -u origin main
```
2) https://vercel.com → **Add New → Project → Import** 에서 방금 만든 저장소 선택
3) Framework는 **Next.js** 자동 감지 → **Deploy**
4) 배포 후 **Settings → Environment Variables**에 아래 키 등록 (없으면 데모 모드로 동작)
5) 재배포(Redeploy)

## 방법 B. Vercel CLI

```bash
npm i -g vercel
vercel            # 프리뷰 배포
vercel --prod     # 프로덕션 배포
```

## 환경변수 (Vercel Project Settings)

| 키 | 용도 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | 계정·DB |
| `OPENAI_API_KEY` | Whisper 음성 전사 |
| `ANTHROPIC_API_KEY` / `CLAUDE_MODEL` | Claude 채점 |
| `NEXT_PUBLIC_PORTONE_STORE_ID` / `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` / `PORTONE_API_SECRET` | 결제 |

## 배포 후 설정
- **Supabase**: `supabase/schema.sql` 실행 → 이메일 로그인 활성화
- **PortOne**: 콘솔에서 웹훅 URL을 `https://<도메인>/api/webhooks/portone` 로 등록
- 결제는 먼저 **테스트(샌드박스) 채널**로 검증 후 실채널로 전환 권장

## 참고
- 키를 하나도 넣지 않아도 **데모 모드**로 전체 기능(응시·채점·결제 UI)이 동작하므로,
  먼저 배포해 URL을 확보한 뒤 키를 순차적으로 연결하는 것을 권장합니다.
