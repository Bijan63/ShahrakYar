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



const personMapper = (person) => {

    if (!person) return null;


    return {

        ...personSummary(person),


        nationalId: person.nationalId,


        createdAt: person.createdAt,

        updatedAt: person.updatedAt

    };

};



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



module.exports = {

    personMapper,

    personPropertiesMapper

};