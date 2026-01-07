import { Injectable } from '@angular/core';
import {HttpClient, HttpParams,} from '@angular/common/http';
import {BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError} from 'rxjs';
import {environment} from 'environments/environment';
import {LinkType, Sponsor, SponsorFilters} from "./sponsors.types";
import {Pagination} from "../../pagination.types";

@Injectable({
    providedIn: 'root'
})
export class SponsorsService {
    sponsorApiUrl = `${environment.apiUrl}/api/sponsors`;
    linkTypeApiUrl = `${environment.apiUrl}/api/link-types`;
    private sponsors: BehaviorSubject<Sponsor[] | null> = new BehaviorSubject(null);
    private sponsor: BehaviorSubject<Sponsor | null> = new BehaviorSubject(null);
    private pagination: BehaviorSubject<Pagination | null> = new BehaviorSubject(null);
    private linkTypes: BehaviorSubject<LinkType[] | null> = new BehaviorSubject(null);

    constructor(private http: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    get sponsors$(): Observable<Sponsor[]>
    {
        return this.sponsors.asObservable();
    }

    get sponsor$(): Observable<Sponsor>
    {
        return this.sponsor.asObservable();
    }

    get pagination$(): Observable<Pagination>
    {
        return this.pagination.asObservable();
    }

    get linkTypes$(): Observable<LinkType[]>
    {
        return this.linkTypes.asObservable();
    }

    getSponsors(
        page: number|null,
        limit: number|null,
        sort: string|null = null,
        order: string|null = null,
        sponsorFilters: SponsorFilters = null
    ): Observable<{
        pagination: Pagination;
        sponsors: Sponsor[];
    }>
    {
        let params = new HttpParams();

        if (page) params = params.set('page', page.toString());
        if (limit) params = params.set('limit', limit.toString());
        if (sort) params = params.set('sort', sort);
        if (order) params = params.set('order', order);
        if (sponsorFilters?.name) params = params.set('name', sponsorFilters?.name);
        if (sponsorFilters?.contact) params = params.set('contact', sponsorFilters?.contact);
        if (sponsorFilters?.status) params = params.set('status', sponsorFilters?.status);
        if (sponsorFilters?.counterpartType) params = params.set('counterpartType', sponsorFilters?.counterpartType);
        if (sponsorFilters?.minAmount) params = params.set('minAmount', sponsorFilters?.minAmount.toString());
        if (sponsorFilters?.maxAmount) params = params.set('maxAmount', sponsorFilters?.maxAmount.toString());
        if (sponsorFilters?.otherCounterpart) params = params.set('otherCounterpart', sponsorFilters?.otherCounterpart);
        if (sponsorFilters?.hasContract) params = params.set('hasContract', sponsorFilters?.hasContract.toString());

        return this.http.get<{
            pagination: Pagination;
            sponsors: Sponsor[];
        }>(`${this.sponsorApiUrl}`, { params }).pipe(
            tap(response => {
                this.sponsors.next(response.sponsors);
                this.pagination.next(response.pagination);
            })
        );
    }

    getSponsorById(sponsorId: number): Observable<Sponsor>
    {
        return this.sponsors.pipe(
            take(1),
            map((sponsors) => {
                // Find the sponsor
                const sponsor = sponsors.find(item => item.id === sponsorId) || null;

                // Update the sponsor
                this.sponsor.next(sponsor);

                // Return the sponsor
                return sponsor;
            }),
            switchMap((sponsor) => {
                if (!sponsor) {
                    return throwError('Could not found sponsor with id of ' + sponsorId + '!');
                }

                return of(sponsor);
            })
        );;
    }

    createSponsor(sponsor: any, sponsorImage?: File, contractFiles: File[] = []): Observable<Sponsor>
    {
        const formData = new FormData();
        formData.append('sponsor', JSON.stringify(sponsor));

        if (sponsorImage) {
            formData.append('sponsorImage', sponsorImage);
        }
        contractFiles.forEach((file, index) => {
            formData.append(`contractFiles[${index}]`, file);
        });

        return this.sponsors$.pipe(
            take(1),
            switchMap(sponsors => this.http.post<Sponsor>(`${this.sponsorApiUrl}`, formData).pipe(
                map((newSponsor) => {
                    // Update the sponsors with the new sponsor
                    this.sponsors.next([newSponsor, ...sponsors]);

                    // Return the new sponsor
                    return newSponsor;
                })
            ))
        );
    }

    updateSponsor(sponsorId: number, sponsor: any, sponsorImage?: File, contractFiles: File[] = []): Observable<Sponsor>
    {
        const formData = new FormData();
        formData.append('sponsor', JSON.stringify(sponsor));

        if (sponsorImage) {
            formData.append('sponsorImage', sponsorImage);
        }

        contractFiles.forEach((file, index) => {
            formData.append(`contractFiles[${index}]`, file);
        });

        return this.sponsors$.pipe(
            take(1),
            switchMap(sponsors => this.http.post<Sponsor>(`${this.sponsorApiUrl}/${sponsorId}`, formData).pipe(
                map((updatedSponsor) => {
                    // Find the index of the updated sponsor
                    const index = sponsors.findIndex(item => item.id === sponsorId);

                    if (index === -1) {
                        // Update the sponsor
                        sponsors[index] = updatedSponsor;

                        // Update the sponsors
                        this.sponsors.next(sponsors);
                    }

                    // Return the updated sponsor
                    return updatedSponsor;
                }),
                switchMap(updatedSponsor => this.sponsor$.pipe(
                    take(1),
                    filter(item => item && item.id === sponsorId),
                    tap(() => {
                        // Update the sponsor if it's selected
                        this.sponsor.next(updatedSponsor);

                        // Return the updated sponsor
                        return updatedSponsor;
                    })
                ))
            ))
        );
    }

    deleteSponsor(sponsorId: number): Observable<void>
    {
        return this.sponsors$.pipe(
            take(1),
            switchMap(sponsors => this.http.delete(`${this.sponsorApiUrl}/${sponsorId}`).pipe(
                map(() => {
                    // Find the index of the deleted sponsor
                    const index = sponsors.findIndex(item => item.id === sponsorId);

                    // Delete the sponsor
                    sponsors.splice(index, 1);

                    // Update the sponsors
                    this.sponsors.next(sponsors);
                })
            ))
        );
    }

    deleteSponsorImage(sponsorId: number): Observable<void>
    {
        return this.http.delete<void>(`${this.sponsorApiUrl}/image/${sponsorId}`);
    }

    deleteContractFile(sponsorshipId: number): Observable<void>
    {
        return this.http.delete<void>(`${this.sponsorApiUrl}/contract/${sponsorshipId}`);
    }

    getLinkTypes(): Observable<LinkType[]> {
        return this.http.get<LinkType[]>(this.linkTypeApiUrl).pipe(
            tap(linkTypes => {
                this.linkTypes.next(linkTypes);
            })
        );
    }
}
