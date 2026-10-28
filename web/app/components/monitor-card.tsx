import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatHz } from "@/app/utils";
import type { DisplayInfo } from "@/types";

type MonitorCardProps = {
  display: DisplayInfo;
  monitorNumber: number;
  shortcutLabel: string | null;
  shortcutsEnabled: boolean;
  busy: boolean;
  hasPendingConfirmation: boolean;
  activeDisplayCount: number;
  onToggleRequest: (display: DisplayInfo) => void;
  onEdit: () => void;
  editDisabled: boolean;
};

export function MonitorCard({
  display,
  monitorNumber,
  shortcutLabel,
  shortcutsEnabled,
  busy,
  hasPendingConfirmation,
  activeDisplayCount,
  onToggleRequest,
  onEdit,
  editDisabled,
}: MonitorCardProps) {
  const toggleDisabled =
    busy ||
    hasPendingConfirmation ||
    (display.is_active && activeDisplayCount <= 1);
  return (
    <article
      aria-label={`显示器 ${monitorNumber}：${display.friendly_name}`}
      className="grid min-w-0 gap-3 p-4"
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-9 w-11 shrink-0 place-items-center rounded-sm border font-mono text-sm ${display.is_active ? "border-foreground/30 bg-muted/30" : "border-dashed text-muted-foreground"}`}
          aria-hidden="true"
        >
          {monitorNumber}
        </span>
        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-sm font-medium"
            title={display.friendly_name}
          >
            {display.friendly_name}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {display.resolution.width} × {display.resolution.height} ·{" "}
            {formatHz(display.refresh_rate_mhz)}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {display.is_primary
            ? "主显示器"
            : display.is_active
              ? "活动"
              : "已断开"}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {shortcutLabel ? (
          <kbd
            className="shortcut"
            title={
              shortcutsEnabled
                ? "切换此显示器"
                : "全局快捷键已禁用"
            }
          >
            {shortcutsEnabled ? shortcutLabel : `${shortcutLabel} · 关闭`}
          </kbd>
        ) : (
          <span />
        )}
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={editDisabled}
            onClick={onEdit}
            aria-label={`显示器 ${monitorNumber} 设置：${display.friendly_name}`}
          >
            <SlidersHorizontal aria-hidden="true" />
            设置
          </Button>
          <Button
            type="button"
            size="sm"
            variant={display.is_active ? "ghost" : "secondary"}
            disabled={toggleDisabled}
            onClick={() => onToggleRequest(display)}
            title={
              display.is_active && activeDisplayCount <= 1
                ? "请至少保留一台活动显示器"
                : undefined
            }
          >
            {display.is_active ? "断开显示器" : "重新连接显示器"}
          </Button>
        </div>
      </div>
    </article>
  );
}
