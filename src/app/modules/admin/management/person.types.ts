import {Sponsor} from "./sponsors/sponsors.types";

export interface Person {
    id: number;
    uniqueId: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    zipCode: string;
    city: string;
    country: string;
    nationality: string;
    role: string;
    mark: string;
    comment: string;
    warnings: number;
    sponsors: Sponsor[];
    links: Link[];
}

export interface Link {
    id: number;
    name: string;
    url: string;
    linkType: LinkType;
}

export interface LinkType {
    id: number;
    name: string;
}
