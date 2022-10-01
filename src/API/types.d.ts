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