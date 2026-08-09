
const AppError = require("../utils/AppError");

const ownershipRepository = require("../repositories/ownership.repository");

const personRepository = require("../repositories/person.repository");

const propertyRepository = require("../repositories/property.repository");

const prisma = require("../config/prisma");


class OwnershipService {

    // =====================
    // Create Ownership
    // =====================

    async createOwnership(data) {

        const {
            propertyId,
            personId,
            percentage,
            startDate,
            endDate
        } = data;


        // ---------------------
        // Required fields
        // ---------------------

        if (!propertyId || !personId) {

            throw new AppError(
                "propertyId and personId are required.",
                400
            );

        }


        // ---------------------
        // Check Property
        // ---------------------

        const property =
            await propertyRepository.findById(propertyId);


        if (!property) {

            throw new AppError(
                "Property not found.",
                404
            );

        }


        // ---------------------
        // Check Person
        // ---------------------

        const person =
            await personRepository.getPersonById(personId);


        if (!person) {

            throw new AppError(
                "Person not found.",
                404
            );

        }


        // ---------------------
        // Validate percentage
        // ---------------------

        const ownershipPercentage =
            percentage === undefined
                ? 100
                : Number(percentage);


        if (
            Number.isNaN(ownershipPercentage) ||
            ownershipPercentage <= 0 ||
            ownershipPercentage > 100
        ) {

            throw new AppError(
                "percentage must be greater than 0 and at most 100.",
                400
            );

        }


        // ---------------------
        // Check duplicate active ownership
        // ---------------------

        const existingOwnership =
            await prisma.ownership.findFirst({

                where: {

                    propertyId,

                    personId,

                    endDate: null

                }

            });


        if (existingOwnership) {

            throw new AppError(
                "This person already has an active ownership for this property.",
                409
            );

        }


        // ---------------------
        // Check total percentage
        // ---------------------

        const activeOwnerships =
            await prisma.ownership.findMany({

                where: {

                    propertyId,

                    endDate: null

                },

                select: {

                    percentage: true

                }

            });


        const currentTotal =
            activeOwnerships.reduce(

                (total, ownership) =>
                    total + ownership.percentage,

                0

            );


        if (
            currentTotal + ownershipPercentage > 100
        ) {

            throw new AppError(
                `Total active ownership percentage cannot exceed 100%. Current total: ${currentTotal}%.`,
                400
            );

        }


        // ---------------------
        // Prepare data
        // ---------------------

        const ownershipData = {

            propertyId,

            personId,

            percentage: ownershipPercentage

        };


        if (startDate) {

            ownershipData.startDate =
                new Date(startDate);

        }


        if (endDate) {

            ownershipData.endDate =
                new Date(endDate);

        }


        // ---------------------
        // Create
        // ---------------------

        return await ownershipRepository.createOwnership(
            ownershipData
        );

    }


    // =====================
    // Get All Ownerships
    // =====================

    async getOwnerships() {

        return await ownershipRepository.getOwnerships();

    }


    // =====================
    // Get Ownership By ID
    // =====================

    async getOwnershipById(id) {

        const ownership =
            await ownershipRepository.getOwnershipById(id);


        if (!ownership) {

            throw new AppError(
                "Ownership not found.",
                404
            );

        }


        return ownership;

    }


    // =====================
    // Update Ownership
    // =====================

    async updateOwnership(id, data) {

        const existingOwnership =
            await ownershipRepository.getOwnershipById(id);


        if (!existingOwnership) {

            throw new AppError(
                "Ownership not found.",
                404
            );

        }


        // ---------------------
        // Validate Property
        // ---------------------

        if (data.propertyId) {

            const property =
                await propertyRepository.findById(
                    data.propertyId
                );


            if (!property) {

                throw new AppError(
                    "Property not found.",
                    404
                );

            }

        }


        // ---------------------
        // Validate Person
        // ---------------------

        if (data.personId) {

            const person =
                await personRepository.getPersonById(
                    data.personId
                );


            if (!person) {

                throw new AppError(
                    "Person not found.",
                    404
                );

            }

        }


        // ---------------------
        // Validate percentage
        // ---------------------

        if (data.percentage !== undefined) {

            const percentage =
                Number(data.percentage);


            if (
                Number.isNaN(percentage) ||
                percentage <= 0 ||
                percentage > 100
            ) {

                throw new AppError(
                    "percentage must be greater than 0 and at most 100.",
                    400
                );

            }

        }


        // ---------------------
        // Validate dates
        // ---------------------

        if (data.startDate) {

            data.startDate =
                new Date(data.startDate);

        }


        if (data.endDate) {

            data.endDate =
                new Date(data.endDate);

        }


        // ---------------------
        // Convert percentage
        // ---------------------

        if (data.percentage !== undefined) {

            data.percentage =
                Number(data.percentage);

        }


        // ---------------------
        // Update
        // ---------------------

        return await ownershipRepository.updateOwnership(
            id,
            data
        );

    }


    // =====================
    // Delete Ownership
    // =====================

    async deleteOwnership(id) {

        const exists =
            await ownershipRepository.getOwnershipById(id);


        if (!exists) {

            throw new AppError(
                "Ownership not found.",
                404
            );

        }


        await ownershipRepository.deleteOwnership(id);


        return {

            success: true,

            message:
                "Ownership deleted successfully."

        };

    }

}


module.exports = new OwnershipService();