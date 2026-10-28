import { Toaster as Sonner, type ToasterProps } from "sonner";

const toasterClassNames: NonNullable<ToasterProps["toastOptions"]>["classNames"] = {
  toast: "bg-background text-foreground border-border",
};

const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    containerAriaLabel="通知"
    toastOptions={{
      classNames: toasterClassNames,
      closeButtonAriaLabel: "关闭通知",
    }}
    {...props}
  />
);

export { Toaster };
