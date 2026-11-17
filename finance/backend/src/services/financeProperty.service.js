const {
    mainBackendRequest,
} = require("../utils/mainBackendClient");


class FinancePropertyService {

    async getProperties(token) {

        const response =
            await mainBackendRequest(
                "/api/properties",
                token
            );


        return response;
    }

}


module.exports =
    new FinancePropertyService();