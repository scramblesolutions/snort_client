import { SnortContext } from "@snort/system-react"
import Modal from "Element/Modal";
import { useContext, useEffect, useState } from "react"
import { FormattedMessage } from "react-intl";
import { TradeOffer } from "trading";
import { MostroTrading } from "trading/mostro";
import { CreateOffer } from "./create-offer";

export function OfferList() {
    const system = useContext(SnortContext);
    const [offers, setOffers] = useState<Array<TradeOffer>>([]);
    const [newOffer, setNewOffer] = useState(false);

    useEffect(() => {
        const mostro = new MostroTrading(system, "7590450f6b4d2c6793cacc8c0894e2c6bd2e8a83894912e79335f8f98436d2d8");
        mostro.listOffers().then(o => setOffers(o));
    }, []);

    return <>
        <div className="flex f-space">
            <h2>
                <FormattedMessage defaultMessage="Offers" />
            </h2>
            <button type="button" onClick={() => setNewOffer(true)}>
                <FormattedMessage defaultMessage="Create Offer" />
            </button>
            {newOffer && <Modal id="new-offer" onClose={() => setNewOffer(false)}>
                <CreateOffer />
            </Modal>}
        </div>

        <pre>{JSON.stringify(offers, undefined, 2)}</pre>
        <div className="flex-column g8">
            {offers.map(v => <div>
                {v.side}
            </div>)}
        </div>
    </>
}