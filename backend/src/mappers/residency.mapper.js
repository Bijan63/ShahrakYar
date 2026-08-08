const toResponse = (residency) => {

    if (!residency) {
        return null;
    }

    return {
        id: residency.id,

        type: residency.type,

        startDate: residency.startDate,

        endDate: residency.endDate,

        property: residency.property
            ? {
                id: residency.property.id,
                code: residency.property.code,
                type: residency.property.propertyType,
                status: residency.property.status
            }
            : null,

        resident: residency.person
            ? {
                id: residency.person.id,
                name: `${residency.person.firstName} ${residency.person.lastName}`,
                mobile: residency.person.mobile
            }
            : null
    };

};

module.exports = {
    toResponse
};