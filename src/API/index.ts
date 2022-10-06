import * as chains from "../ChainConfigs";
import { chainConfigs } from "../ChainConfigs";
import DB from "../DB"
import { BattleEncounterMetadata, BattleResult, BattleSkillsUsed, MonsterBaseMetadata } from "./types";
import { axiosCall, getRandomNumber, getHash, generateRandomNumberChar, getInsertQuery, getRandomChance } from "../../utils";
import { AxiosResponse, AxiosRequestHeaders } from "axios";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env')});
import _ from "lodash";
import ContractCall from '../ContractCall';
import effectFile from '../../assets/effects/_effect_files.json';

const ETHEREUM_ADDRESS_LENGTH = 42;

const sanitizeAddress = (address: string) => {
    address = address.replace(/ /g, "");
    address = address.trim();

    if(address.length !== ETHEREUM_ADDRESS_LENGTH) {
        throw Error("Invalid Address");
    }

    if(address.substring(0, 2) !== '0x') {
        throw Error("Invalid Address");
    }

    return address;
}

export const getStarterStatus = async(address: string) => {
    let db = new DB();

    address = sanitizeAddress(address);

    let query = `SELECT * FROM claimed_addresses WHERE address = '${address}';`;
    let res = await db.executeQueryForResults(query);

    return res && res.length !== 0;
}

export const getStarterMonsters = async(chainId: string) => {
    let db = new DB();

    if(!chainConfigs.includes(chainId)) {
        throw Error("Invalid Chain");
    }

    let query = `
                    with starter_ids AS (
                        select chain_id, element_id, min(id) + element_id as monster_metadata_id
                        from monster_base_metadata
                        group by chain_id, element_id
                    )
                    select
                        md.id,
                        md.name,
                        e.id as element_id,
                        e.name as element_name,
                        img_file,
                        base_attack,
                        max_attack,
                        base_defense,
                        max_defense,
                        base_hp,
                        max_hp,
                        base_crit_chance,
                        max_crit_chance,
                        base_crit_multiplier,
                        max_crit_multiplier,
                        shiny_chance
                    from monster_base_metadata md
                    join elements e
                    on e.id = md.element_id
                    where chain_id='${chainId}' and md.id in (select monster_metadata_id from starter_ids)
                    order by element_id, md.id
                    limit 3`;
    let res = await db.executeQueryForResults<MonsterBaseMetadata>(query);
    return res? res : [];
}

export const insertClaimedAddress = async(address: string) => {
    let db = new DB();
    address = sanitizeAddress(address);
    let query = `insert into claimed_addresses (address) values ('${address}'); insert into player_locations (address) values ('${address}');`;
    await db.executeQuery(query);
}

export const moveAddressTo = async(address: string, areaId: number) => {
    if(!areaId) {
        throw Error("Invalid location");
    }

    let db = new DB();
    address = sanitizeAddress(address);
    let query = `update player_locations set area_id = ${areaId} where address = '${address}'`;
    await db.executeQuery(query);
}

export const getAddressArea = async(address: string) => {

    let db = new DB();
    address = sanitizeAddress(address);
    let query = `select area_id from player_locations where address = '${address}'`;
    return await db.executeQueryForSingleResult<{ area_id: number }>(query);

}

export const insertMonster = async(metadata: number, tokenId: string, tokenHash: string) => {
    //monsters
    const db = new DB();
    let getMonsterMetadataQuery = `select * from monster_base_metadata where id = ${metadata}`;
    let monsterBaseMetadata = await db.executeQueryForSingleResult<MonsterBaseMetadata>(getMonsterMetadataQuery);

    if(!monsterBaseMetadata) {
        throw Error("Unknown monster");
    }

    const table = 'monsters';
    const columns = ['monster_base_metadata_id', 'token_id', 'attack', 'defense', 'hp', 'crit_chance', 'crit_multiplier', 'is_shiny', 'hash'];
    let values: any[][] = [];

    let {
        base_attack,
        max_attack,
        base_defense,
        max_defense,
        base_crit_chance,
        max_crit_chance,
        base_crit_multiplier,
        max_crit_multiplier,
        base_hp,
        max_hp,
        shiny_chance,
    } = monsterBaseMetadata;

    let isShiny = getRandomChance() < shiny_chance;

    values.push([
        metadata,
        tokenId,
        getRandomNumber(base_attack, max_attack),
        getRandomNumber(base_defense, max_defense),
        getRandomNumber(base_hp, max_hp),
        getRandomNumber(base_crit_chance, max_crit_chance),
        getRandomNumber(base_crit_multiplier, max_crit_multiplier),
        isShiny? 'true' : 'false',
        tokenHash
    ]);

    const query = getInsertQuery(columns, values, table, true);
    return await db.executeQueryForSingleResult(query);
}

export const insertMonsterUsingBattleId= async(address: string, battleId: number, tokenId: string, tokenHash: string) => {
    //monsters
    const db = new DB();
    address = sanitizeAddress(address);

    // get battle
    let getMonsterMetadataQuery = `select 
	                                    address,
                                        monster_base_metadata_id,
                                        attack,
                                        defense,
                                        hp,
                                        crit_chance,
                                        crit_multiplier,
                                        is_shiny
                                    from pve_battles b
                                    join pve_battle_encounters e
                                    on b.id = e.pve_battle_id
                                    where b.status = 1
                                    and lower(b.address) = lower('${address}')
                                    and b.id = ${battleId}`;
    let monsterBaseMetadata = await db.executeQueryForSingleResult<BattleEncounterMetadata>(getMonsterMetadataQuery);

    if(!monsterBaseMetadata) {
        throw Error("Unknown battle");
    }

    const table = 'monsters';
    const columns = ['monster_base_metadata_id', 'token_id', 'attack', 'defense', 'hp', 'crit_chance', 'crit_multiplier', 'is_shiny', 'hash'];
    let values: any[][] = [];

    //insert
    let {
        monster_base_metadata_id,
        attack,
        defense,
        hp,
        crit_chance,
        crit_multiplier,
        is_shiny
    } = monsterBaseMetadata;

    values.push([
        monster_base_metadata_id,
        tokenId,
        attack,
        defense,
        hp,
        crit_chance,
        crit_multiplier,
        is_shiny? 'true' : 'false',
        tokenHash
    ]);

    const query = getInsertQuery(columns, values, table, true);
    let res = await db.executeQueryForSingleResult(query);

    //update battle captured
    const updateQuery = `update pve_battle_encounters set is_captured = true where pve_battle_id = ${battleId}`;
    await db.executeQuery(updateQuery);

    return res;
}

export const insertMonsterEquippedSkills = async(monsterId: number) => {
    const SEED_EQUIPPED_SKILL_COUNT = 4;

    let db = new DB();
    let table = 'monster_equipped_skills';
    let columns = ['monster_id', 'monster_skill_id'];
    let values: any[][] = [];
    let nEffects = effectFile.file_names.length;

    let skills: number[] = [];

    for(let j = 0; j < SEED_EQUIPPED_SKILL_COUNT; j++) {
        let skillId = 0;

        do {
            skillId = getRandomNumber(1, nEffects, true);
        } while(skills.includes(skillId));

        skills.push(skillId);
        values.push([monsterId, skillId]);
    }

    let query = getInsertQuery(columns, values, table, true);

    return await db.executeQueryForResults(query);
}

/**
 * Get nft info using moralis api
 * @date 2022-09-29
 * @param { string } chainId
 */
export const getAllNft = async(chainId: string) => {
    // get chain nft contract address
    const chain: any = _.find(chains, { id: chainId });

    if(_.isNil(chain) || !_.has(chain, 'nftContract')) {
        throw Error("Invalid Chain");
    }

    const headers: AxiosRequestHeaders =  {
        'accept': 'application/json',
        'X-API-Key': `${process.env.MORALIS}`
    };

    const config = {
        method: 'GET',
        url: `https://deep-index.moralis.io/api/v2/nft/${chain.nftContract}`,
        params: {chain: chainId, format: 'decimal'},
        headers: headers
    }

    const data: any = await axiosCall(headers, config);

    return JSON.stringify(data.result);
}

/**
 * Generate next nft id & hash
 * @date 2022-09-29
 * @param { string } chainId
 */
export const getMintData = async (chainId: string) => {
    // get new id from mysql
    let db = new DB();

    // initiate ethers
    const etherCall = new ContractCall(chainId);
    let checkDB = false, checkContract = false;
    let tokenId;

    // check if token id claimed
    while(!checkDB || !checkContract) {
        // generate token between 16 ~ 32 chars
        tokenId = generateRandomNumberChar(16, 32);
        // checkDB for duplicated tokenId
        const query = `SELECT count(token_id) as count FROM monsters WHERE token_id = '${tokenId}';`;
        const res = await db.executeQueryForSingleResult<{ count: number }>(query);
        checkDB = Number(res?.count) === 0 ? true : false;

        // checkContract
        const claimed = await etherCall.checkNftClaimed(tokenId);
        // if not a valid nextTokenId
        checkContract = claimed == 1 ? false : true;
    }

    // get next meta hash/id (unixtime + nextTokenId + random number salt)
    const salt = getRandomNumber(1, 1000, true);
    const hash = getHash(`${new Date().getTime()}_${tokenId}_${salt}`);

    // const returnData
    const mintData = {
        'id': tokenId,
        'hash': hash
    }

    return mintData;
}

// battles
export const getBattleResult = async(address: string, battleId: string) => {

    let db = new DB();
    address = sanitizeAddress(address);

    //sanitize battle id
    let battleIdInt = parseInt(battleId);
    let query = `select 
                    time_start,
                    time_end,
                    type,
                    mb.name,
                    mb.img_file,
                    mb.element_id,
                    attack,
                    defense,
                    hp,
                    hp_left,
                    crit_chance,
                    crit_multiplier,
                    is_shiny,
                    is_captured
                from pve_battles b
                join pve_battle_encounters e
                on b.id = e.pve_battle_id
                join monster_base_metadata mb
                on mb.id = e.monster_base_metadata_id
                where lower(address) = lower('${address}') 
                and b.id = ${battleIdInt} 
                and status = 1 -- battle ended
                `;
    let res = await db.executeQueryForSingleResult<BattleResult>(query);
    return res;
}

export const getBattleSkillsUsed = async(battleId: string) => {

    let db = new DB();

    //sanitize battle id
    let battleIdInt = parseInt(battleId);
    let query = `select 
                    m.id as monster_id,
                    mb.name as monster_name,
                    mb.img_file as monster_img,
                    mb.element_id as monster_element_id,
                    ms.name as skill_name,
                    ms.element_id,
                    ms.icon_file as skill_icon,
                    su.total_damage_dealt,
                    su.crit_damage_dealt,
                    CASE WHEN su.total_cooldown = 0 THEN 1 ELSE su.total_cooldown END as total_cooldown,
                    su.hits,
                    su.crits,
                    su.misses,
                    m.is_shiny
                from pve_battle_player_skills_used su
                join monsters m
                on m.id = su.monster_id
                join monster_base_metadata mb
                on mb.id = m.monster_base_metadata_id
                join monster_skills ms
                on ms.id = su.skill_id
                where pve_battle_id = ${battleIdInt}
                `;
    let res = await db.executeQueryForResults<BattleSkillsUsed>(query);
    return res ?? [];
}