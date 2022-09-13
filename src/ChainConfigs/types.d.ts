export type ChainConfig = {
    name: string;
    shortName: string;
    id: string;
    rpc: string;
    nativeCurrency: {
        name: string;
        decimals: number;
        symbol: string;
    };
    blockExplorerUrl?: string;
}