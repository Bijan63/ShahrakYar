const propertySummary = (property) => {

    if (!property) {return null;}


    return {

        id: property.id,

        code: property.code,

        propertyType: property.propertyType,

        status: property.status,

        landArea: property.landArea,

        builtArea: property.builtArea,

        description: property.description

    };

};



const propertyMapper = (property) => {

    if (!property) {return null;}


    return {

        ...propertySummary(property),


        complex: property.complex
            ? {

                id: property.complex.id,

                name: property.complex.name

            }
            : null,


        owners:
            (property.ownerships || [])
                .map((ownership) => ({

                    id: ownership.person.id,

                    name:
                        `${ownership.person.firstName} ${ownership.person.lastName}`,

                    mobile: ownership.person.mobile,

                    share: ownership.percentage

                })),


        residents:
            (property.residencies || [])
                .map((residency) => ({

                    id: residency.person.id,

                    name:
                        `${residency.person.firstName} ${residency.person.lastName}`,

                    mobile: residency.person.mobile,

                    type: residency.type

                }))

    };

};



module.exports = {

    propertySummary,

    propertyMapper

};