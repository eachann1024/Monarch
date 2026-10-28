import * as mock from "./mock";
import { getVersion as tauriGetVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { listen as tauriListen } from "@tauri-apps/api/event";
import packageJson from "../package.json";
import type {
  AppSettings,
  AppSnapshot,
  ConfirmationEvent,
  Layout,
  DisplayCapabilities,
  ProfileDisplayOptions,
} from "./types";
export type EventPayloadMap = {
  "monarch://state-changed": void;
  "monarch://confirmation": ConfirmationEvent;
};
export type ReleaseUpdateCheckResult = {
  currentVersion: string;
  latestVersion: string;
  latestTag: string;
  updateAvailable: boolean;
  releaseUrl: string;
};
const viteEnv = (
  import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  }
).env;
const useWebMock =
  (viteEnv?.VITE_MONARCH_WEB_MOCK ?? "") === "1" || !isTauriRuntime();
const GITHUB_RELEASES_LATEST_API =
  "https://api.github.com/repos/eachann1024/Monarch/releases/latest";
const GITHUB_RELEASES_URL = "https://github.com/eachann1024/Monarch/releases";
function isTauriRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    typeof (
      window as Window & {
        __TAURI_INTERNALS__?: unknown;
      }
    ).__TAURI_INTERNALS__ !== "undefined"
  );
}

function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, "");
}

function compareVersionStrings(a: string, b: string): number {
  const [aBase, aPre = ""] = normalizeVersion(a).split("-", 2);
  const [bBase, bPre = ""] = normalizeVersion(b).split("-", 2);
  const aParts = aBase.split(".").map((part) => Number.parseInt(part, 10));
  const bParts = bBase.split(".").map((part) => Number.parseInt(part, 10));
  const maxLen = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < maxLen; index += 1) {
    const left = Number.isFinite(aParts[index]) ? aParts[index] : 0;
    const right = Number.isFinite(bParts[index]) ? bParts[index] : 0;
    if (left > right) {
      return 1;
    }
    if (left < right) {
      return -1;
    }
  }
  if (aPre && !bPre) {
    return -1;
  }
  if (!aPre && bPre) {
    return 1;
  }
  return aPre.localeCompare(bPre);
}

export async function listenMonarchEvent<E extends keyof EventPayloadMap>(
  eventName: E,
  handler: (event: { payload: EventPayloadMap[E] }) => void,
): Promise<() => void> {
  if (useWebMock) {
    return mock.listenMonarchEvent(eventName, handler);
  }
  return tauriListen(eventName, handler as never);
}

export async function getSnapshot(): Promise<AppSnapshot> {
  if (useWebMock) {
    return mock.getSnapshot();
  }
  return invoke<AppSnapshot>("get_snapshot");
}

export async function getAppVersion(): Promise<string> {
  if (useWebMock) {
    return packageJson.version;
  }
  try {
    return await tauriGetVersion();
  } catch {
    return packageJson.version;
  }
}

function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("URL 不能为空");
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("无效的 URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("仅支持 http(s) URL");
  }
  return parsed.toString();
}

export async function openExternalUrl(url: string): Promise<void> {
  const normalizedUrl = normalizeExternalUrl(url);
  if (useWebMock) {
    if (typeof window !== "undefined") {
      const opened = window.open(
        normalizedUrl,
        "_blank",
        "noopener,noreferrer",
      );
      if (!opened) {
        window.location.assign(normalizedUrl);
      }
    }
    return;
  }
  await invoke("open_external_url", { url: normalizedUrl });
}

export async function checkGithubReleaseUpdate(): Promise<ReleaseUpdateCheckResult> {
  const currentVersion = await getAppVersion();
  if (useWebMock) {
    return {
      currentVersion,
      latestVersion: packageJson.version,
      latestTag: `v${packageJson.version}`,
      updateAvailable: false,
      releaseUrl: GITHUB_RELEASES_URL,
    };
  }
  const response = await fetch(GITHUB_RELEASES_LATEST_API, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });
  if (response.status === 404) {
    throw new Error("此简体中文分支尚无已发布版本；可在 GitHub 仓库的 Actions 页面下载构建产物。");
  }
  if (!response.ok) {
    throw new Error(`检查 GitHub Releases 失败 (${response.status})`);
  }
  const payload = (await response.json()) as {
    tag_name?: unknown;
    html_url?: unknown;
  };
  if (
    typeof payload.tag_name !== "string" ||
    payload.tag_name.trim().length === 0
  ) {
    throw new Error("GitHub Releases 响应缺少 tag_name");
  }
  const latestTag = payload.tag_name.trim();
  const latestVersion = normalizeVersion(latestTag);
  const releaseUrl =
    typeof payload.html_url === "string" && payload.html_url.trim().length > 0
      ? payload.html_url
      : GITHUB_RELEASES_URL;
  return {
    currentVersion,
    latestVersion,
    latestTag,
    updateAvailable: compareVersionStrings(currentVersion, latestVersion) < 0,
    releaseUrl,
  };
}

export async function toggleDisplay(displayKey: string): Promise<void> {
  if (useWebMock) {
    return mock.toggleDisplay(displayKey);
  }
  return invoke("toggle_display", { displayKey });
}

export async function applyLayout(layout: Layout): Promise<void> {
  if (useWebMock) {
    return mock.applyLayout(layout);
  }
  return invoke("apply_layout", { layout });
}

export async function applyProfile(name: string): Promise<void> {
  if (useWebMock) {
    return mock.applyProfile(name);
  }
  return invoke("apply_profile", { name });
}

export async function deleteProfile(name: string): Promise<void> {
  if (useWebMock) {
    return mock.deleteProfile(name);
  }
  return invoke("delete_profile", { name });
}

export async function saveProfile(
  name: string,
  audioOutputId: string | null = null,
  displayOptions?: ProfileDisplayOptions,
): Promise<void> {
  if (useWebMock) {
    return mock.saveProfile(name, audioOutputId, displayOptions);
  }
  return invoke("save_profile", { name, audioOutputId, displayOptions });
}

export async function setProfileDisplayOptions(
  name: string,
  options: ProfileDisplayOptions,
): Promise<void> {
  if (useWebMock) return mock.setProfileDisplayOptions(name, options);
  return invoke("set_profile_display_options", { name, options });
}

export async function setProfileAudio(
  name: string,
  audioOutputId: string | null,
): Promise<void> {
  if (useWebMock) return mock.setProfileAudio(name, audioOutputId);
  return invoke("set_profile_audio", { name, audioOutputId });
}

export async function restoreLastLayout(): Promise<void> {
  if (useWebMock) {
    return mock.restoreLastLayout();
  }
  return invoke("restore_last_layout");
}

export async function confirmCurrentLayout(): Promise<void> {
  if (useWebMock) {
    return mock.confirmCurrentLayout();
  }
  return invoke("confirm_current_layout");
}

export async function rollbackPending(): Promise<void> {
  if (useWebMock) {
    return mock.rollbackPending();
  }
  return invoke("rollback_pending");
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  if (useWebMock) {
    return mock.updateSettings(settings);
  }
  return invoke("update_settings", { settings });
}

export async function getDisplayCapabilities(): Promise<DisplayCapabilities[]> {
  return useWebMock
    ? mock.getDisplayCapabilities()
    : invoke("get_display_capabilities");
}
