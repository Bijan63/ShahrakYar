const personRepository = require("../repositories/person.repository");

// Create
const createPerson = async (data) => {

    return await personRepository.createPerson(data);

};

// Get All
const getPersons = async () => {

    return await personRepository.getPersons();

};

// Get By ID
const getPersonById = async (id) => {

    return await personRepository.getPersonById(id);

};

// Update
const updatePerson = async (id, data) => {

    return await personRepository.updatePerson(id, data);

};

// Delete
const deletePerson = async (id) => {

    return await personRepository.deletePerson(id);

};

module.exports = {

    createPerson,
    getPersons,
    getPersonById,
    updatePerson,
    deletePerson

};