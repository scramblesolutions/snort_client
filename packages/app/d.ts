declare module "*.jpg" {
  const value: unknown;
  export default value;
}

declare module "*.svg" {
  const value: unknown;
  export default value;
}

declare module "*.webp" {
  const value: string;
  export default value;
}

declare module "translations/*.json" {
  const value: Record<string, string>;
  export default value;
}

declare module "light-bolt11-decoder" {
  export function decode(pr?: string): ParsedInvoice;

  export interface ParsedInvoice {
    paymentRequest: string;
    sections: Section[];
  }

  export interface Section {
    name: string;
    value: string | Uint8Array | number | undefined;
  }
}
