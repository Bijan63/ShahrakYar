const app = require("./app");

const config = require("./config");

const PORT = config.app.port;

app.listen(PORT, () => {

    console.log(
        `${config.app.name} running on port ${PORT}`
    );

});

