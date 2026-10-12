const AppError = require("../utils/AppError");

const personRepository =
    require("../repositories/person.repository");


// =========================
// Create Person
// =========================

const createPerson = async (data) => {

    // =========================
    // Validate Required Fields
    // =========================

    if (!data.firstName) {

        throw new AppError(
            "firstName is required.",
            400
        );

    }

    if (!data.lastName) {

        throw new AppError(
            "lastName is required.",
            400
        );

    }

    if (!data.mobile) {

        throw new AppError(
            "mobile is required.",
            400
        );

    }


    // =========================
    // Check Duplicate National ID
    // =========================

    if (data.nationalId) {

        const existingPerson =
            await personRepository.getPersonByNationalId(
                data.nationalId
            );


        if (existingPerson) {

            throw new AppError(
                "Person with this nationalId already exists.",
                409
            );

        }

    }


    // =========================
    // Create
    // =========================

    return await personRepository.createPerson(
        data
    );

};


// =========================
// Get All Persons
// =========================

const getPersons = async () => {

    return await personRepository.getPersons();

};


// =========================
// Get Person By ID
// =========================

const getPersonById = async (id) => {

    const person =
        await personRepository.getPersonById(id);


    if (!person) {

        throw new AppError(
            "Person not found.",
            404
        );

    }


    return person;

};


// =========================
// Update Person
// =========================

const updatePerson = async (
    id,
    data
) => {

    // =========================
    // Check Person
    // =========================

    const existingPerson =
        await personRepository.getPersonById(id);


    if (!existingPerson) {

        throw new AppError(
            "Person not found.",
            404
        );

    }


    // =========================
    // Validate Required Fields
    // =========================

    if (
        data.firstName !== undefined &&
        !data.firstName
    ) {

        throw new AppError(
            "firstName cannot be empty.",
            400
        );

    }


    if (
        data.lastName !== undefined &&
        !data.lastName
    ) {

        throw new AppError(
            "lastName cannot be empty.",
            400
        );

    }


    if (
        data.mobile !== undefined &&
        !data.mobile
    ) {

        throw new AppError(
            "mobile cannot be empty.",
            400
        );

    }


    // =========================
    // Check Duplicate National ID
    // =========================

    if (
        data.nationalId !== undefined &&
        data.nationalId !== null &&
        data.nationalId !== existingPerson.nationalId
    ) {

        const duplicatePerson =
            await personRepository.getPersonByNationalId(
                data.nationalId
            );


        if (
            duplicatePerson &&
            duplicatePerson.id !== id
        ) {

            throw new AppError(
                "Person with this nationalId already exists.",
                409
            );

        }

    }


    // =========================
    // Update
    // =========================

    return await personRepository.updatePerson(
        id,
        data
    );

};


// =========================
// Delete Person
// =========================

const deletePerson = async (id) => {

    // =========================
    // Check Person
    // =========================

    const existingPerson =
        await personRepository.getPersonById(id);


    if (!existingPerson) {

        throw new AppError(
            "Person not found.",
            404
        );

    }


    // =========================
    // Delete
    // =========================

    return await personRepository.deletePerson(
        id
    );

};


// =========================
// Get Properties Of Person
// =========================

const getPersonProperties = async (id) => {

    const person =
        await personRepository.getPersonProperties(
            id
        );


    if (!person) {

        throw new AppError(
            "Person not found.",
            404
        );

    }


    return person;

};


// =========================
// Get Residencies Of Person
// =========================

const getPersonResidencies = async (id) => {

    const person =
        await personRepository.getPersonResidencies(
            id
        );


    if (!person) {

        throw new AppError(
            "Person not found.",
            404
        );

    }


    return person;

};


// =========================
// Export
// =========================

module.exports = {

    createPerson,

    getPersons,

    getPersonById,

    updatePerson,

    deletePerson,

    getPersonProperties,

    getPersonResidencies

};