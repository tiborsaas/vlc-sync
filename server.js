const WebSocket = require('ws');

const PORT = process.env.PORT || 5000;
const ROOMS = {};
const WS = new WebSocket.Server({ port: PORT });

function createRoom(roomName, client) {
    ROOMS[roomName] = {
        clients: [client]
    };
}

function getRoomCount(roomName) {
    return ROOMS[roomName].clients.length;
}

function addClientToRoom(room, client) {
    if (!ROOMS[room]) {
        createRoom(room, client);
    } else {
        if(ROOMS[room].clients.indexOf(client) === -1) {
            ROOMS[room].clients.push(client);
        }
    }
}

function removeClientFromRoom(room, client) {
    if (ROOMS[room].clients.length === 1) {
        delete ROOMS[room];
    } else {
        ROOMS[room].clients = ROOMS[room].clients.filter(cid => client !== cid);
    }
}

function broadcastToRoom(room, payload) {
    const message = JSON.stringify(payload);
    ROOMS[room].clients.forEach(clientId => {
        WS.clients.forEach(client => {
            if (client.id === clientId) {
                client.send(message);
            }
        });
    });
}

WS.on('connection', function connection(ws, req) {
    const clientId = req.headers['sec-websocket-key'];
    ws.id = clientId;

    ws.on('message', function incoming(message) {
        const msg = JSON.parse(message);

        if (msg.room) {
            ws.room = msg.room;
            addClientToRoom(msg.room, ws.id);

            const payload = {
                roomCount: getRoomCount(msg.room),
                hello: ws.id,
            }
            broadcastToRoom(msg.room, payload);
        }

        if (msg.action) {
            const payload = {
                'action': msg.action
            };
            broadcastToRoom(msg.room, payload);
        }
    });

    ws.on('close', function close() {
        removeClientFromRoom(ws.room, ws.id);
    });
});

console.table({
    server: 'online',
    port: PORT
});
