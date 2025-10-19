import type { MeetingNoteStatus } from "../../utils/types.util";

type StatusPillProps={
    status: MeetingNoteStatus
}

export default function StatusPill({ status }: StatusPillProps) {
  const label = status ? status?.toLowerCase().replace(/_/g, " ") : "";
  return <span className={`status-pill status-${status.toLowerCase()}`}>{label}</span>;
}