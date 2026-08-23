import { Bold, Heading2, Italic, List, ListOrdered, Quote, Underline } from "lucide-react";
import { useEffect, useRef } from "react";

type Action = { command: string; label: string; icon: typeof Bold; value?: string };
const actions: Action[] = [
  { command: "bold", label: "In đậm", icon: Bold },
  { command: "italic", label: "In nghiêng", icon: Italic },
  { command: "underline", label: "Gạch chân", icon: Underline },
  { command: "formatBlock", value: "h2", label: "Tiêu đề", icon: Heading2 },
  { command: "insertUnorderedList", label: "Danh sách dấu đầu dòng", icon: List },
  { command: "insertOrderedList", label: "Danh sách đánh số", icon: ListOrdered },
  { command: "formatBlock", value: "blockquote", label: "Trích dẫn", icon: Quote },
];

export default function RichTextEditor({ label, value, onChange, minHeight = "18rem" }: { label: string; value: string; onChange: (value: string) => void; minHeight?: string }) {
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => { if (editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = value; }, [value]);
  const execute = (action: Action) => { editor.current?.focus(); document.execCommand(action.command, false, action.value); onChange(editor.current?.innerHTML ?? ""); };
  return <div className="overflow-hidden rounded-[var(--radius-md-token)] border border-border bg-background focus-within:ring-2 focus-within:ring-primary/35"><div role="toolbar" aria-label={`Định dạng ${label}`} className="flex flex-wrap gap-1 border-b border-border bg-muted/45 p-2">{actions.map(action => { const Icon = action.icon; return <button key={`${action.command}-${action.value ?? ""}`} type="button" onMouseDown={event => event.preventDefault()} onClick={() => execute(action)} title={action.label} aria-label={action.label} className="grid size-8 place-items-center rounded-md text-text-secondary transition-colors hover:bg-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Icon size={15} /></button>; })}</div><div ref={editor} role="textbox" aria-label={label} aria-multiline="true" contentEditable suppressContentEditableWarning onInput={event => onChange(event.currentTarget.innerHTML)} data-placeholder="Nhập nội dung…" className="rich-text-editor-content px-4 py-3 text-sm leading-7 text-foreground outline-none" style={{ minHeight }} /></div>;
}
