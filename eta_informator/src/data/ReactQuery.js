import { QueryClient, useMutation, useQuery } from "react-query";
import {
    getTypesLabels,
    getAccidents,
    getAccidentsByYear,
    getCauses,
    getMachines,
    getSettings,
    getUnits,
    getSubunitsLabels,
    getUnitsLabels,
    patchSettings,
    getRolesLabels,
    getKeywordsLabels,
    getLastIndicator,
    getMachinesAll,
    getReports,
    getOrders,
    getAllAccidents,
    getApprovers,
    getFlawLocations,
    getFlaws,
    getInputLocations,
    getScraps,
    getInputLocationMachines,
    getInputLocation,
    getPaginatedScraps,
} from "./API/Informator/InformatorAPI";
import { getMachineGroups } from "./API/Informator/InformatorAPI";
import { getCastingProgram, getFoundryForms } from "./API/Dreamreport/DreamreportAPI";
import {
    getCasts,
    getClips,
    getFireclays,
    getLastSync,
    getProtectors,
    getRings,
    getSpirals,
} from "./API/Sinapro/SinaproAPI";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 0,
        },
    },
});

export function useUnits() {
    return useQuery("units", getUnits);
}

export function useSubunitsLabels(options) {
    return useQuery("unitsLabels", getSubunitsLabels, { ...options });
}

export function useUnitsLabels(options) {
    return useQuery("onlyUnitsLabels", getUnitsLabels, { ...options });
}

export function useMachineGroups(subunitId, options) {
    return useQuery(
        ["machineGroups", subunitId == undefined ? "all" : subunitId],
        () => getMachineGroups(subunitId),
        {
            ...options,
        },
    );
}

export function useMachines(ted, options) {
    return useQuery(["machines", ted], () => getMachines(ted), {
        enabled: !!ted,
        ...options,
    });
}

export function useMachinesAll(options) {
    return useQuery(["machines"], () => getMachinesAll(), {
        ...options,
    });
}

export function usePatchSettings() {
    return useMutation((newSetting) => patchSettings(newSetting));
}

export function useAllAccidents(subunitId = 0, options) {
    return useQuery(["accidents", subunitId], () => getAllAccidents(), {
        ...options,
    });
}

export function useAccidents(subunitId, options) {
    return useQuery(["accidents", subunitId], () => getAccidents(subunitId), {
        enabled: !!subunitId,
        ...options,
    });
}

export function useAccidentsByYear(subunitId, year, options) {
    return useQuery(
        ["accidents", subunitId, year.format("YYYY")],
        () => getAccidentsByYear(subunitId, year),
        {
            enabled: !!year,
            ...options,
        },
    );
}

export function useSettings(userId, options) {
    return useQuery(["userSettings", userId], () => getSettings(userId), {
        enabled: !!userId,
        ...options,
    });
}

export function useTypesLabels(options = {}) {
    return useQuery(["typesLabels"], () => getTypesLabels(), {
        ...options,
    });
}

export function useKeywordsLabels(options = {}) {
    return useQuery(["keywordsLabels"], () => getKeywordsLabels(), {
        ...options,
    });
}

export function useLastIndicator(subunitId) {
    return useQuery(["lastIndicator", subunitId], () => getLastIndicator(subunitId));
}

export function useRolesLabels(options = {}) {
    return useQuery("rolesLabels", () => getRolesLabels(), {
        ...options,
    });
}

export function useCauses() {
    return useQuery("causes", () => getCauses());
}

export function useFlawLocations(key = [], query = {}, options = {}) {
    return useQuery(["flawsLocations", ...key], () => getFlawLocations(query), { ...options });
}

export function useApprovers(options = {}) {
    return useQuery(["approvers"], () => getApprovers(), { ...options });
}

export function useFlaws(
    key = [],
    query = {},
    filter = (data) => data.filter((flaw) => true),
    options = {},
) {
    return useQuery(["flaws", ...key], () => getFlaws(query, filter), { ...options });
}

export function useScraps(key = [], query = {}, options = {}) {
    return useQuery(["scraps", ...key], () => getScraps(query), { ...options });
}

export function usePaginatedScraps(key = [], query = {}, options = {}) {
    return useQuery(["scraps", ...key], () => getPaginatedScraps(query), { ...options });
}

export function useInputLocations(subunitId, options = {}) {
    return useQuery(
        ["inputLocations", subunitId],
        () =>
            getInputLocations(
                subunitId != undefined
                    ? {
                          query: {
                              subunitId: subunitId,
                          },
                      }
                    : {},
            ),
        { ...options },
    );
}

export function useInputLocation(id, options = {}) {
    return useQuery(["inputLocation", id], () => getInputLocation(id), {
        ...options,
        enabled: !!id,
    });
}

export function useInputLocationMachines(locationId, options = {}) {
    return useQuery(
        ["inputLocationMachines", locationId],
        () => getInputLocationMachines({ query: { locationId: locationId } }),
        {
            enabled: !!locationId && locationId != null,
            ...options,
        },
    );
}

export function useReports(options = {}) {
    return useQuery(["eOrodjarna", "reports"], () => getReports(), {
        ...options,
    });
}

export function useOrders(archive = false, options) {
    return useQuery(
        ["eOrodjarna", archive ? "archive" : "active", "orders"],
        () => getOrders(archive),
        {
            ...options,
        },
    );
}

export function useFoundryForms(startDate, endDate, options = {}) {
    return useQuery(
        ["foundry forms", startDate.format("DD-MM-YYYY"), endDate.format("DD-MM-YYYY")],
        () => getFoundryForms(startDate, endDate),
        { ...options },
    );
}

export function useCastingProgram(options = {}) {
    return useQuery(["castingProgram"], () => getCastingProgram(), { ...options });
}

export function useCasts(options = {}) {
    return useQuery(["casts"], () => getCasts(), { ...options });
}

export function useRings(options = {}) {
    return useQuery(["rings"], () => getRings(), { ...options });
}

export function useClips(options = {}) {
    return useQuery(["clips"], () => getClips(), { ...options });
}

export function useProtectors(options = {}) {
    return useQuery(["protectors"], () => getProtectors(), { ...options });
}

export function useFireclays(options = {}) {
    return useQuery(["fireclays"], () => getFireclays(), { ...options });
}

export function useSpirals(options = {}) {
    return useQuery(["spirals"], () => getSpirals(), { ...options });
}

export function useLastSync(options = {}) {
    return useQuery(["last-sync"], () => getLastSync(), { ...options });
}

export default queryClient;
