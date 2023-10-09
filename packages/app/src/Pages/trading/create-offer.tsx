import "./create-offer.css";
import { useState } from "react";
import { FormattedMessage, FormattedNumber } from "react-intl";

import Tabs, { Tab } from "Element/Tabs";
import { useRates } from "Hooks/useRates";
import { unwrap } from "SnortUtils";
import AsyncButton from "Element/AsyncButton";

export function CreateOffer() {
    const [side, setSide] = useState(0);
    const [premium, setPremium] = useState(1);
    const [amount, setAmount] = useState(10);
    const [fiat, setFiat] = useState("USD");
    const rate = useRates(`BTC${fiat}`, true);

    const tabs = [
        {
            text: <FormattedMessage defaultMessage="Buy" />,
            value: 0
        },
        {
            text: <FormattedMessage defaultMessage="Sell" />,
            value: 1
        }
    ] as Array<Tab>

    const rx = side === 0 ? rate.bid : rate.ask;
    return <div className="create-offer flex-column g12">
        <h2>
            <FormattedMessage defaultMessage="New Offer" />
        </h2>
        <div className="flex-column g4">
            <h3>
                <FormattedMessage defaultMessage="Side" />
            </h3>
            <Tabs tab={unwrap(tabs.find(a => a.value === side))} tabs={tabs} setTab={t => setSide(t.value)} />
        </div>
        <div className="flex-column g4">
            <h3>
                <FormattedMessage defaultMessage="Fiat" />
            </h3>
            <select value={fiat} onChange={e => setFiat(e.target.value)}>
                <option>USD</option>
                <option>EUR</option>
            </select>
        </div>
        <div className="flex g4">
            <div className="flex-column g4">
                <h3>
                    <FormattedMessage defaultMessage="Premium" />
                </h3>
                <div className="premium">
                    <div>
                        <FormattedNumber style="percent" value={premium / 100} />
                    </div>
                    <div onClick={() => setPremium(s => s + 1)}>+</div>
                    <div onClick={() => setPremium(s => s - 1)}>-</div>
                </div>
            </div>
            <div className="flex-column g4">
                <h3>
                    <FormattedMessage defaultMessage="Amount" />
                </h3>
                <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
            </div>
            <div className="flex-column g4">
                <h3>
                    <FormattedMessage defaultMessage="Rate" />
                </h3>
                <FormattedMessage defaultMessage="{n} @ {rate}" values={{
                    n: <FormattedNumber value={amount} style="currency" currency={fiat} />,
                    rate: <FormattedNumber value={rx * (1 + (premium / 100))} style="currency" currency={fiat} />
                }} />
            </div>
        </div>
        <AsyncButton onClick={() => { }}>
            <FormattedMessage defaultMessage="Create Offer" />
        </AsyncButton>
    </div>
}