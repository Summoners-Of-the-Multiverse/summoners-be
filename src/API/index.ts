import { chainConfigs } from "../ChainConfigs";
import DB from "../DB"
import { MonsterBaseMetadata } from "./types";

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

    let query = `select 
                    md.id,
                    md.name,
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
                where chain_id='${chainId}'
                order by md.id
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