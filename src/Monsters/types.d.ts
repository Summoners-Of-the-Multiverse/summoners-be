export interface BaseMonsterConstructor {
    onReady: () => void; 
};

export interface PlayerMonsterConstructor extends BaseMonsterConstructor {
    tokenId: number;
}

export interface MonsterConstructor extends BaseMonsterConstructor {
    metadataId: number;
}