const registerVoteEvents = (io) => {
    io.on("connection", (socket) => {
        console.log(`Vote Socket Connected: ${socket.id}`);
    });
};

module.exports = registerVoteEvents;
