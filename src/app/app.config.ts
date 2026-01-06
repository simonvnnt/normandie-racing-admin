import {LOCALE_ID} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideFuse } from '@fuse';
import { appRoutes } from 'app/app.routes';
import { provideAuth } from 'app/core/auth/auth.provider';
import { provideIcons } from 'app/core/icons/icons.provider';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {LuxonDateAdapter} from "@angular/material-luxon-adapter";
import {provideNgxSkeletonLoader} from "ngx-skeleton-loader";

export const appConfig: ApplicationConfig = {
    providers: [
        provideAnimations(),
        provideHttpClient(),
        provideRouter(appRoutes,
            withPreloading(PreloadAllModules),
            withInMemoryScrolling({scrollPositionRestoration: 'enabled'}),
        ),
        provideNgxSkeletonLoader({
            theme: {
                extendsFromRoot: true,
                height: '30px',
            },
        }),

        {
            provide : LOCALE_ID,
            useValue: 'fr'
        },


        // Material Date Adapter
        {
            provide : DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide: MAT_DATE_LOCALE,
            useValue: 'fr-FR'
        },
        {
            provide : MAT_DATE_FORMATS,
            useValue: {
                parse  : {
                    dateInput: 'D'
                },
                display: {
                    dateInput         : 'D',
                    monthYearLabel    : 'LLL yyyy',
                    dateA11yLabel     : 'D',
                    monthYearA11yLabel: 'LLLL yyyy'
                }
            }
        },

        // Fuse
        provideAuth(),
        provideIcons(),
        provideFuse({
            fuse   : {
                layout: 'classic',
                scheme : 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme  : 'theme-nr',
                themes : [
                    {
                        id  : 'theme-nr',
                        name: 'Normandie Racing',
                    },
                    {
                        id  : 'theme-default',
                        name: 'Indigo',
                    },
                    {
                        id  : 'theme-brand',
                        name: 'Blue',
                    },
                    {
                        id  : 'theme-teal',
                        name: 'Teal',
                    },
                    {
                        id  : 'theme-rose',
                        name: 'Rose',
                    },
                    {
                        id  : 'theme-purple',
                        name: 'Purple',
                    },
                    {
                        id  : 'theme-amber',
                        name: 'Amber',
                    },
                ],
            },
        }),
    ],
};
