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
    SCClosed: 20,
    CCMessageDelete: 21,
    IOInput: 22,
    IOInputRequest: 23,
    IOOutput: 24
}

const GlobalUserPermissions = {
    DEV: 0,
    ADMIN: 1,
    MOD: 2,
    USER: 3,
    MUTED: 4,
    BANNED: 5
}

const GUPShapes = [
    "unknwon",
    "mallet",
    "sword",
    "",
    "speaker",
    "x_sharp"
]

const LocalUserPermissions = {
    OPERATOR: 0,
    USER: 1,
    MUTED: 2,
    BANNED: 3
}

const LUPShapes = [
    "sword",
    "",
    "speaker",
    "x_sharp"
]

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
        gameHandler.room.sendMessage(BinaryPacket
            .header(Packet.CSChatMessage)
            .string(content)
            .getBuffer()
        );
    }
    
    generateMessageElement(message, checkForPrevious = true, previousMessageType = ChatMessageType.MESSAGE) {
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
        if (LUPShapes[message.permissionLevel]?.length == 0) {
            const img = document.createElement("img");
            img.width = 16;
            img.heigth = 16;
            img.src = `https://r74n.com/shapes/png/${LUPShapes[message.permissionLevel]}.png`;
            messageAuthor.appendChild(img);
        }
        const messageContent = document.createElement("h6");
        messageContent.style.marginTop = 0;
        messageContent.style.marginBottom = 0;
        messageContent.textContent = message.content;
        if (checkForPrevious && previous?.author == message.author && previous.messageType == previousMessageType) messageElement.append(messageContent);
        else messageElement.append(messageAuthor, messageContent);
        return messageElement;
    }

    handleMessage(message, init) {
        if (!init && !this.initialized) return;
        this.messages.set(message.id, message);
        if (message.messageType == ChatMessageType.MESSAGE) {
            const messageElement = this.generateMessageElement(message)
            document.getElementById("messageList").appendChild(messageElement);
        } 
        else if (message.messageType == ChatMessageType.LEAVE) this.playerLeft(message);
        else if (message.messageType == ChatMessageType.JOIN) this.playerJoined(message);
        else if (message.messageType == ChatMessageType.SYSTEM) this.systemMessage(message.content);
        else if (message.messageType == ChatMessageType.DISCORD) {
            const messageElement = this.generateMessageElement(message, true, ChatMessageType.DISCORD);
            // const previous = this.getPrevious(message.createdAt);
            // const messageElement = document.createElement("div");
            // messageElement.id = message.id;
            // const messageAuthor = document.createElement("h5");
            // messageAuthor.style.marginBottom = "5px";
            // messageAuthor.style.marginTop = 0;
            // messageAuthor.textContent = `Discord > ${message.authorUsername}`;
            // const color = message.authorColor;
            // messageAuthor.style.background = `linear-gradient(to right, ${color.length == 1 ? `${color}, ${color}` : color.join(", ")})`;
            // messageAuthor.style.backgroundClip = "text";
            // messageAuthor.style.webkitTextFillColor = "transparent";
            // const messageContent = document.createElement("h6");
            // messageContent.style.marginTop = 0;
            // messageContent.style.marginBottom = 0;
            // messageContent.textContent = message.content;
            // if (previous?.author == message.author && previous.messageType == ChatMessageType.DISCORD) messageElement.append(messageContent);
            // else messageElement.append(messageAuthor, messageContent);
            document.getElementById("messageList").appendChild(messageElement);
        }
        document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
    }

    getPrevious(createdAt) {
        return Array.from(this.messages.values()).filter(a => a.createdAt < createdAt).sort((a, b) => b.createdAt - a.createdAt)[0];
    }

    initialize(messages) {
        for (const message of messages) {
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

    deleteMessage(messageID) {
        document.getElementById(messageID).remove();
        this.messages.delete(messageID);
    }
}

let averageTPS = 0;
let times = 0;
let total = 0;

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
        socket.onmessage = async (ev) => {
            this.onMessage(await ev.data.arrayBuffer());
        }
        socket.onclose = () => {
            gameHandler.disconnect();
        }
    }

    sendMessageJSON(type, message) {
        if (gameHandler.connected) this.socket.send(JSON.stringify({type, ...message}));
        // console.log(`Sent ${type} packet with ${JSON.stringify(message)} message`);
    }

    sendMessage(buffer) {
        if (gameHandler.connected) this.socket.send(buffer);
    }

    async identify(id) {
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
        this.sendMessage(BinaryPacket.header(Packet.SSIdentify).string(accessToken).getBuffer());
        this.id = id;
        this.name = sessionHandler.user.username;
        this.color = sessionHandler.user.color;
        this.clients.clear();
    }

    disconnect() {
        this.sendMessage(BinaryPacket.header(Packet.SSDisconnect).getBuffer());
        this.socket.close();
    }

    playerJoined(client) {
        this.clients.set(client.id, client);
        const playerItem = document.createElement("li");
        const playerName = document.createElement("h5");
        playerName.textContent = client.username;
        playerName.style.color = client.color;
        playerName.style.marginTop = 0;
        playerName.style.marginBottom = 0;
        playerItem.id = `playerItem-${client.id}`;
        playerItem.append(playerName);
        document.getElementById("playerList").append(playerItem);
        document.getElementById("playersOnlineChat").innerText = `Players online: ${this.clients.size}/${this.config?.maxPlayers ?? 20}`;
    }

    playerLeft(client) {
        this.clients.delete(client.id);
        document.getElementById(`playerItem-${client.id}`).remove();
        document.getElementById("playersOnlineChat").innerText = `Players online: ${this.clients.size}/${this.config?.maxPlayers ?? 20}`;
    }

    heartbeat() {
        this.sendMessage(BinaryPacket.header(Packet.SSHeartbeat).getBuffer());
    }

    playerUpdated(client) {
        this.clients.set(client.id, client);
    }

    gameStateUpdate(state) {
        this.pixels = decodePixels(Array.from(new Uint8Array(state.pixels)));
        this.ticks = state.tick;
        this.mousePositions = state.mousePositions.filter(a => a.position);
        this.tpsCount++;
        if (this.lastCheck + 1000 < Date.now()) {
            this.tps = this.tpsCount;
            total += this.tps;
            times++;
            averageTPS = total / times;
            this.lastCheck = Date.now();
            this.tpsCount = 0;
        }
    }

    gameInit(game) {
        this.settings = game.settings;
        this.elements = game.elements;
        this.width = game.width;
        this.height = game.height;
        this.identified = true;
        for (const element of this.elements) {
            createElementButton(element.name, element.color, element.category, element.darkText);
            if (!elements[element.name]) {
                elements[element.name] = element;
                elements[element.name].removeAfterDisconnect = true;
                if (element.isTool) elements[element.name].tool = (pixel) => {};
            }
        }
        elements.debug.cooldown = 15;
    }

    gamePlayersInit(players) {
        this.clients.clear();
        for (const player of players) {
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
        document.getElementById("playersOnlineChat").className = "playersOnlineChatHover";
    }

    onMessage(buffer) {
        decodePacket(buffer, this);
    }

    onMessageJSON(message) {
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
                const pixel = message.pixel;
                if (!pixel) return;
                let output = pixel.element.toUpperCase()+" at x"+pixel.x+", y"+pixel.y+", tick"+pixelTicks+"\n";
                for (const i in pixel) {
                    if (i !== "x" && i !== "y" && i !== "element") {
                        output += "  " + i + ": " + pixel[i] + "\n";
                    }
                }
                console.log(output);
                console.log(JSON.stringify(pixel));
                alert(output);
                break;
            case Packet.SCClosed:
                console.log(message);
                displayDisconnectMessage(message.reason, message.message);
                this.disconnect();
                break;
            case Packet.CCMessageDelete:
                this.chatHandler.deleteMessage(message.id);
                break;
            case Packet.IOInputRequest:
                const result = prompt(message.message);
                this.sendMessage(BinaryPacket
                        .header(Packet.IOInput)
                        .string(message.from)
                        .string(result)
                        .getBuffer()
                )
                break;
            case Packet.IOOutput:
                if (message.message) {
                    if (log) logMessage(message.message);
                    else alert(message.message)
                }
        }
    }

    placePixel(element, coords) {
        if (!this.identified || coords.length == 0) return;
        this.sendMessage(BinaryPacket
            .header(Packet.GSPlace)
            .string(element)
            .boolean(mode == "replace")
            .bufferArray(coords.map(a => {
                const b = new BinaryPacket()
                    .number(a[0])
                    .number(a[1])
                    .getBuffer();
                return b;
            }))
            .getBuffer()
        )
    }

    useTool(tool, coords) {
        if (!this.identified) return;
        this.sendMessage(BinaryPacket
            .header(Packet.GSToolUse)
            .string(tool)
            .bufferArray(coords.map(a => {
                const b = new BinaryPacket()
                    .number(a[0])
                    .number(a[1])
                    .getBuffer();
                return b;
            }))
            .getBuffer()
        );
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
        if (document.getElementById("betterMenuScreens_chatButton")) 
            document.getElementById("betterMenuScreens_chatButton").style.display = "block";
        if (document.getElementById("betterMenuScreens_playersButton"))
            document.getElementById("betterMenuScreens_playersButton").style.display = "block";
    }

    disconnect() {
        this.connected = false;
        this.room.disconnect();
        this.room = null;
        this.server = null;
        returnGameFunctions();
        if (document.getElementById("betterMenuScreens_chatButton"))
            document.getElementById("betterMenuScreens_chatButton").style.display = "none";
        if (document.getElementById("betterMenuScreens_playersButton"))
            document.getElementById("betterMenuScreens_playersButton").style.display = "none";
        if (document.getElementById("playersOnlineChat")) {
            document.getElementById("playersOnlineChat").innerText = `You are not connected`;
            document.getElementById("playersOnlineChat").className = "";
        }
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
    "alpha": ["number", 3],
    "element": ["string", 4], 
    "temp": ["number", 5], 
    "charge": ["number", 6], 
    "burning": ["boolean", 7], 
    "clone": ["string", 8]
}

function decodePixel(array, i=0) {
    let index = i;
    let pixel = {};
    while (index < array.length) {
        const current = array[index++];
        if (current == 0xff || (current == 0x00 && index >= array.length)) return [pixel, index];
        const key = Object.keys(PIXEL_BASE_PROPERTIES).find(a => PIXEL_BASE_PROPERTIES[a][1] == current);
        if (pixel[key]) {
            index--;
            return [pixel, index];
        }
        const prop = PIXEL_BASE_PROPERTIES[key];
        if (prop[0] == "number") {
            const value = array[index++] << 24 | array[index++] << 16 | array[index++] << 8 | array[index++];
            pixel[key] = value;
        } else if (prop[0] == "color") {
            const [r, g, b, a] = [array[index++], array[index++], array[index++], array[index++]];
            pixel[key] = `rgb(${r},${g},${b},${a})`;
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

/// HTML STUFF
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
    chatNote.onclick = () => {
        if (gameHandler.connected) openMenu("players", true);
    }
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
    style.innerHTML = `#chatMessage { position: absolute; bottom: 59.4%; width: 95%; max-width: 700px; height: 50px; left: 50%; transform: translate(-50%, 198.5%); background-color: rgb(66, 66, 66); color: white; font-size: 1.5em; padding: 8px; font-family: 'Press Start 2P'; z-index: 11; }\n#messageList {margin-left: 0; max-height: 20%; height: 20%; position: relative; margin-bottom: 50px}\n#chatMenuText {margin-bottom: 50px, padding-bottom: 50px;}\n#chat::-webkit-scrollbar {display: none}\n#chat {-ms-overflow-style: none; scrollbar-width: none;}\n.playersOnlineChatHover:hover {color: #505050}`
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

/// PROTOCOL
class BinaryPacket {
    constructor () {
        this.buffer = new ArrayBuffer(0);
    }

    static header(type) {
        const buffer = new ArrayBuffer(1);
        const view = new DataView(buffer);
        view.setInt8(0, type);
        const instance = new BinaryPacket();
        instance.buffer = buffer;
        return instance;
    }

    string(s) {
        const textEncoder = new TextEncoder();
        const stringBuffer = textEncoder.encode(s);
        const length = stringBuffer.byteLength;
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setInt32(0, length);
        this.concat(buffer);
        this.concat(stringBuffer);
        return this;
    }

    number(n) {
        const buffer = new ArrayBuffer(8);
        const view = new DataView(buffer);
        view.setFloat64(0, n);
        this.concat(buffer);
        return this;
    }

    boolean(b) {
        const buffer = new ArrayBuffer(1);
        const view = new DataView(buffer);
        view.setUint8(0, b ? 0xff : 0);
        this.concat(buffer);
        return this;
    }

    array(a) {
        const array = a.filter(a => ["boolean", "number", "string"].includes(typeof a));
        if (array.length > 0xFFFF) throw "Too long!";
        const buffer = new ArrayBuffer(2);
        const view = new DataView(buffer);
        view.setUint16(0, array.length);
        this.concat(buffer);
        array.forEach(element => {
            const bufferInner = new ArrayBuffer(5);
            const view = new DataView(bufferInner);
            switch (typeof element) {
                case "boolean":
                    view.setUint8(0, 0);
                    view.setInt32(1, 1);
                    this.concat(bufferInner);
                    this.boolean(element);
                    break;
                case "number":
                    view.setUint8(0, 1);
                    view.setInt32(1, 8);
                    this.concat(bufferInner);
                    this.number(element);
                    break;
                case "string":
                    view.setUint8(0, 2);
                    view.setInt32(1, 4 + element.length);
                    this.concat(bufferInner);
                    this.string(element);
                    break;

            }
        })
        return this;
    }

    bufferArray(a) {
        if (a.length > 0xFFFF) throw "Too long!";
        const buffer = new ArrayBuffer(2);
        const view = new DataView(buffer);
        view.setUint16(0, a.length);
        this.concat(buffer);
        a.forEach(element => {
            const bufferInner = new ArrayBuffer(5);
            const view2 = new DataView(bufferInner);
            view2.setUint8(0, 3);
            view2.setInt32(1, element.byteLength);
            this.concat(bufferInner);
            this.concat(element);
        })
        return this;
    }

    enum(obj) {
        const buffer = new ArrayBuffer(4);
        const view = new DataView(buffer);
        view.setUint32(0, Object.keys(obj).length);
        this.concat(buffer);
        for (const key in obj) {
            const num = obj[key];
            const keyBuffer = new Uint32Array(2);
            keyBuffer.set([num, key.length]);
            this.concat(keyBuffer);
            this.concat(key);
        }
        return this;
    }

    concat(buffer) {
        const tempBuffer = new Uint8Array(this.buffer.byteLength + buffer.byteLength);
        tempBuffer.set(new Uint8Array(this.buffer), 0);
        tempBuffer.set(new Uint8Array(buffer), this.buffer.byteLength);
        this.buffer = tempBuffer;
        return this;
    }

    getBuffer() {
        return this.buffer;
    }
}

class BinaryDecoder {
    constructor (buffer, skipType = true) {
        this.offset = skipType ? 1 : 0;
        this.buffer = buffer;
        this.view = new DataView(buffer);
    }

    double() {
       const d = this.view.getFloat64(this.offset);
       this.offset += 8;
       return d; 
    }

    uint8() {
        const i = this.view.getUint8(this.offset);
        this.offset += 1;
        return i;
    }

    int8() {
        const i = this.view.getInt8(this.offset);
        this.offset += 1;
        return i;
    }

    uint16() {
        const i = this.view.getUint16(this.offset);
        this.offset += 2;
        return i;
    }

    int32() {
        const i = this.view.getInt32(this.offset);
        this.offset += 4;
        return i;
    }

    uint32() {
        const i = this.view.getUint32(this.offset);
        this.offset += 4;
        return i;
    }

    string() {
        const length = this.int32();
        const textDecoder = new TextDecoder("utf-8");
        const s = textDecoder.decode(this.buffer.slice(this.offset, this.offset + length));
        this.offset += length;
        return s;
    }

    boolean() {
        const b = this.view.getUint8() == 0xff;
        this.offset += 1;
        return b;
    }

    array() {
        const length = this.uint16();
        const a = [];
        while (a.length < length) {
            const type = this.uint8();
            const length = this.int32();
            switch (type) {
                case 0:
                    a.push(this.boolean());
                    break;
                case 1:
                    a.push(this.double());
                    break;
                case 2:
                    a.push(this.string());
                    break;
                case 3:
                    a.push(this.buffer.slice(this.offset, this.offset + length));
                    this.offset += length;
                    break;
            }
        }
        return a;
    }

    obj() {
        const length = this.uint32();
        const o = {};
        for (let i = 0; i < length; i++) {
            const key = this.string();
            const valType = this.uint8();
            switch (valType) {
                case 0:
                    o[key] = this.boolean();
                    break;
                case 1:
                    o[key] = this.double();
                    break;
                case 2:
                    o[key] = this.string();
                    break;
                case 3:
                    const length = this.uint32();
                    o[key] = this.buffer.slice(this.offset, this.offset + length);
                    this.offset += length;
                    break;
                case 4:
                    o[key] = this.array();
                    break;
            }
        }
        return o;
    }
}

function bufferToChatMessage(b, skip = false) {
    const decoder = new BinaryDecoder(b, skip);
    return {
        createdAt: decoder.double(),
        author: decoder.string(),
        authorColor: decoder.array(),
        authorUsername: decoder.string(),
        content: decoder.string(),
        id: decoder.string(),
        messageType: decoder.double(),
        permissionLevel: decoder.double(),
        reason: decoder.double()
    }
}
function clientToBuffer(c) {
    return new BinaryPacket()
        .string(c.id)
        .string(c.username ?? "Anonymous")
        .number(c.joinedAt ?? 0)
        .array(c.color ?? ["#ffffff"])
        .getBuffer();
}

function bufferToClient(b, skip = false) {
    const decoder = new BinaryDecoder(b, skip);
    return {
        id: decoder.string(),
        username: decoder.string(),
        joinedAt: decoder.double(),
        color: decoder.array()
    }
}

/**
 * 
 * @param {Buffer} buffer 
 * @param {ServerHandler} server 
 */
function decodePacket(buffer, server) {
    const decoder = new BinaryDecoder(buffer, false);
    const type = decoder.int8();
    switch (type) {
        case Packet.SCIdentify: {
            server.identify(decoder.string());
            break;
        }
        case Packet.SCClientJoin: {
            server.playerJoined(bufferToClient(buffer, true));
            break;
        }
        case Packet.SCClientLeave: {
            server.playerLeft(bufferToClient(buffer, true));
            break;
        }
        case Packet.SCHeartbeat: {
            server.heartbeat();
            break;
        }
        case Packet.SCClientUpdate: {
            server.playerUpdated(bufferToClient(buffer, true));
            break;
        }
        case Packet.GCGameState: {
            const tick = decoder.double();
            const length = decoder.double();
            const pixels = decoder.buffer.slice(decoder.offset, decoder.offset + length);
            decoder.offset += length;
            const mousePositions = decoder.array().map(b => {
                const innerDecoder = new BinaryDecoder(b, false);
                const posX = innerDecoder.double();
                const posY = innerDecoder.double();
                const size = innerDecoder.double();
                const player = innerDecoder.string();
                return {
                    position: [posX, posY],
                    size,
                    player
                }
            });
            server.gameStateUpdate({
                tick,
                pixels,
                mousePositions
            })
            break;
        }
        case Packet.GCGamePlayers: {
            server.gamePlayersInit(decoder.array().map(b => bufferToClient(b)));
            break;
        }
        case Packet.GCGameInit: {
            server.gameInit({
                width: decoder.double(),
                height: decoder.double(),
                elements: decoder.array().map(b => {
                    const innerDecoder = new BinaryDecoder(b, false);
                    return {
                        name: innerDecoder.string(),
                        category: innerDecoder.string(),
                        isTool: innerDecoder.boolean(),
                        darkText: innerDecoder.boolean(),
                        color: innerDecoder.array()
                    }
                })
            });
            break;
        }
        case Packet.CCChatMessage: {
            server.chatHandler.handleMessage(bufferToChatMessage(buffer, true), false);
            break;
        }
        case Packet.CCChatInit: {
            server.chatHandler.initialize(decoder.array().map(b => bufferToChatMessage(b)));
            break;
        }
        case Packet.GCDebug: {
            const pixel = {
                x: decoder.double(),
                y: decoder.double(),
                element: decoder.string(),
                color: decoder.string(),
                start: decoder.double(),
                ...decoder.obj()
            };
            let output = pixel.element.toUpperCase() + " at x" + pixel.x + ", y" + pixel.y + ", tick" + server.ticks + "\n";
            for (const i in pixel) {
                if (i !== "x" && i !== "y" && i !== "element") {
                    output += "  " + i + ": " + pixel[i] + "\n";
                }
            }
            alert(output);
            break;
        }
        case Packet.SCClosed: {
            const reason = decoder.double();
            const message = decoder.string();
            displayDisconnectMessage(reason, message);
            server.disconnect();
            break;
        }
        case Packet.CCMessageDelete: {
            server.chatHandler.deleteMessage(decoder.string());
            break;
        }
        case Packet.IOInputRequest: {
            const from = decoder.string();
            const message = decoder.string();
            const result = prompt(message);
            server.sendMessage(BinaryPacket
                .header(Packet.IOInput)
                .string(from)
                .string(result)
                .getBuffer()
            );
            break;
        }
        case Packet.IOOutput: {
            const log = decoder.boolean();
            const message = decoder.string();
            if (log) logMessage(message);
            else alert(message)
            break;
        }
    }
}

/// FUNCTION HIJACKING, IGNORE
const oldDrawPixels = drawPixels;
const oldOutOfBounds = outOfBounds;
const oldIsEmpty = isEmpty;
const oldUpdateStats = updateStats;
const oldMouse2Action = mouse2Action;
const oldMouse1Action = mouse1Action;
const oldMouseMiddleAction = mouseMiddleAction;
const oldCreateElementButton = createElementButton;
const oldCreatePixel = createPixel;
const oldTickPixels = tickPixels;
const oldDrawLayers = drawLayers;
const oldClearLayers = clearLayers;

function overwriteGameFunctions() {
    const drawCursors = () => {
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
    }
    clearLayers = () => {
        const canvasLayerKeys = Object.keys(canvasLayers);
        for (let i = 0; i < canvasLayerKeys.length; i++) {
            const layerCanvas = canvasLayers[canvasLayerKeys[i]];
            const layerCtx = layerCanvas.getContext("2d");
            layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
        }
    }
    drawLayers = (includeBackground) => {
        if (ctx === null) return;
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
        drawCursors();
        for (let i = 0; i < canvasLayersPost.length; i++) {
            const layerCanvas = canvasLayersPost[i];
            ctx.drawImage(layerCanvas, 0, 0);
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
            if (!viewInfo[view]) {
                setView(1);
            }
            if (renderPrePixelList.length) {
                for (let i = 0; i < renderPrePixelList.length; i++) {
                    renderPrePixelList[i](ctx);
                }
            }
            if (viewInfo[view].pre) {
                viewInfo[view].pre(ctx);
            }
            if (viewInfo[view].pixel) {
                for (let i = 0; i < pixelDrawList.length; i++) {
                    let pixel = pixelDrawList[i];
                    if (elements[pixel.element].renderer && settings.textures !== 0) {
                        elements[pixel.element].renderer(pixel,ctx);
                    } else {
                        viewInfo[view].pixel(pixel,ctx);
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
            if (viewInfo[view].post) {
                viewInfo[view].post(ctx);
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
    

    tick = () => {
        if (mouseIsDown && !shaping) {
            mouseAction(null,mousePos.x,mousePos.y);
        }
        
        if (runEveryTickList.length) {
            for (let i = 0; i < runEveryTickList.length; i++) {
                runEveryTickList[i]();
            }
        }

        updateStats();

        if (!gameHandler.connected || !gameHandler.room?.identified) return;
        let a = outOfBounds(mousePos.x, mousePos.y) ? null : [mousePos.x, mousePos.y];
        let b = lastMousePos;
        if ((a == null && Array.isArray(b)) || (Array.isArray(a) && b == null) || (Array.isArray(a) && Array.isArray(b) && (a[0] != b[0] || a[1] != b[1])) || lastMouseSize != mouseSize) {
            if (outOfBounds(mousePos.x, mousePos.y)) {
                gameHandler.room.sendMessage(BinaryPacket
                    .header(Packet.GSClientState)
                    .boolean(false)
                    .number(mouseSize)
                    .boolean(!!shiftDown)
                    .string(currentColor)
                    .string(currentElement)
                    .getBuffer()
                )
                lastMousePos = null;
                lastMouseSize = mouseSize;
            } else {
                gameHandler.room.sendMessage(BinaryPacket
                    .header(Packet.GSClientState)
                    .boolean(true)
                    .number(mousePos.x)
                    .number(mousePos.y)
                    .number(mouseSize)
                    .boolean(!!shiftDown)
                    .string(currentColor)
                    .string(currentElement)
                    .getBuffer()
                )
                lastMousePos = [mousePos.x, mousePos.y];
                lastMouseSize = mouseSize;
            }
        }
    }
    outOfBounds = (x, y) => {
        // Returns true if the pixel is out of bounds
        return y > gameHandler.room.height - 1 || y < 1 || x > gameHandler.room.width - 1 || x < 1
    }
    
    isEmpty = (x, y, ignoreBounds=false, oob=undefined) => {
        if (oob || outOfBounds(x,y)) {
            return ignoreBounds;
        }
        return !gameHandler.room.pixels.find(a => a.x == x && a.y == y);
    }
    
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
            stats += "<span id='stat-view' class='stat'>"+(viewInfo[view] ? viewInfo[view].name : view)+"</span>";
        }
        statsDiv.innerHTML = stats;
    }
    
    mouse1Action = (e,mouseX=undefined,mouseY=undefined,startPos) => {
        if (currentElement === "erase") { mouse2Action(e,mouseX,mouseY); return; }
        else if (currentElement === "pick") { mouseMiddleAction(e,mouseX,mouseY); return; }

        if (mouseX == undefined && mouseY == undefined) {
            lastPos = mousePos;
            mousePos = getMousePos(canvas, e);
            var mouseX = mousePos.x;
            var mouseY = mousePos.y;
        }
        let cooldowned = false;
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
        } else { var coords = mouseRange(mouseX,mouseY); }
        const element = gameHandler.room.elements.find(e => e.name == currentElement);
        if (element.name == "rock_wall") {
            const [tool, element] = coords.reduce((acc, coord) => (acc[gameHandler.room.pixels.find(a => a.x == coord.x && a.y == coord.y) ? 0 : 1].push(coord), acc), [[], []]);
            gameHandler.room.useTool(currentElement, tool);
            gameHandler.room.placePixel(currentElement, element.filter(a => !gameHandler.room.pixels.find(b => b.x == a.x && b.y == a.y)));
        } else if (element.isTool) {
            gameHandler.room.useTool(currentElement, coords);
        } else {
            gameHandler.room.placePixel(currentElement, coords.filter(a => !gameHandler.room.pixels.find(b => b.x == a.x && b.y == a.y)));
        }
    }

    mouseMiddleAction = (e, mouseX, mouseY) => {
        if (mouseX == undefined && mouseY == undefined) {
            // var canvas = document.getElementById("game");
            // var ctx = canvas.getContext("2d");
            lastPos = mousePos;
            mousePos = getMousePos(canvas, e);
            var mouseX = mousePos.x;
            var mouseY = mousePos.y;
        }
        if (!outOfBounds(mouseX, mouseY) && e) { e.preventDefault(); }
        if (!isEmpty(mouseX, mouseY,true)) {
            var pixel = gameHandler.room.pixels.find(a => a.x == mouseX && a.y == mouseY);
            selectElement(pixel.element);
            selectCategory(elements[pixel.element].category);
            if (shiftDown) {
                currentElementProp = {};
                for (var key in pixel) { currentElementProp[key] = pixel[key] }
                delete currentElementProp.x;
                delete currentElementProp.y;
            }
            mouseIsDown = false;
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
        if (pixels.length > 0) {
            gameHandler.room.sendMessage(BinaryPacket
                .header(Packet.GSDelete)
                .bufferArray(pixels.map(a => {
                    const b = new BinaryPacket()
                        .number(a[0])
                        .number(a[1])
                        .getBuffer();
                    return b;
                }))
                .getBuffer());
        }
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
    resetInterval();
}

function returnGameFunctions() {
    drawPixels = oldDrawPixels;
    outOfBounds = oldOutOfBounds;
    isEmpty = oldIsEmpty;
    updateStats = oldUpdateStats;
    mouse2Action = oldMouse2Action;
    mouse1Action = oldMouse1Action;
    mouseMiddleAction = oldMouseMiddleAction;
    createElementButton = oldCreateElementButton;
    createPixel = oldCreatePixel;
    tickPixels = oldTickPixels;
    clearAll(false);
    drawLayers = oldDrawLayers;
    clearLayers = oldClearLayers;
    document.querySelectorAll(".elementButton").forEach(a => a.remove());
    for (var element in elements) {
        if (elements[element].removeAfterDisconnect) {
            delete elements[element];
            continue;
        }
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
    resetInterval();
}
