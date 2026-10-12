const residentDTO = (resident) => {

    return {

        id: resident.id,

        name: resident.name || resident.fullName,

        mobile: resident.mobile,


        userId: resident.userId,

        unitId: resident.unitId,

        personId: resident.personId,

        createdAt: resident.createdAt,

        updatedAt: resident.updatedAt

    };

};

module.exports = residentDTO;