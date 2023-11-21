import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { FormattedMessage, FormattedNumber } from "react-intl";
import { EventKind, NostrHashtagLink, NoteCollection, RequestBuilder } from "@snort/system";
import { dedupe } from "@snort/shared";
import { useRequestBuilder } from "@snort/system-react";

import Timeline from "@/Element/Feed/Timeline";
import useEventPublisher from "@/Hooks/useEventPublisher";
import useLogin from "@/Hooks/useLogin";
import { setTags } from "@/Login";
import AsyncButton from "@/Element/AsyncButton";
import ProfileImage from "@/Element/User/ProfileImage";
import classNames from "classnames";
import { formatShort } from "@/Number";

const HashTagsPage = () => {
  const params = useParams();
  const tag = (params.tag ?? "").toLowerCase();

  return (
    <>
      <div className="bb p">
        <HashTagHeader tag={tag} />
      </div>
      <Timeline
        key={tag}
        subject={{ type: "hashtag", items: [tag], discriminator: tag }}
        postsOnly={false}
        method={"TIME_RANGE"}
      />
    </>
  );
};

export default HashTagsPage;

export function HashTagHeader({ tag, events, className }: { tag: string; events?: number; className?: string }) {
  const login = useLogin();
  const isFollowing = useMemo(() => {
    return login.tags.item.includes(tag);
  }, [login, tag]);
  const { publisher, system } = useEventPublisher();

  async function followTags(ts: string[]) {
    if (publisher) {
      const ev = await publisher.bookmarks(
        ts.map(a => new NostrHashtagLink(a)),
        "follow",
      );
      setTags(login, ts, ev.created_at * 1000);
      await system.BroadcastEvent(ev);
    }
  }

  const sub = useMemo(() => {
    const rb = new RequestBuilder(`hashtag-counts:${tag}`);
    rb.withFilter().kinds([EventKind.CategorizedBookmarks]).tag("d", ["follow"]).tag("t", [tag.toLowerCase()]);
    return rb;
  }, [tag]);
  const followsTag = useRequestBuilder(NoteCollection, sub);
  const pubkeys = dedupe((followsTag.data ?? []).map(a => a.pubkey));

  return (
    <div className={classNames("flex flex-col", className)}>
      <div className="flex items-center justify-between">
        <div className="flex g8 items-center">
          <b className="text-xl">
            <Link to={`/t/${tag}`}>#{tag}</Link>
          </b>
          {events && (
            <small>
              <FormattedMessage
                defaultMessage="{n} notes"
                id="un1nGw"
                values={{
                  n: formatShort(events),
                }}
              />
            </small>
          )}
        </div>
        {isFollowing ? (
          <AsyncButton className="secondary" onClick={() => followTags(login.tags.item.filter(t => t !== tag))}>
            <FormattedMessage defaultMessage="Unfollow" id="izWS4J" />
          </AsyncButton>
        ) : (
          <AsyncButton onClick={() => followTags(login.tags.item.concat([tag]))}>
            <FormattedMessage defaultMessage="Follow" id="ieGrWo" />
          </AsyncButton>
        )}
      </div>
      <div className="flex items-center">
        {pubkeys.slice(0, 5).map(a => (
          <ProfileImage pubkey={a} showUsername={false} showFollowDistance={false} size={40} />
        ))}
        {pubkeys.length > 5 && (
          <span>
            +<FormattedNumber value={pubkeys.length - 5} />
          </span>
        )}
      </div>
    </div>
  );
}
