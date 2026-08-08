const ownershipDTO = (ownership) => {

    if (!ownership) {
        return null;
    }


    return {

        id: ownership.id,

        percentage: ownership.percentage,

        startDate: ownership.startDate,

        endDate: ownership.endDate,


        property: ownership.property
            ? {
                id: ownership.property.id,
                code: ownership.property.code,
                type: ownership.property.propertyType
            }
            : null,


        owner: ownership.person
            ? {
                id: ownership.person.id,
                name:
                    `${ownership.person.firstName} ${ownership.person.lastName}`,
                mobile: ownership.person.mobile
            }
            : null

    };

};


module.exports = ownershipDTO;