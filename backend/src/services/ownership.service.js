const AppError =
    require("../utils/AppError");

const ownershipRepository =
    require("../repositories/ownership.repository");

const personRepository =
    require("../repositories/person.repository");

const propertyRepository =
    require("../repositories/property.repository");

const accessService =
    require("./access.service");

const prisma =
    require("../config/prisma");

const {
    jalaliRangeToGregorian,
    formatJalaliDate,
    formatJalaliDateTime
} = require("../utils/date.utils");


const EPSILON = 0.000001;


// =====================================================
// Helpers
// =====================================================

const hasOwn = (
    object,
    key
) => Object.prototype.hasOwnProperty.call(
    object,
    key
);


const parseDate = (
    value,
    fieldName
) => {

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        throw new AppError(
            `${fieldName} must be a valid date.`,
            400
        );

    }


    return date;

};


const validatePercentage = (
    value
) => {

    const percentage =
        Number(value);


    if (
        !Number.isFinite(percentage) ||
        percentage <= 0 ||
        percentage > 100
    ) {

        throw new AppError(
            "percentage must be greater than 0 and at most 100.",
            400
        );

    }


    return percentage;

};


const rangesOverlap = (
    startA,
    endA,
    startB,
    endB
) => {

    const startATime =
        startA.getTime();

    const startBTime =
        startB.getTime();

    const endATime =
        endA
            ? endA.getTime()
            : Infinity;

    const endBTime =
        endB
            ? endB.getTime()
            : Infinity;


    return (
        startATime <= endBTime &&
        startBTime <= endATime
    );

};


const validateDateRange = (
    startDate,
    endDate
) => {

    if (
        startDate &&
        endDate &&
        startDate.getTime() >
        endDate.getTime()
    ) {

        throw new AppError(
            "startDate cannot be later than endDate.",
            400
        );

    }

};


const getEffectiveStartDate = (
    value,
    fallback
) => {

    if (
        value !== undefined
    ) {

        if (
            value === null ||
            value === ""
        ) {

            throw new AppError(
                "startDate cannot be empty.",
                400
            );

        }


        return parseDate(
            value,
            "startDate"
        );

    }


    return fallback
        ? new Date(fallback)
        : new Date();

};


// =====================================================
// Validate same person / property date overlap
// =====================================================

const validateOwnershipOverlap = async ({
    propertyId,
    personId,
    startDate,
    endDate,
    excludeId = null
}) => {

    const ownerships =
        await prisma.ownership.findMany({

            where: {

                propertyId,

                personId,

                ...(excludeId
                    ? {
                        NOT: {
                            id: excludeId
                        }
                    }
                    : {})

            },

            select: {

                id: true,

                startDate: true,

                endDate: true

            }

        });


    for (
        const ownership of ownerships
    ) {

        const existingStartDate =
            ownership.startDate
                ? new Date(
                    ownership.startDate
                )
                : new Date();


        const existingEndDate =
            ownership.endDate
                ? new Date(
                    ownership.endDate
                )
                : null;


        if (
            rangesOverlap(
                startDate,
                endDate,
                existingStartDate,
                existingEndDate
            )
        ) {

            throw new AppError(
                "Ownership date range overlaps with another ownership for the same person and property.",
                409
            );

        }

    }

};


// =====================================================
// Validate active duplicate ownership
// =====================================================

const validateActiveDuplicate = async ({
    propertyId,
    personId,
    endDate,
    excludeId = null
}) => {

    if (
        endDate !== null
    ) {

        return;

    }


    const existing =
        await prisma.ownership.findFirst({

            where: {

                propertyId,

                personId,

                endDate: null,

                ...(excludeId
                    ? {
                        NOT: {
                            id: excludeId
                        }
                    }
                    : {})

            },

            select: {
                id: true
            }

        });


    if (existing) {

        throw new AppError(
            "This person already has an active ownership for this property.",
            409
        );

    }

};


// =====================================================
// Validate active ownership total
// =====================================================

const validateActiveTotal = async ({
    propertyId,
    percentage,
    endDate,
    excludeId = null
}) => {

    if (
        endDate !== null
    ) {

        return;

    }


    const activeOwnerships =
        await prisma.ownership.findMany({

            where: {

                propertyId,

                endDate: null,

                ...(excludeId
                    ? {
                        NOT: {
                            id: excludeId
                        }
                    }
                    : {})

            },

            select: {
                percentage: true
            }

        });


    const currentTotal =
        activeOwnerships.reduce(
            (
                total,
                ownership
            ) =>
                total +
                Number(
                    ownership.percentage
                ),
            0
        );


    if (
        currentTotal +
        percentage >
        100 + EPSILON
    ) {

        throw new AppError(
            `Total active ownership percentage cannot exceed 100%. Current total excluding this ownership: ${currentTotal}%.`,
            400
        );

    }

};


// =====================================================
// Create Ownership
// =====================================================

const createOwnership = async (
    data,
    user
) => {

    if (!data) {

        throw new AppError(
            "Request body is required.",
            400
        );

    }


    const {
        propertyId,
        personId
    } = data;


    if (
        !propertyId ||
        !personId
    ) {

        throw new AppError(
            "propertyId and personId are required.",
            400
        );

    }


    if (!user) {

        throw new AppError(
            "Unauthorized.",
            401
        );

    }


    // -------------------------------------------------
    // Property
    // -------------------------------------------------

    const property =
        await propertyRepository.findById(
            propertyId
        );


    if (!property) {

        throw new AppError(
            "Property not found.",
            404
        );

    }


    await accessService.requireComplexAccess(
        user,
        property.complexId
    );


    // -------------------------------------------------
    // Person
    // -------------------------------------------------

    const person =
        await personRepository.getPersonById(
            personId
        );


    if (!person) {

        throw new AppError(
            "Person not found.",
            404
        );

    }


    // -------------------------------------------------
    // Percentage
    // -------------------------------------------------

    const percentage =
        data.percentage === undefined
            ? 100
            : validatePercentage(
                data.percentage
            );


    // -------------------------------------------------
    // Dates
    // -------------------------------------------------

    let startDate = null;
    let endDate = null;


    if (
        hasOwn(data, "startDate")
    ) {

        if (
            data.startDate === null ||
            data.startDate === ""
        ) {

            throw new AppError(
                "startDate cannot be empty.",
                400
            );

        }


        startDate =
            parseDate(
                data.startDate,
                "startDate"
            );

    }


    if (
        hasOwn(data, "endDate")
    ) {

        if (
            data.endDate !== null &&
            data.endDate !== ""
        ) {

            endDate =
                parseDate(
                    data.endDate,
                    "endDate"
                );

        }

    }


    const effectiveStartDate =
        startDate ||
        new Date();


    validateDateRange(
        effectiveStartDate,
        endDate
    );


    // -------------------------------------------------
    // Business validation
    // -------------------------------------------------

    await validateActiveDuplicate({

        propertyId,

        personId,

        endDate

    });


    await validateOwnershipOverlap({

        propertyId,

        personId,

        startDate:
            effectiveStartDate,

        endDate

    });


    await validateActiveTotal({

        propertyId,

        percentage,

        endDate

    });


    // -------------------------------------------------
    // Prepare
    // -------------------------------------------------

    const ownershipData = {

        propertyId,

        personId,

        percentage

    };


    if (
        startDate
    ) {

        ownershipData.startDate =
            startDate;

    }


    if (
        hasOwn(data, "endDate")
    ) {

        ownershipData.endDate =
            endDate;

    }


    return await ownershipRepository.createOwnership(
        ownershipData
    );

};


// =====================================================
// Get All Ownerships
// =====================================================

const getOwnerships = async (
    user
) => {

    const complexIds =
        await accessService.getAccessibleComplexIds(
            user
        );


    return await ownershipRepository.getOwnerships(
        complexIds
    );

};


// =====================================================
// Get Ownership By ID
// =====================================================

const getOwnershipById = async (
    id,
    user
) => {

    if (!id) {

        throw new AppError(
            "id is required.",
            400
        );

    }


    const complexIds =
        await accessService.getAccessibleComplexIds(
            user
        );


    const ownership =
        await ownershipRepository.getOwnershipById(
            id,
            complexIds
        );


    if (!ownership) {

        throw new AppError(
            "Ownership not found.",
            404
        );

    }


    return ownership;

};


// =====================================================
// Update Ownership
// =====================================================

const updateOwnership = async (
    id,
    data,
    user
) => {

    if (!id) {

        throw new AppError(
            "id is required.",
            400
        );

    }


    if (!data) {

        throw new AppError(
            "Request body is required.",
            400
        );

    }


    if (!user) {

        throw new AppError(
            "Unauthorized.",
            401
        );

    }


    // -------------------------------------------------
    // Existing ownership
    // -------------------------------------------------

    const existingOwnership =
        await ownershipRepository.getOwnershipById(
            id
        );


    if (!existingOwnership) {

        throw new AppError(
            "Ownership not found.",
            404
        );

    }


    if (
        !existingOwnership.property
    ) {

        throw new AppError(
            "Ownership property not found.",
            404
        );

    }


    await accessService.requireComplexAccess(
        user,
        existingOwnership.property.complexId
    );


    // -------------------------------------------------
    // Final Property
    // -------------------------------------------------

    let finalPropertyId =
        existingOwnership.propertyId;

    let finalProperty;

    if (
        data.propertyId !== undefined
    ) {

        if (
            !data.propertyId
        ) {

            throw new AppError(
                "propertyId cannot be empty.",
                400
            );

        }


        finalProperty =
            await propertyRepository.findById(
                data.propertyId
            );


        if (!finalProperty) {

            throw new AppError(
                "Property not found.",
                404
            );

        }


        finalPropertyId =
            data.propertyId;


        await accessService.requireComplexAccess(
            user,
            finalProperty.complexId
        );

    }


    // -------------------------------------------------
    // Final Person
    // -------------------------------------------------

    let finalPersonId =
        existingOwnership.personId;


    if (
        data.personId !== undefined
    ) {

        if (
            !data.personId
        ) {

            throw new AppError(
                "personId cannot be empty.",
                400
            );

        }


        const person =
            await personRepository.getPersonById(
                data.personId
            );


        if (!person) {

            throw new AppError(
                "Person not found.",
                404
            );

        }


        finalPersonId =
            data.personId;

    }


    // -------------------------------------------------
    // Final Percentage
    // -------------------------------------------------

    let finalPercentage =
        Number(
            existingOwnership.percentage
        );


    if (
        data.percentage !== undefined
    ) {

        finalPercentage =
            validatePercentage(
                data.percentage
            );

    }


    // -------------------------------------------------
    // Final Dates
    // -------------------------------------------------

    const finalStartDate =
        getEffectiveStartDate(
            data.startDate,
            existingOwnership.startDate
        );


    let finalEndDate =
        existingOwnership.endDate
            ? new Date(
                existingOwnership.endDate
            )
            : null;


    if (
        hasOwn(data, "endDate")
    ) {

        if (
            data.endDate === null ||
            data.endDate === ""
        ) {

            finalEndDate = null;

        }
        else {

            finalEndDate =
                parseDate(
                    data.endDate,
                    "endDate"
                );

        }

    }


    validateDateRange(
        finalStartDate,
        finalEndDate
    );


    // -------------------------------------------------
    // Business validation
    // -------------------------------------------------

    await validateActiveDuplicate({

        propertyId:
            finalPropertyId,

        personId:
            finalPersonId,

        endDate:
            finalEndDate,

        excludeId:
            id

    });


    await validateOwnershipOverlap({

        propertyId:
            finalPropertyId,

        personId:
            finalPersonId,

        startDate:
            finalStartDate,

        endDate:
            finalEndDate,

        excludeId:
            id

    });


    await validateActiveTotal({

        propertyId:
            finalPropertyId,

        percentage:
            finalPercentage,

        endDate:
            finalEndDate,

        excludeId:
            id

    });


    // -------------------------------------------------
    // Prepare update
    // -------------------------------------------------

    const updateData = {};


    if (
        data.propertyId !== undefined
    ) {

        updateData.propertyId =
            finalPropertyId;

    }


    if (
        data.personId !== undefined
    ) {

        updateData.personId =
            finalPersonId;

    }


    if (
        data.percentage !== undefined
    ) {

        updateData.percentage =
            finalPercentage;

    }


    if (
        data.startDate !== undefined
    ) {

        updateData.startDate =
            finalStartDate;

    }


    if (
        hasOwn(data, "endDate")
    ) {

        updateData.endDate =
            finalEndDate;

    }


    return await ownershipRepository.updateOwnership(
        id,
        updateData
    );

};


// =====================================================
// Delete Ownership
// =====================================================

const deleteOwnership = async (
    id,
    user
) => {

    if (!id) {

        throw new AppError(
            "id is required.",
            400
        );

    }


    const ownership =
        await ownershipRepository.getOwnershipById(
            id
        );


    if (!ownership) {

        throw new AppError(
            "Ownership not found.",
            404
        );

    }


    if (
        !ownership.property
    ) {

        throw new AppError(
            "Ownership property not found.",
            404
        );

    }


    await accessService.requireComplexAccess(
        user,
        ownership.property.complexId
    );


    await ownershipRepository.deleteOwnership(
        id
    );


    return {

        success: true,

        message:
            "Ownership deleted successfully."

    };

};


// =====================================================
// Get Ownership History
// =====================================================

const getOwnershipHistory = async (
    from,
    to,
    user
) => {

    if (
        !from ||
        !to
    ) {

        throw new AppError(
            "from and to dates are required.",
            400
        );

    }


    let fromDate;
    let toDate;


    try {

        const result =
            jalaliRangeToGregorian(
                from,
                to
            );


        fromDate =
            result.fromDate;

        toDate =
            result.toDate;

    }
    catch {

        throw new AppError(
            "Invalid Jalali date range. Use format YYYY/MM/DD.",
            400
        );

    }


    if (
        fromDate > toDate
    ) {

        throw new AppError(
            "from date cannot be later than to date.",
            400
        );

    }


    const complexIds =
        await accessService.getAccessibleComplexIds(
            user
        );


    return await ownershipRepository.getOwnershipHistory(
        fromDate,
        toDate,
        complexIds
    );

};


// =====================================================
// Get Ownership Changes
// =====================================================

const getOwnershipChanges = async (
    from,
    to,
    user
) => {

    if (
        !from ||
        !to
    ) {

        throw new AppError(
            "from and to dates are required.",
            400
        );

    }


    let fromDate;
    let toDate;


    try {

        const result =
            jalaliRangeToGregorian(
                from,
                to
            );


        fromDate =
            result.fromDate;

        toDate =
            result.toDate;

    }
    catch {

        throw new AppError(
            "Invalid Jalali date range. Use format YYYY/MM/DD.",
            400
        );

    }


    if (
        fromDate > toDate
    ) {

        throw new AppError(
            "from date cannot be later than to date.",
            400
        );

    }


    const complexIds =
        await accessService.getAccessibleComplexIds(
            user
        );


    try {

        const ownerships =
            await ownershipRepository.getOwnershipChanges(
                fromDate,
                toDate,
                complexIds
            );


        const propertyMap =
            new Map();


        for (
            const ownership of ownerships
        ) {

            const propertyId =
                ownership.propertyId;


            if (
                !propertyMap.has(
                    propertyId
                )
            ) {

                propertyMap.set(

                    propertyId,

                    {

                        property: {

                            id:
                                ownership.property?.id,

                            code:
                                ownership.property?.code,

                            type:
                                ownership.property?.propertyType,

                            status:
                                ownership.property?.status

                        },

                        ownerships: []

                    }

                );

            }


            propertyMap
                .get(propertyId)
                .ownerships
                .push(ownership);

        }


        const reports = [];


        for (
            const propertyData of propertyMap.values()
        ) {

            const events = [];


            for (
                const ownership
                of propertyData.ownerships
            ) {

                const owner = {

                    id:
                        ownership.person?.id ||
                        ownership.personId,

                    name:
                        ownership.person
                            ? `${ownership.person.firstName} ${ownership.person.lastName}`.trim()
                            : null,

                    mobile:
                        ownership.person?.mobile ||
                        null

                };


                if (
                    ownership.startDate
                ) {

                    const startDate =
                        new Date(
                            ownership.startDate
                        );


                    if (
                        startDate >= fromDate &&
                        startDate <= toDate
                    ) {

                        events.push({

                            id:
                                ownership.id,

                            type:
                                "OWNERSHIP_STARTED",

                            date:
                                formatJalaliDate(
                                    startDate
                                ),

                            dateTime:
                                formatJalaliDateTime(
                                    startDate
                                ),

                            owner,

                            percentage:
                                ownership.percentage

                        });

                    }

                }


                if (
                    ownership.endDate
                ) {

                    const endDate =
                        new Date(
                            ownership.endDate
                        );


                    if (
                        endDate >= fromDate &&
                        endDate <= toDate
                    ) {

                        events.push({

                            id:
                                ownership.id,

                            type:
                                "OWNERSHIP_ENDED",

                            date:
                                formatJalaliDate(
                                    endDate
                                ),

                            dateTime:
                                formatJalaliDateTime(
                                    endDate
                                ),

                            owner,

                            percentage:
                                ownership.percentage

                        });

                    }

                }

            }


            events.sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.dateTime
                        );

                    const dateB =
                        new Date(
                            b.dateTime
                        );

                    return dateA - dateB;

                }
            );


            const transfers = [];


            for (
                const endedEvent of events
            ) {

                if (
                    endedEvent.type !==
                    "OWNERSHIP_ENDED"
                ) {

                    continue;

                }


                const endedOwnership =
                    propertyData.ownerships.find(
                        ownership =>
                            ownership.id ===
                            endedEvent.id
                    );


                if (
                    !endedOwnership
                ) {

                    continue;

                }


                const endDate =
                    new Date(
                        endedOwnership.endDate
                    );


                const nextOwnership =
                    propertyData.ownerships

                        .filter(
                            ownership => {

                                if (
                                    !ownership.startDate
                                ) {

                                    return false;

                                }


                                const startDate =
                                    new Date(
                                        ownership.startDate
                                    );


                                return (
                                    startDate >= endDate &&
                                    ownership.id !==
                                        endedOwnership.id &&
                                    Number(
                                        ownership.percentage
                                    ) ===
                                    Number(
                                        endedOwnership.percentage
                                    )
                                );

                            }
                        )

                        .sort(
                            (a, b) =>

                                new Date(
                                    a.startDate
                                ) -
                                new Date(
                                    b.startDate
                                )

                        )[0];


                if (
                    !nextOwnership
                ) {

                    continue;

                }


                const nextOwner = {

                    id:
                        nextOwnership.person?.id ||
                        nextOwnership.personId,

                    name:
                        nextOwnership.person
                            ? `${nextOwnership.person.firstName} ${nextOwnership.person.lastName}`.trim()
                            : null,

                    mobile:
                        nextOwnership.person?.mobile ||
                        null

                };


                transfers.push({

                    date:
                        formatJalaliDate(
                            endDate
                        ),

                    dateTime:
                        formatJalaliDateTime(
                            endDate
                        ),

                    previousOwner:
                        endedEvent.owner,

                    previousPercentage:
                        endedOwnership.percentage,

                    newOwner:
                        nextOwner,

                    newPercentage:
                        nextOwnership.percentage,

                    previousOwnershipId:
                        endedOwnership.id,

                    newOwnershipId:
                        nextOwnership.id

                });

            }


            const consumedOwnershipIds =
                new Set();


            for (
                const transfer of transfers
            ) {

                consumedOwnershipIds.add(
                    transfer.previousOwnershipId
                );

                consumedOwnershipIds.add(
                    transfer.newOwnershipId
                );

            }


            const remainingEvents =
                events.filter(
                    event =>
                        !consumedOwnershipIds.has(
                            event.id
                        )
                );


            const changes = [];


            for (
                const transfer of transfers
            ) {

                changes.push({

                    type:
                        "OWNERSHIP_TRANSFER",

                    date:
                        transfer.date,

                    dateTime:
                        transfer.dateTime,

                    previousOwner:
                        transfer.previousOwner,

                    previousPercentage:
                        transfer.previousPercentage,

                    newOwner:
                        transfer.newOwner,

                    newPercentage:
                        transfer.newPercentage

                });

            }


            changes.push(
                ...remainingEvents
            );


            changes.sort(
                (a, b) => {

                    const dateA =
                        a.dateTime || "";

                    const dateB =
                        b.dateTime || "";

                    return dateA.localeCompare(
                        dateB
                    );

                }
            );


            reports.push({

                property:
                    propertyData.property,

                changes,

                changeCount:
                    changes.length,

                hasChanges:
                    changes.length > 0

            });

        }


        return reports;

    }
    catch (error) {

        if (
            error instanceof AppError
        ) {

            throw error;

        }


        throw new AppError(
            "Unable to get ownership changes.",
            500
        );

    }

};


module.exports = {

    createOwnership,

    getOwnerships,

    getOwnershipById,

    updateOwnership,

    deleteOwnership,

    getOwnershipHistory,

    getOwnershipChanges

};