import { useEffect } from "react";

type SecurityEventType = "copy" | "paste" | "context_menu" | "tab_hidden" | "fullscreen_exit";

export default function QuizSecurityGuard({ active, onEvent }: { active: boolean; onEvent: (event: SecurityEventType) => void }) {
  useEffect(() => {
    if (!active) return;
    const block = (type: "copy" | "paste" | "context_menu") => (event: Event) => { event.preventDefault(); onEvent(type); };
    const onCopy = block("copy");
    const onPaste = block("paste");
    const onContextMenu = block("context_menu");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F12" || ((event.ctrlKey || event.metaKey) && ["c", "v", "u", "p"].includes(event.key.toLowerCase()))) {
        event.preventDefault();
        onEvent(event.key.toLowerCase() === "v" ? "paste" : "copy");
      }
    };
    const onVisibility = () => { if (document.hidden) onEvent("tab_hidden"); };
    const onFullscreen = () => { if (!document.fullscreenElement) onEvent("fullscreen_exit"); };
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [active, onEvent]);
  return null;
}
