import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes} from '@angular/router';
import {EventsListComponent} from "./list/list.component";
import {EventCreateComponent} from "./create/create.component";
import {inject} from "@angular/core";
import {EventsService} from "./events.service";
import {EventEditComponent} from "./edit/edit.component";
import {catchError, throwError} from "rxjs";

/**
 * Can deactivate event
 *
 * @param component
 * @param currentRoute
 * @param currentState
 * @param nextState
 */
const canDeactivateEvent = (
    component: any,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
) => {
    // Get the next route
    let nextRoute: ActivatedRouteSnapshot = nextState.root;
    while (nextRoute.firstChild) {
        nextRoute = nextRoute.firstChild;
    }

    // If the next state doesn't contain '/events'
    // it means we are navigating away from the events app
    if (!nextState.url.includes('/events')) {
        // Let it navigate
        return true;
    }

    // Otherwise, close the drawer first, and then navigate
    return component.closeDrawer().then(() => true);
};

/**
 * Events resolver
 *
 * @param route
 * @param state
 */
const eventsResolver = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const eventsService = inject(EventsService);

    return eventsService.getEvents(1, 50);
};

/**
 * Event resolver
 *
 * @param route
 * @param state
 */
const eventResolver = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const eventsService = inject(EventsService);
    const router = inject(Router);

    return eventsService.getEventById(+route.paramMap.get('id')).pipe(
        // Error here means the requested event is not available
        catchError((error) => {
            // Log the error
            console.error(error);

            // Get the parent url
            const parentUrl = state.url.split('/').slice(0, -1).join('/');

            // Navigate to there
            router.navigateByUrl(parentUrl);

            // Throw an error
            return throwError(error);
        })
    );
};


export default [
    {
        path     : '',
        component: EventsListComponent,
        resolve  : {
            commissaireTypes: eventsResolver
        },
        children: [
            {
                path     : 'create',
                component: EventCreateComponent,
                canDeactivate: [canDeactivateEvent]
            },
            {
                path     : ':id/edit',
                component: EventEditComponent,
                resolve  : {
                    event: eventResolver
                },
                canDeactivate: [canDeactivateEvent]
            }
        ]
    }
] as Routes;

