const registerElectionEvents = (io) => {
    io.on("connection", (socket) => {
        console.log(`Election Socket Connected: ${socket.id}`);
    });
};

module.exports = registerElectionEvents;
