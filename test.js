const Packet = {
    SCIdentify: 0,
    SSIdentify: 1,
    SCClientJoin: 2,
    SCClientLeave: 3,
    SCHeartbeat: 4,
    SSHeartbeat: 5,
    SCClientUpdate: 6,
    SSClientUpdate: 7,
    GCGameState: 8,
    GCGamePlayers: 9,
    GSClientState: 10,
    GCGameInit: 11,
    CCChatMessage: 12,
    CSChatMessage: 13,
    GSPlace: 14,
    GSDelete: 15,
    CCChatInit: 16,
    SSDisconnect: 17,
    GSToolUse: 18,
    GCDebug: 19,
    CCClosed: 20
}

const ChatMessageType = {
    SYSTEM: 0,
    JOIN: 1,
    LEAVE: 2,
    MESSAGE: 3,
    DISCORD: 4
}

const DisconnectReason = {
    0: "Connection with the server has been lost or the server closed.",
    1: "You have been kicked from this server. Reason: %0",
    2: "You have been banned from this server. Reason: %0",
    3: "Server is currently restarting, please try again later.",
    3000: "You are already connected to this server.",
    3001: "You are not authorized to join this server.",
    3002: "You have been kicked due to inactivity.",
    3003: "Authorization error, please try again later.",
    3004: "Server is full, please try again later."
}

const PlayerLeaveReason = {
    0: "%0 has been banned",
    1: "%0 has been kicked",
    2: "%0 timed out",
    3: "%0 left the game"
}

menuScreens.servers = {
    name: "Servers",
    parentDiv: "serversListParent",
    buttonDescription: "Available servers",
    show: true,
    loader: serverListLoader
}
menuScreens.chat = {
    name: "Chat",
    parentDiv: "chatParent",
    buttonDescription: "Chat with others",
    show: true,
    loader: chatLoader
}
menuScreens.players = {
    name: "Players",
    parentDiv: "playersListParent",
    buttonDescription: "Players list",
    show: true,
    loader: playerListLoader
}
menuScreens.disconnected = {
    name: "Connection lost",
    show: false,
    parentDiv: "disconnectedMessageParent",
    loader: disconnectMessageLoader
}

class ChatHandler {
    constructor () {
        this.messages = new Map();
        this.initialized = false;
    }

    sendMessage(content) {
        console.log("sendMessage");
        gameHandler.room.sendMessage(Packet.CSChatMessage, {
            content
        })
    }

    handleMessage(message, init) {
        if (!init && !this.initialized) return;
        this.messages.set(message.id, message);
        if (message.messageType == ChatMessageType.MESSAGE) {
            const previous = this.getPrevious(message.createdAt);
            const messageElement = document.createElement("div");
            const messageAuthor = document.createElement("h5");
            messageAuthor.style.marginBottom = "5px";
            messageAuthor.style.marginTop = 0;
            messageAuthor.textContent = message.authorUsername ?? "Anonymous";
            const color = message.authorColor;
            messageAuthor.style.background = `linear-gradient(to right, ${color.length == 1 ? `${color}, ${color}` : color.join(", ")})`;
            messageAuthor.style.backgroundClip = "text";
            messageAuthor.style.webkitTextFillColor = "transparent";
            const messageContent = document.createElement("h6");
            messageContent.style.marginTop = 0;
            messageContent.style.marginBottom = 0;
            messageContent.textContent = message.content;
            if (previous?.author == message.author && previous.messageType == ChatMessageType.MESSAGE) messageElement.append(messageContent);
            else messageElement.append(messageAuthor, messageContent);
            document.getElementById("messageList").appendChild(messageElement);
        } 
        else if (message.messageType == ChatMessageType.LEAVE) this.playerLeft(message);
        else if (message.messageType == ChatMessageType.JOIN) this.playerJoined(message);
        else if (message.messageType == ChatMessageType.SYSTEM) this.systemMessage(message.content);
        else if (message.messageType == ChatMessageType.DISCORD) {
            const previous = this.getPrevious(message.createdAt);
            const messageElement = document.createElement("div");
            const messageAuthor = document.createElement("h5");
            messageAuthor.style.marginBottom = "5px";
            messageAuthor.style.marginTop = 0;
            messageAuthor.textContent = `Discord > ${message.authorUsername}`;
            const color = message.authorColor;
            messageAuthor.style.background = `linear-gradient(to right, ${color.length == 1 ? `${color}, ${color}` : color.join(", ")})`;
            messageAuthor.style.backgroundClip = "text";
            messageAuthor.style.webkitTextFillColor = "transparent";
            const messageContent = document.createElement("h6");
            messageContent.style.marginTop = 0;
            messageContent.style.marginBottom = 0;
            messageContent.textContent = message.content;
            if (previous?.author == message.author && previous.messageType == ChatMessageType.DISCORD) messageElement.append(messageContent);
            else messageElement.append(messageAuthor, messageContent);
            document.getElementById("messageList").appendChild(messageElement);
        }
        document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
    }

    getPrevious(createdAt) {
        return Array.from(this.messages.values()).filter(a => a.createdAt < createdAt).sort((a, b) => b.createdAt - a.createdAt)[0];
    }

    initialize(message_) {
        for (const message of message_.messages) {
            this.handleMessage(message, true);
        }
        this.initialized = true;
    }

    systemMessage(content) {
        const messageElement = document.createElement("div");
        const messageContent = document.createElement("h6");
        messageContent.style.marginTop = 0;
        messageContent.style.marginBottom = 0;
        messageContent.style.color = "#808080";
        messageContent.textContent = content;
        messageElement.append(messageContent);
        document.getElementById("messageList").appendChild(messageElement);
    }

    playerLeft(message) {
        const username = message.authorUsername;
        if (!username) return;
        const color = message.authorColor;
        const messageElement = document.createElement("div");
        const messageAuthor = document.createElement("h5");
        messageAuthor.style.marginBottom = "5px";
        messageAuthor.style.marginTop = 0;
        messageAuthor.textContent = PlayerLeaveReason[message.reason ?? 3].replace("%0", username);
        messageAuthor.style.background = `linear-gradient(to right, ${color.length == 1 ? `${color}, ${color}` : color.join(", ")})`;
        messageAuthor.style.backgroundClip = "text";
        messageAuthor.style.webkitTextFillColor = "transparent";
        messageElement.append(messageAuthor);
        document.getElementById("messageList").appendChild(messageElement);
    }

    playerJoined(message) {
        console.log("playerJoined", message.id);
        const username = message.authorUsername;
        if (!username) return;
        const color = message.authorColor;
        const messageElement = document.createElement("div");
        const messageAuthor = document.createElement("h5");
        messageAuthor.style.marginBottom = "5px";
        messageAuthor.style.marginTop = 0;
        messageAuthor.textContent = username + " joined the game";
        messageAuthor.style.background = `linear-gradient(to right, ${color.length == 1 ? `${color}, ${color}` : color.join(", ")})`;
        messageAuthor.style.backgroundClip = "text";
        messageAuthor.style.webkitTextFillColor = "transparent";
        messageElement.append(messageAuthor);
        document.getElementById("messageList").appendChild(messageElement);
    }
}

class ServerHandler {
    constructor (socket, config) {
        this.socket = socket;
        this.clients = new Map();
        this.chatHandler = new ChatHandler();
        this.pixels = [];
        this.ticks = 0;
        this.mousePositions = [];
        this.settings = {};
        this.elements = [];
        this.width = -1;
        this.height = -1;
        this.tpsCount = 0;
        this.lastCheck = -1;
        this.tps = 0;
        this.identified = false;
        this.config = config;
        socket.onopen = () => {
            logMessage("connected");
        }
        socket.onmessage = (ev) => {
            const message = JSON.parse(ev.data.toString());
            this.onMessage(message);
        }
        socket.onclose = () => {
            gameHandler.disconnect();
        }
    }

    sendMessage(type, message) {
        // console.log(`Sent ${type} packet with ${JSON.stringify(message)} message`);
        this.socket.send(JSON.stringify({type, ...message}));
    }

    async identify(message) {
        console.log("IDENTIFY", sessionHandler.session);
        const response = await fetch("https://sandboxelsserver.xyz/auth/serverAuth/generate", {
            body: JSON.stringify({
                session: sessionHandler.session,
                serverIP: `${gameHandler.server}/play/${gameHandler.room.config.name}`
            }),
            mode: "cors",
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': "https://sandboxelsserver.xyz/auth"},        
            method: "POST"
        });
        const accessToken = await response.text();
        console.log("sending identify");
        this.sendMessage(Packet.SSIdentify, {
            accessToken
        });
        this.id = message.id;
        this.name = sessionHandler.user.username;
        this.color = sessionHandler.user.color;
        this.clients.clear();
    }

    disconnect() {
        this.sendMessage(Packet.SSDisconnect, {});
        this.socket.close();
    }

    playerJoined(message) {
        this.clients.set(message.id, message);
        logMessage(`${message.username} joined`);
        const playerItem = document.createElement("li");
        const playerName = document.createElement("h5");
        playerName.textContent = message.username;
        playerName.style.color = message.color;
        playerName.style.marginTop = 0;
        playerName.style.marginBottom = 0;
        playerItem.id = `playerItem-${message.id}`;
        playerItem.append(playerName);
        document.getElementById("playerList").append(playerItem);
        document.getElementById("playersOnlineChat").innerText = `Players online: ${this.clients.size}/${this.config?.maxPlayers ?? 20}`;
    }

    playerLeft(message) {
        this.clients.delete(message.id);
        document.getElementById(`playerItem-${message.id}`).remove();
        document.getElementById("playersOnlineChat").innerText = `Players online: ${this.clients.size}/${this.config?.maxPlayers ?? 20}`;
    }

    heartbeat() {
        this.sendMessage(Packet.SSHeartbeat, {});
    }

    playerUpdated(message) {
        this.clients.set(message.id, message);
    }

    gameStateUpdate(message) {
        this.pixels = decodePixels(message.pixels);
        this.ticks = message.tick;
        this.mousePositions = message.mousePositions.filter(a => a.position);
        this.tpsCount++;
        if (this.lastCheck + 1000 < Date.now()) {
            this.tps = this.tpsCount;
            this.lastCheck = Date.now();
            this.tpsCount = 0;
        }
    }

    gameInit(message) {
        this.settings = message.settings;
        this.elements = message.elements;
        this.width = message.width;
        this.height = message.height;
        this.identified = true;
        for (const element of this.elements) {
            createElementButton(element.name, element.color, element.category, element.darkText);
        }
    }

    gamePlayersInit(message) {
        this.clients.clear();
        for (const player of message.players) {
            this.clients.set(player.id, player);
            const playerItem = document.createElement("li");
            const playerName = document.createElement("h5");
            playerName.textContent = player.username;
            playerName.style.color = player.color;
            playerName.style.marginTop = 0;
            playerName.style.marginBottom = 0;
            playerItem.id = `playerItem-${player.id}`
            playerItem.append(playerName);
            document.getElementById("playerList").append(playerItem);
        }
        document.getElementById("playersOnlineChat").innerText = `Players online: ${this.clients.size}/${this.config?.maxPlayers ?? 20}`;
    }

    onMessage(message) {
        switch (message.type) {
            case Packet.SCIdentify: this.identify(message);
                break;
            case Packet.SCClientJoin: this.playerJoined(message);
                break;
            case Packet.SCClientLeave: this.playerLeft(message);
                break;
            case Packet.SCClientUpdate: this.playerUpdated(message);
                break;
            case Packet.GCGameInit: this.gameInit(message);
                break;
            case Packet.CCChatMessage: this.chatHandler.handleMessage(message, false);
                break;
            case Packet.GCGamePlayers: this.gamePlayersInit(message);
                break;
            case Packet.GCGameState: this.gameStateUpdate(message);
                break;
            case Packet.SCHeartbeat: this.heartbeat();
                break;
            case Packet.CCChatInit: this.chatHandler.initialize(message);
                break;
            case Packet.GCDebug:
                // FROM DEBUG TOOL
                mouseIsDown = false;
                if (shiftDown) { toggleShift() }
                var output = pixel.element.toUpperCase()+" at x"+pixel.x+", y"+pixel.y+", tick"+pixelTicks+"\n";
                for (var i in pixel) {
                    if (i !== "x" && i !== "y" && i !== "element") {
                        output += "  " + i + ": " + pixel[i] + "\n";
                    }
                }
                console.log(output);
                console.log(JSON.stringify(pixel));
                alert(output);
                break;
            case Packet.CCClosed:
                console.log(message);
                displayDisconnectMessage(message.reason, message.message);
                this.disconnect();
                break;
        }
    }

    placePixel(element, x, y) {
        if (!this.identified) return;
        this.sendMessage(Packet.GSPlace, {
            pixels: [{x, y, element}],
            replace: mode == "replace"
        })
    }
}

class GameHandler {
    constructor () {
        this.room = null;
        this.connected = false;
        this.availableServers = [];
        this.availableRooms = [];
        this.server = null;
    }

    async connect(server, room) {
        this.connected = true;
        const roomConfig = await fetch(`https://${server}/${room}/config`, {
            mode: "cors",
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': `https://${server}/${room}`},        
            method: "GET"
        });
        if (roomConfig.status != 200) throw "Invalid server IP";
        const config = await roomConfig.json();
        const socket = new WebSocket(`wss://${server}/play/${room}`);
        this.room = new ServerHandler(socket, config);
        this.server = server;
        overwriteGameFunctions();
        document.querySelectorAll(".elementButton").forEach(b => b.remove());
        document.getElementById("betterMenuScreens_chatButton").style.display = "block";
        document.getElementById("betterMenuScreens_playersButton").style.display = "block";
    }

    disconnect() {
        this.connected = false;
        this.room.disconnect();
        this.room = null;
        this.server = null;
        returnGameFunctions();
        document.getElementById("betterMenuScreens_chatButton").style.display = "none";
        document.getElementById("betterMenuScreens_playersButton").style.display = "none";
        document.getElementById("playersOnlineChat").innerText = `You are not connected`;
        if (showingMenu == "chat") {
            closeMenu();
        }
    }

    async getAvailableServers() {
        const response = await fetch("https://sandboxelsserver.xyz/auth/servers", {
            mode: "cors",
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': "https://sandboxelsserver.xyz/auth"},        
            method: "GET"
        })

        if (response.status == 404) return [];

        return await response.json();
    }

    async getAvailableRooms(serverIP) {
        const response = await fetch(`https://${serverIP}/config`, {
            mode: "cors",
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': `https://${serverIP}/config`},        
            method: "GET"
        })

        if (response.status == 404) return [];

        return await response.json();
    }

    async getRoomConfig(serverIP, roomName) {
        const response = await fetch(`https://${serverIP}/${roomName}/config`, {
            mode: "cors",
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': `https://${serverIP}/${roomName}`},        
            method: "GET"
        })

        if (response.status == 404) return null;

        return await response.json();
    }

    async pingRoom(serverIP, roomName) {
        const time = Date.now();
        const response = await fetch(`https://${serverIP}/${roomName}`, {
            mode: "cors",
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': `https://${serverIP}/${roomName}`},        
            method: "GET"
        })

        const ping = Date.now() - time;

        if (response.status == 404) return { ping: -1, players: [] };

        return { players: await response.json(), ping };
    }

    async parseURLParams() {
        if (!urlParams.has("lobby")) return;
        const serverInfo = (await this.getAvailableRooms(urlParams.get("server") ?? "sandboxelsserver.xyz"));
        if (serverInfo.map(a => a.lobby).includes(urlParams.get("lobby"))) this.connect(urlParams.get("server") ?? "sandboxelsserver.xyz", serverInfo.find(a => a.lobby == urlParams.get("lobby")).name);
    }
}

class SessionHandler {
    constructor () {
        this.session = null;
    }

    async validateCookie() {
        const cookie = document.cookie.split(";").find(a => a.trim().startsWith("sbSession="))?.trim().split("=")[1];
        if (!cookie) return false;
        const response = await fetch("https://sandboxelsserver.xyz/auth/auth/validate", {
            body: JSON.stringify({
                session: cookie
            }),
            mode: "cors",
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': "https://sandboxelsserver.xyz/auth"},        
            method: "POST"
        })

        const valid = await response.json();
        this.session = cookie;
        return Boolean(valid);
    }

    async getCookie() {
        const valid = await this.validateCookie();
        if (!valid) return this.authorize();
        const cookie = document.cookie.split(";").find(a => a.trim().startsWith("sbSession="))?.trim().split("=")[1];
        this.session = cookie;
        this.fetchUserInfo();
    }

    setCookie(session) {
        this.session = session;
        const date = new Date();
        date.setTime(date.getTime() + (14 * 24 * 60 * 60 * 1000));
        document.cookie = `sbSession=${session}; expires=${date.toUTCString()};path=/`;
    }

    authorize() {
        window.location.href = "https://sandboxelsserver.xyz/auth/auth";
    }

    async getSession() {
        if (urlParams.has("token")) {
            console.log("token");
            const token = urlParams.get("token");
            console.log(token);
            const response = await fetch("https://sandboxelsserver.xyz/auth/auth/token", {
                body: JSON.stringify({
                    accessToken: token
                }),
                mode: "cors",
                headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': "https://sandboxelsserver.xyz/auth"},            
                method: "POST"
            })

            const session = await response.text();
            this.setCookie(session);
            await this.fetchUserInfo();
            urlParams.delete("token");
        } else return;
    }

    async fetchUserInfo() {
        const session = this.session;
        const response = await fetch("https://sandboxelsserver.xyz/auth/auth/session", {
            body: JSON.stringify({
                session
            }),
            mode: "cors",
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': "https://sandboxelsserver.xyz/auth"},        
            method: "POST"
        });

        const user = await response.json();
        this.user = user;
    }

    getUserData() {
        return this.user;
    }
}

const sessionHandler = new SessionHandler();
const gameHandler = new GameHandler();

if (urlParams.has("token")) sessionHandler.getSession();
else {
    (async () => {await sessionHandler.getCookie();})()
}

(async () => {
    gameHandler.availableServers = await gameHandler.getAvailableServers();
    const rooms = [];
    for (const server of gameHandler.availableServers) {
        const availableRooms = await gameHandler.getAvailableRooms(server.ip);
        rooms.push(...availableRooms.map(a => ({room: a.name, server: server.ip})));
    }
    gameHandler.availableRooms = rooms;
    for (let i = 0; i < rooms.length; i++) {
        const { room, server } = rooms[i];
        const config = await gameHandler.getRoomConfig(server, room);
        const slot = document.createElement("span");
        slot.id = `serverSlot${i}`;
        slot.className = "serverSlot";
        const motd = document.createElement("span");
        motd.innerText = config.motd;
        const joinButton = document.createElement("span");
        joinButton.innerText = "Join";
        joinButton.className = "saveOption";
        joinButton.style.color = "#ff00ff";
        joinButton.onclick = () => {
            gameHandler.connect(server, room);
        }
        slot.append(motd, joinButton);
        document.getElementById("serverList").append(slot);
    }

    await gameHandler.parseURLParams();
})()

let lastMousePos = [];
let lastMouseSize = -1;

const PIXEL_BASE_PROPERTIES = {
    "x": ["number", 0],
    "y": ["number", 1],
    "color": ["color", 2],
    "element": ["string", 3], 
    "temp": ["number", 4], 
    "charge": ["number", 5], 
    "burning": ["boolean", 6], 
    "clone": ["string", 7]
}

function decodePixel(array, i=0) {
    let index = i;
    let pixel = {};
    while (index < array.length) {
        const current = array[index++];
        if (current == 0xff || (current == 0x00 && index >= array.length)) return [pixel, index];
        const key = Object.keys(PIXEL_BASE_PROPERTIES).find(a => PIXEL_BASE_PROPERTIES[a][1] == current);
        const prop = PIXEL_BASE_PROPERTIES[key];
        if (prop[0] == "number") {
            const value = array[index++] << 24 | array[index++] << 16 | array[index++] << 8 | array[index++];
            pixel[key] = value;
        } else if (prop[0] == "color") {
            const [r, g, b] = [array[index++], array[index++], array[index++]];
            pixel[key] = `rgb(${r},${g},${b})`;
        } else if (prop[0] == "string") {
            let value = "";
            while (1) {
                const a = array[index++];
                value += String.fromCharCode(a >> 1);
                if ((a & 1) == 0) break;
            }
            pixel[key] = value;
        } else {
            const value = array[index++] == 1;
            pixel[key] = value;
        }
    }
    return [pixel, index];
}

function decodePixels(array) {
    let index = 0;
    const pixels = [];
    while (index < array.length) {
        const res = decodePixel(array, index);
        pixels.push(res[0]);
        index = res[1];
    }
    return pixels;
}

// HTML STUFF
function displayDisconnectMessage(reason, message) {
    console.log("displayDisconnectMessage");
    if (!message && [1, 2].includes(reason)) message = (reason == 1 ? "Kicked" : "Banned") + " by an operator."
    document.getElementById("disconnectMessageReason").innerText = DisconnectReason[reason].replace("%0", message);
    openMenu("disconnected", true);
}

function disconnectMessageLoader() {
    const reason = document.createElement("p");
    reason.style.textAlign = "center";
    reason.id = "disconnectMessageReason";
    new MenuScreen()
        .setTitle("Connection lost")
        .setParentDivId("disconnectedMessageParent")
        .setInnerDivId("disconnectedMessage")
        .addNode(reason)
        .build();
}

function chatLoader() {
    const chatNote = document.createElement("span");
    chatNote.textContent = "You are not connected";
    chatNote.id = "playersOnlineChat";
    chatNote.style.fontSize = "1em";
    chatNote.style.color = "#808080";
    const hr = document.createElement("hr");
    hr.style.width = "100%";
    hr.style.backgroundColor = "#808080";
    hr.style.height = "0.15em";
    hr.style.border = "none";
    const messageList = document.createElement("div");
    messageList.id = "messageList";
    const chatInput = document.createElement("input");
    chatInput.type = "text";
    chatInput.id = "chatMessage";
    chatInput.placeholder = "Type here...";
    chatInput.onkeydown = (ev) => {
        if (ev.key == "Enter") {
            if (document.getElementById("chatMessage").value.length == 0) return;
            if (gameHandler.connected && gameHandler.room.identified) {
                gameHandler.room.chatHandler.sendMessage(document.getElementById("chatMessage").value);
                document.getElementById("chatMessage").value = "";
            }
        }
    }
    const style = document.createElement("style");
    style.innerHTML = `#chatMessage { position: absolute; bottom: 59.4%; width: 95%; max-width: 700px; height: 50px; left: 50%; transform: translate(-50%, 198.5%); background-color: rgb(66, 66, 66); color: white; font-size: 1.5em; padding: 8px; font-family: 'Press Start 2P'; z-index: 11; }\n#messageList {margin-left: 0; max-height: 20%; height: 20%; position: relative; margin-bottom: 50px}\n#chatMenuText {margin-bottom: 50px, padding-bottom: 50px;}\n#chat::-webkit-scrollbar {display: none}\n#chat {-ms-overflow-style: none; scrollbar-width: none;}`
    document.head.append(style);
    new MenuScreen()
        .setTitle("Chat")
        .setParentDivId("chatParent")
        .setInnerDivId("chat")
        .setMenuTextId("chatMenuText")
        .addNode([chatNote, hr, messageList, document.createElement("br"), document.createElement("br")])
        .build();
    document.getElementById("chatParent").append(chatInput);
}
function playerListLoader() {
    const playerList = document.createElement("ul");
    playerList.id = "playerList";
    new MenuScreen()
        .setTitle("Players")
        .setParentDivId("playersListParent")
        .setInnerDivId("playersList")
        .addNode(playerList)
        .build();
}
function serverListLoader() {
    const style = document.createElement("style"); 
    style.innerHTML = `#serverList {padding-top: 1em; height:70%}\n.serverSlot {display: block; border-top: solid gray; padding: 1em}\n.serverSlot:last-child {border-bottom: solid gray}`
    document.head.append(style);
    return new MenuScreen()
        .setTitle("Servers")
        .setParentDivId("serversListParent")
        .setInnerDivId("serversList")
        .setMenuTextId("serverList")
        .build();
}

// FUNCTION HIJACKING, IGNORE
const oldDrawPixels = drawPixels;
const oldIsEmpty = isEmpty;
const oldPixel = Pixel;
const oldConstructor = Pixel.prototype.constructor;
const oldProto = Pixel.prototype;
const oldUpdateStats = updateStats;
const oldMouse2Action = mouse2Action;
const oldCreateElementButton = createElementButton;
const oldCreatePixel = createPixel;
const oldTickPixels = tickPixels;
const oldDrawLayers = drawLayers;

function overwriteGameFunctions() {
    drawLayers = (includeBackground) => {
        if (ctx === null) return console.log('a');
        clearLayers();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (settings.bg) { // Set background color
            if (canvas.style.backgroundColor !== settings.bg) {
                canvas.style.backgroundColor = settings.bg;
            }
            if (includeBackground) {
                ctx.fillStyle = settings.bg;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
        for (let i = 0; i < canvasLayersPre.length; i++) {
            const layerCanvas = canvasLayersPre[i];
            ctx.drawImage(layerCanvas, 0, 0);
        }
        if (!drawPixels() && !paused) {
            logMessage("One or more of your mods are outdated and cannot render properly.");
            togglePause();
        }
        drawCursor();
        for (const pos of gameHandler.room.mousePositions) {
            if (pos.player == gameHandler.room.id) continue;
            else {
                var mouseOffset = Math.trunc(pos.size/2);
                var topLeft = [pos.position[0]-mouseOffset,pos.position[1]-mouseOffset];
                var bottomRight = [pos.position[0]+mouseOffset,pos.position[1]+mouseOffset];
                // Draw a square around the mouse
                const color = gameHandler.room.clients.get(pos.player)?.color ?? ["#ffffff"];
                let strokeStyle = color[0];
                if (color.length > 1) {
                    strokeStyle = ctx.createLinearGradient(topLeft[0]*pixelSize,topLeft[1]*pixelSize,(bottomRight[0]-topLeft[0]+1)*pixelSize,(bottomRight[1]-topLeft[1]+1)*pixelSize)
                    for (let i = 0; i < color.length; i++) {
                        strokeStyle.addColorStop((1 / color.length) * i, color[i]);
                    }
                }
                ctx.strokeStyle = strokeStyle;
                ctx.strokeRect(topLeft[0]*pixelSize,topLeft[1]*pixelSize,(bottomRight[0]-topLeft[0]+1)*pixelSize,(bottomRight[1]-topLeft[1]+1)*pixelSize);
                const username = gameHandler.room.clients.get(pos.player)?.username;
                ctx.font = '10px "Press Start 2P"'

                const textWidth = ctx.measureText(username).width;
                let textStyle = color[0];
                if (color.length > 1) {
                    textStyle = ctx.createLinearGradient((pos.position[0] - mouseOffset) * pixelSize + (pos.size * pixelSize / 2) - textWidth / 2, pos.position[1] * pixelSize + pos.size * pixelSize + 2, (pos.position[0] - mouseOffset) * pixelSize + (pos.size * pixelSize / 2) - textWidth / 2 + textWidth, pos.position[1] * pixelSize + pos.size * pixelSize + 2 + 10);
                    for (let i = 0; i < color.length; i++) {
                        textStyle.addColorStop((1 / color.length) * i, color[i]);
                    }
                }

                ctx.fillStyle = textStyle
                // ctx.fillText(username, topLeft[0] * pixelSize - ctx.measureText(username), topLeft[1] * pixelSize);
                ctx.fillText(username, (pos.position[0] - mouseOffset) * pixelSize + (pos.size * pixelSize / 2) - textWidth / 2, pos.position[1] * pixelSize + pos.size * pixelSize + 2);
            }
        }
        for (let i = 0; i < canvasLayersPost.length; i++) {
            const layerCanvas = canvasLayersPost[i];
            ctx.drawImage(layerCanvas, 0, 0);
        }
        if (!gameHandler.connected || !gameHandler.room.identified) return;
        let a = outOfBounds(mousePos.x, mousePos.y) ? null : [mousePos.x, mousePos.y];
        let b = lastMousePos;
        if ((a == null && Array.isArray(b)) || (Array.isArray(a) && b == null) || (Array.isArray(a) && Array.isArray(b) && (a[0] != b[0] || a[1] != b[1])) || lastMouseSize != mouseSize) {
            if (outOfBounds(mousePos.x, mousePos.y)) {
                gameHandler.room.sendMessage(Packet.GSClientState, {
                    state: {
                        mousePos: null,
                        mouseSize
                    }
                })
                lastMousePos = null;
                lastMouseSize = mouseSize;
            } else {
                gameHandler.room.sendMessage(Packet.GSClientState, {
                    state: {
                        mousePos: [mousePos.x, mousePos.y],
                        mouseSize
                    }
                })
                lastMousePos = [mousePos.x, mousePos.y];
                lastMouseSize = mouseSize;
            }
        }
    }
    drawPixels = (forceTick=false) => {
        const canvas = canvasLayers.pixels;
        const ctx = canvas.getContext("2d");
        let pixelsFirst = [];
        let pixelsLast = [];
        for (let i = 0; i < gameHandler.room.pixels.length; i++) {
            let pixel = gameHandler.room.pixels[i];
            if (elements[pixel.element].isGas || elements[pixel.element].glow) {
                pixelsLast.push(pixel);
            }
            else {
                pixelsFirst.push(pixel);
            }
        }
        // Draw the current pixels
        if (!hiding) {
            let pixelDrawList = pixelsFirst.concat(pixelsLast);
            let viewN = view;
            if (!viewInfo[viewN]) {
                viewN = 1;
            }
            if (renderPrePixelList.length) {
                for (let i = 0; i < renderPrePixelList.length; i++) {
                    renderPrePixelList[i](ctx);
                }
            }
            if (viewInfo[viewN].pre) {
                viewInfo[viewN].pre(ctx);
            }
            if (viewInfo[viewN].pixel) {
                for (let i = 0; i < pixelDrawList.length; i++) {
                    let pixel = pixelDrawList[i];
                    if (elements[pixel.element].renderer && settings.textures !== 0) {
                        elements[pixel.element].renderer(pixel,ctx);
                    }
                    else {
                        viewInfo[viewN].pixel(pixel,ctx);
                    }
                    if (renderEachPixelList.length) {
                        for (let i = 0; i < renderEachPixelList.length; i++) {
                            renderEachPixelList[i](pixel,ctx);
                        }
                    }
                }
            }
            if (renderPostPixelList.length) {
                for (let i = 0; i < renderPostPixelList.length; i++) {
                    renderPostPixelList[i](ctx);
                }
            }
            if (viewInfo[viewN].post) {
                viewInfo[viewN].post(ctx);
            }
        }
        if (ctx.globalAlpha < 1) {
            ctx.globalAlpha = 1;
        }
        return true;
    }
    // drawPixels = (forceTick=false) => {
    //     if (ctx === null) return
    //     var newCurrentPixels = gameHandler.room.pixels
    //     var pixelsFirst = [];
    //     var pixelsLast = [];
        
    //     for (var i = 0; i < newCurrentPixels.length; i++) {
    //         var pixel = newCurrentPixels[i];
    //         if (pixel.con) { pixel = pixel.con }
    //         if (elements[pixel.element].isGas || elements[pixel.element].glow) {
    //             pixelsLast.push(pixel);
    //         }
    //         else {
    //             pixelsFirst.push(pixel);
    //         }
    //     }
    //     if (!hiding) {
    
    //     if (!settings["bg"]) {ctx.clearRect(0, 0, canvas.width, canvas.height)}
    //     else {
    //         ctx.fillStyle = settings["bg"];
    //         ctx.fillRect(0, 0, canvas.width, canvas.height);
    //     }
    //     var pixelDrawList = pixelsFirst.concat(pixelsLast);
    //     for (var i = 0; i < pixelDrawList.length; i++) {
    //         var pixel = pixelDrawList[i];
    //         if (pixel.con) { pixel = pixel.con }
    //         if (view===null || view===3) {
    //             ctx.fillStyle = pixel.color;
    //         }
    //         else if (view === 2) { // thermal view
    //             var temp = pixel.temp;
    //             if (temp < -50) {temp = -50}
    //             if (temp > 6000) {temp = 6000}
    //             // logarithmic scale, with coldest being 225 (-50 degrees) and hottest being 0 (6000 degrees)
    //             var hue = Math.round(225 - (Math.log(temp+50)/Math.log(6000+50))*225);
    //             if (hue < 0) {hue = 0}
    //             if (hue > 225) {hue = 225}
    //             ctx.fillStyle = "hsl("+hue+",100%,50%)";
    //         }
    //         if (ctx.globalAlpha < 1 && !(elements[pixel.element].isGas || elements[pixel.element].glow)) {
    //             ctx.globalAlpha = 1;
    //         }
    //         if (view === null && ((elements[pixel.element].isGas && elements[pixel.element].glow !== false) || elements[pixel.element].glow)) {
    //             if (ctx.globalAlpha!==0.5) { ctx.globalAlpha = 0.5; }
    //             ctx.fillRect((pixel.x-1)*pixelSize, (pixel.y)*pixelSize, pixelSize*3, pixelSize);
    //             ctx.fillRect((pixel.x)*pixelSize, (pixel.y-1)*pixelSize, pixelSize, pixelSize*3);
    //         }
    //         else { // draw the pixel (default)
    //             ctx.fillRect(pixel.x*pixelSize, pixel.y*pixelSize, pixelSize, pixelSize);
    //         }
    //         if (pixel.charge && view !== 2) { // Yellow glow on charge
    //             if (!elements[pixel.element].colorOn) {
    //                 ctx.fillStyle = "rgba(255,255,0,0.5)";
    //                 ctx.fillRect(pixel.x*pixelSize, pixel.y*pixelSize, pixelSize, pixelSize);
    //             }
    //         }
    //     }
    //     }
    //     if (ctx.globalAlpha < 1) {
    //         ctx.globalAlpha = 1;
    //     }
    
    //     for (const pos of gameHandler.room.mousePositions) {
    //         if (pos.player == gameHandler.room.id) {
    //             var mouseOffset = Math.trunc(pos.size/2);
    //             var topLeft = [pos.position[0]-mouseOffset,pos.position[1]-mouseOffset];
    //             var bottomRight = [pos.position[0]+mouseOffset,pos.position[1]+mouseOffset];
    //             // Draw a square around the mouse
    //             ctx.strokeStyle = "#ffffff";
    //             ctx.strokeRect(topLeft[0]*pixelSize,topLeft[1]*pixelSize,(bottomRight[0]-topLeft[0]+1)*pixelSize,(bottomRight[1]-topLeft[1]+1)*pixelSize);
    //         } else {
    //             var mouseOffset = Math.trunc(pos.size/2);
    //             var topLeft = [pos.position[0]-mouseOffset,pos.position[1]-mouseOffset];
    //             var bottomRight = [pos.position[0]+mouseOffset,pos.position[1]+mouseOffset];
    //             // Draw a square around the mouse
    //             const color = gameHandler.room.clients.get(pos.player)?.color ?? ["#ffffff"];
    //             let strokeStyle = color[0];
    //             if (color.length > 1) {
    //                 strokeStyle = ctx.createLinearGradient(topLeft[0]*pixelSize,topLeft[1]*pixelSize,(bottomRight[0]-topLeft[0]+1)*pixelSize,(bottomRight[1]-topLeft[1]+1)*pixelSize)
    //                 for (let i = 0; i < color.length; i++) {
    //                     strokeStyle.addColorStop((1 / color.length) * i, color[i]);
    //                 }
    //             }
    //             ctx.strokeStyle = strokeStyle;
    //             ctx.strokeRect(topLeft[0]*pixelSize,topLeft[1]*pixelSize,(bottomRight[0]-topLeft[0]+1)*pixelSize,(bottomRight[1]-topLeft[1]+1)*pixelSize);
    //             const username = gameHandler.room.clients.get(pos.player)?.username;
    //             ctx.font = '10px "Press Start 2P"'

    //             const textWidth = ctx.measureText(username).width;
    //             let textStyle = color[0];
    //             if (color.length > 1) {
    //                 textStyle = ctx.createLinearGradient((pos.position[0] - mouseOffset) * pixelSize + (pos.size * pixelSize / 2) - textWidth / 2, pos.position[1] * pixelSize + pos.size * pixelSize + 2, (pos.position[0] - mouseOffset) * pixelSize + (pos.size * pixelSize / 2) - textWidth / 2 + textWidth, pos.position[1] * pixelSize + pos.size * pixelSize + 2 + 10);
    //                 for (let i = 0; i < color.length; i++) {
    //                     textStyle.addColorStop((1 / color.length) * i, color[i]);
    //                 }
    //             }

    //             ctx.fillStyle = textStyle
    //             // ctx.fillText(username, topLeft[0] * pixelSize - ctx.measureText(username), topLeft[1] * pixelSize);
    //             ctx.fillText(username, (pos.position[0] - mouseOffset) * pixelSize + (pos.size * pixelSize / 2) - textWidth / 2, pos.position[1] * pixelSize + pos.size * pixelSize + 2);
    //         }
    //     }
    //     if ((!paused) || forceTick) {pixelTicks++};
    
    //     if (showingMenu) return;
    //     let a = outOfBounds(mousePos.x, mousePos.y) ? null : [mousePos.x, mousePos.y];
    //     let b = lastMousePos;
    //     if ((a == null && Array.isArray(b)) || (Array.isArray(a) && b == null) || (Array.isArray(a) && Array.isArray(b) && (a[0] != b[0] || a[1] != b[1])) || lastMouseSize != mouseSize) {
    //         if (outOfBounds(mousePos.x, mousePos.y)) {
    //             gameHandler.room.sendMessage(Packet.GSClientState, {
    //                 state: {
    //                     mousePos: null,
    //                     mouseSize
    //                 }
    //             })
    //             lastMousePos = null;
    //             lastMouseSize = mouseSize;
    //         } else {
    //             gameHandler.room.sendMessage(Packet.GSClientState, {
    //                 state: {
    //                     mousePos: [mousePos.x, mousePos.y],
    //                     mouseSize
    //                 }
    //             })
    //             lastMousePos = [mousePos.x, mousePos.y];
    //             lastMouseSize = mouseSize;
    //         }
    //     }
    //     return true;
    // }
    
    
    isEmpty = (x, y, ignoreBounds=false, oob=undefined) => {
        if (oob || outOfBounds(x,y)) {
            return ignoreBounds;
        }
        return !gameHandler.room.pixels.find(a => a.x == x && a.y == y);
    }
    
    Pixel = function(x, y, element) {
        gameHandler.room.placePixel(element, x, y);
        return new oldConstructor(x, y, element);
    }
    Pixel.prototype = oldProto;
    Pixel.prototype.constructor = Pixel;
    
    updateStats = () => {
        var statsDiv = document.getElementById("stats");
        var stats = "<span id='stat-pos' class='stat'>x"+mousePos.x+",y"+mousePos.y+"</span>";
        stats += "<span id='stat-pixels' class='stat"+ (gameHandler.room.pixels.length >= maxPixelCount ? " redText" : "") +"'>Pxls:" + currentPixels.length+"</span>";
        stats += "<span id='stat-tps' class='stat'>" + gameHandler.room.tps +"tps</span>";
        stats += "<span id='stat-ticks' class='stat'>" + gameHandler.room.ticks +"</span>";
        if ((typeof pixelMap).length === 9) { return; }
        if (pixelMap[mousePos.x] !== undefined) {
            var currentPixel = gameHandler.room.pixels.find(a => a.x == mousePos.x && a.y == mousePos.y);
            if (currentPixel !== undefined) {
                stats += "<span id='stat-element' class='stat'>Elem:" + currentPixel.element.toUpperCase() + "</span>";
                stats += "<span id='stat-temperature' class='stat'>Temp:"+formatTemp(currentPixel.temp)+"</span>";
                if (currentPixel.charge) {
                    stats += "<span id='stat-charge' class='stat'>C"+currentPixel.charge+"</span>";
                }
                if (currentPixel.burning) {
                    stats += "<span id='stat-burning' class='stat'>Burning</span>";
                }
                if (elements[currentPixel.element].hoverStat) {
                    stats += "<span id='stat-hover' class='stat'>"+elements[currentPixel.element].hoverStat(currentPixel).replaceAll("<","&lt;")+"</span>";
                }
                else if (currentPixel.clone) {
                    stats += "<span id='stat-clone' class='stat'>"+currentPixel.clone.toUpperCase().replaceAll("<","&lt;")+"</span>";
                }
                else if (currentPixel.con && currentPixel.con.element) {
                    stats += "<span id='stat-clone' class='stat'>"+currentPixel.con.element.toUpperCase().replaceAll("<","&lt;")+"</span>";
                }
            }
        }
        if (shiftDown) {
            stats += "<span id='stat-shift' class='stat'>"+shiftDownTypes[shiftDown]+"</span>";
        }
        // If the view is not null, show the view in all caps
        if (view !== null) {
            stats += "<span id='stat-view' class='stat'>"+viewKey[view]+"</span>";
        }
        statsDiv.innerHTML = stats;
    }
    
    mouse1Action = (e,mouseX=undefined,mouseY=undefined,startPos) => {
        if (currentElement === "erase") { mouse2Action(e,mouseX,mouseY); return; }
        else if (currentElement === "pick") { mouseMiddleAction(e,mouseX,mouseY); return; }
        // If x and y are undefined, get the mouse position
        if (mouseX == undefined && mouseY == undefined) {
            // var canvas = document.getElementById("game");
            // var ctx = canvas.getContext("2d");
            lastPos = mousePos;
            mousePos = getMousePos(canvas, e);
            var mouseX = mousePos.x;
            var mouseY = mousePos.y;
        }
        var cooldowned = false;
        if ((mouseSize===1 || elements[currentElement].maxSize===1) && elements[currentElement].cooldown) {
            if (pixelTicks-lastPlace < elements[currentElement].cooldown) {
                return;
            }
            cooldowned = true;
        }
        lastPlace = pixelTicks;
        startPos = startPos || lastPos
        if (!((cooldowned && startPos.x===lastPos.x && startPos.y===lastPos.y) || ((elements[currentElement].tool || elements[currentElement].category==="tools") && !elements[currentElement].canPlace))) {
            var coords = lineCoords(startPos.x,startPos.y,mouseX,mouseY);
        }
        else { var coords = mouseRange(mouseX,mouseY); }
        var element = elements[currentElement];
        var mixList = [];
        // For each x,y in coords
        for (var i = 0; i < coords.length; i++) {
            var x = coords[i][0];
            var y = coords[i][1];

            if (currentElement === "mix") {
                if (!isEmpty(x,y,true)) {
                    var pixel = pixelMap[x][y];
                    if (!(elements[pixel.element].movable !== true || elements[pixel.element].noMix === true) || shiftDown) {
                        mixList.push(pixel);
                    }
                }
            }
            else if (currentElement === "shock") {
                if (!isEmpty(x,y,true)) {
                    // One loop that repeats 5 times if shiftDown else 1 time
                    for (var j = 0; j < (shiftDown ? 5 : 1); j++) {
                        var pixel = pixelMap[x][y];
                        var con = elements[pixel.element].conduct;
                        if (con == undefined) {continue}
                        if (Math.random() < con) { // If random number is less than conductivity
                            if (!pixel.charge && !pixel.chargeCD) {
                                pixel.charge = 1;
                                if (elements[pixel.element].colorOn) {
                                    pixel.color = pixelColorPick(pixel);
                                }
                            }
                        }
                        else if (elements[pixel.element].insulate != true) { // Otherwise heat the pixel (Resistance simulation)
                            pixel.temp += 0.25;
                            pixelTempCheck(pixel);
                        }
                    }
                }
            }
            else if (currentElement === "random" && isEmpty(x, y)) {
                // create pixel with random element from "randomChoices" array
                currentPixels.push(new Pixel(x, y, randomChoices[Math.floor(Math.random() * randomChoices.length)]));
            }
            else if (mode === "replace" && (!elements[currentElement].tool || elements[currentElement].canPlace)) {
                if (outOfBounds(x,y)) {
                    continue;
                }
                // Remove pixel at position from currentPixels
                var index = currentPixels.indexOf(pixelMap[x][y]);
                if (index > -1) {
                    currentPixels.splice(index, 1);
                }
                if (currentElement == "random") {
                    currentPixels.push(new Pixel(x, y, randomChoices[Math.floor(Math.random() * randomChoices.length)]));
                }
                else {
                    currentPixels.push(new Pixel(x, y, currentElement));
                }
                if (elements[currentElement].customColor || elements[currentElement].singleColor) {
                    pixelMap[x][y].color = pixelColorPick(currentElement,currentColor);
                }
                if (currentElementProp) {
                    for (var key in currentElementProp) {
                        pixelMap[x][y][key] = currentElementProp[key]
                    }
                }
            }
            else if (elements[currentElement].tool && !(elements[currentElement].canPlace && isEmpty(x,y))) {
                // run the tool function on the pixel
                if (!isEmpty(x,y,true)) {
                    var pixel = pixelMap[x][y];
                    // if the current element has an ignore property and the pixel's element is in the ignore property, don't do anything
                    if (elements[currentElement].ignore && elements[currentElement].ignore.indexOf(pixel.element) != -1) {
                        continue;
                    }
                    elements[currentElement].tool(pixel);
                }
            }
            else if (isEmpty(x, y) && currentPixels.length < maxPixelCount) {
                currentPixels.push(new Pixel(x, y, currentElement));
                if (elements[currentElement].customColor || elements[currentElement].singleColor) {
                    pixelMap[x][y].color = pixelColorPick(currentElement,currentColor);
                }
                if (currentElementProp) {
                    for (var key in currentElementProp) {
                        pixelMap[x][y][key] = currentElementProp[key]
                    }
                }
            }
        }
        if (currentElement === "mix") {
            // 1. repeat for each pixel in mixList
            // 2. choose 2 random pixels and swap their x and y
            // 3. remove pixel from mixList
            for (var i = 0; i < mixList.length; i++) {
                var pixel1 = mixList[Math.floor(Math.random()*mixList.length)];
                var pixel2 = mixList[Math.floor(Math.random()*mixList.length)];
                swapPixels(pixel1,pixel2);
                mixList.splice(mixList.indexOf(pixel1),1);
                mixList.splice(mixList.indexOf(pixel2),1);
                if (elements[pixel1.element].onMix) {
                    elements[pixel1.element].onMix(pixel1,pixel2);
                }
                if (elements[pixel2.element].onMix) {
                    elements[pixel2.element].onMix(pixel2,pixel1);
                }
            }

        }
    }

    mouse2Action = (e,mouseX=undefined,mouseY=undefined,startPos) => {
        // Erase pixel at mouse position
        if (mouseX == undefined && mouseY == undefined) {
            // var canvas = document.getElementById("game");
            // var ctx = canvas.getContext("2d");
            lastPos = mousePos;
            mousePos = getMousePos(canvas, e);
            var mouseX = mousePos.x;
            var mouseY = mousePos.y;
        }
        if (dragStart !== null) {
            dragStart = null;
            for (var i = 0; i < draggingPixels.length; i++) {
                var pixel = draggingPixels[i];
                delete pixel.drag;
            }
            draggingPixels = null;
        }
        // If the current element is "pick" or "lookup", coords = [mouseX,mouseY]
        if (currentElement == "pick" || currentElement == "lookup") {
            var coords = [[mouseX,mouseY]];
        }
        else if (!isMobile) {
            startPos = startPos || lastPos
            var coords = lineCoords(startPos.x,startPos.y,mouseX,mouseY);
        }
        else {
            var coords = mouseRange(mouseX,mouseY);
        }
        if (!gameHandler.connected || !gameHandler.room.identified) return;
        let pixels = coords.filter(a => gameHandler.room.pixels.find(b => b.x == a[0] && b.y == a[1]))
        if (pixels.length > 0) gameHandler.room.sendMessage(Packet.GSDelete, {pixels: pixels.map(a => ({x: a[0], y: a[1]}))});
    }
    
    createElementButton = (elementName, color, category, darkText) => {
        if (!color) return;
        var button = document.createElement("button");
        // if the element has the attribute "name", use that as the button's text, otherwise use the element with underscores replaced by spaces
        var name = elementName;
        // button.innerHTML = name.replace(/_/g, " ").replace(".","   ").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}).replace("   ",".").replace(/ /g, "");
        var str = name.replace(/_./g, function (match) {return match.toUpperCase();}).replace(/_/g, '');
        str = str.charAt(0).toUpperCase() + str.slice(1);
        button.innerHTML = str;
        //set attribute of element to the element
        button.setAttribute("element", elementName);
        button.setAttribute("current", "false");
        button.className = "elementButton";
        //color of the element
        // if the element color is an array, make a gradient background color, otherwise, set the background color to the element color
        if (color instanceof Array) {
            if (color.length === 1) { button.style.background = color; }
            else { button.style.backgroundImage = "linear-gradient(to bottom right, "+color.join(", ")+")"; }
            // choose the middlemost item in array
            const color2 = color[Math.floor(color.length / 2)];
            const [r, g, b] = color2.replace(/[rgb\(\)]/g, "").split(",").map(a => parseInt(a.trim()))
            if (darkText !== false && (darkText || (r + g + b) / 3 > 200)) {
                button.className += " bright"
            }
        }
        else {
            button.style.background = color;
            const [r, g, b] = color.replace(/[rgb\(\)]/g, "").split(",").map(a => parseInt(a.trim()))
            if (darkText !== false && (darkText || (r + g + b) / 3 > 200)) {
                button.className += " bright"
            }
        }
        button.id = "elementButton-" + elementName;
        button.onclick = handleElementButtonClick;
        // on right click, show the element's info
        button.oncontextmenu = function(e) {
            e.preventDefault();
            closeMenu();
            showInfo(this.getAttribute("element"));
        }
        if (!category) {
            category = "other";
        }
        var categoryDiv = document.getElementById("category-"+category);
        if (categoryDiv === null) {
            createCategoryDiv(category);
            categoryDiv = document.getElementById("category-"+category);
            categoryDiv.style.display = "none";
        }
        categoryDiv.appendChild(button);
    }

    createPixel = () => {};
    tickPixels = () => {};

    window.clearInterval(renderInterval);
    renderInterval = window.setInterval(drawLayers, 1000/60);
}

function returnGameFunctions() {
    drawPixels = oldDrawPixels;
    isEmpty = oldIsEmpty;
    Pixel = oldPixel;
    Pixel.prototype = oldProto;
    Pixel.prototype.constructor = oldConstructor;
    updateStats = oldUpdateStats;
    mouse2Action = oldMouse2Action;
    createElementButton = oldCreateElementButton;
    createPixel = oldCreatePixel;
    tickPixels = oldTickPixels;
    clearAll(false);
    drawLayers = oldDrawLayers;
    document.querySelectorAll(".elementButton").forEach(a => a.remove());
    for (var element in elements) {
        if (elementCount === 0) { currentElement = element; firstElement = element }
        elementCount++;
        if (settings.cheerful && elements[element].nocheer) {
            elements[element].hidden = true;
            hiddenCount++;
            continue;
        }
        if (element === "unknown") {continue;}
        var category = elements[element].category;
        if (category==null) {category="other"}
        if (categoryList.indexOf(category) === -1) {
            categoryList.push(category);
        }
        if (elements[element].hidden && (!settings["unhide"] || ( settings["unhide"]===2 && !settings.unlocked[element] ))) { hiddenCount++; continue; }
        var categoryDiv = document.getElementById("category-"+category);
        if (categoryDiv == null) {
            createCategoryDiv(category);
            categoryDiv = document.getElementById("category-"+category);
        }
        createElementButton(element);
    }

    window.clearInterval(renderInterval);
    renderInterval = window.setInterval(drawLayers, 1000/60);
}
