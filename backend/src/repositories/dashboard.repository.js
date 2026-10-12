const prisma = require("../config/prisma");

class DashboardRepository {
    async getStatistics(options = {}) {
        const scoped = Array.isArray(options.complexIds);
        const complexIds = scoped ? options.complexIds : [];

        const complexWhere = scoped
            ? { id: { in: complexIds } }
            : {};

        const propertyWhere = (extra = {}) => ({
            ...(scoped ? { complexId: { in: complexIds } } : {}),
            ...extra,
        });

        const ownershipWhere = (extra = {}) => ({
            ...extra,
            ...(scoped
                ? {
                    property: {
                        is: {
                            complexId: { in: complexIds },
                        },
                    },
                }
                : {}),
        });

        const residencyWhere = (extra = {}) => ({
            ...extra,
            ...(scoped
                ? {
                    property: {
                        is: {
                            complexId: { in: complexIds },
                        },
                    },
                }
                : {}),
        });

        const electionWhere = (extra = {}) => ({
            ...extra,
            ...(scoped
                ? { complexId: { in: complexIds } }
                : {}),
        });

        const candidateWhere = (extra = {}) => ({
            ...extra,
            ...(scoped
                ? {
                    election: {
                        is: {
                            complexId: { in: complexIds },
                        },
                    },
                }
                : {}),
        });

        const voteWhere = (extra = {}) => ({
            ...extra,
            ...(scoped
                ? {
                    election: {
                        is: {
                            complexId: { in: complexIds },
                        },
                    },
                }
                : {}),
        });

        // Count only people connected to properties or elections
        // within the manager's assigned complexes.
        const personWhere = scoped
            ? {
                OR: [
                    {
                        ownerships: {
                            some: {
                                property: {
                                    is: {
                                        complexId: { in: complexIds },
                                    },
                                },
                            },
                        },
                    },
                    {
                        residencies: {
                            some: {
                                property: {
                                    is: {
                                        complexId: { in: complexIds },
                                    },
                                },
                            },
                        },
                    },
                    {
                        candidates: {
                            some: {
                                election: {
                                    is: {
                                        complexId: { in: complexIds },
                                    },
                                },
                            },
                        },
                    },
                    {
                        votes: {
                            some: {
                                election: {
                                    is: {
                                        complexId: { in: complexIds },
                                    },
                                },
                            },
                        },
                    },
                ],
            }
            : {};

        const [
            complexes,
            properties,
            villas,
            lands,
            apartments,
            commercials,
            persons,
            ownerships,
            residencies,
            ownerResidents,
            tenantResidents,
            activeElections,
            candidates,
            votes,
            builtProperties,
            underConstructionProperties,
            vacantProperties,
            activeOwnerships,
            propertiesWithActiveOwner,
            propertiesWithoutActiveOwner,
            activeResidencies,
            activeOwnerResidencies,
            activeTenantResidencies,
            activeFamilyResidencies,
            propertiesWithoutActiveResidency,
            uniqueVoters,
        ] = await Promise.all([
            prisma.complex.count({
                where: complexWhere,
            }),

            prisma.property.count({
                where: propertyWhere(),
            }),

            prisma.property.count({
                where: propertyWhere({
                    propertyType: "VILLA",
                }),
            }),

            prisma.property.count({
                where: propertyWhere({
                    propertyType: "LAND",
                }),
            }),

            prisma.property.count({
                where: propertyWhere({
                    propertyType: "APARTMENT",
                }),
            }),

            prisma.property.count({
                where: propertyWhere({
                    propertyType: "COMMERCIAL",
                }),
            }),

            prisma.person.count({
                where: personWhere,
            }),

            prisma.ownership.count({
                where: ownershipWhere(),
            }),

            prisma.residency.count({
                where: residencyWhere(),
            }),

            prisma.residency.count({
                where: residencyWhere({
                    type: "OWNER",
                }),
            }),

            prisma.residency.count({
                where: residencyWhere({
                    type: "TENANT",
                }),
            }),

            prisma.election.count({
                where: electionWhere({
                    status: "OPEN",
                }),
            }),

            prisma.candidate.count({
                where: candidateWhere(),
            }),

            prisma.vote.count({
                where: voteWhere(),
            }),

            prisma.property.count({
                where: propertyWhere({
                    status: "BUILT",
                }),
            }),

            prisma.property.count({
                where: propertyWhere({
                    status: "UNDER_CONSTRUCTION",
                }),
            }),

            prisma.property.count({
                where: propertyWhere({
                    status: "VACANT",
                }),
            }),

            prisma.ownership.count({
                where: ownershipWhere({
                    endDate: null,
                }),
            }),

            prisma.property.count({
                where: propertyWhere({
                    ownerships: {
                        some: {
                            endDate: null,
                        },
                    },
                }),
            }),

            prisma.property.count({
                where: propertyWhere({
                    ownerships: {
                        none: {
                            endDate: null,
                        },
                    },
                }),
            }),

            prisma.residency.count({
                where: residencyWhere({
                    endDate: null,
                }),
            }),

            prisma.residency.count({
                where: residencyWhere({
                    endDate: null,
                    type: "OWNER",
                }),
            }),

            prisma.residency.count({
                where: residencyWhere({
                    endDate: null,
                    type: "TENANT",
                }),
            }),

            prisma.residency.count({
                where: residencyWhere({
                    endDate: null,
                    type: "FAMILY",
                }),
            }),

            prisma.property.count({
                where: propertyWhere({
                    residencies: {
                        none: {
                            endDate: null,
                        },
                    },
                }),
            }),

            prisma.vote.groupBy({
                by: ["voterId"],
                where: voteWhere(),
            }).then(result => result.length),
        ]);

        return {
            complexes,
            properties,

            propertyTypes: {
                villas,
                lands,
                apartments,
                commercials,
            },

            persons,
            ownerships,
            residencies,
            ownerResidents,
            tenantResidents,
            activeElections,
            candidates,
            votes,

            propertyStatus: {
                built: builtProperties,
                underConstruction: underConstructionProperties,
                vacant: vacantProperties,
            },

            ownershipStatus: {
                active: activeOwnerships,
                propertiesWithActiveOwner,
                propertiesWithoutActiveOwner,
            },

            residencyStatus: {
                active: activeResidencies,
                owner: activeOwnerResidencies,
                tenant: activeTenantResidencies,
                family: activeFamilyResidencies,
                propertiesWithoutActiveResidency,
            },

            electionStatistics: {
                uniqueVoters,
            },
        };
    }
}

module.exports = new DashboardRepository();
