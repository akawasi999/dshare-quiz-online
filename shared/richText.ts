const allowedTags = /<(\/?)(p|br|strong|b|em|i|u|ul|ol|li|h2|h3|blockquote)>/i;

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

export function plainTextToRichHtml(value: string) {
  if (/<\/?[a-z][\s\S]*>/i.test(value)) return value;
  return value.split(/\n{2,}/).map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`).join("");
}

export function sanitizeRichTextHtml(value: string) {
  const withoutScripts = value.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  const withoutAttributes = withoutScripts.replace(/\s+(on\w+|style|src|href)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  const stripped = withoutAttributes.replace(/<[^>]*>/g, tag => allowedTags.test(tag) ? tag.toLowerCase() : "");
  return stripped.replace(/<p>\s*<\/p>/gi, "").trim();
}

export function richTextToPlainText(value: string) {
  return value.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|h2|h3|li|blockquote)>/gi, "\n").replace(/<[^>]*>/g, "").replace(/\n{3,}/g, "\n\n").trim();
}
