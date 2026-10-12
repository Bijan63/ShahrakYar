// ======================================================
// Resident Mapper
// ======================================================

const toResponse = (resident) => {

    if (!resident) {
        return null;
    }

    return {

        id: resident.id,

        name:
            resident.fullName ||
            (
                resident.person
                    ? `${resident.person.firstName} ${resident.person.lastName}`
                    : null
            ),

        mobile:
            resident.mobile ||
            resident.person?.mobile ||
            null,

        userId: resident.userId,

        personId: resident.personId || null,

        unit: resident.unit
            ? {

                id: resident.unit.id,

                unitNumber:
                    resident.unit.unitNumber ?? null,

                floor:
                    resident.unit.floor ?? null,

                area:
                    resident.unit.area ?? null,

                code:
                    resident.unit.code ?? null,

                building: resident.unit.building
                    ? {

                        id: resident.unit.building.id,

                        name:
                            resident.unit.building.name

                    }
                    : null,

                property: resident.unit.property
                    ? {

                        id: resident.unit.property.id,

                        code: resident.unit.property.code,

                        propertyType:
                            resident.unit.property.propertyType,

                        status:
                            resident.unit.property.status

                    }
                    : null

            }
            : null,

        createdAt: resident.createdAt,

        updatedAt: resident.updatedAt

    };

};


// ======================================================
// Export
// ======================================================

module.exports = {
    toResponse
};