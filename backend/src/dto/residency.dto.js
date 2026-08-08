const residencyDTO = (residency) => {

    if (!residency) {
        return null;
    }


    return {

        id: residency.id,

        type: residency.type,

        startDate: residency.startDate,

        endDate: residency.endDate,


        person: residency.person
            ? {
                id: residency.person.id,
                name:
                    `${residency.person.firstName} ${residency.person.lastName}`,
                mobile: residency.person.mobile
            }
            : null,


        property: residency.property
            ? {

                id: residency.property.id,

                code: residency.property.code,

                propertyType: residency.property.propertyType,

                status: residency.property.status

            }
            : null

    };

};


module.exports = residencyDTO;