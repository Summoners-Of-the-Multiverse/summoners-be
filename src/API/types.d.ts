export type MonsterBaseMetadata = {
    id: number;
    name: string;
    element_name: string;
    img_file: string;
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
    shiny_chance: number;
}

export type MintData = {
    id: number,
    hash: string,
    monsterId: number
}

export type BattleResult = {
	time_start: string;
	time_end: string;
	type: number;
	name: string;
	img_file: string;
	element_id: number;
	attack: number;
	defense: number;
	hp: number;
    hp_left: number;
	crit_chance: number;
	crit_multiplier: number;
	is_shiny: boolean;
    is_captured: boolean;
}

export type BattleSkillsUsed = {
    monster_id: number;
    monster_name: string;
    monster_img: string;
    monster_element_id: number;
    skill_name: string;
    element_id: number;
    skill_icon: string;
    total_damage_dealt: number;
    crit_damage_dealt: number;
    hits: number;
    crits: number;
    misses: number;
    total_cooldown: number;
    is_shiny: boolean;
}

export type BattleEncounterMetadata = {
    address: string;
    monster_base_metadata_id: number;
    attack: number;
    defense: number;
    hp: number;
    crit_chance: number;
    crit_multiplier: number;
    is_shiny: boolean;
}