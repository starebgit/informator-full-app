const TED_FALLBACKS = {
    // Diastat D2 should also include SECA machines that are published on D1 TED.
    402: [402, 401],
};

export function getTedQueryList(ted) {
    if (!ted && ted !== 0) return [];

    const numericTed = Number(ted);
    if (!Number.isFinite(numericTed)) return [];

    return TED_FALLBACKS[numericTed] ?? [numericTed];
}
