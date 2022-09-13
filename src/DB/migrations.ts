export default [
    {
        id: 1,
        query: `
            CREATE TABLE migrations (
                id serial PRIMARY KEY,
                migration_id int UNIQUE not null, 
                migration_group int not null, 
                migrated_at timestamp not null
            );`,
        rollback_query: `DROP TABLE migrations;`
    },
    {
        id: 2,
        query: `
            CREATE TABLE monster_base_metadata (
                id serial PRIMARY KEY, 
                chain_id varchar(50) not null, 
                element_type_id int not null,
                name text not null, 
                img_file text not null,
                shiny_img_file text not null,
                shiny_chance decimal(6,3) not null default 0.1 check (shiny_chance >= 0),
                base_attack decimal(36,0) not null default 0,
                max_attack decimal(36,0) not null default 0,
                base_defense decimal(36,0) not null default 0,
                max_defense decimal(36,0) not null default 0,
                base_hp decimal(36,0) not null default 0,
                max_hp decimal(36,0) not null default 0,
                base_crit_chance decimal(5,2) not null default 0,
                max_crit_chance decimal(5,2) not null default 0,
                base_crit_multiplier decimal(10,2) not null default 0,
                max_crit_multiplier decimal(10,2) not null default 0
            );`,
        rollback_query: `DROP TABLE monster_base_metadata;`
    },
    {
        id: 3,
        query: `
            CREATE TABLE monster_skills (
                id serial PRIMARY KEY, 
                element_type_id int not null, 
                effect_id int not null, 
                name varchar(255) not null, 
                hits int not null default 1 check(hits >= 1),
                accuracy decimal(6,3) not null default 95 check(accuracy >= 0), 
                cooldown decimal(5,2) not null default 5 check(cooldown >= 0), 
                multiplier decimal(10,2) not null default 1 check(multiplier >= 0)
            );`,
        rollback_query: `DROP TABLE monster_skills;`
    },
    {
        id: 4,
        query: `
            CREATE TABLE monster_skill_effects (
                id serial PRIMARY KEY, 
                asset_file varchar(255)
            );`,
        rollback_query: `DROP TABLE monster_skill_effects;`
    },
    {
        id: 5,
        query: `
            CREATE TABLE elements (
                id serial PRIMARY KEY, 
                name varchar(50) not null,
                icon_file varchar(50) not null
            );`,
        rollback_query: `DROP TABLE elements;`
    },
    {
        id: 6,
        query: `
            CREATE TABLE monsters (
                id serial PRIMARY KEY, 
                monster_base_metadata_id int not null, 
                token_id varchar(50) not null, 
                attack decimal(36,0) not null check (attack >= 0), 
                defense decimal(36,0) not null check (defense >= 0), 
                hp decimal(36,0) not null check (hp >= 0), 
                crit_chance decimal(6,3) not null default 0 check (crit_chance >= 0),
                crit_multiplier decimal(10,2) not null default 0 check (crit_multiplier >= 1),
                is_shiny boolean not null default false
            );`,
        rollback_query: `DROP TABLE monsters;`
    },
    {
        id: 7,
        query: `CREATE INDEX monsters_token_id_idx ON monsters (token_id);`,
        rollback_query: `DROP INDEX monsters_token_id_idx;`
    },
    {
        id: 8,
        query: `
            CREATE TABLE areas (
                id serial PRIMARY KEY, 
                name varchar(255) not null
            );`,
        rollback_query: `DROP TABLE areas;`
    },
    {
        id: 9,
        query: `
            CREATE TABLE area_monsters (
                id serial PRIMARY KEY, 
                monster_base_metadata_id int not null, 
                area_id int not null,
                stat_modifier decimal(18,3) not null default 1
            );`,
        rollback_query: `DROP TABLE area_monsters;`
    },
    {
        id: 10,
        query: `
            CREATE TABLE element_multipliers (
                id serial PRIMARY KEY, 
                element_type_id int not null, 
                against_element_type_id int not null,
                multiplier decimal(18,3) not null default 1
            );`,
        rollback_query: `DROP TABLE element_multipliers;`
    },

    //Rosters
    {
        id: 11,
        query: `
            CREATE TABLE player_monsters (
                id serial PRIMARY KEY, 
                address varchar(50) not null, 
                monster_id int not null
            );`,
        rollback_query: `DROP TABLE player_monsters;`
    },
    {
        id: 12,
        query: `CREATE INDEX player_monsters_address_idx ON player_monsters (address);`,
        rollback_query: `DROP INDEX player_monsters_address_idx;`
    },
    {
        id: 13,
        query: `
            CREATE TABLE monster_equipped_skills (
                id serial PRIMARY KEY, 
                monster_id int not null,
                monster_skill_id int not null
            );`,
        rollback_query: `DROP TABLE monster_equipped_skills;`
    },
    {
        id: 14,
        query: `CREATE INDEX monster_equipped_skills_monster_idx ON player_monsters (monster_id);`,
        rollback_query: `DROP INDEX monster_equipped_skills_monster_idx;`
    },
]