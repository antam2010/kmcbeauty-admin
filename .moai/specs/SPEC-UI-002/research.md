# SPEC-UI-002 조사 보고서

| 항목 | 내용 |
|---|---|
| SPEC | SPEC-UI-002 — 업무 화면·API·인증·라우팅 재구축과 배포 가드 제거 |
| 단계 | Phase 8(SPEC 계획) 조사 산출물. 짝 문서: `plan.md`(결정 지점 1에서 승인, 0.2.0에서 사전 검토 반영) |
| 작성 | manager-spec · 2026-11-09. 처음 영어로 정리한 조사 종합본(4개 관점, 647행)을 한국어로 다시 쓰고 인터뷰 결정(`interview.md` 1~2회차)을 반영했다. 3회차 뒤 §2.9(배포 서버 확인)를 더했고, 0.2.0(2026-11-09)에서 4회차 결정 15와 사전 검토 85건의 결과를 §5·§6·§9에 반영했다 |
| 기준 트리 | 관리자 저장소 `main` HEAD `b84b92b`(origin과 동기화). 백엔드 `kmcbeauty-fastapi` 주 체크아웃 `eb8b06d`(작업 트리 변경 없음). 예전 앱은 관리자 저장소 커밋 `28c87a9`. 네이티브 앱 `kmcbeauty-native`. 외부 문서와 npm 레지스트리는 2026-11-09에 확인 |
| 관점별 원본 | `.moai/state/verify/cd2cba80-827f-4657-b7ea-6a07e9f25df2/research/lens-*.md`(예전 앱 선례, 백엔드 API 계약, 현재 코드와 이전 SPEC, 외부 문서) |
| 우선순위 | 조사 결과와 `interview.md`(1~4회차, 결정 1~15)가 다르면 인터뷰가 우선한다 |

> **표기** — [검증]: 파일이나 명령 출력으로 직접 확인했다. [전달]: 오케스트레이터 또는 조사원 원본이 확인해 넘겨준 사실이다. **(추론)**: 확인하지 않은 판단이다. 미검증 항목은 9절에 모았다. 파일 인용은 `파일:행` 형식이며, 예전 앱 파일은 커밋 `28c87a9` 기준 경로다.

---

## 0. 요약

1. 사용자가 고른 8개 화면 가운데 **시술 이력은 예전 앱에 없던 화면**이고, 예전 대시보드(`/manager`)는 액세스 토큰을 화면에 찍는 빈 페이지였다. 실제 예약 캘린더는 `/manager/treatments`였다. 인터뷰 2회차에서 이 사실을 바로잡았고, 로그인 뒤 첫 화면을 예약 캘린더로 정했다.
2. 예전 앱은 보기 위주였다. 캘린더의 수정·삭제는 알림창만 띄웠고 시술 메뉴의 추가·수정 창은 콘솔 출력만 했다. 사용자는 **백엔드가 지원하는 기능을 모두** 실제로 동작하게 만들기로 했다(결정 5).
3. 백엔드는 **선택 매장을 서버 Redis에 사용자 단위로 저장**한다. 헤더·경로·토큰으로 매장을 보내지 않는다. 같은 계정으로 네이티브 앱에서 매장을 바꾸면 관리자 웹의 선택 매장도 바뀐다 **(추론, 키 구조에서 도출)**.
4. 백엔드는 이미 HttpOnly·Secure·SameSite=None 리프레시 쿠키를 주고, 갱신은 헤더가 없으면 쿠키를 읽는다. **메모리 액세스 토큰 + HttpOnly 쿠키 갱신(결정 10)은 백엔드 변경 없이 된다.** 단, 사용자당 리프레시 토큰이 하나뿐이라 관리자 웹 로그인이 같은 계정의 네이티브 앱 세션을 밀어낸다.
5. 로컬 백엔드에서 OpenAPI 문서를 파일 쓰기·네트워크 없이 만들 수 있다 [검증]: OpenAPI **3.1.0, 경로 31개, API 50개, 스키마 58개**. 운영 API는 문서 경로를 닫아 두었다(404).
6. 백엔드 응답의 일시는 UTC 오프셋이 붙어 나오고, 요청에 오프셋 없는 일시를 보내면 UTC 벽시계 값으로 저장된다 [검증]. 관리자 웹은 **항상 오프셋이 있는 ISO 문자열**을 보내야 한다.
7. 최신 안정판은 react-router 8.5.1, FullCalendar 7.1.4, MSW 3.0.4, TanStack Query 5.107.1이다 [검증]. react-router 8은 Node 22.22.0 이상을 요구해 engines를 올려야 한다. FullCalendar 7은 CSS를 런타임에 넣지 않는 대신 테마 변수 이름이 v6과 다르다.
8. CSP는 인라인 테마 스크립트 하나만 해시로 허용하면 되지만, Radix Dialog 아래의 `react-style-singleton`이 런타임에 `<style>`을 만든다. 스타일 정책은 실제 브라우저 확인 전까지 보수적으로 둬야 한다.
9. 운영 CORS 허용 목록에 새 관리자 주소가 없다. 백엔드 저장소의 별도 작업이 끝나야 운영 로그인이 된다(결정 9, 이 SPEC 범위 밖).

---

## 1. 화면 범위 — 예전 앱의 실제 모습

### 1.1 예전 경로 구성(`28c87a9`)

| 경로 | 컴포넌트 | 보호 | 근거 |
|---|---|---|---|
| `/` | 공개 "메인 페이지"(로그인·약관·개인정보 링크) | 아니오 | App.tsx:15-43 |
| `/login`(중복) | LoginPage | 아니오 | App.tsx:45 |
| `/privacy-policy` | PrivacyPolicyPage | 아니오 | App.tsx:46 |
| `/terms-of-service` | TermsOfServicePage | 아니오 | App.tsx:48 |
| `/manager/shops/selected` | 매장 선택 | **아니오** | App.tsx:50 |
| `/manager/login` | LoginPage | 아니오 | routes.tsx:14 |
| `/manager` | DashboardPage(**빈 페이지**) | 예 | routes.tsx:16-23 |
| `/manager/customers` | CustomerList | 예 | routes.tsx:26 |
| `/manager/treatment-menus` | TreatmentMenuListPage | 예 | routes.tsx:36 |
| `/manager/treatments` | treatmentListPage.tsx "시술 예약 캘린더"(**실제 캘린더**) | 예 | routes.tsx:46 |
| 404 | **없음**(빈 주석만 있다) | — | App.tsx:52 |

- **경로 구조** [전달]: `/manager/*`는 ManagerRoutes에 넘긴다(App.tsx:13). 보호 경로마다 `<RequireAuth><ManagerLayout>`으로 페이지를 하나씩 감싼다. 레이아웃 경로와 `<Outlet>`이 없다.
- **RequireAuth** [전달](RequireAuth.tsx:15-22, :30-40): 메모리에 토큰이 없으면 `refreshToken()`을 부른다. 성공하면 새 액세스 토큰을 저장하고, 실패하면 토큰을 지운 뒤 `/manager/login`으로 보낸다. 확인하는 동안 "인증 상태를 확인 중입니다..." 전체 화면 로더를 띄운다. 매장 선택이나 권한은 보지 않는다.
- **사용자의 8개 화면 목록과 예전 코드가 다르다.** 예전 DashboardPage는 캘린더가 아니고 시술 이력 화면은 없다(6절 모순 1·2). 인터뷰 2회차 "바로잡은 사실"이 이를 확정했다.

### 1.2 화면별 동작(예전 선례)

**로그인**(`/manager/login`, `/login`)
- 가운데 카드 "매니저 로그인", 이메일(`type=email`, 필수)과 비밀번호(필수). 검증은 HTML `required`뿐이다.
- 성공하면 setToken 뒤 `/manager`로 간다. 매장은 여기서 확인하지 않는다. 실패하면 고정 문구 "로그인에 실패했습니다."를 보여 준다. 로딩·비활성 상태가 없다.
- **이메일과 비밀번호 기본값이 코드에 들어 있다**(LoginPage.tsx:7-8). 옮기지 않는다. 저장소가 공개되어 있어 사용자에게 비밀번호 변경을 알렸다(인터뷰 "알린 위험", 이 SPEC 범위 밖).
- API는 `auth.login`이며 form-urlencoded `username`, `password`, `grant_type=password`를 보낸다(auth.ts:10-19).

**매장 선택**(`/manager/shops/selected`, 보호 없음)
- `ShopSelectList`가 `useEffect`에서 `GET /shops?page=1&size=100`을 부른다(shop.ts:5; ShopSelectList.tsx:14-15).
- 매장마다 이름, 주소 + 상세 주소, 등록일(로컬 날짜)을 버튼으로 보여 준다. 누르면 `POST /shops/selected` 뒤 `/manager`로 간다.
- **선택한 매장을 `useShopStore`에 쓰지 않는다.** 나중에 Sidebar가 다시 가져온다.
- 로딩은 "로딩 중...", 오류는 console.error뿐, 빈 상태 없음.

**대시보드**(`/manager`)
- 고정 제목과 **화면에 그대로 찍힌 액세스 토큰**(DashboardPage.tsx:6-10). API 호출 없음. 다시 만들지 않는다(인터뷰 기본값).

**예약 캘린더**(`/manager/treatments`, 파일 treatmentListPage.tsx)
- FullCalendar ^6.1.17 + dayGrid·timeGrid·interaction 플러그인. `initialView="timeGridWeek"`, `height="auto"`. `locale="ko"`는 문자열만 줬고 ko 로케일 모듈은 가져오지 않았다. 툴바는 `prev,next today | title | dayGridMonth,timeGridWeek,timeGridDay`.
- 데이터: `datesSet`에서 `GET /treatments?start_date&end_date&page=1&size=100` — 범위당 최대 100건만 보인다.
- 이벤트: `id` String(item.id), `title` phonebook.name 또는 "이름 없음", `start` reserved_at, `end` finished_at, `extendedProps` memo·customerName·phoneNumber·durationTotalMin.
- **캘린더 어디에도 상태를 쓰지 않는다.** `editable`(끌어 놓기), select/dateClick, slotMin/MaxTime, businessHours, eventContent 설정이 없다.
- `eventClick`이 직접 만든 오버레이를 연다. **수정은 `alert()`, 삭제는 `confirm()` + `alert()`뿐이고 API를 부르지 않는다.** `createTreatment`는 정의만 있고 호출하지 않는다(treatmentListPage.tsx:23-135; treatment.ts:6-36).

**고객**(`/manager/customers`)
- 열: 이름, 연락처, 그룹(없으면 "-"), 메모("-"), 등록일(로컬 날짜), 동작(수정·삭제).
- 검색: 서버 `search` 매개변수, 안내 문구 "이름, 연락처, 메모 등으로 검색", `useDebounce` 기본값 150ms. 새 검색은 1쪽으로 돌아간다.
- 정렬: TanStack Table `getSortedRowModel`로 현재 쪽만 클라이언트에서 정렬. 쪽 나누기: 서버, 10건, 번호 5개 창 + 이전/다음.
- 삭제: `showConfirm` → `DELETE /phonebooks/{id}` → 토스트 → 다시 불러오기.
- CSV 내보내기: 현재 쪽만, UTF-8 BOM, **값 이스케이프 없음**, `file-saver`의 `saveAs(…, "고객리스트_YYYY-MM-DD.csv")`. file-saver를 쓰는 곳은 여기 하나다(CustomerList.tsx:46-62).
- 목록의 로딩·빈·오류 상태가 없다.

**CustomerFormModal**(headlessui)
- 필드: 이름, 전화번호(형식 검사 없음), 그룹(GroupCombobox, 자유 입력이라 새 그룹 가능), 메모. 이름·전화번호 필수를 토스트로 알린다.
- `POST /phonebooks` 또는 `PUT /phonebooks/{id}`로 저장한다. 그룹은 zustand `usePhonebookGroupStore`에 캐시하고 `GET /phonebooks/groups?with_items=false`로 불러온다.

**시술 메뉴**(`/manager/treatment-menus`)
- 메뉴 표: 메뉴 이름, 등록일, 동작. 쪽 크기 3, 쪽 번호를 모두 보여 준다.
- 메뉴마다 세부 항목 카드: 이름, 소요 시간("N분"), 가격(`toLocaleString` + "원"), 등록일, 동작.
- **두 대화상자 모두 `console.log`만 하는 TODO 껍데기다**(TreatmentMenuFormModal.tsx:24-30; TreatmentDetailFormModal.tsx:30-36). 메뉴·세부 항목의 추가·수정·삭제 API 호출이 없다(treatment_menu.ts:5-12, 목록만).

**이용약관·개인정보처리방침**
- 레이아웃·탐색 없이 고정 카드 하나씩. 약관 3문단(19행, 876바이트), 개인정보 2문단(18행, 964바이트). 개인정보 문서는 "쿠키는 리프레시 토큰에만 쓴다"고 적는다. 이 문장은 결정 10의 방식과 여전히 맞다.

**고아 코드**(가져오거나 부르는 곳이 없다): ReservationModal, ReservationForm, `shared/components/Modal.tsx`, `LoadingSpinner.tsx`.

**선례가 없는 기능**(처음부터 설계한다): 예약 등록·수정·취소, 상태 변경, 메뉴·세부 항목 추가·수정·삭제, 전화번호 검증, 목록의 로딩·빈·오류 상태, 시술 이력 목록.

### 1.3 예전 상태·HTTP·쿼리 계층

- **저장소** [전달]: zustand 저장소는 모두 메모리에만 있다. `persist`와 저장 키가 없다. `useAuthStore`(파일 useTokenStore.ts:9-13)는 `token`, `useShopStore`(useShopStore.ts:10-14)는 `selectedShop`, 모달 저장소는 `{isOpen, mode, data}`, `useConfirmStore`는 Promise 기반 `showConfirm`, `useNotificationStore`는 3000ms 뒤 사라지는 토스트다.
- **axios.ts**: 인스턴스 하나, `baseURL=VITE_API_BASE_URL`, `withCredentials: true`. 요청마다 저장소의 Bearer 토큰을 붙인다. 500이면 `alert()`, 404 + `SHOP_NOT_SELECTED`이면 `/manager/shops/selected`로 **전체 새로고침 이동**, 401이면 갱신 한 번 뒤 재시도, 갱신이 실패하면 토큰을 지우고 `/manager/login`으로 전체 새로고침 이동. 단일 비행(single-flight) 잠금이 없어 동시에 난 401이 각자 갱신을 시작한다 **(추론)**. `refreshToken()`은 기본 `axios`로 빈 본문 + withCredentials를 보낸다(axios.ts:14-103; auth.ts:29-40).
- **parseErrorMessage**는 HTTP 상태만 보고 백엔드 메시지를 읽지 않는다(parseErrorMessage.ts:9-14).
- **쿼리 설정**: 기본값 `new QueryClient()` + Devtools. `useQuery`는 2개뿐(staleTime 60초, `placeholderData: prev`, `enabled: !!shopId`). **`useMutation`이 없고** 변경은 직접 호출 뒤 `refetch()`다.
- **Sidebar**: 마운트할 때 저장소에 매장이 없으면 `GET /shops/selected`를 부른다. 404면 매장 선택으로, 그 밖의 오류는 `/login`으로 보낸다(`/manager/login`과 어긋난다). 로그아웃은 clearToken → clearSelectedShop → `queryClient.clear()` → 이동. 활성 항목은 정확히 같은 경로만 본다(Sidebar.tsx:35-83).
- **레이아웃**: ManagerLayout은 고정 `w-64` 사이드바 + `main p-8`. 상단바·접기·서랍 없음.
- **개발 프록시**: 예전 Vite 설정은 `/api`를 `localhost:8000`으로 넘기며 접두사를 떼었지만 axios는 이 프록시를 쓰지 않았다(vite.config.ts:12-19). SPEC-UI-001 M1에서 이 설정을 지웠다.

---

## 2. 백엔드 계약(주 체크아웃 `eb8b06d`)

### 2.1 매장 범위

- 선택 매장은 **서버 Redis 상태**로 정한다. 헤더·경로 매개변수·토큰 클레임이 아니다. 키는 `user:{user_id}:selected_shop`, TTL 365일(utils/redis/shop.py:3-15) [전달]. `POST /shops/selected {shop_id}`로 설정하고 204를 돌려준다.
- 매장 범위 경로는 모두 `get_current_shop`에 의존한다(dependencies/shop.py:19-39). Redis 값이 없으면 404 `SHOP_NOT_SELECTED`, 회원이 아니면 404 `SHOP_NOT_FOUND`, 성공할 때마다 TTL을 늘린다.
- 키가 사용자 단위이므로 **같은 계정의 다른 기기(네이티브 앱, 다른 브라우저)에서 매장을 바꾸면 관리자 웹이 보는 매장도 바뀐다 (추론)**. 관리자 웹은 서버의 선택 매장을 다시 확인하는 방식을 가져야 한다(plan.md 위험 표).
- 네이티브 앱은 `X-Shop-ID` 헤더를 보낸다(client.ts:243). 백엔드는 이 헤더를 읽지 않는다(`app/` grep 결과 없음). CORS `allow_headers`에도 없어서 브라우저가 보내면 사전 요청(preflight)에서 막힌다.

### 2.2 인증

- **액세스 토큰**: Bearer JWT, `type=access`만 받는다(dependencies/auth.py:13,29). 클레임 sub, role, email, type, exp, iat, nbf. 수명은 `.env.prod.example:53`에서 900초, `.env.example`에서 3600초. 운영 실제 값은 확인하지 못했다(7절).
- **리프레시 토큰**: `type=refresh` JWT. 수명은 운영 예시 14일(`:55`), 개발 7일. 사용자당 하나만 `auth:refresh:{user_id}`에 저장해 새 로그인이 이전 토큰을 대체한다(utils/redis/auth.py:4-15 [검증]). 응답 **본문**(`{access_token, refresh_token, token_type}`)과 **쿠키** `refresh_token`(HttpOnly, Secure, SameSite=None, 도메인 지정 없음)에 함께 담긴다 [검증](api/auth.py:49-56). 쿠키 경로는 지정하지 않아 Starlette 기본값 `/`이다 **(추론, 기본값 기준)**.
- **갱신**: `POST /auth/refresh`, 본문 없음, IP당 분당 30회(api/auth.py:71-72) [검증]. `X-Refresh-Token` 헤더를 먼저, 없으면 쿠키를 읽는다(services/auth_service.py:168 [검증]). 남은 수명이 절반 이하일 때만 토큰을 바꾼다(auth_service.py:243-263) [전달]. 갱신 응답도 새 리프레시 토큰을 쿠키로 다시 설정한다(api/auth.py:83-90) [검증]. 오류는 401 `AUTH_REFRESH_TOKEN_INVALID`, `AUTH_REFRESH_TOKEN_EXPIRED`, `AUTH_UNAUTHORIZED`.
- **로그아웃**: `POST /auth/logout`, 인증 불필요, **쿠키만** 읽는다(api/auth.py:100-101). Redis 키를 지우고 쿠키를 `path="/"`로 지운다(:109) [검증]. 액세스 토큰은 차단 목록에 넣지 않아 만료까지 유효하다.
- **요청 제한**(slowapi, IP 기준): 로그인 분당 5회(api/auth.py:35 [검증]), 갱신 30회, `POST /users` 5회, `GET /users/exists/email` 20회, 초대 10회. 429 응답 본문 모양은 확인하지 않았다.

### 2.3 오류 형식과 쪽 나누기

- **CustomException** 응답은 `{"detail":{"code":"<DOMAIN>_<CODE>","detail":"<msg>","hint":"<hint>"}}`다(exceptions.py:96-108). Redis 장애는 503, 감싸지 않은 DB `DataError`는 400.
- **검증 오류(422)** 는 FastAPI 기본 배열 형식이다. `RequestValidationError` 처리기를 등록하지 않았다. OpenAPI의 `HTTPValidationError`가 `detail: ValidationError[]`이고 `ValidationError`는 `loc`(문자열·정수 배열)·`msg`·`type` 필수다 [검증].
- **문서의 예시가 실제와 다르다.** `docs/common_responses.py:11`의 예시는 `detail.message`를 쓰지만 실제는 `detail.detail`·`detail.hint`다.
- **쪽 나누기**: fastapi_pagination 0.15.15, 응답 `{items,total,page,size,pages}`. `page` 1~100000, `size` 1~100, 기본 50 [검증, OpenAPI 매개변수]. 대상: `/shops`, `/phonebooks`, `/treatments`, `/treatment-menus`.

### 2.4 8개 화면이 쓰는 API

OpenAPI 문서에서 다시 확인한 요청·응답 형태다 [검증]. `*`는 필수 필드.

- **인증**
  - `POST /auth/login` — `application/x-www-form-urlencoded` `Body_login_auth_login_post{username*, password*, grant_type(^password$), scope, client_id, client_secret}` → `LoginResponse{access_token*, refresh_token*, token_type}`, 401, 422.
  - `POST /auth/refresh` → `LoginResponse`, 401. `POST /auth/logout` → 200(response_model 없음).
  - `GET /users/me` → `UserResponse{id*, name*, email*, role*, role_name, created_at*, updated_at*}`(schemas/user.py:28).
- **매장**
  - `GET /shops(page, size)` → `Page[ShopResponse]`. `ShopResponse{id*, name*, address*, address_detail, phone, business_number, created_at*, updated_at*}` — `address_detail`·`business_number`는 null 허용.
  - `GET /shops/selected` → `ShopResponse` 또는 404. `POST /shops/selected {shop_id*}` → 204. `DELETE /shops/selected` → 204(shop.py:40-140).
- **고객(전화번호부)**
  - `GET /phonebooks(page, size, search)` — 검색 대상은 이름·전화번호·그룹·메모(crud/phonebook_crud.py:27-33 [검증]).
  - `GET /phonebooks/groups(with_items=false)`, `GET /phonebooks/check-duplicate(phone_number*)` → `{exists*, phone_number}`, `GET /phonebooks/{id}`.
  - `POST /phonebooks PhonebookCreate{name*(≤100), phone_number*(≤20), group_name(≤100), memo}` → 201, 중복 409.
  - `PUT /phonebooks/{id} PhonebookUpdate`(모든 필드 선택) → 200. `DELETE` → 204(소프트 삭제).
  - 전화번호는 `000-0000-0000` 형태로 정규화하고, 빈 `group_name`은 null이 된다(phonebook.py:35-164; schemas/phonebook.py).
- **예약(시술)** — 캘린더와 이력이 같은 API를 쓴다.
  - `GET /treatments(page, size, start_date, end_date, status, search, sort_by=reserved_at, sort_order=desc, staff_user_id)`(crud/treatment_crud.py:43-117). `start_date`·`end_date`는 KST 날짜이며 "시작 포함, 끝 날짜 다음 날 0시 배타"로 적용한다(utils/query.py:16-37 [검증]). `search`는 전화번호부 이름·번호, 직접 입력한 고객명·번호, 시술 세부 항목 이름을 본다(crud/treatment_crud.py:79-99 [검증]). 메모는 검색하지 않는다.
  - **캘린더 전용 API와 `GET /treatments/{id}`가 없다.**
  - `POST /treatments TreatmentCreate{reserved_at*, status*, phonebook_id, customer_name, customer_phone, memo, finished_at, payment_method(기본 CARD), staff_user_id, treatment_items: TreatmentItemCreate[]}` → 201 `TreatmentSimpleResponse{id, created_at, updated_at}`. 결제 수단 기본값 CARD는 schemas/treatment.py:41-44 [검증].
  - `TreatmentItemCreate{menu_detail_id*, base_price*(0 이상), duration_min*(0~1440), session_no*(1 이상)}`.
  - `PUT /treatments/{id} TreatmentUpdate` — 부분 수정(`exclude_unset`)이라고 설명하지만 `reserved_at`·`status`를 필수로 물려받아 **매번 둘 다 보내야 한다**(schemas/treatment.py:76). `treatment_items`는 생략·null이면 유지, 배열이면 교체, `[]`이면 모두 삭제. 항목 수정 형식은 `TreatmentItemUpdate{id, menu_detail_id, base_price, …}`(schemas/treatment_item.py:63-75 [검증]).
  - `DELETE /treatments/{id}` → 상태를 CANCELLED로 바꾼다(204, 멱등). 잘못된 외래 키는 400(api/treatment.py:27-131; schemas/treatment.py:18-191).
  - `TreatmentResponse`는 위 필드 + `id, shop_id, created_at, updated_at, created_user_id, status_label, payment_method_label, treatment_items: TreatmentItemResponse[](각 항목에 menu_detail 포함), phonebook, staff_user`.
- **예약 상태 enum**(enum/treatment_status.py:4-18 [검증]): RESERVED "예약됨", VISITED "방문 및 시술 완료", CANCELLED "취소됨", NO_SHOW "노쇼", COMPLETED "시술 완료". PaymentMethod: CARD, CASH, UNPAID.
  - **서버에는 상태 전환 규칙이 없다.** `PUT`은 setattr 반복으로 아무 상태나 쓴다. 지키는 불변식은 RESERVED·VISITED이면 `finished_at=NULL`뿐이다(treatment_service.py:231-264).
  - Celery beat가 30분마다 소요 시간이 지난 VISITED를 COMPLETED로 바꾸고 `finished_at=now`를 넣는다. RESERVED는 자동 완료하지 않는다(celery_app.py:20-25; worker/tasks/treatment_task.py:54,77-81). enum 파일 주석도 "직원이 방문 처리한 VISITED만 자동완료한다"고 적는다 [검증].
  - 매출: 예상 = RESERVED + VISITED + COMPLETED, 실매출 = COMPLETED만.
- **시술 메뉴**
  - `GET /treatment-menus(page, size, search)` → `Page[TreatmentMenuResponse{id, shop_id, name, created_at, updated_at, details: TreatmentMenuDetailResponse[]}]` — 세부 항목이 목록에 함께 온다.
  - `POST /treatment-menus TreatmentMenuCreate{name*(≤255)}` → 201, 409. `PUT /treatment-menus/{id}`도 같은 본문. `DELETE` → 204(소프트), `POST /{id}/restore` → 204.
  - `GET /treatment-menus/{id}/details`, `POST …/details TreatmentMenuDetailCreate{name*, duration_min*(>0), base_price*(>0)}` → 201, `PUT …/details/{detail_id}`도 같은 본문(전체 필드 필수), `DELETE`(schemas/treatment_menu.py:10-21).
- **요약**: `GET /summary/dashboard?target_date&force_refresh`. 예전 관리자 웹은 부르지 않았고 이번 범위에도 없다.

### 2.5 OpenAPI 내보내기 검증

- **문서가 닫히는 조건**: `app/main.py:48-54`의 `api_docs_enabled`가 `app_env != "production"`을 돌려준다. `:57-65`의 `api_docs_kwargs`는 그 결과로 docs·redoc·openapi 경로를 None으로 만든다 [검증]. 운영에서는 `/changelog`도 등록하지 않는다(:192-193).
- **실제 확인**: `https://api-beauty.dongri.kr`의 `/`, `/docs`, `/openapi.json`은 모두 **404**였다(curl GET 3회) [전달].
- **로컬 내보내기** [검증, 2026-11-09 이 조사에서 다시 실행]:

  ```bash
  ( cd /home/antam2010/workSpace/_myproject/kmcbeauty/kmcbeauty-fastapi && PYTHONDONTWRITEBYTECODE=1 SENTRY_DSN= LOG_TO_FILE=false timeout 60 .venv/bin/python -c "import json; from app.main import app; print(json.dumps(app.openapi(), ensure_ascii=False))" ) > <세션 스크래치패드>/openapi.json 2>/dev/null
  ```

  - 종료 코드 0, 출력 90,797바이트. `openapi` 3.1.0, 경로 31개, API 50개, 스키마 58개.
  - 실행 뒤 백엔드 `git status --short` 출력이 비어 있었다(파일 쓰기 없음). stderr의 "Failed to initialize Firebase Admin SDK"는 백엔드가 잡아 넘기는 예상된 메시지다 [전달].
  - 백엔드 커밋 `eb8b06d` 기준이다. 백엔드가 바뀌면 다시 내보내야 한다.
- **문서 모양** [검증]:
  - 경로에 `/api` 같은 접두사가 없다. 모든 경로가 `/auth/login`, `/treatments`처럼 루트에서 시작한다.
  - operationId는 FastAPI 자동 이름이다(예: `list_treatments_api_treatments_get`, `login_auth_login_post`).
  - 태그는 한글이다: `인증`, `유저`, `상점`, `전화번호부`, `시술 예약`, `시술 메뉴`, `통계`, `디바이스 푸시 토큰`, `System`. `/changelog`는 태그가 없다.
  - 로그아웃에는 response_model이 없다. `X-Refresh-Token` 헤더와 쿠키는 문서에 선언되어 있지 않다. 오류 응답(401·404·409)은 대부분 본문 스키마 없이 설명만 있다.
- **백엔드에 저장된 스키마는 여전히 없다.** 커밋된 openapi.json, 내보내기 스크립트, `generate_unique_id_function`, 직접 지정한 `operation_id`가 모두 없다(7절).
- **도구 선택에 주는 뜻**: 결정 8로 Orval 대신 openapi-typescript(타입) + openapi-fetch(호출)를 쓴다. openapi-fetch는 경로 문자열과 HTTP 메서드로 타입을 고르므로 자동 operationId와 한글 태그가 문제되지 않는다 **(추론)**. 인증 API의 쿠키 동작, 오류 본문, 로그아웃 응답은 문서에 없으므로 손으로 다룬다.

### 2.6 CORS와 관리자 웹을 둘 곳

- `allow_origins = ["https://kmc2.daeho2.shop", "https://bueafit.vercel.app"]`, credentials 허용(main.py:135-138), 허용 헤더 `Content-Type`, `Authorization`, `X-Refresh-Token`(:148) [검증]. localhost·사설 IP 정규식은 APP_ENV가 production이 아닐 때만 켠다(:70-87, :140) [검증].
- `tests/test_cors_production_security.py:27`이 이 두 주소를 그대로 고정한다. `kmc2.daeho2.shop`에는 DNS 기록이 없다(인터뷰 사실 표).
- **운영 API에 localhost 주소로 직접 요청하면 CORS에 막힌다.** 그래서 개발은 Vite 프록시로 한다(인터뷰 기본값).
- 쿠키 사이트 규칙 **(추론)**: 쿠키는 `api-beauty.dongri.kr` 호스트 전용 + SameSite=None이다. 관리자 웹을 `*.dongri.kr`에서 열면 같은 사이트 쿠키다. 다른 사이트에서 열면 제3자 쿠키가 되어 브라우저의 추적 방지에 막힐 수 있다. 결정 9가 `dongri.kr` 아래 새 주소를 고른 것으로 이 위험을 피한다.
- 운영 관리자 주소는 3회차 인터뷰에서 `admin-beauty.dongri.kr`로 정해졌다(2.9절). 백엔드 `allow_origins`와 `tests/test_cors_production_security.py` 변경은 백엔드 저장소의 별도 작업이다(결정 9).

### 2.7 일시와 시간대(이번 조사에서 새로 확인)

- DB 연결은 세션 시간대를 UTC로 둔다(database.py:24 `-c timezone=UTC`) [검증].
- `reserved_at`·`finished_at` 열은 시간대 없는 `DateTime`이다(models/treatment.py:48, :59) [검증].
- 응답 모델의 공통 부모 `BaseResponseModel`은 시간대 없는 datetime에 UTC를 붙인다(schemas/mixin/base.py:8-14) [검증]. 예약 스키마도 이 부모를 물려받는다(schemas/treatment.py:18 `class TreatmentBase(BaseResponseModel)`) [검증]. 그래서 응답 일시는 오프셋이 붙어 나온다.
- 요청 쪽: 오프셋이 있는 일시는 UTC로 바뀌어 저장된다(schemas/treatment.py:52-64 주석과 검증기) [검증]. 이 검증기는 `mode="before"`에서 `datetime` 객체만 손대므로 JSON 문자열로 온 **오프셋 없는 값은 그대로 UTC 벽시계 값으로 저장된다 (추론, 코드 읽기 기준)**. 오프셋 없이 "14:00"을 보내면 KST 23:00 예약이 된다.
- 네이티브 앱은 두 방식을 섞어 쓴다: `EditTreatmentModal.tsx:391`은 `toISOString()`(UTC 오프셋 포함), `src/utils/bookingPayload.ts:65`는 `${날짜}T${시간}:00`(오프셋 없음) [검증]. 뒤쪽 경로가 실제로 백엔드까지 그대로 가는지는 확인하지 않았다. 그대로 간다면 네이티브에서 만든 예약이 관리자 웹에서 9시간 밀려 보일 수 있다 **(추론, 범위 밖 관찰)**.
- 결론: 관리자 웹은 **항상 오프셋이 있는 ISO 문자열**을 보낸다. 날짜 필터(`start_date`·`end_date`)는 KST 날짜 문자열이어야 한다.

### 2.8 예전 관리자·네이티브 앱과 현재 백엔드의 차이

1. 예전 `ErrorResponse`는 `detail.message`를 선언한다. 백엔드는 `detail.detail`·`detail.hint`를 보내고, 422는 `detail`이 배열이다.
2. 예전 `Auth` 타입에 `refresh_token`이 없다.
3. 예전 갱신은 쿠키만 쓰고 헤더 경로를 쓰지 않는다.
4. 예전 `TreatmentStatus`는 `RESERVED|CANCELLED|FINISHED`다. FINISHED는 없고 VISITED·NO_SHOW·COMPLETED가 빠졌다.
5. 예전 `Treatment` 타입에는 customer_name, customer_phone, payment_method(+label), status_label, staff_user(_id), created_user_id, shop_id가 없다. `phonebook_id`는 필수로 적혀 있지만 지금은 null 허용이다. `treatment_items` 모양도 다르다(백엔드는 항목 안에 `menu_detail`을 넣어 보낸다).
6. 예전 `createTreatment`는 불필요한 `id`와 잘못된 모양의 항목을 보낸다. 호출하는 곳은 없다.
7. 예약 수정·취소, 메뉴·세부 항목 추가·수정·삭제 클라이언트가 없다.
8. `Phonebook.user_id`는 `shop_id`여야 한다.
9. `itmes`는 `items`의 오타이고, `group_name`은 null 허용인데 null 불가로 적혀 있다.
10. 매장 `address_detail`·`business_number`도 null 허용인데 null 불가로 적혀 있다.
11. `SHOP_NOT_SELECTED` 이동 조건(404 + 같은 코드)은 지금도 맞다.
12. 관리자 `.env`의 `VITE_API_BASE_URL`은 죽은 주소 `https://api-kmc2.daeho2.shop`이다.
13. 로그아웃은 쿠키가 실제로 전송될 때만 세션을 끊는다.
14. 네이티브 앱은 쓰이지 않는 `X-Shop-ID` 헤더를 보내고, `getById`는 없는 `GET /treatments/{id}`를 부른다(services/treatment.ts:19-20).
15. 네이티브 앱은 월·주 범위를 size 50으로 쪽마다 돌며 `MAX_PAGES=20`에서 멈춘다(services/treatment.ts:40-85; 현재 경로 `src/api/services/treatment.ts:6-7` [검증]). 예전 관리자 웹의 100건 한도를 피하는 선례다.

### 2.9 배포 서버 읽기 전용 확인(3회차 인터뷰, 2026-11-09에 추가)

사용자가 접속 방법을 알려 주고 확인을 요청해 오케스트레이터가 읽기 전용 명령만 실행했다(설정 변경·다시 읽기 없음). 증거: `.moai/state/verify/cd2cba80-827f-4657-b7ea-6a07e9f25df2/deploy-server/maria-daeho-shop-readonly-check.md`.

- 서버 `maria.daeho.shop`(호스트 `mini-server-01`)에는 호스트 nginx가 없고, nginx 1.30.6이 Docker 컨테이너 `nginx`로 80·443을 받는다. 같은 서버에 `kmcbeauty-api` 등 백엔드 컨테이너가 있다 [검증].
- 설정은 `/srv/server-mini2/nginx/conf.d`(컨테이너 `/etc/nginx/conf.d`, 소유자 `antam2010`)에 있고, 컨테이너는 `/srv/server-mini2/compose.yaml`로 띄운다. `antam2010`은 docker 그룹이라 sudo 없이 설정 파일을 더하고 nginx를 다시 읽힐 수 있다. sudo는 비밀번호가 필요하다 [검증].
- conf.d에는 `api-beauty.conf`(`api-beauty.dongri.kr`), `dongri.conf`(`dongri.kr`, `www.dongri.kr`, `admin.dongri.kr` — 다른 서비스 dcard), 기본 블록 등이 있다. 그래서 `admin-beauty.dongri.kr`은 이름이 겹치지 않는다 [검증].
- 다른 사이트는 서버 수준 `add_header`로 HSTS, `X-Content-Type-Options nosniff`, `X-Frame-Options DENY`, `Referrer-Policy`, `Content-Security-Policy-Report-Only`(`frame-ancestors 'none'` 포함)를 쓴다. "`add_header`·`proxy_set_header`는 server 수준에만 두고 location 안에는 두지 않는다"는 규칙이 주석으로 있다 [검증].
- 정적 파일을 내주는 마운트는 없다(마운트는 conf.d·nginx.conf·logs·인증서뿐). `try_files` SPA 경로 대체 블록도 아직 없다 [검증].
- `dongri` 원본 인증서(공개 인증서만 읽음)의 SAN은 `*.dongri.kr, dongri.kr`이다 [검증].
- 결론: 경로 방식 라우팅(데이터 라우터 + 브라우저 히스토리)을 유지할 수 있다. SPA 경로 대체와 보안 헤더는 이 서버에서 설정할 수 있다. 실제 서버 작업(새 server 블록, 정적 파일 마운트 또는 정적 파일 컨테이너, Cloudflare DNS, nginx 다시 읽기, 백엔드 CORS)은 이 SPEC 밖이며 plan.md §P 점검표로 남겼다.

---

## 3. 현재 저장소(HEAD `b84b92b`)

### 3.1 기준선과 공개 API

- **진입점**: `src/main.tsx:12-20`은 `<ThemeProvider><PreviewPage/><Toaster/><ConfirmDialogHost/></ThemeProvider>`만 마운트한다. `main.tsx:16` 주석이 명령형 Host를 앱에 하나씩만 둔다고 적는다 [검증].
- **의존성**: 라우터·서버 상태·HTTP 클라이언트 라이브러리가 없다. `package.json`은 dependencies 20개, devDependencies 17개, 모두 정확한 버전이다. engines는 `^22.13.0 || ^24.0.0` [검증].
- **`@/ui-core` 공개 API**(`src/ui-core/index.ts:1-73`): 런타임 이름 40개, `export *` 없음. 잠금 장치 [검증]:
  - `design-rules.test.ts:14-55` 공개 이름 목록, `:412-417` 정확히 40개
  - `design-rules.test.ts:58-88` 컴포넌트 파일 목록, `:423-428` 정확히 29개(테스트·`cn.ts`·`index.ts`를 뺀 `.tsx`만 센다)
  - `design-rules.test.ts:91-107` 기반 라이브러리 표, `:441-444` react-day-picker·cmdk 가져오기 범위 제한
  - `dependency-pins.test.ts:13-55` 고정 목록, `:95-98` 정확히 20 + 17개
  - 새 컴포넌트나 패키지를 더하면 이 목록을 함께 고쳐야 한다.

### 3.2 화면별 ui-core 사용 가능성(props 인터페이스에서 추론)

| 화면 | 쓸 수 있는 것 | 없는 것 |
|---|---|---|
| 앱 셸 | Sidebar(`collapsed`, `linkComponent`, `isActive`, `currentPath`, 머리·바닥 슬롯; sidebar.tsx:18-30), Breadcrumb, ThemeToggle, Tooltip, Button | 상단바, 768px 미만 서랍, DropdownMenu(SPEC-UI-001 spec.md:195에서 제외), 앱 셸 건너뛰기 링크(미리보기에만 있다), 현재 매장 표시 |
| 로그인 | Card, Field, Input, Button(`loading`), Alert | 폼 상태·검증, 제출 실패 시 첫 오류 필드 포커스(spec.md:183) |
| 매장 선택 | Card, EmptyState, Loading, SkeletonGroup, Button | 목록·선택 컴포넌트 |
| 캘린더 | DateTimePicker, Combobox, Modal `lg`, Badge, Select, Textarea | FullCalendar, StatusBadge와 상태 매핑(도메인 모듈, system.md:223), 캘린더 테마 변수 연결 |
| 고객 | PageHeader, Search(디바운스 없음, search.tsx:27), Filter, Table(정렬, `getRowRail`, 로딩, 빈 상태), Pagination, Modal `md`, Combobox `createAction`, showConfirm, toast | 천 단위 쉼표 입력, TanStack Table(spec.md:196), CSV 내보내기 |
| 시술 메뉴 | 고객과 같음 | 숫자·금액 입력 |
| 시술 이력 | Table + `getRowRail`, Filter, Pagination, Search | 기간 선택(spec.md:195), StatusBadge |
| 약관·개인정보 | PageHeader, Card | 본문 글 서식 컴포넌트 |

어디에도 없는 것: FileUpload, DropdownMenu, 공개 Popover, 다중 선택 칩.

추가 확인 [검증]: `Calendar`는 `mode="single"`만 쓴다(calendar.tsx:74-75). `DateTimePicker`는 `granularity`·`timeRange`·`minuteStep`을 받는다. `Table`은 `rows`·`columns`·`getRowKey`·`caption`·`sort`·`onSortChange`·`getRowRail`·`loading`·`empty`·`inPanel`을 받고 쪽 나누기는 따로 둔다. `Modal`의 크기는 `sm|md|lg`, `Input`의 크기는 `sm|default|lg`다.

### 3.3 라우터 링크 주입

- **슬롯 타입**: `LinkComponentProps = { to: string; className?: string; "aria-current"?: "page"; children: ReactNode }`(breadcrumb.tsx:5-13).
- **DefaultLink**(breadcrumb.tsx:16-22)는 `<a href={to}>`를 그리며 **URL 스킴 허용 목록이 없다.**
- **Sidebar**: 활성 판정 기본값은 정확히 같은 경로(sidebar.tsx:42 `isActive = exactMatch`) [검증]. 접두사 일치는 `isActive`로 주입한다. 접혔을 때 링크를 `<span>`으로 감싸 Tooltip 트리거로 쓰므로(sidebar.tsx:149-155) 어댑터가 ref를 넘길 필요가 없다.
- **어댑터가 할 일**: `to`·`className`·`aria-current`·`children`을 받아 포커스 가능한 링크를 그리는 컴포넌트, 그리고 라우터 위치에서 얻은 `currentPath`. react-router `Link`가 래퍼 없이 `LinkComponent`를 만족하는지는 타입 검사로 확인하지 않았다.

### 3.4 SPEC-UI-001 후속 과제 17건(`progress.md:591-615`)

| # | 내용 | 위치 | 최소 수정 | 현재 테스트 | 위험 |
|---|---|---|---|---|---|
| 1 | Modal 버리기 확인 상태가 남는다 | modal.tsx:57,61-68,127-129 | `open`이 false가 되면 `confirmingDiscard`를 되돌린다 | modal.test.tsx:190-260. 밖에서 닫고 다시 여는 테스트 없음(grep) | 낮음 |
| 2 | DateTimePicker 간격 밖 값이면 시간 칸이 빈다 | date-time-picker.tsx:106-107,193-201 | 간격 밖 값을 옵션에 더하거나 맞추기·표시 | :64-83, :247. 간격 밖 `value` 테스트 없음 | 낮음~중간(EC-26 경로 :128-133) |
| 3 | deploy.sh가 `.env.stage`를 셸로 실행한다 | deploy.sh:12-14 | KEY=VALUE를 읽고 SCP_* 이름만 허용 | deploy-guard.test.ts:2,37-43,88,99,110 | 중간(C6로 가드를 지울 때 테스트도 바뀐다) |
| 4 | DefaultLink에 스킴 허용 목록이 없다 | breadcrumb.tsx:16-22 | 상대 경로와 http·https만 허용 | breadcrumb.test.tsx:43-47, sidebar.test.tsx:97-99 | 낮음 |
| 5 | CSP가 없고 인라인 스크립트에 해시가 필요하다 | index.html:7-30 | sha256 해시를 담은 CSP | theme-init.test.ts:11,55,64 | 중간(스크립트를 고치면 해시가 바뀐다) |
| 6 | Combobox 새 값 만들기 조건이 중복된다 | combobox.tsx:137-141, :208-212 | `canCreate()` 도우미 | combobox.test.tsx | 낮음 |
| 7 | 포커스 링 클래스 문자열 복사 | 소스 13개(table.tsx:45-46은 이미 지역 상수) | 내부(비공개) 상수 | 테스트 19개 파일의 문자열 단언 | 낮음~중간 |
| 8 | 선택 상태 클래스 복사 | pagination.tsx:77, filter.tsx:68, sidebar.tsx:140 | 공용 상수 | — | 낮음 |
| 9 | 외부 저장소와 포커스 복원 중복 | toast.tsx:42-58, confirm-dialog.tsx:155-171; modal.tsx:59,82-88, confirm-dialog.tsx:112,124-130 | `createExternalStore` + `useRestoreFocus` | — | 중간(`@MX:WARN` toast.tsx:40, confirm-dialog.tsx:153) |
| 10 | Search가 렌더마다 병합 ref를 새로 만든다 | search.tsx:18-25,44 | `useCallback`·`useMemo` | — | 낮음 |
| 11 | `getPageItems`의 맨 숫자 3 | pagination.tsx:9-10,24-25 | 이름 붙은 상수 | pagination.test.tsx:55-62 | 낮음 |
| 12 | jsdom canvas "Not implemented" 메시지 5건 | src/test/setup.ts(대역 :14-47) | 조건부 빈 `getContext` | — | 낮음. axe-core가 원인이라는 판단은 **(추론)** |
| 13 | Loading·Skeleton이 삼항식을 쓴다 | loading.tsx:27,32; skeleton.tsx:16 | `cva` | — | 낮음 |
| 14 | 저장소 초기화가 각 테스트 afterEach에 있다 | toast.test.tsx:21, confirm-dialog.test.tsx:16; setup.ts:49-56 | setup.ts의 `act` 안으로 옮김 | — | 낮음. design-rules 검사 범위 확인 필요 **(추론)** |
| 15 | ToastTone이 Tone에서 파생되지 않는다 | toast.tsx:13 vs badge.tsx:7 | `Exclude<Tone,"neutral">` | — | 낮음 |
| 16 | 중간 크기 이름 `md`와 `default` 혼용 | modal.tsx:15,20,30 vs input.tsx:22,26, select.tsx:30,49, button.tsx:28,34 | 이름 바꾸기(공개 prop 변경) | 미리보기와 테스트 호출부 | 중간 |
| 17 | describe 제목의 AC 표지 축약 | PreviewPage.test.tsx:297 | `AC-UI-001-06·AC-UI-001-14`로 풀어 씀 | — | 없음 |

18번(README)은 SPEC-UI-001 동기화에서 닫혔다. 인터뷰 결정 4로 **17건 모두** 이 SPEC 범위다.

### 3.5 CSP 입력

- **인라인 스크립트**: `index.html:7-30` `<script data-theme-init>` 하나뿐이다. 태그 사이 본문 777자, sha256 `sha256-S1F25ficNeSo4lM6NGm6yDuu5D/Lrale0TY4wbYWbbs=`. `dist/index.html`에서도 같은 해시가 나왔다 [전달].
- **외부 스크립트**: `index.html:34` 모듈 스크립트는 빌드 뒤 외부 파일이 된다.
- **스타일**: index.html에 `<style>`이 없고 글꼴은 자체 호스팅이다(index.css:7).
- **런타임 스타일 출처**: Radix가 인라인 `style` 객체를 쓴다(react-popper 4, select 9, toast 3, visually-hidden 1, tooltip 1, dialog 1 — `style:` 출현 수). react-remove-scroll이 Dialog 아래에서 쓰는 `react-style-singleton`은 **`<head>`에 `<style>` 요소를 만들고**, `get-nonce`를 설정했을 때만 nonce를 붙인다(singleton.js:1-35).
- `style-src-attr`이 CSSOM으로 쓰는 스타일을 막는지는 **미검증**이다(4.6절).

### 3.6 설정·배포·품질 게이트

- **vite.config.ts** [검증]: 별칭 `@` → `./src`, **`server.proxy` 없음**. 커버리지는 v8, 대상은 `src/ui-core/**`뿐(:20-22), 기준 줄·문장·함수 85, 분기 80(:23-28). 앱 코드는 `coverage.include`를 넓혀야 측정된다.
- **tsconfig.json** [검증]: strict, `verbatimModuleSyntax`, `paths @/*`, `include: ["src", "vite.config.ts"]`. `src/vite-env.d.ts`는 `/// <reference types="vite/client" />` 한 줄이라 **`VITE_API_BASE_URL` 타입이 없다.**
- **biome.json**: recommended 프리셋, 큰따옴표, 줄 폭 100. 생성 파일 제외 규칙이 없다.
- **setup.ts** [검증]: jest-dom + 조건부 대역(ResizeObserver, scrollIntoView, 포인터 캡처, matchMedia). afterEach에서 cleanup, `restoreAllMocks`, `localStorage.clear()`, html 클래스 초기화.
- **deploy.sh** [검증]: `:5-9` 가드(`ALLOW_PREVIEW_ONLY_DEPLOY`가 정확히 `1`이 아니면 종료), `:12-14` `.env.stage`를 `.`으로 실행, `:17-20` `SCP_USER`·`SCP_HOST`·`SCP_DIR`·`SCP_PORT` 필수, `:23` `npm run build -- --mode stage`, `:33` scp. 저장소 `.env`에는 `VITE_API_BASE_URL` 하나가 있다. `.env`·`.env.*`는 무시 목록이다(`.gitignore:27-28`) — `.env.example`을 커밋하려면 예외 규칙이 필요하다. `.env.stage`는 저장소에 없다.
- **미리보기 페이지**: 지금은 앱 전체다. `design-rules.test.ts:359-361`(검사 대상), `:111`(`VerificationSection.tsx` 허용 구역), QG-07(원본에 `bg-rose-700`, `dist` CSS에는 없음; acceptance.md:594-596)이 묶여 있다. 미리보기 제목은 "컴포넌트 미리보기"다(PreviewPage.tsx:47) [검증].
- **게이트**: `quality.yaml` tdd(`:4`), 커버리지 목표 85(`:16`), 커밋당 최소 80(`:46`). QG-11은 ui-core에 상태 키·토큰이 없을 것. **QG-12**는 `zustand|@headlessui|axios|react-router|@fullcalendar|file-saver`를 grep해 출력이 없어야 한다(acceptance.md:591) [검증]. 마지막 기록은 테스트 파일 38개, 테스트 551개, 문장 99.27, 분기 97.14(progress.md:566-571).
- **@MX 태그**: 15개(progress.md:572와 일치). ANCHOR index.ts:1, cn.ts:17, button.tsx:41, field.tsx:45. WARN toast.tsx:40, confirm-dialog.tsx:153, theme-provider.tsx:14, combobox.tsx:76. NOTE 7개.
- **전역 CSS 규칙** [검증]: `design-rules.test.ts:404`가 `src/styles/index.css`에 `.dark` 말고 클래스 선택자가 없을 것을 검사한다. 캘린더 테마 CSS를 index.css에 넣으면 이 검사에 걸린다.

### 3.7 설계 기록과 제약

- **system.md §9**(`:206-224`, 예약 상태) [검증]: RESERVED 예약됨 CalendarClock, VISITED 방문함 DoorOpen, COMPLETED 완료 CircleCheck, CANCELLED 취소됨 Ban, NO_SHOW 노쇼 UserX. 방문함·완료는 제2색각 이상에서 ΔE 2.6(라이트)·0.4(다크)라 **아이콘 + 라벨 필수**. 상태 배지와 destructive·warning 배지를 같은 줄·목록에 두지 않는다. 임시 순서 예약됨 → 방문함 → 완료 → 취소됨 → 노쇼. 매핑은 ui-core 밖 도메인 모듈에 둔다. 방문함·완료의 뜻과 툴팁 문구는 "SPEC-UI-002에서 확정한다"고 적혀 있다.
- **system.md §10**(`:226-232`, 레이아웃): 사이드바 240/64px, 상단바 56px 고정, 본문 여백 24/32px, 최대 폭 1280px(캘린더는 풀 수 있음), 필터·검색 상태는 URL 쿼리, 필드 8개 초과는 전체 페이지 폼, 1024px 이상 펼침·768~1023px 접힘·768px 미만 서랍.
- **system.md §12 금지 2**(`:252`) [검증]: "템플릿형 대시보드 — 큰 지표 카드·차트로 채운 홈(**홈은 오늘 예약 목록**)". 인터뷰 기본값(로그인 뒤 첫 화면 = 예약 캘린더)과 문구가 다르다. C1에 따라 코드보다 먼저 이 문구를 고쳐야 한다(plan.md §E).
- **system.md §12 시그니처**: 예약이 나오는 모든 곳에 3px `border-inline-start` 상태 레일, 항상 배지와 함께, 캘린더 이벤트는 `status-*-bg` 면 + 레일 + 아이콘·시간(`status-*-fg`) + 고객명(`foreground`).
- **design-direction.md**: §13(`:705-769`) 방문함·완료 뜻 미정, §14(`:771-851`) 셸 구조(사이드바 머리에 매장명 + 매장 변경, 바닥에 사용자 이름·역할·로그아웃, 상단바 오른쪽에 오늘 날짜·테마 전환·사용자 메뉴), 대화상자 sm 400 / md 560 / lg 720(예약은 lg), §15(`:853-865`) 상태 레일과 "`--fc-*` 변수 연결은 SPEC-UI-002", §17 결정 D1~D9(D1 백엔드 5종, D2 네이티브와 같은 라벨·색, D3 해요체, D4 24시간 HH:mm, D5 입력 테두리 `#808b9d`, D6 사이드바 240/64, D7 시스템 테마, D8 Tailwind 기본 테마 정리, D9 cmdk 1.1.1·react-day-picker 10.0.2·date-fns 4.4.0 ko). design-direction.md는 결정 당시의 기록이라 고치지 않는다(C1).
- **제약 C1~C8**(SPEC-UI-001 spec.md:133-140): C1 system.md가 정본, 코드보다 먼저 고친다. C2 TDD. C3 주 체크아웃 `main`, 새 브랜치 없음. C4 한국어 주석·테스트 이름. C5 정확한 버전 고정, 새 패키지는 blocker → 사용자 승인 → SPEC 개정. C6 배포 가드는 SPEC-UI-002 끝에 지운다. C7 tnum은 기록만. C8 ui-core는 예약 도메인을 모른다.
- **실행 기록의 어긋남**: C3(progress.md:110) — run 단계는 임시 워크트리 + `--ff-only`로 했고 다음 개정에서 이를 허용하기로 했다. D20(`:97`), D22(`:99`)는 추가 조치 없음.

### 3.8 잠금 규칙이 이번 설계에 주는 제약(이번 조사에서 새로 확인)

- `react-day-picker`는 `calendar.tsx` 밖에서 가져올 수 없다(`design-rules.test.ts:441-444`). 기간 선택 컴포넌트가 react-day-picker의 범위 모드를 쓰려면 **ui-core 안에서 `Calendar`를 넓히는 방식**이어야 한다. 앱 계층에서 직접 가져오면 규칙에 걸린다.
- 컴포넌트 파일 수 검사는 `.tsx`만 센다(`:423-428`). 후속 과제 7·8·9의 내부 공용 코드는 `.ts` 파일로 두면 29개 목록을 건드리지 않는다.
- 금지 패턴 검사 대상은 `src/ui-core`와 `src/preview`뿐이다(`:359-361`). 새 앱 코드에도 같은 규칙을 적용하려면 대상 목록을 넓혀야 한다.

---

## 4. 외부 라이브러리와 지침

### 4.1 버전(npm 레지스트리, 2026-11-09 `npm view` [검증])

| 패키지 | 최신 | 이전 줄 | 의존성·엔진 |
|---|---|---|---|
| react-router | **8.5.1** | 7.18.5(`version-7`) | peer react·react-dom ≥19.2.7, @types/react·react-dom ≥19.2.0. **engines node ≥22.22.0**. 의존성 cookie-es, @remix-run/route-pattern |
| @tanstack/react-query | 5.107.1 | — | peer react ^18·^19 |
| @fullcalendar/react | **7.1.4** | 6.1.22(`legacy`) | peer react ^17·^18·^19, **temporal-polyfill ^1.0.7**. 의존성 @fullcalendar/core 7.1.4, @full-ui/headless-calendar 7.1.4 |
| temporal-polyfill | 1.0.8 | — | — |
| openapi-typescript | 7.13.0 | — | peer typescript ^5.x. engines 없음 |
| openapi-fetch | 0.17.0 | — | 의존성 openapi-typescript-helpers ^0.1.0. peer·engines 없음. 1.0 전 버전이다 |
| msw | **3.0.4** | 2.15.0 | peer vite ≥6·graphql ≥16·typescript ≥5.9(모두 optional), **engines node ≥22.12.0** |
| zustand | 5.1.0 | — | peer react ≥18(optional) |
| orval | 8.47.0 | — | node ≥22.18.0(결정 8로 쓰지 않는다) [전달] |
| typescript | 7.0.2(Go 포트, "프로그래밍 API 없이 배포") | 프로젝트는 5.9.3 | 위 패키지는 모두 5.9를 받는다 [전달] |
| vite / react | 8.3.7 / 19.3.1 | 프로젝트는 8.3.5 / 19.3.1 | — [전달] |

- **FullCalendar 7의 패키지 구성** [검증]: `@fullcalendar/react@7.1.4`가 하위 경로로 `./daygrid`, `./timegrid`, `./interaction`, `./list`, `./multimonth`, `./locales/*`, `./skeleton.css`, `./themes/{monarch,forma,pulse,breezy,classic,…}`를 내보낸다. 별도 패키지 `@fullcalendar/daygrid`·`timegrid`·`interaction`의 최신은 여전히 6.1.22이고 peer가 `@fullcalendar/core ~6.1.22`다. **v7에서는 플러그인 패키지를 따로 설치하지 않는다.** 직접 의존성은 `@fullcalendar/react` + `temporal-polyfill` 두 개다.
- **engines**: 프로젝트 `^22.13.0 || ^24.0.0`으로는 Node 22.13~22.21에서 react-router 8이 맞지 않는다. 인터뷰 기본값 `^22.22.0 || ^24.0.0`으로 올리면 react-router 8·MSW 3 조건을 모두 채운다. 로컬 Node는 v24.22.2다 [전달].

### 4.2 react-router

- **모드**(https://reactrouter.com/start/modes): 선언형(`<BrowserRouter>`, `Link`, `useNavigate`, `useLocation`), 데이터(`createBrowserRouter`, loader, action, `lazy`, `middleware`), 프레임워크(Vite 플러그인). 문서는 SPA에 어느 하나를 권하지 않는다.
- **보호**(https://reactrouter.com/start/data/route-object): middleware 또는 loader에서 `throw redirect()`.
- **지연 경로**: `lazy: async () => ({Component, loader})`.
- **v8 변경**(https://reactrouter.com/upgrading/v7): `react-router-dom`이 없어졌다. `react-router`에서 가져오고 DOM API는 `react-router/dom`에서 가져온다.
- **Link**는 "점진적으로 강화된 `<a href>` 래퍼"다(https://reactrouter.com/api/components/Link). ref 전달과 NavLink className 함수는 확인하지 않았다.
- v8에서 데이터 모드 API(`createBrowserRouter`, `RouterProvider`, loader `redirect`, `createMemoryRouter`)가 v7과 같은 이름으로 남아 있는지는 문서 한 쪽만 읽어 **(추론)**이다. M4 사전 점검에서 타입으로 확인한다.

### 4.3 TanStack Query 5

- `queryFn({signal})`은 queryFn이 signal을 넘길 때만 요청을 취소한다. `cancelQueries`로 직접 취소할 수 있다. Suspense 훅에서는 둘 다 동작하지 않는다.
- 쿼리는 기본 3회 재시도, 지수 백오프(1000ms, 최대 30초). `retry(failureCount, error)` 함수로 401 등에서 재시도를 끈다.
- `invalidateQueries`는 접두사로 맞춘다.
- 출처: TanStack 안내 query-cancellation, query-retries, query-invalidation. 변경(mutation) 재시도 기본값은 확인하지 않았다.

### 4.4 Orval 8과 직접 작성 클라이언트(결정 8 이전 비교)

- Orval 설정: `client:'react-query'`, `mode` `single|split|tags|tags-split`, `httpClient` 기본 `fetch`, `override.query.signal: true`, `override.mutator {path,name}`(https://orval.dev/docs/reference/configuration/output, /guides/custom-client). mutator가 `signal`을 받는지, 변경 뒤 쿼리를 자동 무효화하는지는 읽은 쪽에 없었다.
- Orval은 OpenAPI 문서가 필요하다. 조사 당시에는 접근 가능한 문서도 커밋된 문서도 없었다(2.5절). 이후 로컬 내보내기가 가능함을 확인했고, 사용자는 **openapi-typescript + openapi-fetch + 직접 작성한 TanStack Query 훅**을 골랐다(결정 8).

### 4.5 FullCalendar

- **v6.1.22**는 런타임에 `<style>`을 넣는다(`internal-common.js` `injectStyles`). nonce는 `meta[name="csp-nonce"]` 또는 `script[nonce]`에서 가져온다. 테마는 `:root`의 `--fc-*` 변수로 바꾼다.
- **v7.1.4**는 "자체 CSS를 더 이상 번들하지 않는다". `skeleton.css`와 테마(+ 팔레트)를 직접 가져온다. react 청크, core·headless 진입 파일에서 `createElement('style')`, `adoptedStyleSheets`, nonce를 찾지 못했다 [전달]. 인라인 `style` 객체는 63개다.
- **v7 변수 이름은 테마 범위로 바뀌었다.** Monarch 테마 CSS가 읽는 변수 [검증, https://unpkg.com/@fullcalendar/react@7.1.4/themes/monarch/theme.css]:
  - 정의: `--fc-monarch-border-style`, `--fc-monarch-ring-color`
  - 읽기만 함(밖에서 채워야 함): `--fc-event-color`, `--fc-event-contrast-color`, `--fc-monarch-{background, foreground, border, faint, faint-foreground, highlight, muted, muted-foreground, now, outline, popover, popover-foreground, primary, primary-down, primary-over, primary-foreground, secondary(-down/-over/-foreground), tertiary(-down/-over/-foreground), selected(-down/-over/-foreground), strong, strong-border, strong-foreground, stronger, strongest}`
  - `:root` 블록이 없고 해시된 클래스(`.fc-monarch-n5m` 등)에 범위가 묶여 있다. 팔레트 가져오기 없음.
  - 포커스 링을 `box-shadow`(`--fc-monarch-ring-color`)로 그린다. 고대비 모드에서는 box-shadow가 사라진다 **(추론, 일반 규칙)** — 이 시스템의 포커스 규칙(outline)과 다르다.
- 이벤트 필드 이름이 바뀌었다: `className`, `color`, `contrastColor`. `.fc-event` 클래스 스타일링은 지원하지 않는다. `headerToolbar`는 기본으로 꺼져 있다. 접근성: `aria-label`, 클릭 가능한 이벤트는 `role=button`. `/locales/ko.js`가 있다.
- 출처: https://fullcalendar.io/docs/react, https://fullcalendar.io/docs/upgrading-from-v6, https://legacy.fullcalendar.io/v6/css-customization.md. 검색 결과로만 본 쪽: https://fullcalendar.io/docs/upgrading-from-v6-css, https://fullcalendar.io/docs/color-palettes.

### 4.6 정적 SPA의 CSP

- meta 태그 CSP는 `report-uri`, `frame-ancestors`, `sandbox`를 담을 수 없다(CSP3 §3.3; MDN frame-ancestors). 클릭재킹 방지는 서버 헤더(nginx 등)가 필요하다 **(추론)**.
- 해시 출처는 `<script>`·`<style>` 요소 본문만 덮는다. 속성 해시는 `'unsafe-hashes'`가 필요하다(MDN).
- `style-src-attr`이 CSSOM 쓰기(`el.style.x=`)를 막는지는 **미검증**이다. 비공식 포럼 글 하나만 찾았다. `securitypolicyviolation` 리스너를 단 브라우저 시험이 필요하다.
- meta CSP는 그 태그 뒤의 내용에만 적용되므로 `<head>` 맨 앞에 둬야 한다 **(추론, 명세 일반 규칙)**.
- 개발 서버는 HMR·React Refresh용 인라인 스크립트를 넣는다 **(추론)**. CSP는 운영 빌드 HTML에만 넣어야 개발 서버가 깨지지 않는다.

### 4.7 OWASP 토큰 저장

- Session Management Cheat Sheet: "JWT, 리프레시 토큰을 `localStorage`나 `sessionStorage`에 저장하지 말라". `HttpOnly; Secure; SameSite=Strict` 쿠키나 BFF를 권한다.
- HTML5 Security·JWT Cheat Sheet는 `jti` 기반 차단 목록과 짧은 만료를 더한다.
- 결정 10(메모리 액세스 토큰 + HttpOnly 쿠키)은 이 권고와 맞는다. 다른 점은 백엔드 쿠키가 SameSite=None이라는 것(교차 출처 요청을 위해 필요)과 응답 본문에도 토큰이 담긴다는 것이다. 본문 토큰은 저장하지 않는다.

### 4.8 zustand 5 persist, MSW 3, bash dotenv 읽기

- **zustand `persist`**: 옵션 `name`, `storage`, `partialize`, `version`, `migrate`, `merge`, `skipHydration`. `createJSONStorage`는 런타임 검증을 하지 않는다. 읽은 쪽에 수화(hydration) 시점 API는 없었다. 이번 설계는 zustand를 쓰지 않는다(plan.md §C).
- **MSW 3**: ESM 전용. `onUnhandledRequest`가 `onUnhandledFrame`으로 바뀌었다. `request.headers.get('cookie')`는 null을 돌려주므로 `cookies` 인자를 쓴다. 가짜 타이머를 더 이상 패치하지 않는다. `msw/node`의 `setupServer` 사용법은 같다.
- **bash에서 dotenv를 안전하게 읽는 공식 출처는 찾지 못했다**(GNU bash 매뉴얼 요청이 429). `while IFS='=' read -r key value; [[ $key =~ ^[A-Z_][A-Z0-9_]*$ ]] …; printf -v "$key" '%s' "$value"` 관용구는 **(추론)**이다.

---

## 5. 인터뷰 결정과 조사 결과의 대응

| 인터뷰 항목 | 결정 | 이 조사에서 확인한 근거 |
|---|---|---|
| 1. API 주소 | `https://api-beauty.dongri.kr` — 공개 값이라 `.env.production.example`에 적는다(0.2.0) | 백엔드 배포 문서·nginx 설정·네이티브 `eas.json:25`가 같은 주소를 쓴다(인터뷰 사실 표). 관리자 `.env`는 죽은 주소(2.8-12) |
| 2. 화면 범위 | 예전 8개 화면 | 1.1·1.2절. 대시보드는 빈 페이지, 이력은 새 화면 |
| 3. 미리보기 검토 | 아직 검토 전, tnum 미검증 | C7 유지, 숫자 열 `tabular-nums` + 오른쪽 정렬 |
| 4. 후속 과제 | 17건 모두 | 3.4절 표 |
| 5. 기능 범위 | 백엔드 기능까지 모두 | 2.4절 API 목록 |
| 6. 시술 이력 | `GET /treatments` 목록 화면 | 2.4절 필터 매개변수, 검색 대상 |
| 7. 상태 전환 | 다음 단계는 바로, 끝난 상태 되돌리기는 확인 | 2.4절 — 서버 규칙 없음, Celery 자동 완료 |
| 8. API 코드 | 스냅숏 + openapi-typescript + openapi-fetch | 2.5절 내보내기 검증 |
| 9. 운영 주소 | `dongri.kr` 아래 새 주소, CORS는 백엔드 별도 작업 | 2.6절 |
| 10. 토큰 저장 | 메모리 + HttpOnly 쿠키 | 2.2절 — 백엔드 변경 불필요 |
| 11. 운영 관리자 주소 | `admin-beauty.dongri.kr` | 2.9절 — `admin.dongri.kr`은 다른 서비스, 원본 인증서 SAN `*.dongri.kr, dongri.kr` |
| 12. 배포 서버 설정 | 경로 방식 라우팅 유지, 서버 작업은 범위 밖 | 2.9절 — nginx 1.30.6 컨테이너, 서버 수준 `add_header` 관례, 정적 파일 마운트 없음 |
| 13. 배포 대상과 빌드 모드 | 운영 서버, `--mode production`, `.env.production` | 3.6절 `deploy.sh` 현재 동작(`.env.stage` 셸 실행) |
| 14. 운영 로그인 확인 시점 | SPEC 완료 뒤(UR-8). 0.2.0에서 운영 API가 필요한 UR-2·UR-3도 같은 시점으로 옮김 | 2.6절 — 운영 CORS가 새 주소와 `localhost`를 허용하지 않음 |
| 15. 캘린더 일정의 상태 표시 | 색·상태별 아이콘·시각·고객 이름만 보이고, 상태 이름은 접근 이름 `"<상태> · HH:mm · <고객 이름>"`·설명·범례로. system.md §9 예외 | system.md §9(`:219`) — 방문함 ↔ 완료는 색만으로 구분되지 않음(제2색각 근사 ΔE00 2.6) |
| 기본값 | 첫 화면 캘린더, 상태 라벨, 경로 유지, CSV 재작성, 최신 라이브러리, 미리보기 개발 전용, Vite 프록시 기본 로컬, single-flight, C3 재작성 | 4.1절 버전, 2.6절 CORS, 3.7절 C3 |

---

## 6. 모순 23건의 처리 결과

조사 종합본이 표시한 모순을 같은 번호로 적고, 어느 결정으로 풀었는지 또는 남았는지 밝힌다.

| # | 모순 | 처리 | 근거 |
|---|---|---|---|
| 1 | "예약 캘린더(예전 대시보드)"의 뜻 — 요청문은 대시보드라 했고, 예전 코드의 대시보드는 토큰을 찍는 빈 페이지, 캘린더는 `/manager/treatments` | **해결.** 인터뷰 2회차가 사실을 바로잡았고, 로그인 뒤 첫 화면을 예약 캘린더로 정했다. 빈 대시보드는 만들지 않는다 | interview.md:55, :86 |
| 2 | 시술 이력 화면이 있는가 — 요청문은 예전 화면이라 했으나 예전 앱에 없음 | **해결.** `GET /treatments` 목록 화면을 새로 만든다(기간·상태·검색 필터, 상태 배지, 쪽 나누기, 기간 선택 컴포넌트 신규) | 결정 6 |
| 3 | 예전 경로 수와 사용자의 8개 목록 — 예전 8개 경로에는 대시보드와 중복 `/login`이 있고 이력이 없음 | **해결.** 사용자의 8개 화면이 기준이다. 대시보드는 빼고, 경로는 plan.md §B.2에서 새로 정한다(약관·개인정보 경로만 유지) | 결정 2, 기본값 |
| 4 | 문서를 닫는 조건의 위치 — 요청문은 main.py:61-65, 실제 조건은 :48-54 | **해결(사실 정정).** 조건은 `api_docs_enabled`(:48-54), :57-65는 경로 인자를 만드는 함수다 | 2.5절 [검증] |
| 5 | HttpOnly 리프레시 쿠키에 백엔드 변경이 필요한가 | **해결.** 백엔드가 이미 HttpOnly·Secure 쿠키를 주고 갱신이 쿠키를 읽는다. 변경 없이 결정 10을 따른다. OWASP와 다른 점(SameSite=None, 본문 토큰)은 기록만 하고 본문 토큰은 저장하지 않는다 | 결정 10, 2.2절 |
| 6 | 어떤 갱신 경로를 쓸까 — 헤더 경로는 제3자 쿠키를 피하지만 JS가 읽을 수 있는 저장이 필요하고, 로그아웃은 쿠키만 읽음 | **해결.** 쿠키 경로만 쓰고 `X-Refresh-Token` 헤더는 쓰지 않는다. 같은 사이트(`*.dongri.kr`) 배포로 제3자 쿠키 문제를 피한다 | 결정 9·10 |
| 7 | FullCalendar 7을 고르면 `style-src 'self'`로 충분한가 — v7은 정적 CSS지만 Radix `react-style-singleton`이 버전과 상관없이 `<style>`을 만든다 | **부분 해결, 일부 남음.** FullCalendar 7을 기본으로 고른다(런타임 `<style>` 주입이 없다). Radix 때문에 스타일 정책은 `'unsafe-inline'`을 허용하는 보수적인 값으로 출시하고, 더 엄격한 정책은 브라우저 확인 뒤의 후속 과제로 남긴다 | 기본값(최신 안정판), plan.md §B.11 |
| 8 | "`--fc-*` 변수"의 뜻 — v6 이름이고 v7은 `--fc-<테마>-*`, `--fc-event-color`로 바뀜 | **해결.** v7 테마 변수에 토큰을 연결한다. C1에 따라 system.md에 새 매핑을 먼저 적는다. design-direction.md §15는 기록이라 고치지 않는다 | 4.5절, plan.md §E |
| 9 | 목표 버전 — 예전 package.json은 react-router 7·FullCalendar 6·MSW 2, 현재 안정판은 8·7·3 | **해결.** 최신 안정판(react-router 8.5.1, FullCalendar 7.1.4, MSW 3.0.4, TanStack Query 5.107.1)을 쓴다. 이전 줄(7.18.5, 6.1.22, 2.15.0)은 참고 정보로만 남긴다. 막혀서 이전 줄로 바꿔야 하면 blocker → 사용자 승인 → SPEC 개정(spec.md C5, 0.2.0) | 인터뷰 기본값, 4.1절 |
| 10 | engines 범위와 필요한 Node 버전 | **해결.** engines를 `^22.22.0 \|\| ^24.0.0`으로 올린다. Orval은 쓰지 않으므로 Orval 조건은 사라졌다 | 인터뷰 기본값, 결정 8 |
| 11 | 상태 라벨 — system.md는 방문함·완료, 백엔드 `status_label`은 "방문 및 시술 완료"·"시술 완료"; 네이티브 라벨을 읽은 관점이 없었다 | **해결.** system.md 라벨을 쓴다. 네이티브 라벨을 직접 확인했다: `components/booking/BookingListScreen.tsx:22-28`이 예약됨·방문함·완료·취소됨·노쇼다 [검증]. 백엔드 `status_label`은 쓰지 않는다 | 인터뷰 기본값 |
| 12 | 방문함과 완료의 뜻 | **해결.** 방문함 = "손님이 와서 시술 중", 완료 = "시술이 끝남(시간이 지나면 백엔드가 자동 전환)". system.md §9에 문구를 먼저 적는다 | 인터뷰 기본값, 2.4절 Celery |
| 13 | 상태 전환 규칙은 누가 지키는가 — 백엔드는 규칙이 없어 다른 클라이언트가 우회할 수 있음 | **해결(위험은 남김).** 화면에서만 지키는 규칙이다. 네이티브 앱 등이 다른 전환을 만들 수 있다는 점은 위험으로 기록한다 | 결정 7 |
| 14 | CORS 허용 주소와 DNS — 허용 목록의 두 주소 모두 `*.dongri.kr`이 아니고 하나는 DNS가 없음 | **해결(범위 밖 의존성).** `dongri.kr` 아래 새 주소를 쓰고, 백엔드 CORS와 테스트 변경은 백엔드 저장소 작업으로 넘긴다. 남았던 정확한 주소 이름은 3회차 인터뷰에서 `admin-beauty.dongri.kr`로 정했다(2026-11-09, 2.9절) | 결정 9·11 |
| 15 | API 주소 — 결정은 `api-beauty.dongri.kr`, `.env`는 죽은 주소, 운영 문서 경로는 404 | **해결.** 새 주소를 `.env.production.example`에 공개 값으로 적고(0.2.0), 검증 빌드는 명령 앞에 `VITE_API_BASE_URL`을 넘긴다. 로컬 `.env`는 각자 고친다(README 안내는 동기화 단계). 스키마는 로컬 내보내기로 얻는다 | 결정 1·8 |
| 16 | QG-12와 이번 범위 — QG-12가 react-router·@fullcalendar를 막는데 이번에 설치함 | **해결.** QG-12를 다시 정의한다(옛 패키지와 v6 FullCalendar 패키지만 막음). `dependency-pins.test.ts` 목록도 바꾼다 | plan.md §D.3 |
| 17 | 예전 오류 메시지 필드 — 타입은 `detail.message`를 선언, 파서는 상태 코드만 봄 | **해결(설계로 무관해짐).** 새 클라이언트는 실제 형식(`detail.code`·`detail.detail`·`detail.hint` + 422 배열)을 읽는다. 백엔드 문서 예시(`common_responses.py:11`)는 따르지 않는다 | 결정 8, plan.md §B.1 |
| 18 | 포커스 링 중복 개수 — 감사 기록은 소스 13·테스트 14, 다시 센 결과는 소스 13·테스트 19 | **남음(사소).** 고치는 방법(내부 상수)은 개수와 상관없다. run 단계에서 grep으로 다시 세어 기록한다 | 후속 과제 7 |
| 19 | `base_price` 하한 — 세부 항목 생성은 > 0, 예약 항목은 0 이상 | **남음(백엔드 사실).** 고칠 모순이 아니라 두 스키마의 차이다. 화면은 각 스키마를 따른다(세부 항목 가격 1 이상, 예약 항목 가격 0 이상 허용 = 무료 시술 가능) | 2.4절 |
| 20 | `PUT /treatments`가 부분 수정인가 | **해결(계약 정리).** 클라이언트는 수정할 때마다 `reserved_at`과 `status`를 함께 보낸다. 항목을 바꾸지 않으면 `treatment_items`를 생략한다 | 2.4절, plan.md §B.4 |
| 21 | 네이티브 앱은 이 두 호출의 본보기가 못 된다(`X-Shop-ID`, `GET /treatments/{id}`) | **해결.** 두 호출을 따라 하지 않는다. 쪽 반복 조회(`MAX_PAGES`)만 선례로 쓴다 | 2.8-14·15 |
| 22 | 커버리지 범위 — 목표는 프로젝트 전체 85, 설정은 ui-core만 | **해결.** `coverage.include`를 앱 코드까지 넓힌다(생성 파일·진입점·테스트 제외) | 인터뷰 "갱신할 게이트", plan.md §D.3 |
| 23 | C3 문구와 실제 방식 | **해결.** C3를 "main 직행, 임시 작업 트리에서 만들고 fast-forward로 합친다"로 다시 쓴다 | 인터뷰 기본값 |

남은 항목은 7(엄격한 스타일 정책), 18(개수 재측정), 19(백엔드 스키마 차이 — 조치 불필요)이다. 14(정확한 운영 주소 이름)는 3회차 인터뷰로 풀렸다.

---

## 7. 찾지 못한 것(증거 없음 — 빈칸을 추측으로 채우지 않는다)

- 백엔드에 커밋된 OpenAPI 스키마, 내보내기 스크립트, 직접 지정한 operationId. (관리자 저장소에 스냅숏을 두는 것이 결정 8의 해법이다.)
- 예전 시술 이력 목록, 예전 404 경로, 예약·메뉴·세부 항목의 예전 생성·수정·삭제 클라이언트.
- 예전 클라이언트의 영속 상태(`persist` 미들웨어, 저장 키).
- 백엔드가 `X-Shop-ID`를 읽는 곳.
- 서버의 예약 상태 전환 규칙.
- `style-src-attr`이 CSSOM 스타일 쓰기에 적용되는지에 대한 권위 있는 출처.
- bash에서 dotenv를 안전하게 읽는 공식 출처(요청이 429로 실패).
- ~~운영 관리자 주소~~ — **해결(2026-11-09).** 3회차 인터뷰에서 `admin-beauty.dongri.kr`로 정했고, 배포 서버 확인으로 이름이 겹치지 않음을 확인했다(2.9절).
- 운영 `APP_ENV`와 토큰 수명 실제 값(예시 파일만 읽었다).
- ~~배포 서버가 모든 경로를 `index.html`로 돌려주는지(SPA 경로 대체)~~ — **해결(2026-11-09).** 지금은 그런 설정이 없지만 nginx 컨테이너에 설정을 더할 수 있음을 읽기 전용으로 확인했다(2.9절). 설정 작업은 plan.md §P(범위 밖).

---

## 8. 확인한 출처 URL

- react-router: https://reactrouter.com/start/modes, https://reactrouter.com/start/data/route-object, https://reactrouter.com/upgrading/v7, https://reactrouter.com/api/components/Link
- TanStack Query 안내: query-cancellation, query-retries, query-invalidation(조사원 원본 `lens-external-docs.md` 기록)
- Orval: https://orval.dev/docs/reference/configuration/output, https://orval.dev/guides/custom-client
- FullCalendar: https://fullcalendar.io/docs/react, https://fullcalendar.io/docs/upgrading-from-v6, https://legacy.fullcalendar.io/v6/css-customization.md, https://unpkg.com/@fullcalendar/react@7.1.4/themes/monarch/theme.css(이번 조사에서 다시 읽음), https://unpkg.com/@fullcalendar/core@6.1.22/internal-common.js, https://unpkg.com/@fullcalendar/react@7.1.4/?meta
- CSP·보안: CSP3 §3.3, MDN `frame-ancestors`·해시 출처, OWASP Session Management·HTML5 Security·JWT Cheat Sheet(조사원 원본 기록)
- npm 레지스트리: `npm view <패키지> version peerDependencies engines dependencies`, `npm view <패키지> dist-tags`, `npm view @fullcalendar/react@7.1.4 exports`(2026-11-09)

---

## 9. 미검증 항목 모음

| 항목 | 이유 | 확인 방법(plan.md 참조) |
|---|---|---|
| 선택 매장을 다른 기기에서 바꾸면 관리자 웹이 영향을 받는다 | Redis 키 구조에서 도출 | 실제 계정으로 두 기기 시험(사용자 검토) |
| 쿠키 경로 기본값 `/` | Starlette 기본값 기준 | 브라우저 개발자 도구 확인 |
| 오프셋 없는 요청 일시가 UTC로 저장된다 | 코드 읽기 기준 | MSW가 아닌 로컬 백엔드 시험(사용자 검토) |
| 네이티브 `bookingPayload.ts:65`의 오프셋 없는 값이 백엔드까지 간다 | 호출 경로 미추적 | 범위 밖. 결과는 관리자 화면 표시에만 영향 |
| react-router 8 데이터 모드 API 이름 | v8 문서 일부만 확인 | M4 사전 점검(타입 검사) |
| openapi-fetch 미들웨어의 재시도 방식과 `credentials` 기본값 | 문서 미확인 | M2 사전 점검 |
| openapi-typescript Node API와 CLI의 출력이 같은가 | 확인 안 함 | 확인할 필요를 없앴다(0.2.0): 동기 시험은 `api:types`와 같은 CLI·옵션을 그대로 실행한다 |
| `vite.config.ts` `test.env.TZ`가 vitest 작업자의 `Intl`까지 닿는가 | 확인 안 함 | M1 사전 점검, `TZ=UTC npx vitest run src/test/timezone.test.ts`로 증명 |
| Vite 8(Rolldown)이 모듈 범위 `import.meta.env.DEV` 분기의 동적 가져오기를 운영 빌드에서 지우는가 | 확인 안 함 | M4의 QG-18 JS 검사 |
| FullCalendar 7 테마 객체 가져오기 방식, temporal-polyfill 자동 적용 | 문서 일부만 확인 | M7 사전 점검 |
| FullCalendar 7의 jsdom 렌더링 가능성 | 확인 안 함 | M7 첫 RED 테스트 |
| `style-src-attr`과 CSSOM | 권위 있는 출처 없음 | 사용자 검토 브라우저 시험 |
| http://localhost에서 Secure 쿠키 저장(Vite 프록시 경유) | 브라우저 정책 일반 지식 | 사용자 검토 |
| 개발 서버가 인라인 스크립트를 넣는다 | Vite·React 플러그인 일반 지식 | M8에서 `vite` 실행 HTML 확인 |
| 429 응답 본문 모양 | 확인 안 함 | 오류 정규화가 형식과 상관없이 상태 코드로 처리 |
| Monarch 포커스 링이 고대비 모드에서 사라진다 | 일반 규칙 | system.md 개정에서 outline 덮어쓰기로 대응 |
