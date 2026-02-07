export interface Event {
    id: number;
    name: string;
    link: string;
    fromDate: string;
    toDate: string;
    imagePath: string;
}

export interface EventFilter {
    name: string;
}
