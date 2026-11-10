// 폼 훅 단위 시험(AC-UI-002-22 폼 단위 부분, design.md §8).
// 시점 규칙: 처음 숨김 → 떠남(blur)·제출 뒤 표시 → 이후 값이 바뀔 때마다 다시 검사.
// 서버 오류: 필드별 앱 문구가 있으면 그 문구, 없으면 백엔드 msg.
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type FormErrors, useForm } from "./form";

interface Values {
  email: string;
  password: string;
}

const validate = (values: Values): FormErrors => ({
  email: values.email.trim() === "" ? "이메일을 입력해 주세요." : undefined,
  password: values.password === "" ? "비밀번호를 입력해 주세요." : undefined,
});

const inputs: HTMLInputElement[] = [];

/** 등록 순서대로 실제 입력 요소를 붙인다(포커스 판정용). */
function attach(form: ReturnType<typeof useForm<Values>>, ...names: (keyof Values)[]) {
  for (const name of names) {
    const input = document.createElement("input");
    document.body.append(input);
    inputs.push(input);
    form.register(name).ref(input);
  }
}

afterEach(() => {
  for (const input of inputs.splice(0)) input.remove();
});

function setup(onSubmit: (values: Values) => Promise<void> | void = () => undefined) {
  return renderHook(() =>
    useForm<Values>({ initialValues: { email: "", password: "" }, validate, onSubmit }),
  );
}

const change = (value: string) => ({ target: { value } });

describe("useForm 검증 시점", () => {
  it("처음에는 오류를 숨기고, 값을 쳤다 지워도 떠나기 전에는 숨긴다", () => {
    const { result } = setup();
    expect(result.current.error("email")).toBeUndefined();
    act(() => result.current.register("email").onChange(change("a")));
    act(() => result.current.register("email").onChange(change("")));
    expect(result.current.error("email")).toBeUndefined();
  });

  it("필드를 떠나면 그 필드의 오류만 보인다", () => {
    const { result } = setup();
    act(() => result.current.register("email").onBlur());
    expect(result.current.error("email")).toBe("이메일을 입력해 주세요.");
    expect(result.current.error("password")).toBeUndefined();
  });

  it("떠난 뒤에는 값이 바뀔 때마다 다시 검사한다", () => {
    const { result } = setup();
    act(() => result.current.register("email").onBlur());
    act(() => result.current.register("email").onChange(change("a@b.co")));
    expect(result.current.error("email")).toBeUndefined();
    act(() => result.current.register("email").onChange(change(" ")));
    expect(result.current.error("email")).toBe("이메일을 입력해 주세요.");
  });

  it("제출하면 모든 필드의 오류가 보이고, onSubmit을 부르지 않으며, 등록 순서상 첫 오류 필드로 포커스가 간다", async () => {
    const onSubmit = vi.fn();
    const { result } = setup(onSubmit);
    attach(result.current, "email", "password");
    act(() => result.current.register("email").onChange(change("a@b.co")));

    await act(() => result.current.handleSubmit());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(result.current.error("email")).toBeUndefined();
    expect(result.current.error("password")).toBe("비밀번호를 입력해 주세요.");
    expect(document.activeElement).toBe(inputs[1]);
  });

  it("오류가 둘이면 먼저 등록한 필드로 포커스가 간다", async () => {
    const { result } = setup();
    attach(result.current, "email", "password");
    await act(() => result.current.handleSubmit());
    expect(document.activeElement).toBe(inputs[0]);
  });

  it("제출 뒤에는 떠나지 않아도 값이 바뀔 때마다 다시 검사한다", async () => {
    const { result } = setup();
    await act(() => result.current.handleSubmit());
    act(() => result.current.register("password").onChange(change("x")));
    expect(result.current.error("password")).toBeUndefined();
    act(() => result.current.register("password").onChange(change("")));
    expect(result.current.error("password")).toBe("비밀번호를 입력해 주세요.");
  });

  it("오류가 없으면 값으로 onSubmit을 부르고 그 동안 submitting이 true다", async () => {
    let finish: () => void = () => undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { result } = setup(onSubmit);
    act(() => result.current.register("email").onChange(change("a@b.co")));
    act(() => result.current.register("password").onChange(change("x")));

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.handleSubmit();
    });
    expect(result.current.submitting).toBe(true);
    await act(async () => {
      finish();
      await pending;
    });

    expect(onSubmit).toHaveBeenCalledWith({ email: "a@b.co", password: "x" });
    expect(result.current.submitting).toBe(false);
  });

  it("제출 이벤트를 받으면 기본 동작(문서 이동)을 막는다", async () => {
    const { result } = setup();
    const preventDefault = vi.fn();
    await act(() => result.current.handleSubmit({ preventDefault }));
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("값이 처음 값과 다르면 dirty다", () => {
    const { result } = setup();
    expect(result.current.dirty).toBe(false);
    act(() => result.current.setValue("email", "a"));
    expect(result.current.dirty).toBe(true);
    expect(result.current.values.email).toBe("a");
  });
});

describe("useForm 서버 오류", () => {
  it("필드별 앱 문구가 있으면 그 문구, 없으면 백엔드 msg를 그 필드 오류로 보이고 첫 필드로 포커스한다", async () => {
    const { result } = setup();
    attach(result.current, "email", "password");
    let applied = false;
    act(() => {
      applied = result.current.setServerErrors(
        {
          password: "String should have at most 20 characters",
          email: "value is not a valid email",
        },
        (name) => (name === "email" ? "이메일 형식을 확인해 주세요." : undefined),
      );
    });
    expect(applied).toBe(true);
    expect(result.current.error("email")).toBe("이메일 형식을 확인해 주세요.");
    expect(result.current.error("password")).toBe("String should have at most 20 characters");
    expect(document.activeElement).toBe(inputs[0]);
  });

  it("값이 바뀌면 그 필드의 서버 오류를 지우고 클라이언트 검사로 돌아간다", () => {
    const { result } = setup();
    act(() => {
      result.current.setServerErrors({ email: "이미 등록된 이메일" });
    });
    expect(result.current.error("email")).toBe("이미 등록된 이메일");
    act(() => result.current.register("email").onChange(change("b@b.co")));
    expect(result.current.error("email")).toBeUndefined();
  });

  it("등록한 필드와 맞는 키가 없으면 false를 돌려준다(부르는 쪽이 Alert로 보인다)", () => {
    const { result } = setup();
    attach(result.current, "email");
    let applied = true;
    act(() => {
      applied = result.current.setServerErrors({ "query.page": "bad" });
    });
    expect(applied).toBe(false);
  });

  it("경로 이름(treatment_items.0.base_price) 필드의 값을 읽고 쓴다", () => {
    const { result } = renderHook(() =>
      useForm({
        initialValues: { treatment_items: [{ base_price: 0 as number | null }] },
        onSubmit: () => undefined,
      }),
    );
    act(() => result.current.register("treatment_items.0.base_price").onChange(1200));
    expect(result.current.register("treatment_items.0.base_price").value).toBe(1200);
    act(() => {
      result.current.setServerErrors({
        "treatment_items.0.base_price": "Input should be greater than or equal to 0",
      });
    });
    expect(result.current.error("treatment_items.0.base_price")).toBe(
      "Input should be greater than or equal to 0",
    );
  });
});
