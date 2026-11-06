/**
 * Fixed reference hierarchy for Mombasa County: County > Subcounty > Ward.
 * Areas are dynamically created and managed by Ward Leaders within their respective Ward.
 */

export interface WardLocation {
  name: string;
}

export interface SubcountyLocation {
  name: string;
  wards: string[];
}

export interface CountyLocation {
  name: string;
  subcounties: SubcountyLocation[];
}

export const KENYA_LOCATIONS: CountyLocation[] = [
  {
    name: "Mombasa",
    subcounties: [
      {
        name: "Nyali",
        wards: [
          "Frere Town",
          "Ziwa La Ng'ombe",
          "Mkomani",
          "Kongowea",
          "Kadzandani",
        ],
      },
      {
        name: "Mvita",
        wards: [
          "Mji wa Kale/Makadara",
          "Tudor",
          "Tononoka",
          "Shimanzi/Ganjoni",
          "Majengo",
        ],
      },
      {
        name: "Kisauni",
        wards: [
          "Mjambere",
          "Junda",
          "Bamburi",
          "Mwakirunge",
          "Mtopanga",
          "Magogoni",
          "Shanzu",
        ],
      },
      {
        name: "Likoni",
        wards: [
          "Mtongwe",
          "Shika Adabu",
          "Bofu",
          "Likoni",
          "Timbwani",
        ],
      },
      {
        name: "Changamwe",
        wards: [
          "Port Reitz",
          "Kipevu",
          "Airport",
          "Changamwe",
          "Chaani",
        ],
      },
      {
        name: "Jomvu",
        wards: [
          "Jomvu Kuu",
          "Miritini",
          "Mikindani",
        ],
      },
    ],
  },
];

export function getCounties(): string[] {
  return KENYA_LOCATIONS.map((c) => c.name);
}

export function getSubcounties(countyName: string = "Mombasa"): string[] {
  const c = KENYA_LOCATIONS.find((loc) => loc.name.toLowerCase() === countyName.toLowerCase());
  return c ? c.subcounties.map((s) => s.name) : [];
}

export function getWards(subcountyName: string, countyName: string = "Mombasa"): string[] {
  const c = KENYA_LOCATIONS.find((loc) => loc.name.toLowerCase() === countyName.toLowerCase());
  if (!c) return [];
  const s = c.subcounties.find(
    (sub) => sub.name.toLowerCase() === subcountyName.toLowerCase() ||
             subcountyName.toLowerCase().includes(sub.name.toLowerCase())
  );
  return s ? s.wards : [];
}

