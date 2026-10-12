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
// Complex Scope
// =====================

const buildComplexScope = (complexIds) => {

    // ADMIN
    // null means no Complex scope restriction.
    if (complexIds === null) {

        return {};

    }


    // MANAGER / scoped access
    if (!Array.isArray(complexIds)) {

        throw new Error(
            "complexIds must be an array."
        );

    }


    return {

        property: {

            complexId: {

                in: complexIds

            }

        }

    };

};


// =====================
// Create Residency
// =====================

const createResidency = async (data) => {

    return prisma.residency.create({

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

const getResidencies = async (complexIds) => {

    return prisma.residency.findMany({

        where: buildComplexScope(complexIds),

        include: residencyInclude,

        orderBy: {
            id: "asc"
        }

    });

};


// =====================
// Get Residency By ID
// =====================

const getResidencyById = async (
    id,
    complexIds
) => {

    return prisma.residency.findFirst({

        where: {
            id,
            ...buildComplexScope(complexIds)
        },

        include: residencyInclude

    });

};


// =====================
// Find Active Residency
// =====================

const findActiveResidency = async (
    propertyId,
    personId,
    complexIds
) => {

    return prisma.residency.findFirst({

        where: {
            propertyId,
            personId,
            endDate: null,
            ...buildComplexScope(complexIds)
        },

        include: residencyInclude

    });

};


// =====================
// Find Another Active Residency
// =====================

const findAnotherActiveResidency = async (
    id,
    propertyId,
    personId,
    complexIds
) => {

    return prisma.residency.findFirst({

        where: {
            propertyId,
            personId,
            endDate: null,
            NOT: {
                id
            },
            ...buildComplexScope(complexIds)
        },

        include: residencyInclude

    });

};


// =====================
// Find Overlapping Residency
// =====================

const findOverlappingResidency = async ({
    id,
    propertyId,
    personId,
    startDate,
    endDate,
    complexIds
}) => {

    const where = {

        propertyId,
        personId,
        ...buildComplexScope(complexIds),

        ...(id
            ? {
                NOT: {
                    id
                }
            }
            : {}),

        OR: [
            {
                endDate: null
            },
            {
                endDate: {
                    gt: startDate
                }
            }
        ]

    };


    if (endDate) {

        where.startDate = {
            lt: endDate
        };

    }


    return prisma.residency.findFirst({

        where,

        include: residencyInclude,

        orderBy: {
            startDate: "asc"
        }

    });

};


// =====================
// Find Overlapping Tenant
// =====================

const findOverlappingTenant = async ({
    id,
    propertyId,
    startDate,
    endDate,
    complexIds
}) => {

    const where = {

        propertyId,
        type: "TENANT",
        ...buildComplexScope(complexIds),

        ...(id
            ? {
                NOT: {
                    id
                }
            }
            : {}),

        OR: [
            {
                endDate: null
            },
            {
                endDate: {
                    gt: startDate
                }
            }
        ]

    };


    if (endDate) {

        where.startDate = {
            lt: endDate
        };

    }


    return prisma.residency.findFirst({

        where,

        include: residencyInclude,

        orderBy: {
            startDate: "asc"
        }

    });

};


// =====================
// Update Residency
// =====================

const updateResidency = async (
    id,
    data
) => {

    return prisma.residency.update({

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

    return prisma.residency.delete({

        where: {
            id
        }

    });

};


// =====================
// Get Active Residents By Property
// =====================

const getResidentsByProperty = async (
    propertyId,
    complexIds
) => {

    return prisma.residency.findMany({

        where: {
            propertyId,
            endDate: null,
            ...buildComplexScope(complexIds)
        },

        include: residencyInclude,

        orderBy: {
            id: "asc"
        }

    });

};


// =====================
// Export
// =====================

module.exports = {
    createResidency,
    getResidencies,
    getResidencyById,
    findActiveResidency,
    findAnotherActiveResidency,
    findOverlappingResidency,
    findOverlappingTenant,
    updateResidency,
    deleteResidency,
    getResidentsByProperty
};
