const registerDashboardEvents = (io) => {
    io.on("connection", (socket) => {
        console.log(`Dashboard Socket Connected: ${socket.id}`);
    });
};

module.exports = registerDashboardEvents;
