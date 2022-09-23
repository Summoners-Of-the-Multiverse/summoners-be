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
                element_id int not null,
                name text not null, 
                img_file text not null,
                shiny_img_file text not null,
                shiny_chance real not null default 0.1 check (shiny_chance >= 0),
                base_attack real not null default 0,
                max_attack real not null default 0,
                base_defense real not null default 0,
                max_defense real not null default 0,
                base_hp real not null default 0,
                max_hp real not null default 0,
                base_crit_chance real not null default 0,
                max_crit_chance real not null default 0,
                base_crit_multiplier real not null default 0,
                max_crit_multiplier real not null default 0
            );`,
        rollback_query: `DROP TABLE monster_base_metadata;`
    },
    {
        id: 3,
        query: `
            CREATE TABLE monster_skills (
                id serial PRIMARY KEY, 
                element_id int not null, 
                effect_id int not null, 
                name varchar(255) not null, 
                hits int not null default 1 check(hits >= 1),
                accuracy real not null default 95 check(accuracy >= 0), 
                cooldown real not null default 5 check(cooldown >= 0), 
                multiplier real not null default 1 check(multiplier >= 0)
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
                attack real not null check (attack >= 0), 
                defense real not null check (defense >= 0), 
                hp real not null check (hp >= 0), 
                crit_chance real not null default 0 check (crit_chance >= 0),
                crit_multiplier real not null default 0 check (crit_multiplier >= 1),
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
                stat_modifier real not null default 1
            );`,
        rollback_query: `DROP TABLE area_monsters;`
    },
    {
        id: 10,
        query: `
            CREATE TABLE element_multipliers (
                id serial PRIMARY KEY, 
                element_id int not null, 
                target_element_id int not null,
                multiplier real not null default 1
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
    {
        id: 15,
        query: `
            CREATE TABLE pve_battles (
                id serial PRIMARY KEY, 
                address varchar(50) not null,
                status smallint not null default 0,
                time_start timestamp not null,
                time_end timestamp
            );`,
        rollback_query: `DROP TABLE pve_battles;`
    },
    {
        id: 16,
        query: `CREATE INDEX pve_battles_address_idx ON pve_battles (address);`,
        rollback_query: `DROP INDEX pve_battles_address_idx;`
    },
    {
        id: 17,
        query: `
            CREATE TABLE pve_battle_encounters (
                id serial PRIMARY KEY, 
                type smallint not null,
                pve_battle_id int not null,
                monster_base_metadata_id int not null,
                attack real not null,
                defense real not null,
                hp real not null,
                hp_left real not null,
                crit_chance real not null,
                crit_multiplier real not null,
                is_shiny boolean not null,
                is_captured boolean not null default false
            );`,
        rollback_query: `DROP TABLE pve_battle_encounters;`
    },
    {
        id: 18,
        query: `
            CREATE INDEX pve_battle_encounters_pve_battle_id_idx ON pve_battle_encounters (pve_battle_id);
            CREATE INDEX pve_battle_encounters_monster_base_metadata_id_idx ON pve_battle_encounters (monster_base_metadata_id);
            CREATE INDEX pve_battle_encounters_is_captured_idx ON pve_battle_encounters (is_captured);
        `,
        rollback_query: `
            DROP INDEX pve_battle_encounters_pve_battle_id_idx;
            DROP INDEX pve_battle_encounters_monster_base_metadata_id_idx;
            DROP INDEX pve_battle_encounters_is_captured_idx;
        `
    },
    {
        id: 19,
        query: `
            CREATE TABLE pve_battle_player_skills_used (
                id serial PRIMARY KEY, 
                pve_battle_id int not null,
                skill_id int not null,
                monster_id int not null,
                total_damage_dealt real not null,
                crit_damage_dealt real not null,
                hits int not null,
                misses int not null
            );`,
        rollback_query: `DROP TABLE pve_battle_player_skills_used;`
    },
    {
        id: 20,
        query: `
            CREATE INDEX pve_battle_player_skills_used_pve_battle_id_idx ON pve_battle_player_skills_used (pve_battle_id);
            CREATE INDEX pve_battle_player_skills_used_skill_id_idx ON pve_battle_player_skills_used (skill_id);
            CREATE INDEX pve_battle_player_skills_used_monster_id_idx ON pve_battle_player_skills_used (monster_id);
        `,
        rollback_query: `
            DROP INDEX pve_battle_player_skills_used_pve_battle_id_idx;
            DROP INDEX pve_battle_player_skills_used_skill_id_idx;
            DROP INDEX pve_battle_player_skills_used_monster_id_idx;
        `
    },
    {
        id: 21,
        query: `ALTER TABLE player_monsters ADD chain_id varchar(50) not null default '';`,
        rollback_query: `ALTER TABLE player_monsters DROP COLUMN chain_id;`
    },
    {
        id: 22,
        query: `
            CREATE TABLE claimed_addresses (
                id serial PRIMARY KEY, 
                address varchar(50) not null
            );`,
        rollback_query: `DROP TABLE claimed_addresses;`
    },
    {
        id: 23,
        query: `
            CREATE TABLE player_locations (
                id serial PRIMARY KEY, 
                address varchar(50) not null,
                area_id int not null default 1
            );`,
        rollback_query: `DROP TABLE player_locations;`
    },
]