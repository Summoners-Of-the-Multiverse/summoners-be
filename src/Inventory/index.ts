import {AxiosRequestHeaders} from "axios";
import * as chains from "../ChainConfigs";
import DB from "../DB"
import {
    axiosCall,
} from "../../utils";
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
    path: path.join(__dirname, '../../.env')
});
import _ from "lodash";
import { PromisifyBatchRequest } from './batchRequest';
import NftLinker from '../abi/SotmNftLinker.json';
import ContractCall from "../ContractCall";

/**
 * Get wallet's nft (on-chain) - haven't match with db record
 * @date 2022-10-03
 * @param { string } address
 * @param { string } chainId
 */
 export const getHolderNft = async (address:string, chainId: string) => {
    const chain: any = _.find(chains, {id: chainId});

    if (_.isNil(chain) || !_.has(chain, 'nftContract')) {
        throw Error("Invalid Chain");
    }

    const headers: AxiosRequestHeaders = {
        'accept': 'application/json',
        'X-API-Key': `${
            process.env.MORALIS
        }`
    };

    // store all tokens
    let tokens: any = [];
    let nextCursor = null;
    do {
        let config: any = {
            method: 'GET',
            url: `https://deep-index.moralis.io/api/v2/${ address }/nft`,
            params: {
                chain: chainId,
                format: 'decimal',
                token_addresses: chain.nftContract,
                // limit: 10
            },
            headers: headers
        }

        // append next cursor if not empty
        if (!_.isNil(nextCursor)) {
            config.params['cursor'] = nextCursor;
        }

        const data: any = await axiosCall(headers, config);

        // merge all result
        if (!_.isNil(data)) {
            tokens = _.concat(tokens, data.result);

            // while next page still available
            nextCursor = data.cursor;
        }

    } while(!_.isNil(nextCursor));

    return tokens;
}

export const getInventory = async (address:string, chainId: string) => {
    try {
        // get all token id (without pagination for now)
        const data = await getHolderNft(address, chainId);

        // handle empty result
        if (_.isEmpty(data)) {
            return data;
        }

        const tokenIds = _.map(data, 'token_id');

        // https://github.com/ethers-io/ethers.js/issues/892
        // get token origin id (to detect cross chain token)
        // batch get original token id to search in db
        const chain: any = _.find(chains, {id: chainId});
        const etherCall = new ContractCall(chainId);
        const tokensOrigin = await etherCall.checkBulkTokenOrigin(tokenIds);

        let tokenIdsString = await Promise.all(
            _.map(tokensOrigin, async(tk) => {
                // const tokenOrigin = await etherCall.checkTokenOrigin(tk);
                // console.log(tokenOrigin);
                return `'${tk[1].toString()}'`;
            })
        );

        // only select token_id that recorded in db
        // select mob data & equipped
        const db = new DB();
        const mobQuery = `
            SELECT
                mob.id,
                mob.token_id,
                mob.attack,
                mob.defense,
                mob.hp,
                mob.crit_chance,
                mob.crit_multiplier,
                mob.is_shiny,
                CASE WHEN pmob.monster_id > 0 THEN 1 ELSE 0 END as equipped,
                mbm.name,
                mbm.img_file,
                e.name as element,
                e.id as element_id
            FROM monsters mob
            LEFT JOIN player_monsters pmob
            ON mob.id = pmob.monster_id
            LEFT JOIN monster_base_metadata mbm
            ON mob.monster_base_metadata_id = mbm.id
            LEFT JOIN elements e
            ON mbm.element_id = e.id
            WHERE mob.token_id IN (${_.join(tokenIdsString, ', ')}) AND mbm.chain_id = '${chainId}'
        `;

        let mobRes: any = await db.executeQueryForResults(mobQuery);

        // after filter chain and first query punya token id
        tokenIdsString = _.map(mobRes, tk => `'${tk.token_id}'`);
        // select mob skills
        const skillQuery = `
            SELECT
                mob.id,
                e.name as element,
                ms.name,
                ms.icon_file
            FROM monsters mob
            LEFT JOIN monster_equipped_skills mes
            ON mob.id = mes.monster_id
            LEFT JOIN monster_skills ms
            ON mes.monster_skill_id = ms.id
            LEFT JOIN elements e
            ON ms.element_id = e.id
            WHERE mob.token_id IN (${_.join(tokenIdsString, ', ')})
        `;

        let skillRes: any = await db.executeQueryForResults(skillQuery);
        // assign skills
        _.map(mobRes, (ms, index) => {
            mobRes[index]['skills'] = _.filter(skillRes, {'id': ms.id });

            // remove unused id
            _.map(mobRes[index]['skills'], (currMs, currIndex) => {
                mobRes[index]['skills'][currIndex] = _.omit(mobRes[index]['skills'][currIndex], 'id');
            })
        });

        return mobRes;
    } catch(e) {
        console.log(e);
        return [];
    }
}