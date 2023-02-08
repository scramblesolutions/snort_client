import "./BackButton.css";
import { useIntl } from "react-intl";

import ArrowBack from "Icons/ArrowBack";

import messages from "./messages";

interface BackButtonProps {
  text?: string;
  onClick?(): void;
}

const BackButton = ({ text, onClick }: BackButtonProps) => {
  const { formatMessage } = useIntl();
  const onClickHandler = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <button className="back-button" type="button" onClick={onClickHandler}>
      <ArrowBack />
      {text || formatMessage(messages.Back)}
    </button>
  );
};

export default BackButton;
