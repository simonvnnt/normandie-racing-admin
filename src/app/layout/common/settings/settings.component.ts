import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {FuseConfig, FuseConfigService, Scheme, Theme} from '@fuse/services/config';
import {FuseDrawerComponent} from '@fuse/components/drawer';
import { MatIconModule } from '@angular/material/icon';
import { NgClass, NgFor } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector     : 'settings',
    templateUrl  : './settings.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone   : true,
    imports      : [MatIconModule, FuseDrawerComponent, NgFor, NgClass, MatTooltipModule],
})
export class SettingsComponent implements OnInit, OnDestroy
{
    config: FuseConfig;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _fuseConfigService: FuseConfigService
    )
    {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {

                // Store the config
                this.config = config;
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set the scheme on the config
     *
     * @param scheme
     */
    setScheme(scheme: Scheme): void
    {
        localStorage.setItem('scheme', scheme);
        this._fuseConfigService.config = {scheme};
    }

    /**
     * Set the theme on the config
     *
     * @param theme
     */
    setTheme(theme: Theme): void
    {
        localStorage.setItem('theme', theme);
        this._fuseConfigService.config = {theme};
    }
}
