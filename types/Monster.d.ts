export type Monster = {
    id: number;
    monster_base_metadata_id: number;
    token_id: string;
    attack: number;
    defense: number; 
    hp: number;
    crit_chance: number;
    crit_multiplier: number;
    is_shiny: boolean;
}

export type MonsterBaseMetadata = {
    id: number;
    chain_id: string; 
    element_type_id: number;
    name: string;
    img_file: string;
    shiny_img_file: string;
    shiny_chance: number;
    base_attack: number;
    max_attack: number;
    base_defense: number;
    max_defense: number;
    base_hp: number;
    max_hp: number;
    base_crit_chance: number;
    max_crit_chance: number;
    base_crit_multiplier: number;
    max_crit_multiplier: number;
}

export type MonsterSkill = {
    id: number;
    element_type_id: number;
    effect_id: number;
    name: string;
    hits: number;
    accuracy: number;
    cooldown: number;
    multiplier: number;
}

export type MonsterSkillEffect = {
    id: number;
    asset_file: string;
}

export type Element = {
    id: number;
    name: number;
    icon_file: number;
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
    monster_base_metadata_id: number;
    area_id: number;
    stat_modifier: number;
}

// in roster
export type PlayerMonster = {
    id: number;
    address: string;
    monster_id: number;
}

export type MonsterEquippedSkill = {
    id: number;
    monster_id: number;
    monster_skill_id: number;
}