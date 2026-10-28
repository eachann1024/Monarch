import { useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SelectField } from "@/components/ui/select-field";
import { X } from "lucide-react";
import {
  capabilityMatches,
  changeAttachment,
  editOutput,
  nativeResolution,
  sharedResolutionChoices,
  sharedScaleChoices,
  canPreserveScaling,
  sourceMembers,
  refreshChoices,
  layoutError,
  rebaseLayout,
  fitDesktop,
} from "@/app/display-editor";
import { localizeReason } from "@/app/messages";
import type {
  AppSnapshot,
  DisplayCapabilities,
  Layout,
  OutputConfig,
} from "@/types";

const rotations = [
  ["landscape", "横向"],
  ["portrait", "纵向 (90°)"],
  ["landscape_flipped", "横向翻转 (180°)"],
  ["portrait_flipped", "纵向翻转 (270°)"],
] as const;

function RefreshRateField({
  output,
  cap,
  label = "刷新率",
  onChange,
}: {
  output: OutputConfig;
  cap: DisplayCapabilities | undefined;
  label?: string;
  onChange: (rate: number) => void;
}) {
  const rates = refreshChoices(cap, output);
  const choices = rates.map((rate) => ({
    value: String(rate),
    label: `${rate / 1000} Hz`,
  }));
  if (!rates.includes(output.refresh_rate_mhz)) {
    const current = rates.some(
      (r) => Math.abs(r - output.refresh_rate_mhz) <= 2,
    );
    choices.unshift({
      value: String(output.refresh_rate_mhz),
      label: `${output.refresh_rate_mhz / 1000} Hz (${current ? "当前" : cap?.modes_unavailable_reason ? "已保存" : "不可用"})`,
    });
  }
  return (
    <SelectField
      label={label}
      value={String(output.refresh_rate_mhz)}
      choices={choices}
      disabled={!rates.length}
      onValueChange={(value) => onChange(Number(value))}
    />
  );
}

export function DisplayProperties({
  snapshot,
  initial,
  displayKey,
  busy,
  onSave,
  onClose,
}: {
  snapshot: AppSnapshot;
  initial: Layout;
  displayKey: string;
  busy: boolean;
  onSave: (layout: Layout) => Promise<boolean>;
  onClose: () => void;
}) {
  const opener = useRef(
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  );
  const [draft, setDraft] = useState(() => structuredClone(initial));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const locked = busy || saving;
  const output = draft.outputs.find((o) => o.display_key === displayKey)!;
  const display = snapshot.displays.find((d) => d.id_key === displayKey);
  const cap = snapshot.capabilities.find((c) => capabilityMatches(output, c));
  const dimensions = nativeResolution(output);
  const resolutionKey = `${dimensions.width}x${dimensions.height}`;
  const members = sourceMembers(draft, output);
  const duplicated = members.length > 1;
  const resolutions = sharedResolutionChoices(
    draft,
    output,
    snapshot.capabilities,
  );
  const scales = sharedScaleChoices(draft, output, snapshot.capabilities);
  const preserveScaling = canPreserveScaling(
    draft,
    output,
    snapshot.capabilities,
  );
  const validMode =
    !output.enabled ||
    members.every((member) =>
      refreshChoices(
        snapshot.capabilities.find((c) => capabilityMatches(member, c)),
        member,
      ).some((r) => Math.abs(r - member.refresh_rate_mhz) <= 2),
    );
  const change = (patch: Partial<OutputConfig>, key = displayKey) => {
    const next = editOutput(draft, key, patch);
    setDraft(patch.resolution ? fitDesktop(next) : next);
    setError(null);
  };
  const attachment = !output.enabled
    ? "detached"
    : output.clone_group
      ? (draft.outputs.find(
          (o) =>
            o !== output && o.enabled && o.clone_group === output.clone_group,
        )?.display_key ?? "extend")
      : "extend";
  const resolutionChoices = resolutions.map((r) => ({
    value: `${r.width}x${r.height}`,
    label: `${r.width} × ${r.height}`,
  }));
  if (!resolutionChoices.some((r) => r.value === resolutionKey))
    resolutionChoices.unshift({
      value: resolutionKey,
      label: `${dimensions.width} × ${dimensions.height} (当前)`,
    });
  const scaleChoices = scales.map((scale) => ({
    value: String(scale),
    label: `${scale}%`,
  }));
  if (output.scale_percent != null && !scales.includes(output.scale_percent))
    scaleChoices.unshift({
      value: String(output.scale_percent),
      label: `${output.scale_percent}% (当前)`,
    });
  if (preserveScaling)
    scaleChoices.unshift({ value: "preserve", label: "保持缩放" });

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !locked) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-40 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border bg-background shadow-lg outline-none"
          onEscapeKeyDown={(event) => {
            if (locked) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (opener.current?.isConnected) opener.current.focus();
          }}
        >
          <div className="relative shrink-0 border-b px-5 py-4 pr-14">
            <Dialog.Title className="text-base font-semibold">
              {display?.friendly_name ?? "显示器"} 设置
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-xs text-muted-foreground">
              保存后将应用更改。确认以保留这些更改，或还原。
            </Dialog.Description>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={locked}
                className="absolute right-3 top-3"
                aria-label="关闭显示器设置"
              >
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <div className="min-h-0 overflow-y-auto px-5 py-5">
            <fieldset disabled={locked} className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="显示模式"
                className="sm:col-span-2"
                value={attachment}
                choices={[
                  { value: "extend", label: "扩展" },
                  { value: "detached", label: "断开" },
                  ...draft.outputs
                    .filter((o) => o !== output && o.enabled)
                    .map((o) => ({
                      value: o.display_key,
                      label: `复制自 ${snapshot.displays.find((d) => d.id_key === o.display_key)?.friendly_name ?? "显示器"}`,
                    })),
                ]}
                onValueChange={(value) => {
                  try {
                    setDraft(
                      fitDesktop(
                        changeAttachment(
                          draft,
                          displayKey,
                          value,
                          snapshot.capabilities,
                        ),
                      ),
                    );
                    setError(null);
                  } catch (error) {
                    setError(error instanceof Error ? error.message : String(error));
                  }
                }}
              />
              {duplicated && (
                <p className="rounded-md border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground sm:col-span-2">
                  镜像复制{" "}
                  {members
                    .filter((member) => member !== output)
                    .map(
                      (member) =>
                        snapshot.displays.find(
                          (d) => d.id_key === member.display_key,
                        )?.friendly_name ?? "显示器",
                    )
                    .join("、")}
                  。分辨率与缩放比例为共享设置。刷新率、方向和 HDR 为各显示器独立设置。
                </p>
              )}
              <SelectField
                label="分辨率"
                value={resolutionKey}
                choices={resolutionChoices}
                disabled={!resolutions.length}
                onValueChange={(value) => {
                  const resolution = resolutions.find(
                    (r) => `${r.width}x${r.height}` === value,
                  )!;
                  change({
                    resolution:
                      output.rotation === "portrait" ||
                      output.rotation === "portrait_flipped"
                        ? { width: resolution.height, height: resolution.width }
                        : { ...resolution },
                  });
                }}
              />
              <RefreshRateField
                output={output}
                cap={cap}
                onChange={(rate) => change({ refresh_rate_mhz: rate })}
              />
              {members
                .filter((member) => member !== output)
                .map((member) => (
                  <div key={member.display_key} className="sm:col-span-2">
                    <RefreshRateField
                      output={member}
                      cap={snapshot.capabilities.find((c) =>
                        capabilityMatches(member, c),
                      )}
                      label={`刷新率 — ${snapshot.displays.find((d) => d.id_key === member.display_key)?.friendly_name ?? "显示器"}`}
                      onChange={(rate) =>
                        change({ refresh_rate_mhz: rate }, member.display_key)
                      }
                    />
                  </div>
                ))}
              {!validMode && (
                <p
                  role="alert"
                  className="text-xs text-danger-text sm:col-span-2"
                >
                  {duplicated
                    ? "请在共享分辨率下为每台显示器选择受支持的刷新率。"
                    : "请为此分辨率选择受支持的刷新率。"}
                </p>
              )}
              <SelectField
                label="方向"
                value={output.rotation ?? "landscape"}
                choices={rotations.map(([value, label]) => ({ value, label }))}
                onValueChange={(value) => {
                  const rotation = value as OutputConfig["rotation"];
                  change({
                    rotation,
                    resolution:
                      rotation === "portrait" || rotation === "portrait_flipped"
                        ? { width: dimensions.height, height: dimensions.width }
                        : { ...dimensions },
                  });
                }}
              />
              <SelectField
                label="缩放"
                value={String(output.scale_percent ?? "preserve")}
                choices={scaleChoices}
                disabled={!scales.length}
                onValueChange={(value) =>
                  change({
                    scale_percent: value === "preserve" ? null : Number(value),
                  })
                }
              />
              <SelectField
                label="HDR"
                value={
                  output.hdr_enabled == null
                    ? "preserve"
                    : String(output.hdr_enabled)
                }
                choices={[
                  { value: "preserve", label: "保持 HDR" },
                  { value: "true", label: "开启" },
                  { value: "false", label: "关闭" },
                ]}
                disabled={!cap?.hdr_supported}
                onValueChange={(value) =>
                  change({
                    hdr_enabled: value === "preserve" ? null : value === "true",
                  })
                }
              />
              <label className="flex min-h-9 items-center gap-2.5 self-end text-sm">
                <Checkbox
                  checked={output.primary}
                  disabled={!output.enabled || output.primary}
                  onCheckedChange={() => change({ primary: true })}
                />
                主显示器
              </label>
            </fieldset>
            {draft.outputs.some((o) => {
              const before = initial.outputs.find(
                (p) => p.display_key === o.display_key,
              );
              return (
                before &&
                (before.position.x !== o.position.x ||
                  before.position.y !== o.position.y)
              );
            }) && (
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                显示器位置将自动调整，以保持显示器边缘相邻并将主显示器置于桌面原点。
              </p>
            )}
            {!cap && (
              <p className="mt-4 text-xs text-muted-foreground">
                无法获取实时功能信息。应用新属性前请先重新连接显示器。
              </p>
            )}
            {[
              localizeReason(cap?.modes_unavailable_reason),
              localizeReason(cap?.hdr_unavailable_reason),
              localizeReason(cap?.scaling_unavailable_reason),
            ]
              .filter(Boolean)
              .map((reason) => (
                <p
                  key={reason}
                  className="mt-3 text-xs leading-relaxed text-muted-foreground"
                >
                  {reason}
                </p>
              ))}
            {error && (
              <p role="alert" className="mt-4 text-sm text-danger-text">
                {error}
              </p>
            )}
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t bg-muted/10 px-5 py-4">
            <Button variant="outline" disabled={locked} onClick={onClose}>
              取消
            </Button>
            <Button
              disabled={locked || !validMode}
              onClick={async () => {
                const validation = layoutError(draft, snapshot.capabilities);
                if (validation) {
                  setError(validation);
                  return;
                }
                setError(null);
                setSaving(true);
                try {
                  if (await onSave(rebaseLayout(draft))) onClose();
                  else
                    setError("无法应用设置。请检查报告的错误并重试。");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "正在保存…" : "保存设置"}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
