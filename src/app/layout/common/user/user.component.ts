import { ChangeDetectionStrategy, Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NgIf } from '@angular/common';
import {AuthService} from 'app/core/auth/auth.service';
import {RouterLink} from "@angular/router";
import {StorageService} from "../../../core/storage/storage.service";
import {User} from "app//modules/auth/login/types/user.types";

@Component({
    selector       : 'user',
    templateUrl    : './user.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'user',
    standalone     : true,
    imports: [MatButtonModule, MatMenuModule, NgIf, MatIconModule, MatDividerModule, RouterLink],
})
export class UserComponent implements OnInit
{
    @Input() showAvatar: boolean = false;
    user: User;


    /**
     * Constructor
     */
    constructor(
        public auth: AuthService,
        public storage: StorageService,
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
        this.user = this.auth.user;
    }
}
