import "./ChatPage.css";
import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import ProfileImage from "Element/ProfileImage";
import { bech32ToHex } from "Util";
import useEventPublisher from "Feed/EventPublisher";

import DM from "Element/DM";
import { RawEvent, TaggedRawEvent } from "@snort/nostr";
import { dmsInChat, isToSelf } from "Pages/MessagesPage";
import NoteToSelf from "Element/NoteToSelf";
import { RootState } from "State/Store";
import { FormattedMessage } from "react-intl";
import { useDmCache } from "Hooks/useDmsCache";

type RouterParams = {
  id: string;
};

export default function ChatPage() {
  const params = useParams<RouterParams>();
  const publisher = useEventPublisher();
  const id = bech32ToHex(params.id ?? "");
  const pubKey = useSelector((s: RootState) => s.login.publicKey);
  const [content, setContent] = useState<string>();
  const dmListRef = useRef<HTMLDivElement>(null);
  const dms = filterDms(useDmCache());

  function filterDms(dms: readonly RawEvent[]) {
    return dmsInChat(id === pubKey ? dms.filter(d => isToSelf(d, pubKey)) : dms, id);
  }

  const sortedDms = useMemo(() => {
    return [...dms].sort((a, b) => a.created_at - b.created_at);
  }, [dms]);

  useEffect(() => {
    if (dmListRef.current) {
      dmListRef.current.scroll(0, dmListRef.current.scrollHeight);
    }
  }, [dmListRef.current?.scrollHeight]);

  async function sendDm() {
    if (content) {
      const ev = await publisher.sendDm(content, id);
      console.debug(ev);
      publisher.broadcast(ev);
      setContent("");
    }
  }

  async function onEnter(e: KeyboardEvent) {
    const isEnter = e.code === "Enter";
    if (isEnter && !e.shiftKey) {
      await sendDm();
    }
  }

  return (
    <>
      {(id === pubKey && <NoteToSelf className="f-grow mb-10" pubkey={id} />) || (
        <ProfileImage pubkey={id} className="f-grow mb10" />
      )}
      <div className="dm-list" ref={dmListRef}>
        <div>
          {sortedDms.map(a => (
            <DM data={a as TaggedRawEvent} key={a.id} />
          ))}
        </div>
      </div>
      <div className="write-dm">
        <div className="inner">
          <textarea
            className="f-grow mr10"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => onEnter(e)}></textarea>
          <button type="button" onClick={() => sendDm()}>
            <FormattedMessage defaultMessage="Send" description="Send DM button" />
          </button>
        </div>
      </div>
    </>
  );
}
