const http = require("http");

const app = require("./app");

const config = require("./config");

const initializeSocket = require("./socket");

const server = http.createServer(app);

initializeSocket(server);

const PORT = config.app.port;

server.listen(PORT, () => {
    console.log(`${config.app.name} running on port ${PORT}`);
});
