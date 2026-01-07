import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guard/auth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { NoAuthGuard } from "./core/auth/guard/noAuth.guard";

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    {
        path: '',
        pathMatch : 'full',
        redirectTo: 'management'
    },
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {
                path: 'login',
                loadChildren: () => import('app/modules/auth/login/login.routes')
            },
        ]
    },
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        children: [
            {
                path: 'management',
                children: [
                    {
                        path      : '',
                        pathMatch : 'full',
                        redirectTo: 'events'
                    },
                    {
                        // Events
                        path: 'events',
                        loadChildren: () => import('app/modules/admin/management/events/events.routes'),
                    },
                    {
                        // Sponsors
                        path: 'sponsors',
                        loadChildren: () => import('app/modules/admin/management/sponsors/sponsors.routes'),
                    }
                ]
            },
        ]
    },
];
