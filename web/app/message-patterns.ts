import { EXACT_MESSAGES, AUDIO_OPERATIONS } from "./message-dict";

function translateDifference(diff: string): string {
  const rotationMatch = diff.match(/^rotation: requested (.+), observed (.+)$/);
  if (rotationMatch) {
    return `方向：请求 ${rotationMatch[1]}，实际 ${rotationMatch[2]}`;
  }
  const posMatch = diff.match(/^position: requested \(([^)]+)\), observed \(([^)]+)\)$/);
  if (posMatch) {
    return `位置：请求 (${posMatch[1]})，实际 (${posMatch[2]})`;
  }
  const resMatch = diff.match(/^resolution: requested ([^,]+), observed ([^,]+)$/);
  if (resMatch) {
    return `分辨率：请求 ${resMatch[1]}，实际 ${resMatch[2]}`;
  }
  const rateMatch = diff.match(/^refresh rate \(mHz\): requested (\d+), observed (\d+)$/);
  if (rateMatch) {
    return `刷新率 (mHz)：请求 ${rateMatch[1]}，实际 ${rateMatch[2]}`;
  }
  const primaryMatch = diff.match(/^primary: requested (true|false), observed (true|false)$/);
  if (primaryMatch) {
    return `主显示器：请求 ${primaryMatch[1] === "true" ? "是" : "否"}，实际 ${primaryMatch[2] === "true" ? "是" : "否"}`;
  }
  const hdrMatch = diff.match(/^HDR: requested (.+), observed (.+)$/);
  if (hdrMatch) {
    return `HDR：请求 ${hdrMatch[1]}，实际 ${hdrMatch[2]}`;
  }
  const scaleMatch = diff.match(/^scaling \(%\): requested (.+), observed (.+)$/);
  if (scaleMatch) {
    return `缩放 (%)：请求 ${scaleMatch[1]}，实际 ${scaleMatch[2]}`;
  }
  return diff;
}

function formatShortcutTarget(target: string): string {
  const profileMatch = target.match(/^profile '([\s\S]+)'$/);
  if (profileMatch) {
    return `配置方案“${profileMatch[1]}”`;
  }
  const displayMatch = target.match(/^display '([\s\S]+)'$/);
  if (displayMatch) {
    return `显示器“${displayMatch[1]}”`;
  }
  return target;
}

// Resolve names before splitting recovery chains so punctuation inside names is retained.
export function matchNamedMessage(message: string): string | null {
  let m: RegExpMatchArray | null;
  m = message.match(/^profile '([\s\S]+)'$/);
  if (m) return `配置方案“${m[1]}”`;

  const displaySuffix = ") is not connected right now: Windows does not report it as an available display. turn it on or reconnect it and try again, or re-save the profile without it";
  if (message.indexOf(displaySuffix) === message.length - displaySuffix.length) {
    m = message.match(/^display (?:'([\s\S]+?)' )?\(target_id=(\d+), edid_hash=([^)]+)\) is not connected right now: Windows does not report it as an available display\. turn it on or reconnect it and try again, or re-save the profile without it$/);
    if (m) {
      const name = m[1] ? `'${m[1]}' ` : "";
      return `显示器 ${name}(target_id=${m[2]}, edid_hash=${m[3]}) 当前未连接：Windows 未将其报告为可用显示器。请将其开启或重新连接后再试，或在不包含该显示器的情况下重新保存配置方案。`;
    }
  }

  const audioSuffix = "' is unavailable. Turn on or reconnect the device, enable it in Windows Sound settings, or select another output for this profile";
  if (message.indexOf(audioSuffix) === message.length - audioSuffix.length) {
    m = message.match(/^audio output '([\s\S]+)' is unavailable\. Turn on or reconnect the device, enable it in Windows Sound settings, or select another output for this profile$/);
    if (m) {
      return `音频输出“${m[1]}”不可用。请开启或重新连接该设备，在 Windows 声音设置中启用它，或为此配置方案选择其他输出。`;
    }
  }
  return null;
}

export function matchPatternMessage(message: string): string | null {
  if (Object.prototype.hasOwnProperty.call(EXACT_MESSAGES, message)) {
    return EXACT_MESSAGES[message];
  }

  const named = matchNamedMessage(message);
  if (named) return named;

  let m: RegExpMatchArray | null;

  m = message.match(/^Profile not found: (.+)$/);
  if (m) return `未找到配置方案：${m[1]}`;

  m = message.match(/^Display not found: (.+)$/);
  if (m) return `未找到显示器：${m[1]}`;

  m = message.match(/^display \(([0-9a-fA-F]+), (\d+)\)$/);
  if (m) return `显示器 (${m[1]}, ${m[2]})`;

  m = message.match(/^display identity is (ambiguous|missing or changed); refresh the inventory before applying$/);
  if (m) {
    const desc = m[1] === "ambiguous" ? "存在多义性" : "缺失或已更改";
    return `显示器标识${desc}；应用前请先刷新清单。`;
  }

  m = message.match(/^display identity is ambiguous \((\d+) candidates\); reconnect the intended monitor on its saved port or re-save the profile$/);
  if (m) {
    return `显示器标识存在多义性（${m[1]} 个候选）；请将目标显示器重新连接到其保存的端口，或重新保存配置方案。`;
  }

  m = message.match(/^display (\d+) is unavailable; reconnect it and refresh$/);
  if (m) return `显示器 ${m[1]} 不可用；请重新连接并刷新。`;

  m = message.match(/^display (\d+): resolution\/refresh combination is unavailable; attach the display to enumerate modes or select a reported mode$/);
  if (m) return `显示器 ${m[1]}：分辨率/刷新率组合不可用；请重新连接显示器以枚举模式，或选择已报告的模式。`;

  m = message.match(/^display (\d+): HDR cannot be controlled in this configuration; choose Preserve HDR$/);
  if (m) return `显示器 ${m[1]}：无法在此配置下控制 HDR；请选择“保持 HDR”。`;

  m = message.match(/^display (\d+): scaling is unavailable or outside the supported range; choose Preserve scaling$/);
  if (m) return `显示器 ${m[1]}：缩放不可用或超出受支持的范围；请选择“保持缩放”。`;

  m = message.match(/^profile\/layout references an unknown display \(target_id=(\d+), edid_hash=([^)]+)\)\. re-save the profile on this system$/);
  if (m) {
    return `配置方案/布局引用了未知的显示器 (target_id=${m[1]}, edid_hash=${m[2]})。请在此系统上重新保存配置方案。`;
  }

  m = message.match(/^Windows audio (.+) failed: ([\s\S]+)\. Check Windows Sound settings and try again$/);
  if (m) {
    const op = Object.prototype.hasOwnProperty.call(AUDIO_OPERATIONS, m[1])
      ? AUDIO_OPERATIONS[m[1]]
      : m[1];
    return `Windows 音频${op}失败：${m[2]}。请检查 Windows 声音设置并重试。`;
  }

  m = message.match(/^Windows applied a different active display set: requested (.+), observed (.+)$/);
  if (m) {
    return `Windows 应用了不同的活动显示器集合：请求 ${m[1]}，实际 ${m[2]}`;
  }

  m = message.match(/^Windows did not apply the complete display layout \(missing: (.+), unexpected: (.+)\)$/);
  if (m) {
    return `Windows 未应用完整的显示器布局（缺失：${m[1]}，意外：${m[2]}）`;
  }

  m = message.match(/^SetDisplayConfig failed: (\d+)$/);
  if (m) return `SetDisplayConfig 失败：${m[1]}`;

  m = message.match(/^Windows rejected the requested display combination \((\d+)\); select compatible resolution\/refresh or Extend$/);
  if (m) return `Windows 拒绝了请求的显示器组合 (${m[1]})；请选择兼容的分辨率/刷新率或选择“扩展”。`;

  m = message.match(/^GetDisplayConfigBufferSizes (retry )?failed: (\d+)$/);
  if (m) return `GetDisplayConfigBufferSizes ${m[1] ? "重试" : ""}失败：${m[2]}`;

  m = message.match(/^QueryDisplayConfig failed: (\d+)$/);
  if (m) return `QueryDisplayConfig 失败：${m[1]}`;

  m = message.match(/^DisplayConfigGetDeviceInfo failed: (\d+)$/);
  if (m) return `DisplayConfigGetDeviceInfo 失败：${m[1]}`;

  m = message.match(/^Windows rejected HDR change \((\d+)\); choose a compatible mode\/topology$/);
  if (m) return `Windows 拒绝了 HDR 更改 (${m[1]})；请选择兼容的模式/拓扑。`;

  m = message.match(/^cannot reconnect display (\d+) on adapter ([0-9a-fA-F]+): Windows reports no available display path$/);
  if (m) return `无法在适配器 ${m[2]} 上重新连接显示器 ${m[1]}：Windows 报告无可用显示路径。`;

  m = message.match(/^(\d+)% is outside this source's supported scaling range$/);
  if (m) return `${m[1]}% 超出了此信号源受支持的缩放范围。`;

  m = message.match(/^Windows rejected (\d+)% scaling \((\d+)\)$/);
  if (m) return `Windows 拒绝了 ${m[1]}% 缩放 (${m[2]})。`;

  m = message.match(/^display (\d+) has (\d+) cached paths; fresh connection discovery is required$/);
  if (m) return `显示器 ${m[1]} 存在 ${m[2]} 条缓存路径；需要重新发现连接。`;

  m = message.match(/^Windows did not apply the requested settings for display (\d+) on adapter ([0-9a-fA-F]+): (.+)$/);
  if (m) {
    const diffs = m[3].split("; ").map(translateDifference).join("；");
    return `Windows 未对适配器 ${m[2]} 上的显示器 ${m[1]} 应用请求的设置：${diffs}`;
  }

  m = message.match(/^failed to register global shortcut '([\s\S]+?)' for ((?:profile|display) '[\s\S]+?'): ([\s\S]+)$/);
  if (m) return `为${formatShortcutTarget(m[2])}注册全局快捷键“${m[1]}”失败：${m[3]}`;

  m = message.match(/^duplicate global shortcut assignment: '([\s\S]+?)' is used by ((?:profile|display) '[\s\S]+?') and ((?:profile|display) '[\s\S]+')$/);
  if (m) return `全局快捷键分配冲突：“${m[1]}”已被${formatShortcutTarget(m[2])}和${formatShortcutTarget(m[3])}同时使用`;

  m = message.match(/^cannot update startup registry value \(Windows error (\d+)\)$/);
  if (m) return `无法更新开机启动注册表项 (Windows 错误 ${m[1]})`;

  m = message.match(/^GitHub releases check failed \((\d+)\)$/);
  if (m) return `检查 GitHub Releases 失败 (${m[1]})`;

  m = message.match(/^Could not check for updates: (.+)$/);
  if (m) return `无法检查更新：${m[1]}`;

  m = message.match(/^IPC acknowledgement failed; submission outcome is unknown: ([\s\S]+)$/);
  if (m) return `IPC 确认失败；提交结果未知：${m[1]}`;

  m = message.match(/^request (.+) was accepted; completion is unknown\. Do not retry automatically$/);
  if (m) return `请求 ${m[1]} 已被接受；完成状态未知。请勿自动重试。`;

  m = message.match(/^request (.+) was accepted; completion is unknown: ([\s\S]+)$/);
  if (m) return `请求 ${m[1]} 已被接受；完成状态未知：${m[2]}`;

  m = message.match(/^failed to open URL: ([\s\S]+)$/);
  if (m) return `无法打开 URL：${m[1]}`;

  m = message.match(/^cannot open startup registry key: ([\s\S]+)$/);
  if (m) return `无法打开开机启动注册表项：${m[1]}`;

  m = message.match(/^failed to clear existing global shortcuts: ([\s\S]+)$/);
  if (m) return `无法清除已有的全局快捷键：${m[1]}`;

  return null;
}
