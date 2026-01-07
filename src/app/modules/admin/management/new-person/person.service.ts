import { Injectable } from '@angular/core';
import {HttpClient, HttpParams,} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from 'environments/environment';
import {Pagination} from "../../pagination.types";
import {Person} from "../person.types";

@Injectable({
    providedIn: 'root'
})
export class PersonService {
    personApiUrl = `${environment.apiUrl}/api/persons`;

    constructor(private http: HttpClient) {}

    getPersons(
        page: number|null,
        limit: number|null,
        sort: string|null = null,
        order: string|null = null,
        person: string|null = null
    ): Observable<{
        pagination: Pagination;
        persons: Person[];
    }>
    {
        let params = new HttpParams();

        if (page) params = params.set('page', page.toString());
        if (limit) params = params.set('limit', limit.toString());
        if (sort) params = params.set('sort', sort);
        if (order) params = params.set('order', order);
        if (person) params = params.set('person', person);

        return this.http.get<{
            pagination: Pagination;
            persons: Person[];
        }>(`${this.personApiUrl}`, { params });
    }

    createPerson(person: any): Observable<Person>
    {
        return this.http.post<Person>(`${this.personApiUrl}`, person);
    }
}
