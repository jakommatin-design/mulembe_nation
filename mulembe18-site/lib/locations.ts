/**
 * Official reference hierarchy for Kenya Locations: County > Subcounty > Ward > Area.
 * Source Citation:
 * - Constitution of Kenya (2010), First Schedule (47 Counties)
 * - Independent Electoral and Boundaries Commission (IEBC) 2012 / 2022 Revised Delimitation of Constituencies and Electoral Wards (Kenya Gazette Notice No. 1014).
 *
 * Areas are dynamically created and managed by Ward Leaders and Administrators within their respective Ward.
 */

import kenyaHierarchyData from "./data/kenya-hierarchy.json";

export const LOCATION_DATA_SOURCE =
  "Constitution of Kenya (2010), First Schedule & Independent Electoral and Boundaries Commission (IEBC) Revised Delimitation of Constituencies and Electoral Wards (Kenya Gazette Notice No. 1014)";

export interface WardLocation {
  code?: number;
  name: string;
}

export interface SubcountyLocation {
  code?: number;
  name: string;
  wards: string[];
}

export interface CountyLocation {
  code?: number;
  name: string;
  capital?: string;
  subcounties: SubcountyLocation[];
}

// Convert JSON hierarchy into typed CountyLocation array
export const KENYA_LOCATIONS: CountyLocation[] = (kenyaHierarchyData as any[]).map((c: any) => ({
  code: c.code,
  name: c.name,
  capital: c.capital,
  subcounties: (c.subcounties || []).map((s: any) => ({
    code: s.code,
    name: s.name,
    wards: (s.wards || []).map((w: any) => (typeof w === "string" ? w : w.name)),
  })),
}));

export const KENYA_COUNTIES = KENYA_LOCATIONS.map((c) => c.name).sort((a, b) => a.localeCompare(b));

export type KenyaCounty = (typeof KENYA_COUNTIES)[number];

export function isValidCounty(county?: string | null): boolean {
  if (!county) return false;
  return KENYA_COUNTIES.some(
    (c) => c.toLowerCase() === county.trim().toLowerCase()
  );
}

export function getCounties(): string[] {
  return [...KENYA_COUNTIES];
}

export function getSubcounties(countyName?: string | null): string[] {
  if (!countyName) return [];
  const clean = countyName.trim().toLowerCase();
  const c = KENYA_LOCATIONS.find((loc) => loc.name.toLowerCase() === clean);
  return c ? c.subcounties.map((s) => s.name).sort((a, b) => a.localeCompare(b)) : [];
}

export function getWards(subcountyName?: string | null, countyName?: string | null): string[] {
  if (!subcountyName) return [];
  const cleanSub = subcountyName.trim().toLowerCase();

  // If county is provided, search within that county
  if (countyName) {
    const cleanCounty = countyName.trim().toLowerCase();
    const c = KENYA_LOCATIONS.find((loc) => loc.name.toLowerCase() === cleanCounty);
    if (c) {
      const s = c.subcounties.find(
        (sub) => sub.name.toLowerCase() === cleanSub || cleanSub.includes(sub.name.toLowerCase())
      );
      if (s) return [...s.wards].sort((a, b) => a.localeCompare(b));
    }
  }

  // Fallback: search across all counties if county wasn't specified
  for (const c of KENYA_LOCATIONS) {
    const s = c.subcounties.find(
      (sub) => sub.name.toLowerCase() === cleanSub || cleanSub.includes(sub.name.toLowerCase())
    );
    if (s) return [...s.wards].sort((a, b) => a.localeCompare(b));
  }

  return [];
}

export function isValidSubcounty(subcountyName: string, countyName?: string | null): boolean {
  const list = getSubcounties(countyName);
  const clean = subcountyName.trim().toLowerCase();
  return list.some((s) => s.toLowerCase() === clean);
}

export function isValidWard(wardName: string, subcountyName?: string | null, countyName?: string | null): boolean {
  const list = getWards(subcountyName, countyName);
  const clean = wardName.trim().toLowerCase();
  return list.some((w) => w.toLowerCase() === clean);
}
