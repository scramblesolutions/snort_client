import "./Note.css";
import React, { useCallback, useMemo, useState, useLayoutEffect, ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { useIntl, FormattedMessage } from "react-intl";

import { default as NEvent } from "Nostr/Event";
import ProfileImage from "Element/ProfileImage";
import Text from "Element/Text";

import { eventLink, getReactions, hexToBech32 } from "Util";
import NoteFooter, { Translation } from "Element/NoteFooter";
import NoteTime from "Element/NoteTime";
import EventKind from "Nostr/EventKind";
import { useUserProfiles } from "Feed/ProfileFeed";
import { TaggedRawEvent, u256 } from "Nostr";
import useModeration from "Hooks/useModeration";

import messages from "./messages";

export interface NoteProps {
  data?: TaggedRawEvent;
  className?: string;
  related: TaggedRawEvent[];
  highlight?: boolean;
  ignoreModeration?: boolean;
  options?: {
    showHeader?: boolean;
    showTime?: boolean;
    showFooter?: boolean;
  };
  ["data-ev"]?: NEvent;
}

const HiddenNote = ({ children }: { children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return show ? (
    <>{children}</>
  ) : (
    <div className="card note hidden-note">
      <div className="header">
        <p>
          <FormattedMessage {...messages.MutedAuthor} />
        </p>
        <button onClick={() => setShow(true)}>
          <FormattedMessage {...messages.Show} />
        </button>
      </div>
    </div>
  );
};

export default function Note(props: NoteProps) {
  const navigate = useNavigate();
  const { data, related, highlight, options: opt, ["data-ev"]: parsedEvent, ignoreModeration = false } = props;
  const ev = useMemo(() => parsedEvent ?? new NEvent(data), [data]);
  const pubKeys = useMemo(() => ev.Thread?.PubKeys || [], [ev]);
  const users = useUserProfiles(pubKeys);
  const deletions = useMemo(() => getReactions(related, ev.Id, EventKind.Deletion), [related]);
  const { isMuted } = useModeration();
  const isOpMuted = isMuted(ev.PubKey);
  const { ref, inView, entry } = useInView({ triggerOnce: true });
  const [extendable, setExtendable] = useState<boolean>(false);
  const [showMore, setShowMore] = useState<boolean>(false);
  const baseClassName = `note card ${props.className ? props.className : ""}`;
  const [translated, setTranslated] = useState<Translation>();
  const { formatMessage } = useIntl();

  const options = {
    showHeader: true,
    showTime: true,
    showFooter: true,
    ...opt,
  };

  const transformBody = useCallback(() => {
    const body = ev?.Content ?? "";
    if (deletions?.length > 0) {
      return (
        <b className="error">
          <FormattedMessage {...messages.Deleted} />
        </b>
      );
    }
    return <Text content={body} tags={ev.Tags} users={users || new Map()} creator={ev.PubKey} />;
  }, [ev]);

  useLayoutEffect(() => {
    if (entry && inView && extendable === false) {
      const h = entry?.target.clientHeight ?? 0;
      if (h > 650) {
        setExtendable(true);
      }
    }
  }, [inView, entry, extendable]);

  function goToEvent(e: React.MouseEvent, id: u256) {
    e.stopPropagation();
    navigate(eventLink(id));
  }

  function replyTag() {
    if (ev.Thread === null) {
      return null;
    }

    const maxMentions = 2;
    const replyId = ev.Thread?.ReplyTo?.Event ?? ev.Thread?.Root?.Event;
    const mentions: { pk: string; name: string; link: ReactNode }[] = [];
    for (const pk of ev.Thread?.PubKeys ?? []) {
      const u = users?.get(pk);
      const npub = hexToBech32("npub", pk);
      const shortNpub = npub.substring(0, 12);
      if (u) {
        mentions.push({
          pk,
          name: u.name ?? shortNpub,
          link: <Link to={`/p/${npub}`}>{u.name ? `@${u.name}` : shortNpub}</Link>,
        });
      } else {
        mentions.push({
          pk,
          name: shortNpub,
          link: <Link to={`/p/${npub}`}>{shortNpub}</Link>,
        });
      }
    }
    mentions.sort(a => (a.name.startsWith("npub") ? 1 : -1));
    const othersLength = mentions.length - maxMentions;
    const renderMention = (m: { link: React.ReactNode; pk: string; name: string }, idx: number) => {
      return (
        <React.Fragment key={m.pk}>
          {idx > 0 && ", "}
          {m.link}
        </React.Fragment>
      );
    };
    const pubMentions =
      mentions.length > maxMentions ? mentions?.slice(0, maxMentions).map(renderMention) : mentions?.map(renderMention);
    const others = mentions.length > maxMentions ? formatMessage(messages.Others, { n: othersLength }) : "";
    return (
      <div className="reply">
        re:&nbsp;
        {(mentions?.length ?? 0) > 0 ? (
          <>
            {pubMentions}
            {others}
          </>
        ) : (
          replyId && <Link to={eventLink(replyId)}>{hexToBech32("note", replyId)?.substring(0, 12)}</Link>
        )}
      </div>
    );
  }

  if (ev.Kind !== EventKind.TextNote) {
    return (
      <>
        <h4>
          <FormattedMessage {...messages.UnknownEventKind} values={{ kind: ev.Kind }} />
        </h4>
        <pre>{JSON.stringify(ev.ToObject(), undefined, "  ")}</pre>
      </>
    );
  }

  function translation() {
    if (translated && translated.confidence > 0.5) {
      return (
        <>
          <p className="highlight">
            <FormattedMessage {...messages.TranslatedFrom} values={{ lang: translated.fromLanguage }} />
          </p>
          {translated.text}
        </>
      );
    } else if (translated) {
      return (
        <p className="highlight">
          <FormattedMessage {...messages.TranslationFailed} />
        </p>
      );
    }
  }

  function content() {
    if (!inView) return null;
    return (
      <>
        {options.showHeader && (
          <div className="header flex">
            <ProfileImage pubkey={ev.RootPubKey} subHeader={replyTag() ?? undefined} />
            {options.showTime && (
              <div className="info">
                <NoteTime from={ev.CreatedAt * 1000} />
              </div>
            )}
          </div>
        )}
        <div className="body" onClick={e => goToEvent(e, ev.Id)}>
          {transformBody()}
          {translation()}
        </div>
        {extendable && !showMore && (
          <span className="expand-note mt10 flex f-center" onClick={() => setShowMore(true)}>
            <FormattedMessage {...messages.ShowMore} />
          </span>
        )}
        {options.showFooter && <NoteFooter ev={ev} related={related} onTranslated={t => setTranslated(t)} />}
      </>
    );
  }

  const note = (
    <div
      className={`${baseClassName}${highlight ? " active " : " "}${extendable && !showMore ? " note-expand" : ""}`}
      ref={ref}>
      {content()}
    </div>
  );

  return !ignoreModeration && isOpMuted ? <HiddenNote>{note}</HiddenNote> : note;
}
