import { FormattedMessage } from "react-intl";

import { Magnet } from "@/SnortUtils";

interface MagnetLinkProps {
  magnet: Magnet;
}

const MagnetLink = ({ magnet }: MagnetLinkProps) => {
  return (
    <div className="note-invoice">
      <h4>
        <FormattedMessage defaultMessage="Magnet Link" id="Gcn9NQ" />
      </h4>
      <a href={magnet.raw} rel="noreferrer">
        {magnet.dn ?? magnet.infoHash}
      </a>
    </div>
  );
};

export default MagnetLink;
