
const personRepository = require("../repositories/person.repository");


// =========================
// Create Person
// =========================

const createPerson = async (data) => {

    return await personRepository.createPerson(data);

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

    return await personRepository.getPersonById(id);

};


// =========================
// Update Person
// =========================

const updatePerson = async (id, data) => {

    return await personRepository.updatePerson(
        id,
        data
    );

};


// =========================
// Delete Person
// =========================

const deletePerson = async (id) => {

    return await personRepository.deletePerson(id);

};


// =========================
// Get Properties Of Person
// =========================

const getPersonProperties = async (id) => {

    return await personRepository.getPersonProperties(id);

};


// =========================
// Get Residencies Of Person
// =========================

const getPersonResidencies = async (id) => {

    return await personRepository.getPersonResidencies(id);

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