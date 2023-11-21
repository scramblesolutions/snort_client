import { ReactNode } from "react";
import { FormattedMessage } from "react-intl";
import { HexKey } from "@snort/system";
import { dedupe } from "@snort/shared";

import useEventPublisher from "@/Hooks/useEventPublisher";
import ProfilePreview from "@/Element/User/ProfilePreview";
import useLogin from "@/Hooks/useLogin";

import messages from "../messages";
import { FollowsFeed } from "@/Cache";
import AsyncButton from "../AsyncButton";
import { setFollows } from "@/Login";

export interface FollowListBaseProps {
  pubkeys: HexKey[];
  title?: ReactNode;
  showFollowAll?: boolean;
  showAbout?: boolean;
  className?: string;
  actions?: ReactNode;
  profileActions?: (pk: string) => ReactNode;
}

export default function FollowListBase({
  pubkeys,
  title,
  showFollowAll,
  showAbout,
  className,
  actions,
  profileActions,
}: FollowListBaseProps) {
  const { publisher, system } = useEventPublisher();
  const login = useLogin();

  async function followAll() {
    if (publisher) {
      const newFollows = dedupe([...pubkeys, ...login.follows.item]);
      const ev = await publisher.contactList(newFollows.map(a => ["p", a]));
      setFollows(login, newFollows, ev.created_at);
      await system.BroadcastEvent(ev);
      await FollowsFeed.backFill(system, pubkeys);
    }
  }

  return (
    <div className="flex flex-col g8">
      {(showFollowAll ?? true) && (
        <div className="flex items-center">
          <div className="grow font-bold">{title}</div>
          {actions}
          <AsyncButton className="transparent" type="button" onClick={() => followAll()} disabled={login.readonly}>
            <FormattedMessage {...messages.FollowAll} />
          </AsyncButton>
        </div>
      )}
      <div className={className}>
        {pubkeys?.map(a => (
          <ProfilePreview pubkey={a} key={a} options={{ about: showAbout }} actions={profileActions?.(a)} />
        ))}
      </div>
    </div>
  );
}
