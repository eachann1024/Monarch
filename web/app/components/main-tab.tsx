import { useEffect, useState } from "react";
import { Monitor, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { LayoutPreview } from "@/app/components/layout-preview";
import { MonitorCard } from "@/app/components/monitor-card";
import { CurrentAudioOutput } from "./audio-output";
import { DisplayProperties } from "./display-properties";
import {
  arrangementDraft,
  sameSource,
  layoutError,
  rebaseLayout,
} from "@/app/display-editor";
import { indexedShortcutLabel } from "@/app/utils";
import type { AppSnapshot, DisplayInfo, Layout, Position } from "@/types";

type MainTabProps = {
  loading: boolean;
  snapshot: AppSnapshot | null;
  activeDisplayCount: number;
  actionBusy: boolean;
  hasPendingConfirmation: boolean;
  shortcutsEnabled: boolean;
  displayShortcutBase: string | null;
  onApplyLayout: (layout: Layout) => Promise<boolean>;
  onRestoreLastLayout: () => void;
  onToggleRequest: (display: DisplayInfo) => void;
};

export function MainTab({
  loading,
  snapshot,
  activeDisplayCount,
  actionBusy,
  hasPendingConfirmation,
  shortcutsEnabled,
  displayShortcutBase,
  onApplyLayout,
  onRestoreLastLayout,
  onToggleRequest,
}: MainTabProps) {
  const [offsets, setOffsets] = useState<Record<string, Position>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const signature = JSON.stringify(snapshot?.layout);
  useEffect(() => {
    if (Object.keys(offsets).length)
      setNotice(
        "显示器设置已变更。您尚未保存的位置调整仍显示在预览中。",
      );
    setEditing(null);
  }, [signature]);
  if (loading || !snapshot) {
    return <TabsContent value="main" className="mt-0" />;
  }

  const layout = arrangementDraft(snapshot.layout, offsets);
  const draft = JSON.stringify(layout) !== signature;
  const error = draft ? layoutError(layout, snapshot.capabilities) : null;
  const locked = actionBusy || hasPendingConfirmation;

  return (
    <TabsContent value="main" className="mt-0">
      <main className="grid gap-4">
        <div className="grid items-start gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
          <Card className="min-w-0">
            <CardHeader className="min-h-12 flex-row flex-wrap items-center justify-between gap-2 py-2">
              <CardTitle className="flex items-center gap-2">
                <Monitor
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                显示器布局
              </CardTitle>
              {draft ? (
                <Badge variant="outline">未保存的布局</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {activeDisplayCount} 台活动 · 检测到 {snapshot.displays.length}{" "}
                  台
                </span>
              )}
            </CardHeader>
            <CardContent>
              <LayoutPreview
                snapshot={{ ...snapshot, layout }}
                disabled={locked}
                onMove={(key, position) => {
                  const output = snapshot.layout.outputs.find(
                    (o) => o.display_key === key,
                  )!;
                  const offset = {
                    x: position.x - output.position.x,
                    y: position.y - output.position.y,
                  };
                  setOffsets((current) => {
                    const next = { ...current };
                    for (const member of snapshot.layout.outputs.filter(
                      (o) => o === output || sameSource(o, output),
                    )) {
                      if (offset.x || offset.y)
                        next[member.display_key] = offset;
                      else delete next[member.display_key];
                    }
                    return next;
                  });
                  setNotice(null);
                }}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  拖动以排列显示器。使用方向键可进行微调。
                </p>
              </div>
              {notice && (
                <p role="status" className="mt-2 text-sm text-muted-foreground">
                  {notice}
                </p>
              )}
              {error && (
                <p role="alert" className="mt-2 text-sm text-danger-text">
                  {error}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div className="min-w-0 max-w-full basis-full sm:basis-auto sm:flex-1">
                  <CurrentAudioOutput audio={snapshot.audio} />
                </div>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!draft || locked}
                    onClick={() => {
                      setOffsets({});
                      setNotice(null);
                    }}
                  >
                    放弃更改
                  </Button>
                  <Button
                    disabled={!draft || locked || Boolean(error)}
                    onClick={() => {
                      setOffsets({});
                      setNotice(null);
                      void onApplyLayout(rebaseLayout(layout)).then((ok) => {
                        if (!ok) setOffsets(offsets);
                      });
                    }}
                  >
                    保存布局
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="min-h-12 flex-row items-center justify-between gap-2 py-2">
              <CardTitle>显示器</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={actionBusy}
                onClick={onRestoreLastLayout}
              >
                <RotateCcw aria-hidden="true" />
                还原上次布局
              </Button>
            </CardHeader>
            <CardContent className="max-h-[36rem] divide-y overflow-auto p-0">
              {snapshot.displays.map((display, index) => {
                const shortcutLabel = displayShortcutBase
                  ? indexedShortcutLabel(displayShortcutBase, index)
                  : (snapshot.settings.display_toggle_shortcuts[
                      display.id_key
                    ] ?? null);

                return (
                  <MonitorCard
                    key={display.id_key}
                    display={display}
                    monitorNumber={index + 1}
                    shortcutLabel={shortcutLabel}
                    shortcutsEnabled={shortcutsEnabled}
                    busy={actionBusy || Boolean(draft)}
                    hasPendingConfirmation={hasPendingConfirmation}
                    activeDisplayCount={activeDisplayCount}
                    onToggleRequest={onToggleRequest}
                    onEdit={() => setEditing(display.id_key)}
                    editDisabled={locked}
                  />
                );
              })}
            </CardContent>
          </Card>
        </div>

        {editing && (
          <DisplayProperties
            key={editing}
            displayKey={editing}
            initial={snapshot.layout}
            snapshot={snapshot}
            busy={locked}
            onClose={() => setEditing(null)}
            onSave={onApplyLayout}
          />
        )}

        <details className="rounded-md border text-xs text-muted-foreground">
          <summary className="cursor-pointer px-4 py-3 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            显示器连接排错提示
          </summary>
          <p className="px-4 pb-4 leading-relaxed">
            如果显示器未显示，请按{" "}
            <kbd className="shortcut">Win + P</kbd> 并选择{" "}
            <span className="text-foreground">扩展</span> 或{" "}
            <span className="text-foreground">仅电脑屏幕</span> 以重置显示模式。
          </p>
        </details>
      </main>
    </TabsContent>
  );
}
