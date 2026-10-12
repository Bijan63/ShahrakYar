const personService =
    require("../services/person.service");

const ResponseHelper =
    require("../helpers/response.helper");

const {
    personMapper,
    personPropertiesMapper,
    personResidenciesMapper
} = require("../mappers/person.mapper");


// =========================
// Create Person
// =========================

const createPerson = async (req, res, next) => {

    try {

        const person =
            await personService.createPerson(
                req.body
            );


        ResponseHelper.created(
            res,
            "Person created successfully",
            personMapper(person)
        );

    } catch (error) {

        next(error);

    }

};


// =========================
// Get All Persons
// =========================

const getPersons = async (req, res, next) => {

    try {

        const persons =
            await personService.getPersons();


        ResponseHelper.success(
            res,
            "Persons fetched successfully",
            persons.map(personMapper)
        );

    } catch (error) {

        next(error);

    }

};


// =========================
// Get Person By ID
// =========================

const getPersonById = async (req, res, next) => {

    try {

        const person =
            await personService.getPersonById(
                req.params.id
            );


        ResponseHelper.success(
            res,
            "Person fetched successfully",
            personMapper(person)
        );

    } catch (error) {

        next(error);

    }

};


// =========================
// Update Person
// =========================

const updatePerson = async (req, res, next) => {

    try {

        const person =
            await personService.updatePerson(
                req.params.id,
                req.body
            );


        ResponseHelper.success(
            res,
            "Person updated successfully",
            personMapper(person)
        );

    } catch (error) {

        next(error);

    }

};


// =========================
// Delete Person
// =========================

const deletePerson = async (req, res, next) => {

    try {

        await personService.deletePerson(
            req.params.id
        );


        ResponseHelper.success(
            res,
            "Person deleted successfully"
        );

    } catch (error) {

        next(error);

    }

};


// =========================
// Get Properties Of One Person
// =========================

const getPersonProperties = async (req, res, next) => {

    try {

        const person =
            await personService.getPersonProperties(
                req.params.id
            );


        ResponseHelper.success(
            res,
            "Person properties fetched successfully",
            personPropertiesMapper(person)
        );

    } catch (error) {

        next(error);

    }

};


// =========================
// Get Residencies Of One Person
// =========================

const getPersonResidencies = async (req, res, next) => {

    try {

        const person =
            await personService.getPersonResidencies(
                req.params.id
            );


        ResponseHelper.success(
            res,
            "Person residencies fetched successfully",
            personResidenciesMapper(person)
        );

    } catch (error) {

        next(error);

    }

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