// ======================================================
// Building Summary
// ======================================================

const buildingSummary = (building) => {

    if (!building) {
        return null;
    }


    return {

        id: building.id,

        name: building.name,

        address: building.address,

        description: building.description

    };

};


// ======================================================
// Building Mapper
// ======================================================

const buildingMapper = (building) => {

    if (!building) {
        return null;
    }


    return {

        ...buildingSummary(building),


        // --------------------------------------------------
        // Complex
        // --------------------------------------------------

        complex: building.complex

            ? {

                id: building.complex.id,

                name: building.complex.name

            }

            : null,


        // --------------------------------------------------
        // Units
        // --------------------------------------------------

        units:
            (building.units || [])
                .map((unit) => ({

                    id: unit.id,

                    unitNumber: unit.unitNumber,

                    floor: unit.floor,

                    area: unit.area,

                    code: unit.code,


                    // ------------------------------------------
                    // Property
                    // ------------------------------------------

                    property: unit.property

                        ? {

                            id: unit.property.id,

                            code: unit.property.code,

                            type:
                                unit.property.propertyType,

                            status:
                                unit.property.status

                        }

                        : null,


                    // ------------------------------------------
                    // Residents
                    // ------------------------------------------

                    residents:
                        (unit.residents || [])
                            .map((resident) => ({

                                id: resident.id,

                                fullName:
                                    resident.fullName,

                                mobile:
                                    resident.mobile,

                                personId:
                                    resident.personId

                            }))

                }))

    };

};


// ======================================================
// Export
// ======================================================

module.exports = {

    buildingSummary,

    buildingMapper

};