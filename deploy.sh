#!/bin/bash

# 배포 중지 가드(SPEC-UI-001 M1 ~ SPEC-UI-002 완료): 이 기간의 앱은 컴포넌트 미리보기 한 페이지뿐이다.
# ALLOW_PREVIEW_ONLY_DEPLOY가 정확히 1일 때만 아래 배포 단계를 실행한다. SPEC-UI-002가 업무 화면을 되살릴 때 지운다.
if [ "${ALLOW_PREVIEW_ONLY_DEPLOY:-}" != "1" ]; then
  echo "[deploy] 배포를 중지했습니다. SPEC-UI-002가 완료될 때까지 이 앱은 컴포넌트 미리보기 전용입니다." >&2
  echo "[deploy] 미리보기만 배포하려면 ALLOW_PREVIEW_ONLY_DEPLOY=1을 지정해 다시 실행하십시오." >&2
  exit 1
fi

# .env.stage 파일 로딩
set -a  # export 자동
. .env.stage
set +a  # export 자동 종료

# 필수 환경변수 체크
: "${SCP_USER:?SCP_USER 환경변수가 설정되지 않았습니다}"
: "${SCP_HOST:?SCP_HOST 환경변수가 설정되지 않았습니다}"
: "${SCP_DIR:?SCP_DIR 환경변수가 설정되지 않았습니다}"
: "${SCP_PORT:?SCP_PORT 환경변수가 설정되지 않았습니다}"

echo "[build] 빌드 시작"
npm run build -- --mode stage

if [ $? -ne 0 ]; then
  echo "[build] 빌드 실패"
  exit 1
fi

echo "[build] 빌드 완료"

echo "[deploy] 파일 전송 시작"
scp -P "$SCP_PORT" -r ./dist/* "$SCP_USER@$SCP_HOST:$SCP_DIR"

if [ $? -ne 0 ]; then
  echo "[deploy] 파일 전송 실패"
  exit 1
fi

echo "[deploy] 파일 전송 완료"
