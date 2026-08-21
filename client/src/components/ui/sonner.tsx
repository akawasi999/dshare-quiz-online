import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--text)",
          "--normal-border": "var(--border)",
          "--success-bg": "color-mix(in srgb, var(--success) 12%, var(--surface))",
          "--success-text": "var(--success)",
          "--warning-bg": "color-mix(in srgb, var(--warning) 14%, var(--surface))",
          "--warning-text": "var(--warning)",
          "--error-bg": "color-mix(in srgb, var(--danger) 12%, var(--surface))",
          "--error-text": "var(--danger)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
