export type DBMonster = {
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

export type DBMonsterBaseMetadata = {
    id: number;
    chain_id: string; 
    element_id: number;
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

export type DBMonsterSkill = {
    id: number;
    element_id: number;
    effect_id: number;
    name: string;
    hits: number;
    accuracy: number;
    cooldown: number;
    multiplier: number;
}

export type DBMonsterSkillEffect = {
    id: number;
    asset_file: string;
}

export type DBElement = {
    id: number;
    name: number;
    icon_file: number;
}

export type DBElementMultipler = {
    id: number;
    element_id: number;
    target_element_id: number;
    multiplier: number;
}

export type DBArea = {
    id: number;
    name: string;
}

export type DBAreaMonster = {
    id: number;
    monster_base_metadata_id: number;
    area_id: number;
    stat_modifier: number;
}

// in roster
export type DBPlayerMonster = {
    id: number;
    address: string;
    monster_id: number;
}

export type DBMonsterEquippedSkill = {
    id: number;
    monster_id: number;
    monster_skill_id: number;
}

export type MonsterType = "player" | "wild" | "boss";

export type MonsterStats = {
    name: string;
    img_file: string;
    attack: number;
    defense: number;
    hp: number;
    hp_left: number;
    element_id: number;
    crit_chance: number;
    crit_multiplier: number;
    element_name: string;
    element_file: string;
    is_shiny: boolean;
    type: MonsterType;
}

export type MonsterEquippedSkill = {
    id: number;
    name: string;
    element_id: number;
    element_name: string;
    element_file: string;
    hits: number;
    accuracy: number;
    cooldown: number;
    multiplier: number;
    effect_file: string;
    icon_file: string;
}

export type MonsterEquippedSkillById = {
    [id: string]: {
        id: number;
        name: string;
        element_id: number;
        element_name: string;
        element_file: string;
        hits: number;
        accuracy: number;
        cooldown: number;
        multiplier: number;
        effect_file: string;
        icon_file: string;
    }
}

export type MonsterBaseMetadata = {
    id: number;
    chain_id: string; 
    element_id: number;
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
    element_name: string;
    element_file: string;
}