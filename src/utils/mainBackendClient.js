const MAIN_BACKEND_URL =
    process.env.MAIN_BACKEND_URL || "http://localhost:5000";


async function mainBackendRequest(
    path,
    token
) {

    const response = await fetch(
        `${MAIN_BACKEND_URL}${path}`,
        {
            method: "GET",

            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Main Backend request failed"
        );

    }


    return data;
}


module.exports = {
    mainBackendRequest,
};