import "./Copy.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useCopy } from "useCopy";

export interface CopyProps {
    text: string,
    maxSize?: number
}
export default function Copy({ text, maxSize = 32 }: CopyProps) {
    const { copy, copied, error } = useCopy();
    const sliceLength = maxSize / 2
    const trimmed = text.length > maxSize ? `${text.slice(0, sliceLength)}...${text.slice(-sliceLength)}` : text

    return (
        <div className="flex flex-row copy" onClick={() => copy(text)}>
            <span className="body">
                {trimmed}
            </span>
            <FontAwesomeIcon
                icon={copied ? faCheck : faCopy}
                size="xs"
                style={{ color: copied ? 'var(--success)' : 'var(--highlight)', marginRight: '2px' }}
            />
        </div>
    )
}
