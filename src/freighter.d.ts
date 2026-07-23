declare module "@stellar/freighter-api" {
  export function isConnected(): Promise<{ isConnected: boolean }>;
  export function isAllowed(): Promise<{ isAllowed: boolean }>;
  export function setAllowed(): Promise<{ isAllowed: boolean }>;
  export function getPublicKey(): Promise<string>;
  export function getAddress(): Promise<{ address: string }>;
  export function requestAccess(): Promise<{ address: string; error?: string }>;
  export function signTransaction(
    transactionXdr: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
    }
  ): Promise<{ signedTxXdr: string; signerAddress: string }>;
}
