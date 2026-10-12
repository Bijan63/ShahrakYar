const AppError = require("../utils/AppError");
const prisma = require("../config/prisma");

const accessService = require("./access.service");
const userRepository = require("../repositories/user.repository");

class ElectionAccessService {
    /**
     * Returns:
     *   null  => global access (ADMIN)
     *   []    => no accessible complexes
     *   [...] => accessible complex IDs
     */
    async getReadableComplexIds(user) {
        const currentUser = await accessService.getCurrentUser(user);

        if (currentUser.status !== "ACTIVE") {
            return [];
        }

        if (currentUser.role === "ADMIN") {
            return null;
        }

        if (currentUser.role === "MANAGER") {
            return await accessService.getAccessibleComplexIds(user);
        }

        if (currentUser.role !== "USER") {
            return [];
        }

        const fullUser = await userRepository.findByIdWithPerson(
            currentUser.id
        );

        if (
            !fullUser ||
            fullUser.status !== "ACTIVE" ||
            !fullUser.person ||
            fullUser.person.status !== "ACTIVE"
        ) {
            return [];
        }

        const now = new Date();

        const ownerships = await prisma.ownership.findMany({
            where: {
                personId: fullUser.person.id,
                percentage: {
                    gt: 0
                },
                startDate: {
                    lte: now
                },
                OR: [
                    {
                        endDate: null
                    },
                    {
                        endDate: {
                            gt: now
                        }
                    }
                ]
            },
            select: {
                property: {
                    select: {
                        complexId: true
                    }
                }
            }
        });

        return [
            ...new Set(
                ownerships
                    .map((ownership) => ownership.property?.complexId)
                    .filter(Boolean)
            )
        ];
    }

    async assertCanReadElection(user, election) {
        if (!election) {
            throw new AppError("Election not found.", 404);
        }

        const complexIds = await this.getReadableComplexIds(user);

        // ADMIN has global access, including legacy elections
        // that do not yet have a complexId.
        if (complexIds === null) {
            return true;
        }

        if (
            !election.complexId ||
            !complexIds.includes(election.complexId)
        ) {
            throw new AppError("Election not found.", 404);
        }

        return true;
    }

    async assertCanManageElection(user, election) {
        if (!election) {
            throw new AppError("Election not found.", 404);
        }

        const currentUser = await accessService.getCurrentUser(user);

        if (currentUser.status !== "ACTIVE") {
            throw new AppError("Forbidden.", 403);
        }

        // ADMIN has global access, including legacy elections
        // that do not have a complexId.
        if (currentUser.role === "ADMIN") {
            return true;
        }

        // Only MANAGER may manage elections below.
        if (currentUser.role !== "MANAGER") {
            throw new AppError("Forbidden.", 403);
        }

        if (!election.complexId) {
            throw new AppError(
                "Election must be assigned to a Complex before it can be managed.",
                409
            );
        }

        await accessService.requireComplexAccess(
            user,
            election.complexId
        );

        return true;
    }
}

module.exports = new ElectionAccessService();
