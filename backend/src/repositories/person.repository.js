const prisma = require("../config/prisma");

// Create
const createPerson = async (data) => {

    return await prisma.person.create({
        data
    });

};

// Get All
const getPersons = async () => {

    return await prisma.person.findMany({

        orderBy: {
            id: "asc"
        }

    });

};

// Get By ID
const getPersonById = async (id) => {

    return await prisma.person.findUnique({

        where: {
            id: Number(id)
        }

    });

};

// Update
const updatePerson = async (id, data) => {

    return await prisma.person.update({

        where: {
            id: Number(id)
        },

        data

    });

};

// Delete
const deletePerson = async (id) => {

    return await prisma.person.delete({

        where: {
            id: Number(id)
        }

    });

};

module.exports = {

    createPerson,
    getPersons,
    getPersonById,
    updatePerson,
    deletePerson

};