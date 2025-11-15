import { Badge } from "@/components/ui/badge";
import { Event } from "@/types";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, XCircle } from "lucide-react";

export const NameCell = ({ event }: { event: Event }) => {
  return (
    <Link
      href={`/events/${event.id}`}
      className="font-medium hover:underline text-blue-600 dark:text-blue-400"
    >
      {event.name}
    </Link>
  );
};

export const EventTypeCell = ({ eventType }: { eventType: string }) => {
  return (
    <Badge variant={eventType === "singles" ? "default" : "secondary"}>
      {eventType === "singles" ? "Singles" : "Doubles"}
    </Badge>
  );
};

export const GenderCell = ({ gender }: { gender: string }) => {
  const variant =
    gender === "male"
      ? "default"
      : gender === "female"
      ? "secondary"
      : "outline";
  const label =
    gender === "male"
      ? "Male"
      : gender === "female"
      ? "Female"
      : "Mixed";

  return <Badge variant={variant}>{label}</Badge>;
};

export const CompletedCell = ({ completed }: { completed: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      {completed ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm">Yes</span>
        </>
      ) : (
        <>
          <XCircle className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-muted-foreground">No</span>
        </>
      )}
    </div>
  );
};

export const DateRangeCell = ({
  startDate,
  endDate,
}: {
  startDate?: string | null;
  endDate?: string | null;
}) => {
  if (!startDate && !endDate) {
    return <span className="text-muted-foreground">-</span>;
  }

  if (startDate && endDate) {
    return (
      <span className="text-sm">
        {format(new Date(startDate), "MMM d")} -{" "}
        {format(new Date(endDate), "MMM d, yyyy")}
      </span>
    );
  }

  if (startDate) {
    return (
      <span className="text-sm">{format(new Date(startDate), "MMM d, yyyy")}</span>
    );
  }

  return (
    <span className="text-sm">{format(new Date(endDate!), "MMM d, yyyy")}</span>
  );
};

export const EventDatesCell = ({ dates }: { dates?: string[] }) => {
  if (!dates || dates.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {dates.slice(0, 2).map((date, idx) => (
        <span key={idx} className="text-sm">
          {format(new Date(date), "MMM d, yyyy")}
        </span>
      ))}
      {dates.length > 2 && (
        <span className="text-xs text-muted-foreground">
          +{dates.length - 2} more
        </span>
      )}
    </div>
  );
};

export const RegistrationsCountCell = ({
  count,
}: {
  count?: number;
}) => {
  return (
    <span className="text-sm">{count ?? 0}</span>
  );
};

export const LastMatchPlayedDateCell = ({
  date,
}: {
  date?: string | null;
}) => {
  if (!date) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <span className="text-sm">{format(new Date(date), "MMM d, yyyy")}</span>
  );
};

