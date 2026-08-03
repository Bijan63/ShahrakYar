const registerResidentEvents = (io) => {
    io.on("connection", (socket) => {
        console.log(`Resident Socket Connected: ${socket.id}`);
    });
};

module.exports = registerResidentEvents;
