import { getRandomNumber } from "../../utils";
import DB from "../DB";
import { getHolderNft } from "../Inventory";
import BossMonster from "./BossMonster";
import PlayerMonster from "./PlayerMonster";
import WildMonster from "./WildMonster";

const getAreaMonsterBaseMetadataIds = async(area_id: number, chainId: string) => {
    let db = new DB();
    let areaMonsterBaseMetadataIds = await db.executeQueryForResults<{ monster_base_metadata_id: number }>(`
        SELECT DISTINCT monster_base_metadata_id
        FROM area_monsters am
        JOIN monster_base_metadata mb
        ON mb.id = am.monster_base_metadata_id
        WHERE area_id = ${area_id} AND chain_id = '${chainId}';
    `);

    if(!areaMonsterBaseMetadataIds) {
        return [];
    }

    return areaMonsterBaseMetadataIds.map(x => x.monster_base_metadata_id);
}

const getRandomAreaMonsterBaseMetadataId = async(area_id: number, chainId: string) => {
    let db = new DB();
    let areaMonsterBaseMetadataIds = await db.executeQueryForResults<{ monster_base_metadata_id: number }>(`
        SELECT DISTINCT monster_base_metadata_id
        FROM area_monsters am
        JOIN monster_base_metadata mb
        ON mb.id = am.monster_base_metadata_id
        WHERE area_id = ${area_id} AND chain_id = '${chainId}';
    `);

    if(!areaMonsterBaseMetadataIds) {
        return undefined;
    }

    let ids = areaMonsterBaseMetadataIds.map(x => x.monster_base_metadata_id);
    return ids[getRandomNumber(0, ids.length - 1, true)];
}

const getPlayerMonsters = async(address: string, chainId: string) => {
    // get all token from erc721 & linker
    let data = await getHolderNft(chainId, address);
    let ownedTokenIds = data.map((x: any) => x.token_id) as string[];

    let db = new DB();

    //only 4
    let monsterIds = await db.executeQueryForResults<{ monster_id: number }>(`
        SELECT 
            monster_id
        FROM player_monsters pm
        JOIN monsters m
        ON m.id = pm.monster_id
        WHERE 
            LOWER(address) = LOWER('${address}') 
            AND LOWER(chain_id) = LOWER('${chainId}')
            AND token_id IN ('${ownedTokenIds.join("','")}')
        LIMIT 4;
    `);

    if(!monsterIds) {
        return undefined;
    }

    return monsterIds.map(x => x.monster_id);
}

export { 
    BossMonster, 
    PlayerMonster, 
    WildMonster,
    getAreaMonsterBaseMetadataIds, 
    getRandomAreaMonsterBaseMetadataId, 
    getPlayerMonsters,
};