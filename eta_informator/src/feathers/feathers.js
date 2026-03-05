import feathersLatest from "feathers-latest";
import socketioLatest from "feathers-socketio-latest";
import ioLatest from "socketio-latest";
import feathers from "@feathersjs/feathers";
import socketio from "@feathersjs/socketio-client";
import io from "socket.io-client";
import auth from "@feathersjs/authentication-client";
//const feathers = require("@feathersjs/feathers");
//const socketio = require("@feathersjs/socketio-client");
//const io = require("socket.io-client");
//const auth = require("@feathersjs/authentication-client");

const socket = io(process.env.REACT_APP_INFORMATOR);
const sinaproSocket = io(process.env.REACT_APP_SINAPRO);
const spicaSocket = io(process.env.REACT_APP_SPICA);
const toolshopSocket = io(process.env.REACT_APP_EORODJARNA);
const dreamreportSocket = io(process.env.REACT_APP_DREAMREPORT);

const qualitySocker = ioLatest(process.env.REACT_APP_QUALITY);

//const socket = io('http://192.168.43.103:3030', {transports: ["websocket"]});
const client = feathers();
const sinapro = feathers();
const spica = feathers();
const toolshop = feathers();
const dreamreport = feathers();

const quality = feathersLatest();

// Informator API
client.configure(socketio(socket));
client.configure(
    auth({
        storageKey: "authToken",
        storage: window.sessionStorage,
        timeout: 10000,
    }),
);
client.service("mdocs-documentation").timeout = 50000;

// Sinapro API
sinapro.configure(
    socketio(sinaproSocket, {
        timeout: 20000,
    }),
);

sinapro.on("connect_error", () => {
    setTimeout(() => {
        socket.connect();
    }, 1000);
});

// Spica API
spica.configure(socketio(spicaSocket));

// eOrodjarna API
toolshop.configure(
    socketio(toolshopSocket, {
        timeout: 90000,
    }),
);

quality.configure(socketioLatest(qualitySocker));

dreamreport.configure(socketio(dreamreportSocket));

export default client;
export {
    sinapro as sinaproClient,
    spica as spicaClient,
    toolshop as toolshopClient,
    dreamreport as dreamreportClient,
    quality as qualityClient,
};
