import BossMonster from "./BossMonster";
import PlayerMonster from "./PlayerMonster";
import WildMonster from "./WildMonster";

export interface BaseMonsterConstructor {
    onOffCooldown: () => void;
};

export interface PlayerMonsterConstructor extends BaseMonsterConstructor {
    onLoad: (monster: PlayerMonster) => void; 
    tokenId: number;
}

export interface MonsterConstructor extends BaseMonsterConstructor {
    onLoad: (monster: BossMonster | WildMonster) => void; 
    metadataId: number;
    areaId: number;
}

export type Attack = {
    damage: number;
    type: "normal" | "crit" | "immune" | "miss";
    element_id: number;
}

export type AttackRes = { 
    attacks: Attack[];
    cd: number;
    totalDamage: number;
    critDamage: number;
    crit: number;
    hits: number;
    misses: number;
}