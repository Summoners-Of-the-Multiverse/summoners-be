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
                name text not null, 
                img_url text not null
            );`,
        rollback_query: `DROP TABLE monster_base_metadata;`
    },
    {
        id: 3,
        query: `
            CREATE TABLE monster_skills (
                id serial PRIMARY KEY, 
                monster_base_metadata_id int not null, 
                type_id int not null, 
                effect_id int not null, 
                movement_id int not null, 
                name varchar(255) not null, 
                accuracy decimal(6,3) not null default 50, 
                cooldown decimal(5,2) not null, 
                multiplier decimal(5,2) not null default 1
            );`,
        rollback_query: `DROP TABLE monster_skills;`
    },
    {
        id: 4,
        query: `
            CREATE TABLE monster_skill_effects (
                id serial PRIMARY KEY, 
                name varchar(255) not null, 
                effect_asset_url varchar(255)
            );`,
        rollback_query: `DROP TABLE monster_skill_effects;`
    },
    {
        id: 5,
        query: `
            CREATE TABLE monsters (
                id serial PRIMARY KEY, 
                monster_base_metadata_id int not null, 
                token_id varchar(50) not null, 
                attack decimal(36,6) not null, 
                defense decimal(36,6) not null, 
                crit_chance decimal(6,3) not null default 0, 
                stat_volatility decimal(36,6) not null default 0
            );`,
        rollback_query: `DROP TABLE monsters;`
    },
    {
        id: 6,
        query: `CREATE INDEX monsters_token_id_idx ON monsters (token_id);`,
        rollback_query: `DROP INDEX monsters_token_id_idx;`
    },
    {
        id: 7,
        query: `
            CREATE TABLE areas (
                id serial PRIMARY KEY, 
                name varchar(255) not null
            );`,
        rollback_query: `DROP TABLE areas;`
    },
    {
        id: 8,
        query: `
            CREATE TABLE area_monsters (
                id serial PRIMARY KEY, 
                monster_id int not null, 
                stat_modifier decimal(18,3) not null default 1
            );`,
        rollback_query: `DROP TABLE area_monsters;`
    }
]