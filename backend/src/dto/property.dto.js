const propertyDTO = (property) => {

    return {

        id: property.id,

        code: property.code,

        propertyType: property.propertyType,

        status: property.status,

        landArea: property.landArea,

        builtArea: property.builtArea,

        description: property.description,

        complex: property.complex
            ? {
                id: property.complex.id,
                name: property.complex.name
            }
            : null,

        owners: (property.ownerships || []).map(owner => ({
            id: owner.person.id,
            name: `${owner.person.firstName} ${owner.person.lastName}`,
            mobile: owner.person.mobile,
            share: owner.percentage
        })),

        residents: (property.residencies || []).map(resident => ({
            id: resident.person.id,
            name: `${resident.person.firstName} ${resident.person.lastName}`,
            mobile: resident.person.mobile,
            type: resident.type
        }))

    };

};

module.exports = propertyDTO;