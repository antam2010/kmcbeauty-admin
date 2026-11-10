// 사용자 메뉴(system.md §10): Popover 안에 이름·역할·이메일, "매장 변경", "로그아웃".
// 항목이 둘뿐이라 메뉴 역할(roving focus) 컴포넌트를 들이지 않는다(plan.md §B.13 기본값).
import { CircleUser } from "lucide-react";
import { useNavigate } from "react-router";
import { useServices } from "@/app/services";
import { logout, useMe } from "@/features/auth/queries";
import { Button, Popover } from "@/ui-core";

export function AccountMenu() {
  const { client, queryClient, sessionNotice } = useServices();
  const me = useMe(client);
  const navigate = useNavigate();

  const onLogout = () => {
    // 응답을 기다리지 않고 바로 세션·캐시를 비운다(REQ-UI-002-007). 직접 로그아웃이므로 만료 안내는 끈다
    logout(client, queryClient);
    sessionNotice.clear();
    void navigate("/login", { replace: true });
  };

  return (
    <Popover
      aria-label="사용자 메뉴"
      trigger={
        <Button variant="ghost" size="icon" aria-label="사용자 메뉴">
          <CircleUser />
        </Button>
      }
    >
      {me.data ? (
        <div className="flex flex-col gap-0.5 px-1 pb-2">
          <p className="text-body font-semibold text-foreground">{me.data.name}</p>
          {me.data.role_name ? (
            <p className="text-caption text-muted-foreground">{me.data.role_name}</p>
          ) : null}
          <p className="text-body-sm text-muted-foreground">{me.data.email}</p>
        </div>
      ) : null}
      <Button variant="outline" size="sm" onClick={() => void navigate("/shops")}>
        매장 변경
      </Button>
      <Button variant="ghost" size="sm" onClick={onLogout}>
        로그아웃
      </Button>
    </Popover>
  );
}
