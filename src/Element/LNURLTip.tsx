import "./LNURLTip.css";
import { useEffect, useMemo, useState } from "react";
import { bech32ToText } from "Util";
import Modal from "Element/Modal";
import QrCode from "Element/QrCode";
import Copy from "Element/Copy";

declare global {
    interface Window {
        webln?: {
            enabled: boolean,
            enable: () => Promise<void>,
            sendPayment: (pr: string) => Promise<any>
        }
    }
}

interface LNURLService {
    minSendable?: number,
    maxSendable?: number,
    metadata: string,
    callback: string,
    commentAllowed?: number
}

interface LNURLInvoice {
    pr: string,
    successAction?: LNURLSuccessAction
}

interface LNURLSuccessAction {
    description?: string,
    url?: string
}

export interface LNURLTipProps {
    onClose?: () => void,
    svc?: string,
    show?: boolean,
    invoice?: string, // shortcut to invoice qr tab
    title?: string,
    notice?: string
}

export default function LNURLTip(props: LNURLTipProps) {
    const onClose = props.onClose || (() => { });
    const service = props.svc;
    const show = props.show || false;
    const amounts = [50, 100, 500, 1_000, 5_000, 10_000, 50_000];
    const [payService, setPayService] = useState<LNURLService>();
    const [amount, setAmount] = useState<number>();
    const [customAmount, setCustomAmount] = useState<number>();
    const [invoice, setInvoice] = useState<LNURLInvoice>();
    const [comment, setComment] = useState<string>();
    const [error, setError] = useState<string>();
    const [success, setSuccess] = useState<LNURLSuccessAction>();

    useEffect(() => {
        if (show && !props.invoice) {
            loadService()
                .then(a => setPayService(a!))
                .catch(() => setError("Failed to load LNURL service"));
        } else {
            setPayService(undefined);
            setError(undefined);
            setInvoice(props.invoice ? { pr: props.invoice } : undefined);
            setAmount(undefined);
            setComment(undefined);
            setSuccess(undefined);
        }
    }, [show, service]);

    const serviceAmounts = useMemo(() => {
        if (payService) {
            let min = (payService.minSendable ?? 0) / 1000;
            let max = (payService.maxSendable ?? 0) / 1000;
            return amounts.filter(a => a >= min && a <= max);
        }
        return [];
    }, [payService]);

    const metadata = useMemo(() => {
        if (payService) {
            let meta: string[][] = JSON.parse(payService.metadata);
            let desc = meta.find(a => a[0] === "text/plain");
            let image = meta.find(a => a[0] === "image/png;base64");
            return {
                description: desc ? desc[1] : null,
                image: image ? image[1] : null
            };
        }
        return null;
    }, [payService]);

    const selectAmount = (a: number) => {
        setError(undefined);
        setInvoice(undefined);
        setAmount(a);
    };

    async function fetchJson<T>(url: string) {
        let rsp = await fetch(url);
        if (rsp.ok) {
            let data: T = await rsp.json();
            console.log(data);
            setError(undefined);
            return data;
        }
        return null;
    }

    async function loadService(): Promise<LNURLService | null> {
        if (service) {
            let isServiceUrl = service.toLowerCase().startsWith("lnurl");
            if (isServiceUrl) {
                let serviceUrl = bech32ToText(service);
                return await fetchJson(serviceUrl);
            } else {
                let ns = service.split("@");
                return await fetchJson(`https://${ns[1]}/.well-known/lnurlp/${ns[0]}`);
            }
        }
        return null;
    }

    async function loadInvoice() {
        if (!amount || !payService) return null;
        const url = `${payService.callback}?amount=${Math.floor(amount * 1000)}${comment ? `&comment=${encodeURIComponent(comment)}` : ""}`;
        try {
            let rsp = await fetch(url);
            if (rsp.ok) {
                let data = await rsp.json();
                console.log(data);
                if (data.status === "ERROR") {
                    setError(data.reason);
                } else {
                    setInvoice(data);
                    setError("");
                }
            } else {
                setError("Failed to load invoice");
            }
        } catch (e) {
            setError("Failed to load invoice");
        }
    };

    function custom() {
        let min = (payService?.minSendable ?? 0) / 1000;
        let max = (payService?.maxSendable ?? 21_000_000_000) / 1000;
        return (
            <div className="flex mb10">
                <input type="number" min={min} max={max} className="f-grow mr10" value={customAmount} onChange={(e) => setCustomAmount(parseInt(e.target.value))} />
                <div className="btn" onClick={() => selectAmount(customAmount!)}>Confirm</div>
            </div>
        );
    }

    async function payWebLN() {
        try {
            if (!window.webln!.enabled) {
                await window.webln!.enable();
            }
            let res = await window.webln!.sendPayment(invoice!.pr);
            console.log(res);
            setSuccess(invoice!.successAction || {});
        } catch (e: any) {
            setError(e.toString());
            console.warn(e);
        }
    }

    function webLn() {
        if ("webln" in window) {
            return (
                <div className="btn" onClick={() => payWebLN()}>Pay with WebLN</div>
            )
        }
        return null;
    }

    function invoiceForm() {
        if (invoice) return null;
        return (
            <>
                <div className="f-ellipsis mb10">{metadata?.description ?? service}</div>
                <div className="flex">
                    {(payService?.commentAllowed ?? 0) > 0 ?
                        <input type="text" placeholder="Comment" className="mb10 f-grow" maxLength={payService?.commentAllowed} onChange={(e) => setComment(e.target.value)} /> : null}
                </div>
                <div className="mb10">
                    {serviceAmounts.map(a => <span className={`sat-amount ${amount === a ? "active" : ""}`} key={a} onClick={() => selectAmount(a)}>
                        {a.toLocaleString()}
                    </span>)}
                    {payService ?
                        <span className={`sat-amount ${amount === -1 ? "active" : ""}`} onClick={() => selectAmount(-1)}>
                            Custom
                        </span> : null}
                </div>
                {amount === -1 ? custom() : null}
                {(amount ?? 0) > 0 ? <div className="btn mb10" onClick={() => loadInvoice()}>Get Invoice</div> : null}
            </>
        )
    }

    function payInvoice() {
        if (success) return null;
        const pr = invoice?.pr;
        return (
            <>
                <div className="invoice">
                    {props.notice && <b className="error">{props.notice}</b>}
                    <QrCode data={pr} link={`lightning:${pr}`} />
                    <div className="actions">
                        {pr && (
                            <>
                                <div className="copy-action">
                                    <Copy text={pr} maxSize={26} />
                                </div>
                                <div className="pay-actions">
                                    <div className="btn" onClick={() => window.open(`lightning:${pr}`)}>
                                        Open Wallet
                                    </div>
                                    <div>{webLn()}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </>
        )
    }

    function successAction() {
        if (!success) return null;
        return (
            <>
                <p>{success?.description ?? "Paid!"}</p>
                {success.url ? <a href={success.url} target="_blank">{success.url}</a> : null}
            </>
        )
    }

    if (!show) return null;
    return (
        <Modal onClose={() => onClose()}>
            <div className="lnurl-tip" onClick={(e) => e.stopPropagation()}>
                <h2>{props.title || "⚡️ Send sats"}</h2>
                {invoiceForm()}
                {error ? <p className="error">{error}</p> : null}
                {payInvoice()}
                {successAction()}
            </div>
        </Modal>
    )
}