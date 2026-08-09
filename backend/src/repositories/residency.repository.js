
const prisma = require("../config/prisma");

// =====================
// Residency Include
// =====================

const residencyInclude = {

    property: {
        include: {
            complex: true
        }
    },

    person: true

};

// =====================
// Create Residency
// =====================

const createResidency = async (data) => {

    return await prisma.residency.create({

        data: {

            propertyId: data.propertyId,

            personId: data.personId,

            type: data.type,

            startDate: data.startDate,

            endDate: data.endDate

        },

        include: residencyInclude

    });

};

// =====================
// Get All Residencies
// =====================

const getResidencies = async () => {

    return await prisma.residency.findMany({

        include: residencyInclude,

        orderBy: {

            id: "asc"

        }

    });

};

// =====================
// Get Residency By ID
// =====================

const getResidencyById = async (id) => {

    return await prisma.residency.findUnique({

        where: {

            id

        },

        include: residencyInclude

    });

};

// =====================
// Update Residency
// =====================

const updateResidency = async (id, data) => {

    return await prisma.residency.update({

        where: {

            id

        },

        data,

        include: residencyInclude

    });

};

// =====================
// Delete Residency
// =====================

const deleteResidency = async (id) => {

    return await prisma.residency.delete({

        where: {

            id

        }

    });

};

// =====================
// Get Residents By Property
// =====================

const getResidentsByProperty = async (propertyId) => {

    return await prisma.residency.findMany({

        where: {

            propertyId

        },

        include: residencyInclude,

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
