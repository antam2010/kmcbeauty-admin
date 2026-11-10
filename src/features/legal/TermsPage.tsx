// 이용약관. 예전 앱(28c87a9:src/manager/pages/policy/TermsOfServicePage.tsx) 문구를 그대로 옮겼다 — 문구 수정은 범위 밖이고
// 원문 문체(합니다체)를 지킨다(acceptance.md §3.9, C4). 예전 파일은 <br /><br />로 나눈 문단을 여기서는 문단마다 <p>로 쓴다.
import { LegalDocument } from "./LegalDocument";

const PARAGRAPHS = [
  "본 서비스는 무료로 제공되며, 누구나 이메일과 별명을 통해 회원 가입할 수 있습니다.",
  "운영자는 서비스의 일부 또는 전부를 사전 통보 없이 변경하거나 종료할 수 있으며, 서비스 종료 시 사용자의 데이터는 파기 또는 요청 시 반환됩니다.",
  "사용자는 언제든지 자신의 정보를 열람, 수정, 삭제할 수 있으며, 본 약관은 향후 필요에 따라 수정될 수 있습니다.",
];

export function TermsPage() {
  return <LegalDocument title="이용약관" paragraphs={PARAGRAPHS} />;
}
