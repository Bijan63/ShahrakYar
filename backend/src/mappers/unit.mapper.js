const unitSummary = (unit) => {
    if (!unit) {
        return null;
    }

    return {
        id: unit.id,
        unitNumber: unit.unitNumber,
        floor: unit.floor,
        area: unit.area,
        code: unit.code,
    };
};

// =========================
// Unit Mapper
// =========================

const unitMapper = (unit) => {
    if (!unit) {
        return null;
    }

    return {
        ...unitSummary(unit),

        building: unit.building
            ? {
                id: unit.building.id,
                name: unit.building.name,
            }
            : null,

        property: unit.property
            ? {
                id: unit.property.id,
                code: unit.property.code,
                type: unit.property.propertyType,
                status: unit.property.status,
            }
            : null,

        residents: (unit.residents || []).map((resident) => ({
            id: resident.id,
            fullName: resident.fullName,
            mobile: resident.mobile,
                personId: resident.personId,
        })),
    };
};

// =========================
// Export
// =========================

module.exports = {
    unitSummary,
    unitMapper,
};