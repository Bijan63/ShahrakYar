const personService = require("../services/person.service");

// Create Person
const createPerson = async (req, res, next) => {

    try {

        const person = await personService.createPerson(
            req.body
        );

        res.status(201).json({
            success: true,
            person
        });

    } catch (error) {

        next(error);

    }

};

// Get All Persons
const getPersons = async (req, res, next) => {

    try {

        const persons = await personService.getPersons();

        res.json({
            success: true,
            persons
        });

    } catch (error) {

        next(error);

    }

};

// Get Person By ID
const getPersonById = async (req, res, next) => {

    try {

        const person = await personService.getPersonById(
            req.params.id
        );

        res.json({
            success: true,
            person
        });

    } catch (error) {

        next(error);

    }

};

// Update Person
const updatePerson = async (req, res, next) => {

    try {

        const person = await personService.updatePerson(
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            person
        });

    } catch (error) {

        next(error);

    }

};

// Delete Person
const deletePerson = async (req, res, next) => {

    try {

        await personService.deletePerson(
            req.params.id
        );

        res.json({
            success: true,
            message: "Person deleted successfully"
        });

    } catch (error) {

        next(error);

    }

};

module.exports = {

    createPerson,
    getPersons,
    getPersonById,
    updatePerson,
    deletePerson

};