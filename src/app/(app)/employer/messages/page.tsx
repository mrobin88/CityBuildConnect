import { Suspense } from "react";
import { MessagesInbox } from "@/components/messages/messages-inbox";

export const dynamic = "force-dynamic";

export default function EmployerMessagesPage() {
  return (
    <Suspense fallback={<div className="pageStack muted msgPad">Loading messages…</div>}>
      <MessagesInbox basePath="/employer/messages" />
    </Suspense>
  );
}
