import { matchNamedMessage, matchPatternMessage } from "./message-patterns";
import { EXACT_MESSAGES } from "./message-dict";

const LOCALIZED_CONSTANTS = new Set(
  Object.values(EXACT_MESSAGES).flatMap((text) => [text, text.replace(/。$/, "")]),
);

const RECOVERY_SEPARATORS = [
  ["; restoring previous layout failed: ", "；还原先前的布局失败："],
  ["; audio recovery failed: ", "；音频恢复失败："],
  ["; settings recovery failed: ", "；设置恢复失败："],
  ["; recovery failed: ", "；恢复失败："],
] as const;

function localizeCore(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "";
  if (LOCALIZED_CONSTANTS.has(trimmed)) return trimmed;

  const restoredSuffix = ". The previous settings were restored.";
  if (trimmed.endsWith(restoredSuffix)) {
    const prefix = trimmed.slice(0, -restoredSuffix.length);
    return `${localizeCore(prefix).replace(/。$/, "")}。已还原先前的设置。`;
  }
  const recoveryPendingSuffix = ". Recovery is pending.";
  if (trimmed.endsWith(recoveryPendingSuffix)) {
    const prefix = trimmed.slice(0, -recoveryPendingSuffix.length);
    return `${localizeCore(prefix).replace(/。$/, "")}。正在等待恢复。`;
  }

  if (trimmed.startsWith("backend error: ")) {
    const localized = localizeCore(trimmed.slice("backend error: ".length));
    if (localized.startsWith("后端错误：")) return localized;
    const detail = localized.startsWith("错误：")
      ? localized.slice("错误：".length)
      : localized;
    return `后端错误：${detail}`;
  }
  if (trimmed.startsWith("validation error: ")) {
    return localizeCore(trimmed.slice("validation error: ".length));
  }
  if (trimmed.startsWith("not found: ")) {
    const inner = trimmed.slice("not found: ".length);
    const direct = matchPatternMessage(inner);
    return direct
      ? direct.startsWith("未找到") ? direct : `未找到${direct}`
      : `未找到：${inner}`;
  }

  const named = matchNamedMessage(trimmed);
  if (named) return named;

  // Split the first program-defined boundary before broad diagnostic patterns.
  // Recursion also handles multiple recovery failures in one error chain.
  let boundary = -1;
  let separator: (typeof RECOVERY_SEPARATORS)[number] | undefined;
  for (const candidate of RECOVERY_SEPARATORS) {
    const index = trimmed.indexOf(candidate[0]);
    if (index >= 0 && (boundary < 0 || index < boundary)) {
      boundary = index;
      separator = candidate;
    }
  }
  if (separator) {
    return `${localizeCore(trimmed.slice(0, boundary)).replace(/。$/, "")}${separator[1]}${localizeCore(trimmed.slice(boundary + separator[0].length))}`;
  }

  const direct = matchPatternMessage(trimmed);
  if (direct) return direct;

  if (trimmed.startsWith("io error: ")) {
    return `I/O 错误：${trimmed.slice("io error: ".length)}`;
  }
  if (trimmed.startsWith("json error: ")) {
    return `JSON 解析错误：${trimmed.slice("json error: ".length)}`;
  }

  // Unknown OS/driver diagnostics remain intact after a Chinese error label.
  if (/^[\u4e00-\u9fa5]/.test(trimmed)) return trimmed;
  return `错误：${trimmed}`;
}

export function localizeBackendMessage(raw: unknown): string {
  if (raw == null) return "";
  const message = (
    raw instanceof Error ? raw.message : typeof raw === "string" ? raw : String(raw)
  ).trim();
  if (!message) return "";

  return localizeCore(message);
}

export function localizeReason(
  reason: string | null | undefined,
): string | null {
  return reason?.trim() ? localizeBackendMessage(reason) : null;
}
