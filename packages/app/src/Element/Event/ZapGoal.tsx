import "./ZapGoal.css";
import { useState } from "react";
import { NostrEvent, NostrLink } from "@snort/system";
import useZapsFeed from "@/Feed/ZapsFeed";
import { formatShort } from "@/Number";
import { findTag } from "@/SnortUtils";
import Icon from "@/Icons/Icon";
import SendSats from "../SendSats";
import { Zapper } from "@/Zapper";
import Progress from "@/Element/Progress";
import { FormattedNumber } from "react-intl";

export function ZapGoal({ ev }: { ev: NostrEvent }) {
  const [zap, setZap] = useState(false);
  const zaps = useZapsFeed(NostrLink.fromEvent(ev));
  const target = Number(findTag(ev, "amount"));
  const amount = zaps.reduce((acc, v) => (acc += v.amount * 1000), 0);
  const progress = amount / target;

  return (
    <div className="zap-goal card">
      <div className="flex items-center justify-between">
        <h2>{ev.content}</h2>
        <div className="zap-button flex" onClick={() => setZap(true)}>
          <Icon name="zap" size={15} />
        </div>
        <SendSats targets={Zapper.fromEvent(ev)} show={zap} onClose={() => setZap(false)} />
      </div>

      <div className="flex justify-between">
        <div>
          <FormattedNumber value={progress} style="percent" />
        </div>
        <div>
          {formatShort(amount / 1000)}/{formatShort(target / 1000)}
        </div>
      </div>
      <Progress value={progress} />
    </div>
  );
}
