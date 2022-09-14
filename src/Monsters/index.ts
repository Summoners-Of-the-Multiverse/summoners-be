import DB from "../DB";
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

export { BossMonster, PlayerMonster, WildMonster, getAreaMonsterBaseMetadataIds };