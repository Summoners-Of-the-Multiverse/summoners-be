import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Socket, Server } from 'socket.io';
import cors from 'cors';
import { Battle } from './src/Battles';
import { StartBattleParams } from './types';

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
    socket.on('start_battle', ({ address, chainId, areaId}: StartBattleParams) => {
        if(!address || !chainId || !areaId) {
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
            battle = new Battle({io, socket, address, areaId, chainId, type: "wild", onPromptDelete});
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

http.listen(port, () => {
    console.log("I'm alive!");
});