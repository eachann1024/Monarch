import type { FormEvent, KeyboardEvent } from "react";
import { Download, ExternalLink, Keyboard, Settings2 } from "lucide-react";

import {
  DEFAULT_MONITOR_SHORTCUT_BASE,
  DEFAULT_PROFILE_SHORTCUT_BASE,
} from "@/app/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabsContent } from "@/components/ui/tabs";
import { openExternalUrl, type ReleaseUpdateCheckResult } from "@/tauri";
import type { AppSnapshot } from "@/types";

const NO_STARTUP_PROFILE_VALUE = "__none__";

function shortcutBaseFromKeyEvent(
  event: KeyboardEvent<HTMLInputElement>,
): string | null {
  const parts: string[] = [];
  if (event.ctrlKey) {
    parts.push("Ctrl");
  }
  if (event.altKey) {
    parts.push("Alt");
  }
  if (event.shiftKey) {
    parts.push("Shift");
  }
  if (event.metaKey) {
    parts.push("Super");
  }
  return parts.length > 0 ? parts.join("+") : null;
}

type ShortcutBaseFieldProps = {
  id: string;
  label: string;
  description: string;
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
};

function ShortcutBaseField({
  id,
  label,
  description,
  value,
  defaultValue,
  onChange,
}: ShortcutBaseFieldProps) {
  const displayValue = value.trim() || "自定义快捷键";

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab") {
      return;
    }
    event.preventDefault();

    if (
      event.key === "Escape" ||
      event.key === "Backspace" ||
      event.key === "Delete"
    ) {
      onChange(defaultValue);
      return;
    }

    const base = shortcutBaseFromKeyEvent(event);
    if (base) {
      onChange(base);
    }
  };

  return (
    <div className="grid min-w-0 gap-1.5 text-sm">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <Input
        id={id}
        aria-describedby={`${id}-hint`}
        type="text"
        readOnly
        autoComplete="off"
        value={displayValue}
        onKeyDown={handleKeyDown}
        onPaste={(event) => event.preventDefault()}
        className="font-mono"
      />
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

type SettingsTabProps = {
  loading: boolean;
  snapshot: AppSnapshot | null;
  settingsDirty: boolean;
  disabled: boolean;
  onDiscardSettings: () => void;
  revertTimeoutInput: string;
  startWithWindows: boolean;
  startupProfileName: string | null;
  globalShortcutsEnabled: boolean;
  profileShortcutBase: string;
  displayShortcutBase: string;
  settingsValidationMessage: string | null;
  canSubmitSettings: boolean;
  onSettingsSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRevertTimeoutInputChange: (value: string) => void;
  onStartWithWindowsChange: (checked: boolean) => void;
  onStartupProfileNameChange: (value: string | null) => void;
  onGlobalShortcutsEnabledChange: (checked: boolean) => void;
  onProfileShortcutBaseChange: (value: string) => void;
  onDisplayShortcutBaseChange: (value: string) => void;
  checkingUpdates: boolean;
  updateCheckResult: ReleaseUpdateCheckResult | null;
  updateCheckError: string | null;
  onCheckForUpdates: () => void;
  releasesUrl: string;
};

export function SettingsTab({
  loading,
  snapshot,
  settingsDirty,
  disabled,
  onDiscardSettings,
  revertTimeoutInput,
  startWithWindows,
  startupProfileName,
  globalShortcutsEnabled,
  profileShortcutBase,
  displayShortcutBase,
  settingsValidationMessage,
  canSubmitSettings,
  onSettingsSubmit,
  onRevertTimeoutInputChange,
  onStartWithWindowsChange,
  onStartupProfileNameChange,
  onGlobalShortcutsEnabledChange,
  onProfileShortcutBaseChange,
  onDisplayShortcutBaseChange,
  checkingUpdates,
  updateCheckResult,
  updateCheckError,
  onCheckForUpdates,
  releasesUrl,
}: SettingsTabProps) {
  const startupProfileSelectValue =
    startupProfileName ?? NO_STARTUP_PROFILE_VALUE;
  const selectedProfileExists =
    startupProfileName == null ||
    snapshot?.profiles.some((profile) => profile.name === startupProfileName);

  return (
    <TabsContent value="settings" className="mt-0">
      {!loading && snapshot ? (
        <main className="grid items-start gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardHeader className="min-h-12 flex-row items-center justify-between py-2">
              <CardTitle className="flex items-center gap-2">
                <Settings2
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                偏好设置
              </CardTitle>
              {settingsDirty && (
                <Badge variant="outline">未保存的更改</Badge>
              )}
            </CardHeader>
            <form onSubmit={onSettingsSubmit}>
              <fieldset disabled={disabled} className="divide-y">
                <section className="grid gap-5 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label htmlFor="revert-timeout" className="grid gap-1">
                      <span className="text-sm font-medium">
                        确认超时时间
                      </span>
                      <span className="text-xs text-muted-foreground">
                        在 1–60 秒后自动还原未确认的显示器更改。
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="revert-timeout"
                        aria-label="还原超时时间（秒）"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        value={revertTimeoutInput}
                        onChange={(event) =>
                          onRevertTimeoutInputChange(event.target.value)
                        }
                        className="w-20 font-mono"
                      />
                      <span className="text-xs text-muted-foreground">
                        秒
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="start-with-windows"
                      aria-labelledby="start-with-windows-label"
                      aria-describedby="start-with-windows-hint"
                      checked={startWithWindows}
                      onCheckedChange={(checked) =>
                        onStartWithWindowsChange(checked === true)
                      }
                      className="mt-0.5"
                    />
                    <label
                      htmlFor="start-with-windows"
                      className="grid gap-1 text-sm"
                    >
                      <span
                        id="start-with-windows-label"
                        className="font-medium"
                      >
                        开机启动
                      </span>
                      <span
                        id="start-with-windows-hint"
                        className="text-xs text-muted-foreground"
                      >
                        登录后约 10 秒在系统托盘中启动。
                      </span>
                    </label>
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="startup-profile" className="field-label">
                      启动时应用的配置方案（可选）
                    </label>
                    <Select
                      value={startupProfileSelectValue}
                      disabled={disabled}
                      onValueChange={(value) =>
                        onStartupProfileNameChange(
                          value === NO_STARTUP_PROFILE_VALUE ? null : value,
                        )
                      }
                    >
                      <SelectTrigger id="startup-profile">
                        <SelectValue placeholder="不应用配置方案" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_STARTUP_PROFILE_VALUE}>
                          不应用配置方案
                        </SelectItem>
                        {!selectedProfileExists && startupProfileName && (
                          <SelectItem value={startupProfileName}>
                            {startupProfileName} (已丢失)
                          </SelectItem>
                        )}
                        {snapshot.profiles.map((profile) => (
                          <SelectItem key={profile.name} value={profile.name}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Monarch 启动时自动应用。
                    </p>
                  </div>
                </section>
                <section className="grid gap-4 p-4 sm:p-5">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <Keyboard
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    快捷键
                  </h3>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="enable-global-shortcuts"
                      checked={globalShortcutsEnabled}
                      onCheckedChange={(checked) =>
                        onGlobalShortcutsEnabledChange(checked === true)
                      }
                    />
                    <label
                      htmlFor="enable-global-shortcuts"
                      className="text-sm"
                    >
                      启用全局快捷键
                    </label>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    点击输入框并按下修饰键。Monarch 会为每个配置方案或显示器追加数字编号（1–9，然后是 0）。按 Backspace 键恢复默认值。已有自定义快捷键将保留，直到您记录新的修饰键组合。
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ShortcutBaseField
                      id="profile-shortcut-base"
                      label="配置方案快捷键修饰键组合"
                      value={profileShortcutBase}
                      defaultValue={DEFAULT_PROFILE_SHORTCUT_BASE}
                      onChange={onProfileShortcutBaseChange}
                      description="示例：Ctrl + Shift + 1 应用第一个配置方案。"
                    />
                    <ShortcutBaseField
                      id="monitor-shortcut-base"
                      label="显示器快捷键修饰键组合"
                      value={displayShortcutBase}
                      defaultValue={DEFAULT_MONITOR_SHORTCUT_BASE}
                      onChange={onDisplayShortcutBaseChange}
                      description="示例：Ctrl + Alt + 1 切换显示器 1。"
                    />
                  </div>
                </section>
              </fieldset>
              <div className="grid gap-3 border-t bg-muted/10 px-4 py-4 sm:px-5">
                {settingsValidationMessage && (
                  <p role="alert" className="text-xs text-danger-text">
                    {settingsValidationMessage}
                  </p>
                )}
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!settingsDirty || disabled}
                    onClick={onDiscardSettings}
                  >
                    放弃更改
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canSubmitSettings || disabled}
                  >
                    保存设置
                  </Button>
                </div>
              </div>
            </form>
          </Card>
          <Card>
            <CardHeader className="min-h-12 flex-row items-center py-2">
              <CardTitle className="flex items-center gap-2">
                <Download
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                更新
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-xs leading-relaxed text-muted-foreground">
                检查 GitHub Releases 获取 Monarch 的更新版本。
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={checkingUpdates}
                  onClick={onCheckForUpdates}
                >
                  {checkingUpdates ? "正在检查…" : "检查更新"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    void openExternalUrl(releasesUrl);
                  }}
                >
                  发布页面
                  <ExternalLink aria-hidden="true" />
                </Button>
              </div>
              {updateCheckResult && (
                <div className="space-y-2 border-t pt-4 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">当前版本</span>
                    <span className="font-mono">
                      v{updateCheckResult.currentVersion}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">
                      最新发布
                    </span>
                    <span className="font-mono">
                      {updateCheckResult.latestTag}
                    </span>
                  </div>
                  <p>
                    {updateCheckResult.updateAvailable
                      ? "GitHub 上有更新的版本可用。"
                      : "已是最新版本。"}
                  </p>
                </div>
              )}
              {updateCheckError && (
                <p role="alert" className="text-xs text-danger-text">
                  {updateCheckError}
                </p>
              )}
            </CardContent>
          </Card>
        </main>
      ) : null}
    </TabsContent>
  );
}
