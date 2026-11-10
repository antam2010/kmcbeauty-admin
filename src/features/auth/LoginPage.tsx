// 로그인 화면(plan.md §B.13, AC-UI-002-11). 문구는 acceptance.md §3.2(필드별 앱 문구·화면별 문구)와 같은 글자다.
// 성공하면 선택 매장을 확인해 규칙을 통과한 next 또는 /reservations(매장 있음), next를 그대로 실은 /shops(매장 없음)로 간다.
// 기본 계정 값을 넣지 않는다(예전 앱 28c87a9:src/manager/pages/auth/LoginPage.tsx:7-8의 문제를 옮기지 않음).
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ApiError, SERVER_ERROR_MESSAGE } from "@/api/errors";
import { nextDestination } from "@/app/safe-next";
import { useServices, useSessionExpiredNotice } from "@/app/services";
import { selectedShopQueryOptions } from "@/features/shops/queries";
import { type FormErrors, useForm } from "@/lib/form";
import { Alert, Button, Card, Field, Input } from "@/ui-core";
import { useLogin } from "./queries";

interface LoginValues {
  email: string;
  password: string;
}

// acceptance.md §3.2 이메일 형식 규칙: 앞뒤 공백을 자른 값이 이 정규식에 맞으면 형식이 맞다
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_EXPIRED_MESSAGE = "로그인이 만료됐어요. 다시 로그인해 주세요.";

function validate({ email, password }: LoginValues): FormErrors {
  const trimmed = email.trim();
  return {
    email:
      trimmed === ""
        ? "이메일을 입력해 주세요."
        : EMAIL_PATTERN.test(trimmed)
          ? undefined
          : "이메일 형식을 확인해 주세요.",
    password: password === "" ? "비밀번호를 입력해 주세요." : undefined,
  };
}

/**
 * 로그인 실패 문구. 401·429는 로그인 화면 전용 문구, 그 밖에는 정규화한 문구(네트워크 포함)다.
 * access_token 없는 응답(EC-04)은 클라이언트가 만든 status라 status로 가르지 않고 정규화 문구를 그대로 쓴다(M2 일탈 8).
 * 백엔드 hint는 개발자용 글이라 보이지 않는다(사용자 결정 F3).
 */
function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.kind === "http") {
    if (error.status === 401) return "이메일이나 비밀번호가 맞지 않아요.";
    if (error.status === 429) return "로그인 시도가 많아요. 1분 뒤 다시 시도해 주세요.";
  }
  return error instanceof ApiError ? error.message : SERVER_ERROR_MESSAGE;
}

export function LoginPage() {
  const { client, queryClient, sessionNotice } = useServices();
  const expired = useSessionExpiredNotice();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  const login = useLogin(client);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** 매장이 있으면 next(규칙 통과) 또는 /reservations, 매장이 없으면 next를 그대로 실은 /shops. */
  const destination = async (): Promise<string> => {
    try {
      await queryClient.fetchQuery(selectedShopQueryOptions(client));
    } catch (error) {
      if (error instanceof ApiError && error.code === "SHOP_NOT_SELECTED") {
        return next === null ? "/shops" : `/shops?next=${encodeURIComponent(next)}`;
      }
      // 그 밖의 확인 실패는 목적지 loader가 다시 확인해 경로 오류 화면으로 보인다
    }
    return nextDestination(next, window.location.origin);
  };

  const form = useForm<LoginValues>({
    initialValues: { email: "", password: "" },
    validate,
    onSubmit: async ({ email, password }) => {
      setSubmitError(null);
      try {
        await login.mutateAsync({ email: email.trim(), password });
      } catch (error) {
        setSubmitError(loginErrorMessage(error));
        return;
      } finally {
        // 변경 캐시가 비밀번호(variables)를 붙잡지 않게 관찰자를 바로 뗀다(gcTime 0과 함께, 감사 결함 F4)
        login.reset();
      }
      sessionNotice.clear();
      navigate(await destination(), { replace: true });
    },
  });

  const email = form.register("email");
  const password = form.register("password");

  return (
    <section className="mx-auto flex w-full max-w-dialog-sm flex-col gap-6 py-12">
      <Card className="flex flex-col gap-6 p-6">
        <h1 className="text-heading font-bold text-foreground">로그인</h1>
        {expired ? <Alert tone="warning">{SESSION_EXPIRED_MESSAGE}</Alert> : null}
        {submitError ? (
          <Alert tone="destructive" live>
            {submitError}
          </Alert>
        ) : null}
        <form
          noValidate
          onSubmit={(event) => void form.handleSubmit(event)}
          className="flex flex-col gap-5"
        >
          <Field label="이메일" error={form.error("email")} required>
            <Input
              type="email"
              autoComplete="username"
              name={email.name}
              value={form.values.email}
              onChange={email.onChange}
              onBlur={email.onBlur}
              ref={email.ref}
            />
          </Field>
          <Field label="비밀번호" error={form.error("password")} required>
            <Input
              type="password"
              autoComplete="current-password"
              name={password.name}
              value={form.values.password}
              onChange={password.onChange}
              onBlur={password.onBlur}
              ref={password.ref}
            />
          </Field>
          <Button type="submit" loading={form.submitting}>
            로그인
          </Button>
        </form>
      </Card>
      <div className="flex justify-center gap-4 text-body-sm">
        <Link
          to="/terms-of-service"
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          이용약관
        </Link>
        <Link
          to="/privacy-policy"
          className="text-muted-foreground underline-offset-4 hover:underline"
        >
          개인정보처리방침
        </Link>
      </div>
    </section>
  );
}
