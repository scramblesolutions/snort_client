import { NostrEvent, NostrLink } from "@snort/system";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";

import { findTag } from "@/SnortUtils";
import ProfileImage from "./User/ProfileImage";
import Icon from "@/Icons/Icon";

export function LiveEvent({ ev }: { ev: NostrEvent }) {
  const title = findTag(ev, "title");
  const status = findTag(ev, "status");
  const starts = Number(findTag(ev, "starts"));
  const host = ev.tags.find(a => a[0] === "p" && a[3] === "host")?.[1] ?? ev.pubkey;

  function statusLine() {
    switch (status) {
      case "live": {
        return (
          <div className="flex g4">
            <Icon name="signal-01" />
            <b className="uppercase">
              <FormattedMessage defaultMessage="Live" id="Dn82AL" />
            </b>
          </div>
        );
      }
      case "ended": {
        return (
          <b className="uppercase">
            <FormattedMessage defaultMessage="Ended" id="TP/cMX" />
          </b>
        );
      }
      case "planned": {
        return (
          <b className="uppercase">
            {new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "short" }).format(
              new Date(starts * 1000),
            )}
          </b>
        );
      }
    }
  }

  function cta() {
    const link = `https://zap.stream/${NostrLink.fromEvent(ev).encode()}`;
    switch (status) {
      case "live": {
        return (
          <Link to={link} target="_blank">
            <button type="button">
              <FormattedMessage defaultMessage="Join Stream" id="GQPtfk" />
            </button>
          </Link>
        );
      }
      case "ended": {
        if (findTag(ev, "recording")) {
          return (
            <Link to={link} target="_blank">
              <button type="button">
                <FormattedMessage defaultMessage="Watch Replay" id="6/hB3S" />
              </button>
            </Link>
          );
        }
      }
    }
  }

  return (
    <div className="flex justify-between br p24 bg-primary">
      <div className="flex g12">
        <ProfileImage pubkey={host} showUsername={false} size={56} />
        <div>
          <h2>{title}</h2>
          {statusLine()}
        </div>
      </div>
      <div>{cta()}</div>
    </div>
  );
}
