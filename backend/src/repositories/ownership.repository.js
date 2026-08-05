const prisma = require("../config/prisma");


// Create Ownership
const createOwnership = async (data) => {

    return await prisma.ownership.create({
        data
    });

};


// Get All Ownerships
const getOwnerships = async () => {

    return await prisma.ownership.findMany({

        include: {

            property: true,

            person: true

        }

    });

};


// Get Ownership By ID
const getOwnershipById = async (id) => {

    return await prisma.ownership.findUnique({

        where: {
            id: Number(id)
        },

        include: {

            property: true,

            person: true

        }

    });

};


// Update Ownership
const updateOwnership = async (id, data) => {

    return await prisma.ownership.update({

        where: {
            id: Number(id)
        },

        data

    });

};


// Delete Ownership
const deleteOwnership = async (id) => {

    return await prisma.ownership.delete({

        where: {
            id: Number(id)
        }

    });

};



module.exports = {

    createOwnership,

    getOwnerships,

    getOwnershipById,

    updateOwnership,

    deleteOwnership

};