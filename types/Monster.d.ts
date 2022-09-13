export type Monster = {
    id: number;
    monster_base_metadata_id: number;
    token_id: string;
    attack: number;
    defense: number; 
    crit_chance: number;
    stat_volatility: number;
}

export type MonsterBaseMetadata = {
    id: number;
    chain_id: string; 
    name: string;
    img_url: string;
}

export type MonsterSkill = {
    id: number;
    monster_base_metadata_id: number;
    type_id: number;
    effect_id: number;
    name: string;
    accuracy: number;
    cooldown: number;
    multiplier: number;
}

export type MonsterSkillEffect = {
    id: number;
    name: string;
    effect_asset_url: string;
}

export type MonsterSkillEffectType = {
    id: number;
    name: string;
    icon_url: string;
}

export type ElementMultipler = {
    id: number;
    element_type_id: number;
    against_element_type_id: number;
    multiplier: number;
}

export type Area = {
    id: number;
    name: string;
}

export type AreaMonster = {
    id: number;
    monster_id: number;
    stat_modifier: number;
}