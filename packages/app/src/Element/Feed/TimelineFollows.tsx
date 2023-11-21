import "./Timeline.css";
import { ReactNode, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { EventKind, NostrEvent, NostrLink, TaggedNostrEvent } from "@snort/system";
import { unixNow } from "@snort/shared";
import { SnortContext, useReactions } from "@snort/system-react";

import { dedupeByPubkey, findTag, orderDescending } from "@/SnortUtils";
import useModeration from "@/Hooks/useModeration";
import { FollowsFeed } from "@/Cache";
import { LiveStreams } from "@/Element/LiveStreams";
import useLogin from "@/Hooks/useLogin";
import { TimelineRenderer } from "./TimelineFragment";
import useHashtagsFeed from "@/Feed/HashtagsFeed";
import { ShowMoreInView } from "@/Element/Event/ShowMore";

export interface TimelineFollowsProps {
  postsOnly: boolean;
  liveStreams?: boolean;
  noteFilter?: (ev: NostrEvent) => boolean;
  noteRenderer?: (ev: NostrEvent) => ReactNode;
  noteOnClick?: (ev: NostrEvent) => void;
}

/**
 * A list of notes by "subject"
 */
const TimelineFollows = (props: TimelineFollowsProps) => {
  const [latest, setLatest] = useState(unixNow());
  const feed = useSyncExternalStore(
    cb => FollowsFeed.hook(cb, "*"),
    () => FollowsFeed.snapshot(),
  );
  const reactions = useReactions(
    "follows-feed-reactions",
    feed.map(a => NostrLink.fromEvent(a)),
    undefined,
    true,
  );
  const system = useContext(SnortContext);
  const login = useLogin();
  const { muted, isEventMuted } = useModeration();

  const sortedFeed = useMemo(() => orderDescending(feed), [feed]);
  const oldest = useMemo(() => sortedFeed.at(-1)?.created_at, [sortedFeed]);

  const postsOnly = useCallback(
    (a: NostrEvent) => (props.postsOnly ? !a.tags.some(b => b[0] === "e" || b[0] === "a") : true),
    [props.postsOnly],
  );

  const filterPosts = useCallback(
    (nts: Array<TaggedNostrEvent>) => {
      const a = nts.filter(a => a.kind !== EventKind.LiveEvent);
      return a
        ?.filter(postsOnly)
        .filter(a => !isEventMuted(a) && login.follows.item.includes(a.pubkey) && (props.noteFilter?.(a) ?? true));
    },
    [postsOnly, muted, login.follows.timestamp],
  );

  const mixin = useHashtagsFeed();
  const mainFeed = useMemo(() => {
    return filterPosts((sortedFeed ?? []).filter(a => a.created_at <= latest));
  }, [sortedFeed, filterPosts, latest, login.follows.timestamp]);

  const findHashTagContext = (a: NostrEvent) => {
    const tag = a.tags.filter(a => a[0] === "t").find(a => login.tags.item.includes(a[1].toLowerCase()))?.[1];
    return tag;
  };
  const mixinFiltered = useMemo(() => {
    const mainFeedIds = new Set(mainFeed.map(a => a.id));
    return (mixin.data.data ?? [])
      .filter(a => !mainFeedIds.has(a.id) && postsOnly(a) && !isEventMuted(a))
      .filter(a => a.tags.filter(a => a[0] === "t").length < 5)
      .filter(a => !oldest || a.created_at >= oldest)
      .map(
        a =>
          ({
            ...a,
            context: findHashTagContext(a),
          }) as TaggedNostrEvent,
      );
  }, [mixin, mainFeed, postsOnly, isEventMuted]);

  const latestFeed = useMemo(() => {
    return filterPosts((sortedFeed ?? []).filter(a => a.created_at > latest));
  }, [sortedFeed, latest]);

  const liveStreams = useMemo(() => {
    return (sortedFeed ?? []).filter(a => a.kind === EventKind.LiveEvent && findTag(a, "status") === "live");
  }, [sortedFeed]);

  const latestAuthors = useMemo(() => {
    return dedupeByPubkey(latestFeed).map(e => e.pubkey);
  }, [latestFeed]);

  function onShowLatest(scrollToTop = false) {
    setLatest(unixNow());
    if (scrollToTop) {
      window.scrollTo(0, 0);
    }
  }

  return (
    <>
      {(props.liveStreams ?? true) && <LiveStreams evs={liveStreams} />}
      <TimelineRenderer
        frags={[{ events: orderDescending(mainFeed.concat(mixinFiltered)), refTime: latest }]}
        related={reactions.data ?? []}
        latest={latestAuthors}
        showLatest={t => onShowLatest(t)}
        noteOnClick={props.noteOnClick}
        noteRenderer={props.noteRenderer}
        noteContext={e => {
          if (typeof e.context === "string") {
            return <Link to={`/t/${e.context}`}>{`#${e.context}`}</Link>;
          }
        }}
      />
      {sortedFeed.length > 0 && (
        <ShowMoreInView onClick={async () => await FollowsFeed.loadMore(system, login, oldest ?? unixNow())} />
      )}
    </>
  );
};
export default TimelineFollows;
