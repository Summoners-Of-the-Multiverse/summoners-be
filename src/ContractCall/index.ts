import { ethers, Contract } from "ethers";
import * as chains from "../ChainConfigs";
import _ from "lodash";
import { ChainConfig } from "../ChainConfigs/types";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env')});
import ERC721 from '../ABI/Sotm721.json';
import NftLinker from '../ABI/SotmNftLinker.json';

export default class ContractCall {
    provider: ethers.providers.JsonRpcProvider;
    chainConfig: ChainConfig;
    signer: ethers.Wallet;
    erc721: Contract;
    ntfLinker: Contract;

    constructor(chainId: string) {
        // get chain nft contract address
        const chain: any = _.find(chains, { id: chainId });

        this.chainConfig = chain;
        this.provider = new ethers.providers.JsonRpcProvider(chain.rpc);
        this.signer = new ethers.Wallet(`${process.env.PRIVATE_KEY}`, this.provider);
        this.erc721 = new ethers.Contract(chain.nftContract, ERC721.abi, this.signer);
        this.ntfLinker = new ethers.Contract(chain.linkerContract, NftLinker.abi, this.signer);
    }

    checkNftClaimed = async(tokenId: string) => {
        return await this.erc721.isClaimed(tokenId);
    }
}