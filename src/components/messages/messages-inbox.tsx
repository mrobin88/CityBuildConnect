"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ConversationRow = {
  peerUserId: string;
  peerName: string;
  peerRole: string;
  lastPreview: string;
  lastAt: string;
  unreadCount: number;
};

type ThreadMessage = {
  id: string;
  fromMe: boolean;
  body: string;
  createdAt: string;
};

type Props = {
  basePath: "/worker/messages" | "/employer/messages";
};

export function MessagesInbox({ basePath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withParam = searchParams.get("with") ?? "";

  const [peerId, setPeerId] = useState("");
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [peerName, setPeerName] = useState("");
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (withParam) setPeerId(withParam);
  }, [withParam]);

  const loadConversations = useCallback(async () => {
    setListError(null);
    setLoadingList(true);
    try {
      const res = await fetch("/api/messages/conversations", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListError((data as { error?: string }).error ?? "Could not load conversations.");
        return;
      }
      setConversations((data as { conversations: ConversationRow[] }).conversations ?? []);
    } catch {
      setListError("Network error.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    if (!id) {
      setThread([]);
      setPeerName("");
      return;
    }
    setThreadError(null);
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/messages/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setThreadError((data as { error?: string }).error ?? "Could not load thread.");
        setThread([]);
        setPeerName("");
        return;
      }
      const d = data as { peer: { name: string }; messages: ThreadMessage[] };
      setPeerName(d.peer?.name ?? "User");
      setThread(d.messages ?? []);
    } catch {
      setThreadError("Network error.");
      setThread([]);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    void loadThread(peerId);
  }, [peerId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, peerId]);

  const selectPeer = (id: string) => {
    setPeerId(id);
    router.replace(`${basePath}?with=${encodeURIComponent(id)}`);
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !peerId) return;
    setSending(true);
    setThreadError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: peerId, body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setThreadError((data as { error?: string }).error ?? "Send failed.");
        return;
      }
      setDraft("");
      await loadThread(peerId);
      await loadConversations();
    } catch {
      setThreadError("Network error.");
    } finally {
      setSending(false);
    }
  };

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
  }, [conversations]);

  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">Messages</h1>
        <button type="button" className="btnSecondary" onClick={() => void loadConversations()}>
          Refresh
        </button>
      </header>

      <div className="msgSplit">
        <aside className="msgSidebar">
          <div className="msgSidebarHeader">Inbox</div>
          {loadingList ? <div className="muted msgPad">Loading…</div> : null}
          {listError ? <div className="msgPad" style={{ color: "#b91c1c", fontSize: 12 }}>{listError}</div> : null}
          {!loadingList && sortedConversations.length === 0 ? (
            <div className="muted msgPad" style={{ fontSize: 12, lineHeight: 1.45 }}>
              No conversations yet.{" "}
              {basePath.startsWith("/employer") ? (
                <>
                  Start one from{" "}
                  <Link href="/employer/browse" className="certDocLink">
                    Browse workers
                  </Link>
                  .
                </>
              ) : (
                <>Employers can message you first; your replies appear here.</>
              )}
            </div>
          ) : null}
          <ul className="msgConvList">
            {sortedConversations.map((c) => (
              <li key={c.peerUserId}>
                <button
                  type="button"
                  className={`msgConvItem ${peerId === c.peerUserId ? "msgConvItemActive" : ""}`}
                  onClick={() => selectPeer(c.peerUserId)}
                >
                  <div className="msgConvName">
                    {c.peerName}
                    {c.unreadCount > 0 ? <span className="msgUnreadBadge">{c.unreadCount}</span> : null}
                  </div>
                  <div className="msgConvPreview">{c.lastPreview}</div>
                  <div className="msgConvTime">{formatShortTime(c.lastAt)}</div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="msgThreadPane">
          {!peerId ? (
            <div className="muted msgPad" style={{ marginTop: 24 }}>
              Select a conversation or open a thread from Browse workers.
            </div>
          ) : (
            <>
              <div className="msgThreadHeader">
                <div className="workerName">{peerName || "…"}</div>
                <div className="muted" style={{ fontSize: 11 }}>
                  Direct messages
                </div>
              </div>
              {loadingThread ? <div className="muted msgPad">Loading thread…</div> : null}
              {threadError ? <div className="msgPad" style={{ color: "#b91c1c", fontSize: 12 }}>{threadError}</div> : null}
              <div className="msgBubbleList">
                {thread.map((m) => (
                  <div key={m.id} className={`msgRow ${m.fromMe ? "msgRowSent" : "msgRowRecv"}`}>
                    <div className={m.fromMe ? "msgBubble msgBubbleSent" : "msgBubble msgBubbleRecv"}>
                      <div className="msgBubbleText">{m.body}</div>
                      <div className="msgBubbleMeta">{formatTime(m.createdAt)}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form className="msgComposer" onSubmit={onSend}>
                <textarea
                  className="msgTextarea"
                  rows={3}
                  placeholder="Write a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending}
                  maxLength={8000}
                />
                <button type="submit" className="btnPrimary" disabled={sending || !draft.trim()}>
                  {sending ? "Sending…" : "Send"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function formatShortTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
}
