import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Volume2 } from "lucide-react";
import { localizeReason } from "@/app/messages";
import type { AudioOutput, AudioSnapshot, Profile } from "@/types";

export function AudioOutputSelect({
  audio,
  value,
  saved,
  onChange,
  disabled,
  label = "音频输出",
}: {
  audio: AudioSnapshot;
  value: string | null;
  saved?: AudioOutput | null;
  onChange: (id: string | null) => void;
  disabled: boolean;
  label?: string;
}) {
  const id = useId();
  const devices = [...audio.devices].sort(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  );
  const available = devices.filter((device) => device.available);
  const unavailable = devices.filter((device) => !device.available);
  const missing = value && !audio.devices.some((device) => device.id === value);
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className="field-label">
        音频输出
      </label>
      <Select
        value={value ?? "__unchanged__"}
        disabled={disabled}
        onValueChange={(next) =>
          onChange(next === "__unchanged__" ? null : next)
        }
      >
        <SelectTrigger id={id} aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unchanged__">保持不变</SelectItem>
          {available.length > 0 && (
            <SelectGroup>
              <SelectSeparator />
              <SelectLabel>可用</SelectLabel>
              {available.map((device) => (
                <SelectItem key={device.id} value={device.id}>
                  {device.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {(unavailable.length > 0 || missing) && (
            <SelectGroup>
              <SelectSeparator />
              <SelectLabel>不可用</SelectLabel>
              {missing && (
                <SelectItem value={value} disabled>
                  {saved?.name ?? "已保存的音频输出"} (不可用)
                </SelectItem>
              )}
              {unavailable.map((device) => (
                <SelectItem key={device.id} value={device.id}>
                  {device.name} (不可用)
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CurrentAudioOutput({ audio }: { audio: AudioSnapshot }) {
  const current = audio.devices.find(
    (device) => device.id === audio.defaults.console,
  );
  const localizedReason = localizeReason(audio.unavailable_reason);
  const name = localizedReason
    ? "不可用"
    : (current?.name ??
      (audio.defaults.console ? "设备不可用" : "无输出设备"));
  return (
    <p
      role="status"
      className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground"
      title={localizedReason ?? name}
    >
      <Volume2 className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">音频：{name}</span>
    </p>
  );
}

export function ProfileAudio({
  profile,
  audio,
  disabled,
  onSave,
}: {
  profile: Profile;
  audio: AudioSnapshot;
  disabled: boolean;
  onSave: (name: string, id: string | null) => void;
}) {
  const saved = profile.audio_output?.id ?? null;
  const [selected, setSelected] = useState(saved);
  return (
    <div className="flex min-w-0 flex-wrap items-end gap-2">
      <div className="min-w-0 basis-56 grow sm:max-w-sm">
        <AudioOutputSelect
          label={`配置方案 ${profile.name} 的音频输出`}
          audio={audio}
          value={selected}
          saved={profile.audio_output}
          onChange={setSelected}
          disabled={disabled}
        />
      </div>
      {selected !== saved && (
        <>
          <Button
            disabled={disabled}
            onClick={() => onSave(profile.name, selected)}
          >
            保存音频
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => setSelected(saved)}
          >
            取消
          </Button>
        </>
      )}
    </div>
  );
}
