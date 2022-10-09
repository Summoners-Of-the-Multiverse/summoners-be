import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Socket, Server } from 'socket.io';
import cors from 'cors';
import { Battle } from './src/Battles';
import { StartBattleParams } from './types';
import { getInventory, equipMonster, unequipMonster } from './src/Inventory';
import { getMintData, getAddressArea, getStarterMonsters, getStarterStatus, insertClaimedAddress, moveAddressTo, insertMonster, insertMonsterEquippedSkills, getBattleResult, getBattleSkillsUsed, insertMonsterUsingBattleId, getBattleResults } from './src/API';
import _ from 'lodash';

//create app
const port = 8081;

let app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({
    origin: '*',
    credentials: true
}));

//connect app to websocket
let http = createServer(app);
let io = new Server(http, {
    cors: {
        origin: 'http://localhost:3000',
        credentials: true
    }
});

//websocket functions
io.on('connection', (socket: Socket) => {
    socket.on('start_battle', ({ address, chainId }: StartBattleParams) => {
        if(!address || !chainId ) {
            socket.emit("invalid_battle");
            return;
        }

        console.log('starting battle for ' + socket.id);
        let battle: Battle | null = null;
        let onPromptDelete = () => {
            battle = null;
            console.log('room destroyed');
        };
        try {
            battle = new Battle({io, socket, address, chainId, type: "wild", onPromptDelete});
            battle.init();
        }

        catch (e){
            console.log(e);
        }
    });
});

//api endpoints
app.get('/', function(req, res) {
    res.send('Hello World');
});

//starter endpoints
app.get('/getStarterStatus/:address', async function(req, res) {
    try {
        let address = req.params['address'];
        let hasMinted = await getStarterStatus(address);

        return res.send({ hasMinted });
    }

    catch {
        return res.status(400).send("Invalid Address");
    }
});

app.get('/getStarterMonsters/:chainId', async function(req, res) {
    try {
        let chainId = req.params['chainId'];
        let starters = await getStarterMonsters(chainId);

        return res.send(starters);
    }

    catch {
        return res.status(400).send("Invalid Chain");
    }
});

app.post('/premint/:chainId', async function(req, res) {
    try {
        let chainId = req.params['chainId'];
        const data = await getMintData(chainId);
        return res.json(data);
    }

    catch(e) {
        return res.status(400).send("Unknown Error");
    }
});

app.post('/mint', async function(req, res) {
    try {
        // insert mob
        const insert1: any = await insertMonster(
            req.body.metadataId,
            req.body.tokenId,
            req.body.tokenHash
        );
        // random skills
        const insert2 = await insertMonsterEquippedSkills(insert1.id);
        // insert claim
        await insertClaimedAddress(req.body.address);

        // got 4 skills and mob inserted
        if (_.has(insert1, 'id') && _.size(insert2) == 4) {
            // auto equip mint mob
            await equipMonster(req.body.chainId, req.body.address, insert1.id);
            console.log(`success mint`);
            return res.json({ 'success': true });
        }
        console.log(`failed mint`);
        return res.json({ 'success': false });
    }

    catch(e) {
        return res.status(400).send("Unknown Error");
    }
});

app.post('/capture', async function(req, res) {
    try {
        // insert mob
        const insert1: any = await insertMonsterUsingBattleId(
            req.body.address,
            req.body.battleId,
            req.body.tokenId,
            req.body.tokenHash,
        );

        // random skills
        const insert2 = await insertMonsterEquippedSkills(insert1.id);

        // got 4 skills and mob inserted
        if (_.has(insert1, 'id') && _.size(insert2) == 4) {
            console.log(`success mint`);
            return res.json({ 'success': true });
        }
        console.log(`failed mint`);
        return res.json({ 'success': false });
    }

    catch(e) {
        return res.status(400).send("Unknown Error");
    }
});

//map api
app.get('/area/:address', async function(req, res) {
    try {

        let address = req.params['address'];
        let area = await getAddressArea(address);

        if(!area) {
            return res.status(404).send("Cant find location");
        }

        return res.send({ area_id: area.area_id });
    }

    catch (e){
        console.log(e)
        return res.status(400).send("Invalid address or location");
    }
});

app.post('/travel', async function(req, res) {
    try {
        const address = req.body['address'];
        const areaId = req.body['areaId'];
        await moveAddressTo(address, areaId);
        return res.send("1");
    }

    catch {
        return res.status(400).send("Invalid address or location");
    }
});

//end battle api
app.post('/battleResults', async function(req, res) {
    try {
        let address = req.body['address'];
        let results = await getBattleResults(address);

        if(!results) {
            return res.status(404).send("Cant find battle result");
        }

        return res.send(results);
    }

    catch (e){
        return res.status(400).send("Bad Request");
    }
});

app.post('/battleResult', async function(req, res) {
    try {
        let address = req.body['address'];
        let battleId = req.body['battleId'];
        let [result, skillsUsed] = await Promise.all([getBattleResult(address, battleId), getBattleSkillsUsed(battleId)]);

        if(!result) {
            return res.status(404).send("Cant find battle result");
        }

        return res.send({result, skillsUsed});
    }

    catch (e){
        return res.status(400).send("Bad Request");
    }
});

app.post('/inventory', async function(req, res) {
    const chainId = req.body['chainId'];
    const address = req.body['address'].toLowerCase();
    return res.send(await getInventory(chainId, address));
});

app.post('/equipMob', async function(req, res) {
    const address = req.body['address'].toLowerCase();
    const chainId = req.body['chainId'];
    const monsterId = req.body['monsterId'];
    return res.send(await equipMonster(chainId, address, monsterId));
});

app.post('/unequipMob', async function(req, res) {
    const address = req.body['address'].toLowerCase();
    const chainId = req.body['chainId'];
    const monsterId = req.body['monsterId'];
    return res.send(await unequipMonster(chainId, address, monsterId));
});

http.listen(port, () => {
    console.log("I'm alive!");
});