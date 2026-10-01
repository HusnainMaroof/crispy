import { resolvePage } from "../../src/utils/pagination.js";

/**
 * A PageRequest for tests that are not themselves about paging.
 * resolvePage is the same function the controllers use, so these tests cannot
 * drift from the defaults a real request would get.
 */
export const FIRST_PAGE = resolvePage(undefined);

export { resolvePage };
