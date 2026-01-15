import { Injectable } from '@angular/core';
import {HttpClient, HttpParams,} from '@angular/common/http';
import {BehaviorSubject, filter, map, Observable, of, switchMap, take, tap, throwError} from 'rxjs';
import {environment} from 'environments/environment';
import {Event, EventFilter} from "./events.types";
import {Pagination} from "../../pagination.types";

@Injectable({
    providedIn: 'root'
})
export class EventsService {
    eventsApiUrl = `${environment.apiUrl}/api/events`;
    private events: BehaviorSubject<Event[] | null> = new BehaviorSubject(null);
    private event: BehaviorSubject<Event | null> = new BehaviorSubject(null);
    private pagination: BehaviorSubject<Pagination | null> = new BehaviorSubject(null);

    constructor(private http: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    get events$(): Observable<Event[]>
    {
        return this.events.asObservable();
    }

    get event$(): Observable<Event>
    {
        return this.event.asObservable();
    }

    get pagination$(): Observable<Pagination>
    {
        return this.pagination.asObservable();
    }

    getEvents(
        page: number|null,
        limit: number|null,
        sort: string|null = null,
        order: string|null = null,
        eventFilter: EventFilter = null
    ): Observable<{
        pagination: Pagination;
        events: Event[];
    }>
    {
        let params = new HttpParams();

        if (page) params = params.set('page', page.toString());
        if (limit) params = params.set('limit', limit.toString());
        if (sort) params = params.set('sort', sort);
        if (order) params = params.set('order', order);
        if (eventFilter?.name) params = params.set('name', eventFilter?.name);

        return this.http.get<{
            pagination: Pagination;
            events: Event[];
        }>(`${this.eventsApiUrl}`, { params }).pipe(
            tap(response => {
                this.events.next(response.events);
                this.pagination.next(response.pagination);
            })
        );
    }

    getEventById(eventId: number): Observable<Event>
    {
        return this.events.pipe(
            take(1),
            map((events) => {
                // Find the event
                const event = events.find(item => item.id === eventId) || null;

                // Update the event
                this.event.next(event);

                // Return the event
                return event;
            }),
            switchMap((event) => {
                if (!event) {
                    return throwError('Could not found event with id of ' + eventId + '!');
                }

                return of(event);
            })
        );
    }

    createEvent(event: Event, eventImage?: File): Observable<Event>
    {
        const formData = new FormData();
        formData.append('event', JSON.stringify(event));

        if (eventImage) {
            formData.append('eventImage', eventImage);
        }

        return this.events$.pipe(
            take(1),
            switchMap(events => this.http.post<Event>(`${this.eventsApiUrl}`, formData).pipe(
                map((newEvent) => {
                    // Update the events with the new event
                    this.events.next([newEvent, ...events]);

                    // Return the new event
                    return newEvent;
                })
            ))
        );
    }

    updateEvent(eventId: number, event: Event, eventImage?: File): Observable<Event>
    {
        const formData = new FormData();
        formData.append('event', JSON.stringify(event));

        if (eventImage) {
            formData.append('eventImage', eventImage);
        }

        return this.events$.pipe(
            take(1),
            switchMap(events => this.http.post<Event>(`${this.eventsApiUrl}/${eventId}`, formData).pipe(
                map((updatedEvent) => {
                    // Find the index of the updated event
                    const index = events.findIndex(item => item.id === eventId);

                    if (index !== -1) {
                        // Update the event
                        events[index] = updatedEvent;

                        // Update the events
                        this.events.next(events);
                    }

                    // Return the updated event
                    return updatedEvent;
                }),
                switchMap(updatedEvent => this.event$.pipe(
                    take(1),
                    filter(item => item && item.id === eventId),
                    tap(() => {
                        // Update the event if it's selected
                        this.event.next(updatedEvent);

                        // Return the updated event
                        return updatedEvent;
                    })
                ))
            ))
        );
    }

    deleteEvent(eventId: number): Observable<void>
    {
        return this.events$.pipe(
            take(1),
            switchMap(events => this.http.delete(`${this.eventsApiUrl}/${eventId}`).pipe(
                map(() => {
                    // Find the index of the deleted event
                    const index = events.findIndex(item => item.id === eventId);

                    // Delete the event
                    events.splice(index, 1);

                    // Update the events
                    this.events.next(events);
                })
            ))
        );
    }

    deleteEventImage(eventId: number): Observable<void>
    {
        return this.http.delete<void>(`${this.eventsApiUrl}/${eventId}/image`);
    }
}
