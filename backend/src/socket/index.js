const { Server } = require("socket.io");

const { setIO } = require("./socket");

const residentSocket = require("./resident.socket");
const electionSocket = require("./election.socket");
const voteSocket = require("./vote.socket");
const dashboardSocket = require("./dashboard.socket");

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
        }
    });

    setIO(io);

    residentSocket(io);
    electionSocket(io);
    voteSocket(io);
    dashboardSocket(io);

    io.on("connection", (socket) => {
        console.log(`Client Connected: ${socket.id}`);

        socket.on("disconnect", () => {
            console.log(`Client Disconnected: ${socket.id}`);
        });
    });

    return io;
};

module.exports = initializeSocket;
