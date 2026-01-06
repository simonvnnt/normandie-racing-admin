import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, ReplaySubject, switchMap, take, tap } from 'rxjs';
import { Notification } from 'app/layout/common/notifications/notifications.types';

@Injectable({
    providedIn: 'root'
})
export class NotificationsService
{
    private _notifications: ReplaySubject<Notification[]> = new ReplaySubject<Notification[]>(1);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for notifications
     */
    /*get notifications$(): Observable<Notification[]>
    {
        return this._notifications.asObservable();
    }*/

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all notifications
     */
    getAll(): any
    {
        // TODO
    }

    /**
     * Create a notification
     *
     * @param notification
     */
    create(notification: Notification): any
    {
        // TODO
    }

    /**
     * Update the notification
     *
     * @param id
     * @param notification
     */
    update(id: string, notification: Notification): any
    {
        // TODO
    }

    /**
     * Delete the notification
     *
     * @param id
     */
    delete(id: string): any
    {
        // TODO
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): any
    {
        // TODO
    }
}
