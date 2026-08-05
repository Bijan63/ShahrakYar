const prisma = require("../config/prisma");


// Create Residency
const createResidency = async (data) => {

    return await prisma.residency.create({
        data
    });

};


// Get All Residencies
const getResidencies = async () => {

    return await prisma.residency.findMany({
        include: {
            property: true,
            person: true
        }
    });

};


// Get By ID
const getResidencyById = async (id) => {

    return await prisma.residency.findUnique({
        where: {
            id: Number(id)
        },
        include: {
            property: true,
            person: true
        }
    });

};


// Update
const updateResidency = async (id, data) => {

    return await prisma.residency.update({
        where: {
            id: Number(id)
        },
        data
    });

};


// Delete
const deleteResidency = async (id) => {

    return await prisma.residency.delete({
        where: {
            id: Number(id)
        }
    });

};


module.exports = {

    createResidency,
    getResidencies,
    getResidencyById,
    updateResidency,
    deleteResidency

};