// localStorage에 문자열 하나를 저장하는 상태 훅(사이드바 접힘 kmc-admin-sidebar, plan.md §B.13).
// 허용 목록 밖의 저장값은 버린다. 저장소 접근 예외(사생활 보호 모드 등)는 테마 저장처럼 삼키고 메모리 값으로 동작한다(EC-07).
import { useState } from "react";

function read<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  try {
    const stored = window.localStorage.getItem(key);
    return allowed.find((value) => value === stored) ?? fallback;
  } catch {
    return fallback;
  }
}

export function usePersistedState<T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[],
): [T, (value: T) => void] {
  const [value, setValue] = useState(() => read(key, fallback, allowed));
  const update = (next: T) => {
    setValue(next);
    try {
      window.localStorage.setItem(key, next);
    } catch {
      // 저장하지 못해도 이번 화면에서는 고른 값을 쓴다
    }
  };
  return [value, update];
}
