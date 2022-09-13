import migrations from './migrations';
import { Client } from 'pg';
import { DBConstructorParams } from './types';
import moment from 'moment';

export default class DB {

    user: string;
    password: string;
    port: number;
    host: string;
    database: string;

    constructor({ user, password, port, host, database }: DBConstructorParams) {
        this.user = user;
        this.password = password;
        this.port = port;
        this.host = host;
        this.database = database;
    }

    migrate = async(isInit = false) => {
        let now = moment().format('YYYY-MM-DD HH:mm:ss');
        let groupQuery = `
            SELECT migration_id, migration_group FROM migrations ORDER BY migration_group DESC;
        `;
        let groupRes = await this.executeQueryForResults<{ migration_id: number, migration_group: number }>(groupQuery);

        //if is init and group is not null then it's initialized before
        if(isInit && groupRes) {
            console.error('DB was initialized, please use npm run migrate instead');
            return;
        }

        //get group
        let migrationGroup = groupRes && groupRes.length > 0? groupRes[0].migration_group + 1: 1;
        let previousMigrationIds = groupRes? groupRes.map(x => x.migration_id) : [];
        let filteredMigrations = migrations.filter(x => !previousMigrationIds.includes(x.id));

        if(filteredMigrations.length == 0) {
            console.error('Nothing to migrate..');
            return;
        }

        for(let migration of filteredMigrations) {
            let res = await this.executeQuery(migration.query);
            if(res) {
                let logQuery = `INSERT INTO migrations(migration_id, migration_group, migrated_at) VALUES(${migration.id}, ${migrationGroup}, '${now}')`;
                await this.executeQuery(logQuery);
                console.log(`Migrated ID: ${migration.id}`);
            }

            else {
                console.error(`Unable to migrate ID: ${migration.id}`);
                break;
            }
        }

        return;
    }

    rollback = async() => {
        let rollbackIdQuery = `
            SELECT migration_id FROM migrations
            WHERE migration_group = (SELECT migration_group FROM migrations ORDER BY id DESC LIMIT 1);
        `;
        let rollbackIdQueryRes = await this.executeQueryForResults<{ migration_id: number }>(rollbackIdQuery);

        if(!rollbackIdQueryRes || rollbackIdQueryRes.length === 0) {
            console.error('No migrations found!');
            return;
        }

        //start from the last migration file
        let reversedMigrations = migrations.reverse();
        let rollbackMigrationIds = rollbackIdQueryRes.map(x => x.migration_id);
        let hasStartedRollback = false;

        for(let migration of reversedMigrations) {
            if(hasStartedRollback && !rollbackMigrationIds.includes(migration.id)) {
                // to prevent rollback older migrations
                break;
            }

            else if(!rollbackMigrationIds.includes(migration.id)) {
                // if rollback has not occured and rollback migration ids dont include current migration id
                // ie when there are more migrations since last update but a rollback is called
                continue;
            }

            hasStartedRollback = true;

            try {
                let res = await this.executeQuery(migration.rollback_query);
                if(res) {
                    let logQuery = `DELETE FROM migrations WHERE migration_id = (SELECT migration_id FROM migrations WHERE migration_id = ${migration.id} ORDER BY id DESC LIMIT 1)`;
                    await this.executeQuery(logQuery);
                    console.log(`Rollbacked ID: ${migration.id}`);
                }
    
                else {
                    console.error(`Unable to rollback ID: ${migration.id}`);
                    break;
                }

            }

            catch {
                if(migration.id === 1) {
                    //migrations table do not exist
                    console.log(`Rollbacked ID: ${migration.id}`);
                    break;
                }
                console.error(`Unable to rollback ID: ${migration.id}`);
                break;
            }
        }

        return;
    }

    executeQuery = async (query: string) => {
        const client = new Client({
            user: this.user,
            password: this.password,
            host: this.host,
            port: this.port,
            database: this.database,
        });
        try {
            await client.connect();
            await client.query(query);
            await client.end();
        }
    
        catch (e){
            return false;
        }
        return true;
    }

    executeQueryForResults = async<T = any>(query: string): Promise<T[] | undefined> => {
        const client = new Client({
            user: this.user,
            password: this.password,
            host: this.host,
            port: this.port,
            database: this.database,
        });
        try {
            await client.connect();
            let res = await client.query(query);
            await client.end();
            return res.rows;
        }
    
        catch (e){
            return undefined;
        }
    }
}