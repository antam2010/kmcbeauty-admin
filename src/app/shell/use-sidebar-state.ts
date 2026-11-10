// 사이드바 상태(system.md §10 반응형, design.md §3.3).
// 1024px 이상: 사용자 선택을 localStorage kmc-admin-sidebar에 저장하고 따른다(기본 펼침).
// 768~1023px: 들어올 때마다 접힘으로 시작하고, 펼치거나 접어도 저장하지 않는다.
// 768px 미만: 사이드바 대신 서랍. 경로가 바뀌면 서랍을 닫는다(AppShell).
import { useState } from "react";
import { useMediaQuery } from "@/lib/use-media-query";
import { usePersistedState } from "@/lib/use-persisted-state";

const STORAGE_KEY = "kmc-admin-sidebar";
const STORED_VALUES = ["expanded", "collapsed"] as const;

export type SidebarBand = "wide" | "medium" | "narrow";

export function useSidebarState() {
  const wide = useMediaQuery("(min-width: 1024px)");
  const medium = useMediaQuery("(min-width: 768px)");
  const band: SidebarBand = wide ? "wide" : medium ? "medium" : "narrow";
  const [stored, setStored] = usePersistedState(STORAGE_KEY, "expanded", STORED_VALUES);
  // 768~1023px 구간의 펼침은 그 구간에 머무는 동안만 산다. 구간이 바뀌면 처음(접힘)으로 돌아간다
  const [mediumExpanded, setMediumExpanded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lastBand, setLastBand] = useState(band);
  if (band !== lastBand) {
    // 렌더링 중 상태 조정(효과 없이): 구간이 바뀐 첫 렌더에서 구간 지역 상태를 처음으로 돌린다
    setLastBand(band);
    setMediumExpanded(false);
    setDrawerOpen(false);
  }

  const collapsed = band === "wide" ? stored === "collapsed" : band === "medium" && !mediumExpanded;

  const toggle = () => {
    if (band === "wide") setStored(collapsed ? "expanded" : "collapsed");
    else if (band === "medium") setMediumExpanded(!mediumExpanded);
    else setDrawerOpen(true);
  };

  return { band, collapsed, toggle, drawerOpen, setDrawerOpen };
}
