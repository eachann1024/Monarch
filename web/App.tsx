import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { subscriptions } from "@/app/subscriptions";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { AppHeader } from "@/app/components/app-header";
import {
  DeleteProfileDialog,
  DisplayToggleDialog,
  PendingConfirmationDialog,
} from "@/app/components/dialogs";
import { MainTab } from "@/app/components/main-tab";
import { ProfilesTab } from "@/app/components/profiles-tab";
import { SettingsTab } from "@/app/components/settings-tab";
import {
  DEFAULT_GLOBAL_SHORTCUTS_ENABLED,
  DEFAULT_MONITOR_SHORTCUT_BASE,
  DEFAULT_PROFILE_SHORTCUT_BASE,
  REPO_URL,
  isView,
  type PendingDisplayToggle,
  type View,
} from "@/app/ui";
import { capitalizeToastError, formatMs } from "@/app/utils";
import { localizeBackendMessage } from "@/app/messages";

import {
  applyLayout,
  applyProfile,
  checkGithubReleaseUpdate,
  confirmCurrentLayout,
  deleteProfile,
  getSnapshot,
  listenMonarchEvent,
  restoreLastLayout,
  rollbackPending,
  saveProfile,
  setProfileAudio,
  setProfileDisplayOptions,
  toggleDisplay,
  updateSettings,
  type ReleaseUpdateCheckResult,
} from "./tauri";
import type { AppSettings, AppSnapshot } from "./types";

function normalizeShortcutBaseForCompare(
  value: string | null | undefined,
): string {
  return (value ?? "").trim().toLowerCase();
}

function App() {
  const [view, setView] = useState<View>("main");
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingLayoutDecisionBusy, setPendingLayoutDecisionBusy] =
    useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileAudio, setNewProfileAudio] = useState<string | null>(null);
  const [newProfileIgnoreMissingDraft, setNewProfileIgnoreMissingDraft] =
    useState<boolean | null>(null);
  const newProfileIgnoreMissing = newProfileIgnoreMissingDraft ??
    snapshot?.profiles.find((profile) => profile.name === newProfileName.trim())
      ?.display_options.ignore_missing_displays ?? false;
  const [revertTimeoutInput, setRevertTimeoutInput] = useState("10");
  const [startWithWindowsEnabled, setStartWithWindowsEnabled] = useState(false);
  const [startupProfileName, setStartupProfileName] = useState<string | null>(
    null,
  );
  const [globalShortcutsEnabled, setGlobalShortcutsEnabled] = useState(
    DEFAULT_GLOBAL_SHORTCUTS_ENABLED,
  );
  const [profileShortcutBaseInput, setProfileShortcutBaseInput] = useState(
    DEFAULT_PROFILE_SHORTCUT_BASE,
  );
  const [displayShortcutBaseInput, setDisplayShortcutBaseInput] = useState(
    DEFAULT_MONITOR_SHORTCUT_BASE,
  );
  const [pendingDisplayToggle, setPendingDisplayToggle] =
    useState<PendingDisplayToggle | null>(null);
  const [pendingProfileDelete, setPendingProfileDelete] = useState<
    string | null
  >(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateCheckResult, setUpdateCheckResult] =
    useState<ReleaseUpdateCheckResult | null>(null);
  const [updateCheckError, setUpdateCheckError] = useState<string | null>(null);
  const refreshInFlight = useRef<Promise<boolean> | null>(null);
  const refreshQueued = useRef(false);
  const settingsDirtyRef = useRef(false);
  const hasPendingConfirmation = Boolean(snapshot?.pending_confirmation);

  async function refreshStateOnce(): Promise<boolean> {
    try {
      const next = await getSnapshot();
      setSnapshot(next);
      if (!settingsDirtyRef.current) {
        setRevertTimeoutInput(String(next.settings.revert_timeout_secs));
        setStartWithWindowsEnabled(next.settings.start_with_windows);
        setStartupProfileName(next.settings.startup_profile_name);
        setGlobalShortcutsEnabled(
          next.settings.global_shortcuts_enabled ??
            DEFAULT_GLOBAL_SHORTCUTS_ENABLED,
        );
        setProfileShortcutBaseInput(next.settings.profile_shortcut_base ?? "");
        setDisplayShortcutBaseInput(
          next.settings.display_toggle_shortcut_base ?? "",
        );
      }
      setRefreshError(null);
      return true;
    } catch (err) {
      setRefreshError(
        localizeBackendMessage(err instanceof Error ? err.message : String(err)),
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function refreshState(): Promise<boolean> {
    if (refreshInFlight.current) {
      refreshQueued.current = true;
      return refreshInFlight.current;
    }

    const task = (async () => {
      let ok = await refreshStateOnce();
      while (refreshQueued.current) {
        refreshQueued.current = false;
        ok = await refreshStateOnce();
      }
      return ok;
    })();

    refreshInFlight.current = task;
    try {
      return await task;
    } finally {
      refreshInFlight.current = null;
    }
  }

  async function runAction(
    action: () => Promise<void>,
    successNotice?: string,
    refresh = true,
  ): Promise<boolean> {
    setBusy(true);
    setError(null);

    try {
      await action();
      if (successNotice) {
        toast.success(successNotice);
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      const message = localizeBackendMessage(rawMessage);
      setError(message);
      toast.error(capitalizeToastError(message));
      return false;
    } finally {
      setBusy(false);
    }

    if (refresh) {
      void refreshState();
    }

    return true;
  }

  function runPendingLayoutDecision(action: () => Promise<void>): void {
    if (pendingLayoutDecisionBusy) {
      return;
    }

    setPendingLayoutDecisionBusy(true);
    setError(null);
    setSnapshot((current) =>
      current ? { ...current, pending_confirmation: null } : current,
    );

    const run = async () => {
      try {
        await action();
      } catch (err) {
        const rawMessage = err instanceof Error ? err.message : String(err);
        const message = localizeBackendMessage(rawMessage);
        setError(message);
        toast.error(capitalizeToastError(message));
      } finally {
        setPendingLayoutDecisionBusy(false);
        void refreshState();
      }
    };

    void run();
  }

  useEffect(() => {
    void refreshState();

    const listeners = subscriptions((error) =>
      setError(localizeBackendMessage(error)),
    );

    listeners.add(
      listenMonarchEvent("monarch://state-changed", () => {
        void refreshState();
      }),
    );

    listeners.add(
      listenMonarchEvent<"monarch://confirmation">(
        "monarch://confirmation",
        (event) => {
          const payload = event.payload;

          if (payload.kind === "applied") {
            toast("已应用设置", {
              description: `请在 ${formatMs(payload.timeout_ms)} 内确认，否则将自动还原。`,
            });
          }

          if (payload.kind === "confirmed") {
            toast.success("已确认设置。");
          }

          if (payload.kind === "rollback_failed") {
            toast.error("无法还原先前的设置", {
              description: `${localizeBackendMessage(payload.message)} 请尝试再次还原，或检查 Windows 显示与声音设置。`,
            });
          }

          if (payload.kind === "reverted") {
            toast("已还原设置", {
              description:
                payload.reason === "timeout"
                  ? "还原倒计时已超时。"
                  : "待确认的设置已还原。",
            });
          }

          void refreshState();
        },
      ),
    );

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void refreshState();
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      listeners.dispose();
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, []);

  useEffect(() => {
    const intervalMs = hasPendingConfirmation ? 1000 : 4000;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshState();
      }
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasPendingConfirmation]);

  const activeDisplays = useMemo(
    () => snapshot?.displays.filter((display) => display.is_active) ?? [],
    [snapshot],
  );

  const rawRevertTimeout = revertTimeoutInput.trim();
  const revertTimeoutIsWholeNumber = /^\d+$/.test(rawRevertTimeout);
  const parsedRevertTimeout = revertTimeoutIsWholeNumber
    ? Number(rawRevertTimeout)
    : NaN;
  const revertTimeoutInRange =
    revertTimeoutIsWholeNumber &&
    parsedRevertTimeout >= 1 &&
    parsedRevertTimeout <= 60;
  const duplicateShortcutBase =
    normalizeShortcutBaseForCompare(profileShortcutBaseInput) !== "" &&
    normalizeShortcutBaseForCompare(profileShortcutBaseInput) ===
      normalizeShortcutBaseForCompare(displayShortcutBaseInput);

  const settingsDirty = useMemo(() => {
    if (!snapshot) {
      return false;
    }

    const timeoutDirty = revertTimeoutIsWholeNumber
      ? parsedRevertTimeout !== snapshot.settings.revert_timeout_secs
      : rawRevertTimeout !== String(snapshot.settings.revert_timeout_secs);

    return (
      timeoutDirty ||
      startWithWindowsEnabled !== snapshot.settings.start_with_windows ||
      startupProfileName !== snapshot.settings.startup_profile_name ||
      globalShortcutsEnabled !==
        (snapshot.settings.global_shortcuts_enabled ??
          DEFAULT_GLOBAL_SHORTCUTS_ENABLED) ||
      profileShortcutBaseInput.trim() !==
        (snapshot.settings.profile_shortcut_base ?? "") ||
      displayShortcutBaseInput.trim() !==
        (snapshot.settings.display_toggle_shortcut_base ?? "")
    );
  }, [
    displayShortcutBaseInput,
    parsedRevertTimeout,
    profileShortcutBaseInput,
    rawRevertTimeout,
    revertTimeoutIsWholeNumber,
    snapshot,
    startWithWindowsEnabled,
    startupProfileName,
    globalShortcutsEnabled,
  ]);

  useEffect(() => {
    settingsDirtyRef.current = settingsDirty;
  }, [settingsDirty]);

  const actionBusy = busy || pendingLayoutDecisionBusy;
  const canSubmitSettings =
    Boolean(snapshot) &&
    !actionBusy &&
    settingsDirty &&
    revertTimeoutInRange &&
    !duplicateShortcutBase;

  const settingsValidationMessage =
    rawRevertTimeout.length === 0
      ? "请输入 1 到 60 之间的整数。"
      : duplicateShortcutBase
        ? "配置方案与显示器的快捷键修饰键组合不能相同。"
        : revertTimeoutInRange
          ? null
          : "还原超时时间必须是 1 到 60 之间的整数。";

  async function handleConfirmDisplayToggle() {
    if (!pendingDisplayToggle) {
      return;
    }

    if (hasPendingConfirmation) {
      toast("请先处理待确认的设置变更", {
        description:
          "在切换其他显示器前，请先确认或还原当前的布局变更。",
      });
      return;
    }

    const target = pendingDisplayToggle;
    setPendingDisplayToggle(null);

    await runAction(
      () => toggleDisplay(target.idKey),
      target.currentlyActive ? "已断开显示器" : "已重新连接显示器",
    );
  }

  function handleConfirmPendingLayout() {
    runPendingLayoutDecision(confirmCurrentLayout);
  }

  function handleRevertPendingLayout() {
    runPendingLayoutDecision(rollbackPending);
  }

  async function handleConfirmProfileDelete() {
    if (!pendingProfileDelete) {
      return;
    }

    if (hasPendingConfirmation) {
      toast("请先处理待确认的设置变更", {
        description:
          "在布局变更等待确认期间，配置方案处于锁定状态。",
      });
      return;
    }

    const profileName = pendingProfileDelete;
    setPendingProfileDelete(null);
    await runAction(() => deleteProfile(profileName), "配置方案已删除");
  }

  async function handleCheckForUpdates() {
    setCheckingUpdates(true);
    setUpdateCheckError(null);
    try {
      const result = await checkGithubReleaseUpdate();
      setUpdateCheckResult(result);
      if (result.updateAvailable) {
        toast("发现新版本", {
          description: `GitHub Releases 上有新版本发布：${result.latestTag}。`,
        });
      } else {
        toast.success("已是最新版本。");
      }
    } catch (err) {
      const message = localizeBackendMessage(
        err instanceof Error ? err.message : String(err),
      );
      setUpdateCheckError(message);
      toast.error(capitalizeToastError(message));
    } finally {
      setCheckingUpdates(false);
    }
  }

  async function handleSaveCurrentLayout() {
    await runAction(async () => {
      await saveProfile(newProfileName.trim(), newProfileAudio, {
        ignore_missing_displays: newProfileIgnoreMissing,
      });
      setNewProfileAudio(null);
      setNewProfileName("");
      setNewProfileIgnoreMissingDraft(null);
    }, "配置方案已保存");
  }

  function markSettingsDirty() {
    setError(null);
    settingsDirtyRef.current = true;
  }

  function handleRevertTimeoutInputChange(value: string) {
    markSettingsDirty();
    setRevertTimeoutInput(value);
  }

  function handleStartWithWindowsChange(checked: boolean) {
    markSettingsDirty();
    setStartWithWindowsEnabled(checked);
  }

  function handleStartupProfileNameChange(value: string | null) {
    markSettingsDirty();
    setStartupProfileName(value);
  }

  function handleGlobalShortcutsEnabledChange(checked: boolean) {
    markSettingsDirty();
    setGlobalShortcutsEnabled(checked);
  }

  function handleProfileShortcutBaseChange(value: string) {
    markSettingsDirty();
    setProfileShortcutBaseInput(value);
  }

  function handleDisplayShortcutBaseChange(value: string) {
    markSettingsDirty();
    setDisplayShortcutBaseInput(value);
  }

  function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!revertTimeoutInRange) {
      const message = "还原超时时间必须是 1 到 60 之间的整数。";
      setError(message);
      toast.error(capitalizeToastError(message));
      return;
    }
    if (duplicateShortcutBase) {
      const message = "配置方案与显示器的快捷键修饰键组合不能相同。";
      setError(message);
      toast.error(message);
      return;
    }

    if (!snapshot || !settingsDirty) {
      return;
    }

    const nextSettings: AppSettings = {
      ...snapshot.settings,
      revert_timeout_secs: parsedRevertTimeout,
      start_with_windows: startWithWindowsEnabled,
      startup_profile_name: startupProfileName,
      global_shortcuts_enabled: globalShortcutsEnabled,
      profile_shortcut_base: profileShortcutBaseInput.trim() || null,
      display_toggle_shortcut_base: displayShortcutBaseInput.trim() || null,
      profile_shortcuts: snapshot.settings.profile_shortcuts,
      display_toggle_shortcuts: snapshot.settings.display_toggle_shortcuts,
    };
    const normalizedRevertTimeout = String(parsedRevertTimeout);
    void runAction(async () => {
      await updateSettings(nextSettings);
      settingsDirtyRef.current = false;
      setRevertTimeoutInput(normalizedRevertTimeout);
      setStartWithWindowsEnabled(nextSettings.start_with_windows);
      setStartupProfileName(nextSettings.startup_profile_name);
      setGlobalShortcutsEnabled(
        nextSettings.global_shortcuts_enabled ??
          DEFAULT_GLOBAL_SHORTCUTS_ENABLED,
      );
      setProfileShortcutBaseInput(nextSettings.profile_shortcut_base ?? "");
      setDisplayShortcutBaseInput(
        nextSettings.display_toggle_shortcut_base ?? "",
      );
    }, "设置已更新");
  }

  return (
    <div className="min-h-screen">
      <Tabs
        value={view}
        onValueChange={(value) => {
          if (isView(value)) {
            setView(value);
          }
        }}
        className="flex min-h-screen flex-col"
      >
        <AppHeader />
        <div className="mx-auto grid w-full max-w-[1440px] gap-4 p-4 pb-8 sm:p-5">
          {error || refreshError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-danger-text"
            >
              {error ?? refreshError}
            </p>
          ) : null}

          {loading ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                正在加载显示器拓扑...
              </CardContent>
            </Card>
          ) : null}

          <MainTab
            loading={loading}
            snapshot={snapshot}
            activeDisplayCount={activeDisplays.length}
            actionBusy={actionBusy}
            hasPendingConfirmation={hasPendingConfirmation}
            shortcutsEnabled={
              snapshot?.settings.global_shortcuts_enabled ??
              DEFAULT_GLOBAL_SHORTCUTS_ENABLED
            }
            displayShortcutBase={
              snapshot?.settings.display_toggle_shortcut_base ?? null
            }
            onApplyLayout={(layout) => runAction(() => applyLayout(layout))}
            onRestoreLastLayout={() => {
              void runAction(restoreLastLayout, "已还原上次布局");
            }}
            onToggleRequest={(selected) =>
              setPendingDisplayToggle({
                idKey: selected.id_key,
                friendlyName: selected.friendly_name,
                currentlyActive: selected.is_active,
              })
            }
          />

          <ProfilesTab
            loading={loading}
            snapshot={snapshot}
            actionBusy={actionBusy}
            hasPendingConfirmation={hasPendingConfirmation}
            shortcutsEnabled={
              snapshot?.settings.global_shortcuts_enabled ??
              DEFAULT_GLOBAL_SHORTCUTS_ENABLED
            }
            profileShortcutBase={
              snapshot?.settings.profile_shortcut_base ?? null
            }
            newProfileName={newProfileName}
            newProfileAudio={newProfileAudio}
            newProfileIgnoreMissing={newProfileIgnoreMissing}
            onNewProfileIgnoreMissingChange={setNewProfileIgnoreMissingDraft}
            onNewProfileAudioChange={setNewProfileAudio}
            onSaveProfileAudio={(name, id) => {
              void runAction(
                () => setProfileAudio(name, id),
                "已保存配置方案音频设置",
              );
            }}
            onSaveProfileDisplayOptions={(name, options) => {
              void runAction(
                () => setProfileDisplayOptions(name, options),
                "已保存配置方案显示器选项",
              );
            }}
            onNewProfileNameChange={setNewProfileName}
            onSaveCurrentLayout={() => {
              void handleSaveCurrentLayout();
            }}
            onApplyProfile={(name) => {
              void runAction(() => applyProfile(name), "配置方案已应用");
            }}
            onDeleteProfileRequest={setPendingProfileDelete}
          />

          <SettingsTab
            loading={loading}
            snapshot={snapshot}
            settingsDirty={settingsDirty}
            disabled={actionBusy || hasPendingConfirmation}
            onDiscardSettings={() => {
              if (!snapshot) return;
              const settings = snapshot.settings;
              setRevertTimeoutInput(String(settings.revert_timeout_secs));
              setStartWithWindowsEnabled(settings.start_with_windows);
              setStartupProfileName(settings.startup_profile_name);
              setGlobalShortcutsEnabled(
                settings.global_shortcuts_enabled ??
                  DEFAULT_GLOBAL_SHORTCUTS_ENABLED,
              );
              setProfileShortcutBaseInput(settings.profile_shortcut_base ?? "");
              setDisplayShortcutBaseInput(
                settings.display_toggle_shortcut_base ?? "",
              );
              settingsDirtyRef.current = false;
            }}
            revertTimeoutInput={revertTimeoutInput}
            startWithWindows={startWithWindowsEnabled}
            startupProfileName={startupProfileName}
            globalShortcutsEnabled={globalShortcutsEnabled}
            settingsValidationMessage={settingsValidationMessage}
            canSubmitSettings={canSubmitSettings}
            onSettingsSubmit={handleSettingsSubmit}
            onRevertTimeoutInputChange={handleRevertTimeoutInputChange}
            onStartWithWindowsChange={handleStartWithWindowsChange}
            onStartupProfileNameChange={handleStartupProfileNameChange}
            onGlobalShortcutsEnabledChange={handleGlobalShortcutsEnabledChange}
            profileShortcutBase={profileShortcutBaseInput}
            displayShortcutBase={displayShortcutBaseInput}
            onProfileShortcutBaseChange={handleProfileShortcutBaseChange}
            onDisplayShortcutBaseChange={handleDisplayShortcutBaseChange}
            checkingUpdates={checkingUpdates}
            updateCheckResult={updateCheckResult}
            updateCheckError={updateCheckError}
            onCheckForUpdates={() => {
              void handleCheckForUpdates();
            }}
            releasesUrl={`${REPO_URL}/releases`}
          />

          <PendingConfirmationDialog
            pendingConfirmation={snapshot?.pending_confirmation ?? null}
            busy={pendingLayoutDecisionBusy}
            onRevert={handleRevertPendingLayout}
            onConfirm={handleConfirmPendingLayout}
          />

          <DisplayToggleDialog
            pendingDisplayToggle={pendingDisplayToggle}
            busy={actionBusy}
            onOpenChange={(open) => {
              if (!open) {
                setPendingDisplayToggle(null);
              }
            }}
            onConfirm={() => {
              void handleConfirmDisplayToggle();
            }}
          />

          <DeleteProfileDialog
            pendingProfileDelete={pendingProfileDelete}
            busy={actionBusy}
            onOpenChange={(open) => {
              if (!open) {
                setPendingProfileDelete(null);
              }
            }}
            onConfirm={() => {
              void handleConfirmProfileDelete();
            }}
          />
        </div>
      </Tabs>
    </div>
  );
}

export default App;
