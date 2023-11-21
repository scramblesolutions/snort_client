import messages from "../messages";
import { useState } from "react";
import { FormattedMessage } from "react-intl";

const HiddenNote = ({ children }: { children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return show ? (
    children
  ) : (
    <div className="card note hidden-note">
      <div className="header">
        <p>
          <FormattedMessage defaultMessage="This note has been muted" id="qfmMQh" />
        </p>
        <button type="button" onClick={() => setShow(true)}>
          <FormattedMessage {...messages.Show} />
        </button>
      </div>
    </div>
  );
};

export default HiddenNote;
