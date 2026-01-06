import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FuseFullscreenComponent } from '@fuse/components/fullscreen';
import { FuseLoadingBarComponent } from '@fuse/components/loading-bar';
import {
    FuseNavigationItem,
    FuseNavigationService,
    FuseVerticalNavigationComponent,
} from '@fuse/components/navigation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { NotificationsComponent } from 'app/layout/common/notifications/notifications.component';
import { SearchComponent } from 'app/layout/common/search/search.component';
import { UserComponent } from 'app/layout/common/user/user.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'thin-layout',
    templateUrl: './thin.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        FuseLoadingBarComponent,
        FuseVerticalNavigationComponent,
        MatButtonModule,
        MatIconModule,
        FuseFullscreenComponent,
        SearchComponent,
        NotificationsComponent,
        UserComponent,
        RouterOutlet,
    ],
})
export class ThinLayoutComponent implements OnInit, OnDestroy {
    isScreenSmall: boolean;
    navigationItems: FuseNavigationItem[];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current year
     */
    get currentYear(): number {
        return new Date().getFullYear();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.getNavigationItems();

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getNavigationItems(): void
    {
        this.navigationItems = [
            {
                id      : 'summary',
                title   : 'Dashboard',
                tooltip : 'Dashboard',
                type    : 'basic',
                icon    : 'heroicons_outline:home',
                link    : '/summary'
            },
        ];


        this.navigationItems.push({
            id      : 'products',
            title   : 'Produits',
            tooltip : 'Produits',
            type    : 'basic',
            icon    : 'heroicons_outline:list-bullet',
            link    : '/products'
        });

        this.navigationItems.push({
            id      : 'fulfillment',
            title   : 'Préparations',
            tooltip : 'Préparations',
            type    : 'basic',
            icon    : 'heroicons_outline:cube',
            link    : '/fulfillment'
        });

        this.navigationItems.push({
            id      : 'configuration',
            title   : 'Configuration',
            tooltip : 'Configuration',
            type    : 'basic',
            icon    : 'heroicons_outline:cog',
            link    : '/configuration'
        });
    }

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void {
        // Get the navigation
        const navigation =
            this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(
                name
            );

        if (navigation) {
            // Toggle the opened status
            navigation.toggle();
        }
    }
}
