const personSummary = (person) => {

    if (!person) return null;

    return {

        id: person.id,

        firstName: person.firstName,

        lastName: person.lastName,

        fullName:
            `${person.firstName} ${person.lastName}`,

        mobile: person.mobile,

        email: person.email

    };

};


// =========================
// Person Mapper
// =========================

const personMapper = (person) => {

    if (!person) return null;

    return {

        ...personSummary(person),

        nationalId: person.nationalId,

        createdAt: person.createdAt,

        updatedAt: person.updatedAt

    };

};


// =========================
// Person Properties Mapper
// =========================

const personPropertiesMapper = (person) => {

    if (!person) return null;

    return {

        ...personMapper(person),

        ownerships:
            (person.ownerships || []).map(
                ownership => ({

                    id: ownership.id,

                    percentage: ownership.percentage,

                    startDate: ownership.startDate,

                    endDate: ownership.endDate,

                    property: ownership.property
                        ? {

                            id: ownership.property.id,

                            code: ownership.property.code,

                            type:
                                ownership.property.propertyType,

                            status:
                                ownership.property.status

                        }
                        : null

                })
            )

    };

};


// =========================
// Person Residencies Mapper
// =========================

const personResidenciesMapper = (person) => {

    if (!person) return null;

    return {

        ...personMapper(person),

        residencies:
            (person.residencies || []).map(
                residency => ({

                    id: residency.id,

                    type: residency.type,

                    startDate: residency.startDate,

                    endDate: residency.endDate,

                    property: residency.property
                        ? {

                            id: residency.property.id,

                            code: residency.property.code,

                            type:
                                residency.property.propertyType,

                            status:
                                residency.property.status,

                            landArea:
                                residency.property.landArea,

                            builtArea:
                                residency.property.builtArea,

                            complex:
                                residency.property.complex
                                    ? {

                                        id:
                                            residency.property.complex.id,

                                        name:
                                            residency.property.complex.name

                                    }
                                    : null

                        }
                        : null

                })
            )

    };

};


module.exports = {

    personMapper,

    personPropertiesMapper,

    personResidenciesMapper

};