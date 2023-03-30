import "./DM.css";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { useInView } from "react-intersection-observer";
import { HexKey, TaggedRawEvent } from "@snort/nostr";

import useEventPublisher from "Feed/EventPublisher";
import NoteTime from "Element/NoteTime";
import Text from "Element/Text";
import { setLastReadDm } from "Pages/MessagesPage";
import { RootState } from "State/Store";
import { incDmInteraction } from "State/Login";
import { unwrap } from "Util";

import messages from "./messages";

export type DMProps = {
  data: TaggedRawEvent;
};

export default function DM(props: DMProps) {
  const dispatch = useDispatch();
  const pubKey = useSelector<RootState, HexKey | undefined>(s => s.login.publicKey);
  const publisher = useEventPublisher();
  const [content, setContent] = useState("Loading...");
  const [decrypted, setDecrypted] = useState(false);
  const { ref, inView } = useInView();
  const { formatMessage } = useIntl();
  const isMe = props.data.pubkey === pubKey;
  const otherPubkey = isMe ? pubKey : unwrap(props.data.tags.find(a => a[0] === "p")?.[1]);

  async function decrypt() {
    const decrypted = await publisher.decryptDm(props.data);
    setContent(decrypted || "<ERROR>");
    if (!isMe) {
      setLastReadDm(props.data.pubkey);
      dispatch(incDmInteraction());
    }
  }

  useEffect(() => {
    if (!decrypted && inView) {
      setDecrypted(true);
      decrypt().catch(console.error);
    }
  }, [inView, props.data]);

  return (
    <div className={`flex dm f-col${isMe ? " me" : ""}`} ref={ref}>
      <div>
        <NoteTime from={props.data.created_at * 1000} fallback={formatMessage(messages.JustNow)} />
      </div>
      <div className="w-max">
        <Text content={content} tags={[]} creator={otherPubkey} />
      </div>
    </div>
  );
}
