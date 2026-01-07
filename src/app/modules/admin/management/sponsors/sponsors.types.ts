import {Person} from "../person.types";

export interface Sponsor {
    id: number;
    name: string;
    description: string;
    filePath: string;
    alt: string;
    displayWebsite: boolean;
    contact: Person;
    createdAt: Date;
    updatedAt: Date;
    sponsorships: Sponsorship[];
    links: Link[];
}

export interface Sponsorship {
    id: number;
    sponsor: Sponsor;
    contractFilePath: string;
    status: string;
    sponsorshipCounterparts: SponsorshipCounterpart[];
}

export interface SponsorshipCounterpart {
    id: number;
    counterpartType: string;
    amount: number;
    otherCounterpart: string;
}

export interface SponsorFilters {
    name: string;
    contact: string;
    status: string;
    counterpartType: string;
    minAmount: number;
    maxAmount: number;
    otherCounterpart: string;
    hasContract: boolean;
}

export interface Link {
    id: number;
    url: string;
    linkType: LinkType;
}

export interface LinkType {
    id: number;
    name: string;
}
