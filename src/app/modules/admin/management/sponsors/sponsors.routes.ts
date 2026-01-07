import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes} from '@angular/router';
import {SponsorCreateComponent} from "./create/create.component";
import {inject} from "@angular/core";
import {catchError, throwError} from "rxjs";
import {SponsorsService} from "./sponsors.service";
import {SponsorListComponent} from "./list/list.component";
import {SponsorEditComponent} from "./edit/edit.component";

/**
 * Can deactivate sponsor
 *
 * @param component
 * @param currentRoute
 * @param currentState
 * @param nextState
 */
const canDeactivateSponsor = (
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

    // If the next state doesn't contain '/sponsors'
    // it means we are navigating away from the sponsors app
    if (!nextState.url.includes('/sponsors')) {
        // Let it navigate
        return true;
    }

    // Otherwise, close the drawer first, and then navigate
    return component.closeDrawer().then(() => true);
};

/**
 * Sponsors resolver
 *
 * @param route
 * @param state
 */
const sponsorsResolver = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const sponsorService = inject(SponsorsService);

    return sponsorService.getSponsors(1, 50);
};

/**
 * Sponsor resolver
 *
 * @param route
 * @param state
 */
const sponsorResolver = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const sponsorsService = inject(SponsorsService);
    const router = inject(Router);

    return sponsorsService.getSponsorById(+route.paramMap.get('id')).pipe(
        // Error here means the requested sponsor is not available
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
        component: SponsorListComponent,
        resolve  : {
            linkTypes: () => inject(SponsorsService).getLinkTypes(),
            sponsors: sponsorsResolver
        },
        children: [
            {
                path     : 'create',
                component: SponsorCreateComponent,
                canDeactivate: [canDeactivateSponsor]
            },
            {
                path     : ':id/edit',
                component: SponsorEditComponent,
                resolve  : {
                    sponsor: sponsorResolver
                },
                canDeactivate: [canDeactivateSponsor]
            }
        ]
    }
] as Routes;

