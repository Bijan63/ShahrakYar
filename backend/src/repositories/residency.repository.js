const prisma = require("../config/prisma");

// Create Residency
const createResidency = async (data) => {

    return await prisma.residency.create({

        data: {
            propertyId: Number(data.propertyId),
            personId: Number(data.personId),
            type: data.type,
            startDate: data.startDate,
            endDate: data.endDate
        },

        include: {
            property: true,
            person: true
        }
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

// Get Residency By ID
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

// Update Residency
const updateResidency = async (id, data) => {

    return await prisma.residency.update({
        where: {
            id: Number(id)
        },
        data,
        include: {
            property: true,
            person: true
        }
    });

};

// Delete Residency
const deleteResidency = async (id) => {

    return await prisma.residency.delete({
        where: {
            id: Number(id)
        }
    });

};

// Get Residents By Property
const getResidentsByProperty = async (propertyId) => {

    return await prisma.residency.findMany({

        where: {
            propertyId: Number(propertyId)
        },

        include: {
            property: true,
            person: true
        },

        orderBy: {
            id: "asc"
        }

    });

};

module.exports = {
    createResidency,
    getResidencies,
    getResidencyById,
    updateResidency,
    deleteResidency,
    getResidentsByProperty
};