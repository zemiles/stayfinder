import { AlertCircle, CheckCircle2 } from "lucide-react";

export function StatusBanner({
  status,
  message
}: {
  status: "success" | "error" | "idle";
  message: string;
}) {
  if (status === "idle" || !message) {
    return null;
  }

  const Icon = status === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div className={`status status-${status}`} role="status">
      <Icon size={18} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
