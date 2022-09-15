export interface BaseMonsterConstructor {
    onLoad: () => void; 
    onOffCooldown: () => void;
};

export interface PlayerMonsterConstructor extends BaseMonsterConstructor {
    tokenId: number;
}

export interface MonsterConstructor extends BaseMonsterConstructor {
    metadataId: number;
}

export type Attack = {
    damage: number;
    type: "normal" | "crit" | "immune" | "miss";
}

export type AttackRes = { 
    attacks: Attack[];
    totalDamage: number;
    critDamage: number;
    hits: number;
    misses: number;
}