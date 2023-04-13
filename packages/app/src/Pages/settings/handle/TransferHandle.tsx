import { ApiHost } from "Const";
import AsyncButton from "Element/AsyncButton";
import useEventPublisher from "Feed/EventPublisher";
import { ServiceError } from "Nip05/ServiceProvider";
import SnortServiceProvider, { ManageHandle } from "Nip05/SnortServiceProvider";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { useNavigate } from "react-router-dom";

export default function TransferHandle({ handle }: { handle: ManageHandle }) {
  const publisher = useEventPublisher();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const sp = new SnortServiceProvider(publisher, `${ApiHost}/api/v1/n5sp`);

  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState<Array<string>>([]);

  async function startTransfer() {
    if (!newKey) return;
    setError([]);
    const rsp = await sp.transfer(handle.id, newKey);
    if ("error" in rsp) {
      setError((rsp as ServiceError).errors);
      return;
    }
    navigate(-1);
  }

  return (
    <div className="card">
      <h4>
        <FormattedMessage defaultMessage="Transfer to Pubkey" />
      </h4>
      <div className="flex">
        <div className="f-grow">
          <input
            type="text"
            className="w-max mr10"
            placeholder={formatMessage({
              defaultMessage: "Public key (npub/nprofile)",
            })}
            value={newKey}
            onChange={e => setNewKey(e.target.value)}
          />
        </div>
        <AsyncButton onClick={() => startTransfer()}>
          <FormattedMessage defaultMessage="Transfer" />
        </AsyncButton>
      </div>
      {error && <b className="error">{error}</b>}
    </div>
  );
}
