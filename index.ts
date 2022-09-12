import express from 'express';
import bodyParser from 'body-parser';
import { createServer } from 'http';
import { Socket, Server } from 'socket.io';

//create app
const port = 8081;

let app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//connect app to websocket
let http = createServer(app);
let io = new Server(http);

//websocket functions
io.on('connection', (socket: Socket) => {
    //sends heartbeat
    socket.emit('Pong');
});

//api endpoints
app.get('/', function(req, res) {
    res.send('Hello World');
});

http.listen(port, () => {
    console.log("I'm alive!");
});