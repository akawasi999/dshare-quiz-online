import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { URL } from "node:url";
import { fetchTranscript } from "youtube-transcript";

const maxRemoteBytes = 1_500_000;
const maxSourceCharacters = 45_000;

export type RemoteQuizSource = { sourceName: string; sourceUrl: string; text: string; sourceType: "youtube" | "web" };

function isPrivateAddress(address: string) {
  if (isIP(address) === 4) {
    const [first, second] = address.split(".").map(Number);
    return first === 10 || first === 127 || first === 0 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
  }
  const normalized = address.toLowerCase();
  return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
}

async function assertPublicHttpUrl(rawUrl: string) {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new Error("URL không hợp lệ."); }
  if (!/^https?:$/.test(url.protocol)) throw new Error("Chỉ hỗ trợ URL http hoặc https.");
  const hostname = url.hostname.toLowerCase();
  if (!hostname || hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) throw new Error("Không hỗ trợ địa chỉ nội bộ.");
  if (isIP(hostname)) { if (isPrivateAddress(hostname)) throw new Error("Không hỗ trợ địa chỉ nội bộ."); return url; }
  const addresses = await lookup(hostname, { all: true });
  if (!addresses.length || addresses.some(entry => isPrivateAddress(entry.address))) throw new Error("URL trỏ tới địa chỉ nội bộ không được hỗ trợ.");
  return url;
}

function cleanText(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>|<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/\s{2,}/g, " ").trim();
}

function parsePageTitle(html: string, fallback: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return cleanText(match?.[1] ?? fallback).slice(0, 160) || fallback;
}

async function readResponse(response: Response) {
  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > maxRemoteBytes) throw new Error("Trang web quá lớn để trích xuất. Hãy dùng bài viết ngắn hơn hoặc tệp nguồn.");
  const reader = response.body?.getReader();
  if (!reader) return "";
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxRemoteBytes) { await reader.cancel(); throw new Error("Trang web quá lớn để trích xuất. Hãy dùng bài viết ngắn hơn hoặc tệp nguồn."); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

async function fetchPublicPage(initialUrl: URL, signal: AbortSignal) {
  let currentUrl = initialUrl;
  for (let redirectCount = 0; redirectCount < 4; redirectCount += 1) {
    const response = await fetch(currentUrl, { headers: { "user-agent": "DshareQuizBot/1.0 (+https://dshare.quiz)" }, redirect: "manual", signal });
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, finalUrl: currentUrl };
    const location = response.headers.get("location");
    if (!location) throw new Error("Trang web chuyển hướng không hợp lệ.");
    currentUrl = await assertPublicHttpUrl(new URL(location, currentUrl).toString());
  }
  throw new Error("Trang web chuyển hướng quá nhiều lần.");
}

function isYouTubeHost(host: string) { return host === "youtu.be" || host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com"); }

export async function extractRemoteQuizSource(rawUrl: string): Promise<RemoteQuizSource> {
  const url = await assertPublicHttpUrl(rawUrl);
  if (isYouTubeHost(url.hostname.toLowerCase())) {
    const transcript = await fetchTranscript(url.toString(), { lang: "vi" }).catch(async () => fetchTranscript(url.toString()));
    const text = transcript.map(item => item.text).join(" ").replace(/\s{2,}/g, " ").trim();
    if (text.length < 80) throw new Error("Không tìm được phụ đề đủ nội dung từ video YouTube này. Hãy kiểm tra video có phụ đề công khai.");
    return { sourceName: `YouTube · ${url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).at(-1) ?? "video"}`, sourceUrl: url.toString(), text: text.slice(0, maxSourceCharacters), sourceType: "youtube" };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const { response, finalUrl } = await fetchPublicPage(url, controller.signal);
    if (!response.ok) throw new Error(`Không thể đọc trang web (HTTP ${response.status}).`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) throw new Error("URL cần trỏ tới một trang HTML hoặc văn bản công khai.");
    const rawHtml = await readResponse(response);
    const text = cleanText(rawHtml).slice(0, maxSourceCharacters);
    if (text.length < 160) throw new Error("Không trích xuất được đủ nội dung từ trang web này. Hãy dùng bài viết công khai có văn bản đầy đủ.");
    return { sourceName: parsePageTitle(rawHtml, finalUrl.hostname), sourceUrl: finalUrl.toString(), text, sourceType: "web" };
  } finally { clearTimeout(timeout); }
}
