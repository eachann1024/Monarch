import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatMs } from "@/app/utils";
import type { PendingDisplayToggle } from "@/app/ui";
import type { PendingConfirmation } from "@/types";

const noop = () => {};

type PendingConfirmationDialogProps = {
  pendingConfirmation: PendingConfirmation | null;
  busy: boolean;
  onConfirm: () => void;
  onRevert: () => void;
};

export function PendingConfirmationDialog({
  pendingConfirmation,
  busy,
  onConfirm,
  onRevert,
}: PendingConfirmationDialogProps) {
  return (
    <AlertDialog open={Boolean(pendingConfirmation)} onOpenChange={noop}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认更改</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingConfirmation ? (
              <>
                将在{" "}
                <span className="font-medium text-foreground">
                  {formatMs(pendingConfirmation.remaining_ms)}
                </span>{" "}
                后自动还原。确认以保留这些显示器与音频设置，或立即还原。
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} onClick={onRevert}>
            还原
          </AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={onConfirm}>
            确认
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type DisplayToggleDialogProps = {
  pendingDisplayToggle: PendingDisplayToggle | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DisplayToggleDialog({
  pendingDisplayToggle,
  busy,
  onOpenChange,
  onConfirm,
}: DisplayToggleDialogProps) {
  const isActive = Boolean(pendingDisplayToggle?.currentlyActive);
  const actionLabel = isActive ? "断开显示器" : "重新连接显示器";
  const title = isActive ? "断开显示器？" : "重新连接显示器？";
  const description = isActive
    ? "将从当前活动布局中移除。"
    : "将重新添加到当前活动布局中。";

  return (
    <AlertDialog
      open={Boolean(pendingDisplayToggle)}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingDisplayToggle ? (
              <>
                <span className="font-medium text-foreground">
                  {pendingDisplayToggle.friendlyName}
                </span>{" "}
                {description}
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>取消</AlertDialogCancel>
          <AlertDialogAction
            variant={isActive ? "destructive" : "default"}
            disabled={busy}
            onClick={onConfirm}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type DeleteProfileDialogProps = {
  pendingProfileDelete: string | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteProfileDialog({
  pendingProfileDelete,
  busy,
  onOpenChange,
  onConfirm,
}: DeleteProfileDialogProps) {
  return (
    <AlertDialog
      open={Boolean(pendingProfileDelete)}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除配置方案？</AlertDialogTitle>
          <AlertDialogDescription>
            {pendingProfileDelete ? (
              <>
                将永久删除配置方案{" "}
                <span className="font-medium text-foreground">
                  {pendingProfileDelete}
                </span>
                。此操作无法撤销。
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>取消</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy}
            onClick={onConfirm}
          >
            删除配置方案
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
