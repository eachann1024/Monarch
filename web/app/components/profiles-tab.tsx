import { Layers, Plus, Play, Trash2 } from "lucide-react";
import { AudioOutputSelect, ProfileAudio } from "./audio-output";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TabsContent } from "@/components/ui/tabs";
import { indexedShortcutLabel } from "@/app/utils";
import { localizeReason } from "@/app/messages";
import type { AppSnapshot, ProfileDisplayOptions } from "@/types";

type ProfilesTabProps = {
  loading: boolean;
  snapshot: AppSnapshot | null;
  actionBusy: boolean;
  hasPendingConfirmation: boolean;
  shortcutsEnabled: boolean;
  profileShortcutBase: string | null;
  newProfileName: string;
  newProfileAudio: string | null;
  newProfileIgnoreMissing: boolean;
  onNewProfileIgnoreMissingChange: (value: boolean) => void;
  onNewProfileAudioChange: (id: string | null) => void;
  onSaveProfileAudio: (name: string, id: string | null) => void;
  onSaveProfileDisplayOptions: (name: string, options: ProfileDisplayOptions) => void;
  onNewProfileNameChange: (value: string) => void;
  onSaveCurrentLayout: () => void;
  onApplyProfile: (name: string) => void;
  onDeleteProfileRequest: (name: string) => void;
};

export function ProfilesTab({
  loading,
  snapshot,
  actionBusy,
  hasPendingConfirmation,
  shortcutsEnabled,
  profileShortcutBase,
  newProfileName,
  newProfileAudio,
  newProfileIgnoreMissing,
  onNewProfileIgnoreMissingChange,
  onNewProfileAudioChange,
  onSaveProfileAudio,
  onSaveProfileDisplayOptions,
  onNewProfileNameChange,
  onSaveCurrentLayout,
  onApplyProfile,
  onDeleteProfileRequest,
}: ProfilesTabProps) {
  const locked = actionBusy || hasPendingConfirmation;
  return (
    <TabsContent value="profiles" className="mt-0">
      {!loading && snapshot ? (
        <main className="grid items-start gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="min-[900px]:col-start-2 min-[900px]:row-start-1">
            <CardHeader className="min-h-12 flex-row items-center py-2">
              <CardTitle className="flex items-center gap-2">
                <Plus
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                保存当前设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!locked && newProfileName.trim()) onSaveCurrentLayout();
                }}
              >
                <p className="text-xs leading-relaxed text-muted-foreground">
                  捕获当前的显示器布局，并可选择关联音频输出设备。
                </p>
                <label className="grid gap-1.5">
                  <span className="field-label">配置方案名称</span>
                  <Input
                    type="text"
                    placeholder="例如：工作、游戏、电视"
                    value={newProfileName}
                    disabled={locked}
                    onChange={(event) =>
                      onNewProfileNameChange(event.target.value)
                    }
                  />
                </label>
                <AudioOutputSelect
                  label="新配置方案的音频输出"
                  audio={snapshot.audio}
                  value={newProfileAudio}
                  onChange={onNewProfileAudioChange}
                  disabled={locked}
                />
                <label className="flex items-start gap-2 text-xs">
                  <Checkbox
                    checked={newProfileIgnoreMissing}
                    disabled={locked}
                    onCheckedChange={(checked) =>
                      onNewProfileIgnoreMissingChange(checked === true)
                    }
                  />
                  <span>
                    忽略缺失的显示器
                    <span className="block text-muted-foreground">
                      即使部分保存的显示器未连接，也应用此配置方案。
                    </span>
                  </span>
                </label>
                <Button
                  type="submit"
                  disabled={locked || !newProfileName.trim()}
                >
                  保存当前布局
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  保存配置方案不会改变您当前活动的显示器和音频。
                </p>
              </form>
            </CardContent>
          </Card>
          <Card className="min-[900px]:col-start-1 min-[900px]:row-start-1">
            <CardHeader className="min-h-12 flex-row items-center justify-between py-2">
              <CardTitle className="flex items-center gap-2">
                <Layers
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                已保存的配置方案
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                已保存 {snapshot.profiles.length} 个
              </span>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {snapshot.profiles.length === 0 ? (
                <div className="space-y-2 px-4 py-10 text-center">
                  <p className="text-sm font-medium">暂无配置方案</p>
                  <p className="text-xs text-muted-foreground">
                    排列您的显示器，然后保存您的第一个配置方案。
                  </p>
                </div>
              ) : (
                snapshot.profiles.map((profile, index) => {
                  const activeCount = profile.layout.outputs.filter(
                    (output) => output.enabled,
                  ).length;
                  const shortcutLabel = profileShortcutBase
                    ? indexedShortcutLabel(profileShortcutBase, index)
                    : (snapshot.settings.profile_shortcuts[profile.name] ??
                      null);
                  return (
                    <article
                      key={`${profile.name}:${profile.audio_output?.id ?? ""}`}
                      aria-label={`配置方案 ${profile.name}`}
                      className="grid min-w-0 gap-4 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <h3 className="break-words text-sm font-medium">
                            {profile.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {activeCount} 台活动显示器
                            </span>
                            {shortcutLabel && (
                              <kbd
                                className="shortcut"
                                title={
                                  shortcutsEnabled
                                    ? "应用此配置方案"
                                    : "全局快捷键已禁用"
                                }
                              >
                                {shortcutLabel}
                                {!shortcutsEnabled && " · 关闭"}
                              </kbd>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={locked}
                            onClick={() => onApplyProfile(profile.name)}
                          >
                            <Play aria-hidden="true" />
                            应用
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            disabled={locked}
                            aria-label={`删除配置方案 ${profile.name}`}
                            title="删除配置方案"
                            onClick={() => onDeleteProfileRequest(profile.name)}
                          >
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2 text-xs">
                        <label className="flex items-start gap-2">
                          <Checkbox
                            checked={profile.display_options.ignore_missing_displays}
                            disabled={locked}
                            onCheckedChange={(checked) => onSaveProfileDisplayOptions(profile.name, {
                              ...profile.display_options,
                              ignore_missing_displays: checked === true,
                            })}
                          />
                          <span>
                            忽略缺失的显示器
                            <span className="block text-muted-foreground">
                              当有显示器未连接时，仍应用其余已保存的显示器。
                            </span>
                          </span>
                        </label>
                      </div>
                      <ProfileAudio
                        profile={profile}
                        audio={snapshot.audio}
                        disabled={locked}
                        onSave={onSaveProfileAudio}
                      />
                    </article>
                  );
                })
              )}
            </CardContent>
          </Card>
          <p className="text-xs leading-relaxed text-muted-foreground min-[900px]:col-span-2">
            {localizeReason(snapshot.audio.unavailable_reason) ??
              "不可用的电视音频输出仍可保存；当显示器激活时，Monarch 会等待其可用。通信设备保留其 Windows 首选项。"}
          </p>
        </main>
      ) : null}
    </TabsContent>
  );
}
