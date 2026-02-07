import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {
    FormBuilder,
    ReactiveFormsModule,
    UntypedFormGroup,
} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {MatButton, MatIconAnchor} from "@angular/material/button";
import {
    debounceTime,
    map,
    Observable,
    Subject,
    takeUntil
} from "rxjs";
import {customPaginator} from "app/core/utils/customPaginator";
import {MatPaginator, MatPaginatorIntl} from "@angular/material/paginator";
import {MatSort, MatSortHeader} from "@angular/material/sort";
import {FuseMediaWatcherService} from "@fuse/services/media-watcher";
import {MatDrawer, MatSidenavModule} from "@angular/material/sidenav";
import {ActivatedRoute, Router, RouterLink, RouterOutlet} from "@angular/router";
import {EventsService} from "../events.service";
import {FuseConfirmationService} from "../../../../../../@fuse/services/confirmation";
import {Pagination} from "../../../pagination.types";
import {AsyncPipe, DatePipe} from "@angular/common";
import {MatTooltipModule} from "@angular/material/tooltip";
import {Event, EventFilter} from "../events.types";
import {StorageService} from "../../../../../core/storage/storage.service";
import {environment} from "../../../../../../environments/environment";

@Component({
    selector: 'events-list',
    templateUrl: './list.component.html',
    styles: [
        `
            .events-grid {
                grid-template-columns: 64px auto 60px 150px 150px 60px;
            }
        `,
    ],
    providers: [
        { provide: MatPaginatorIntl, useValue: customPaginator() },
    ],
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatInputModule,
        MatIconModule,
        MatButton,
        RouterOutlet,
        MatSidenavModule,
        RouterLink,
        AsyncPipe,
        MatPaginator,
        MatSort,
        MatSortHeader,
        MatTooltipModule,
        DatePipe,
        MatIconAnchor,
    ]
})
export class EventsListComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) private sort: MatSort;
    filtersForm: UntypedFormGroup;
    pagination: Pagination;
    events$: Observable<Event[]>;
    drawerMode: 'side' | 'over';
    private unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private eventsService: EventsService,
        private storageService: StorageService,
        private formBuilder: FormBuilder,
        private fuseMediaWatcherService: FuseMediaWatcherService,
        private fuseConfirmationService: FuseConfirmationService,
        private changeDetectorRef: ChangeDetectorRef,
        private activatedRoute: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit(): void
    {
        this.filtersForm = this.formBuilder.group({
            name: [null],
        });

        this.saveFilterForm();
        this.inputValueChanges();

        // Subscribe to media query change
        this.fuseMediaWatcherService
            .onMediaQueryChange$('(min-width: 1440px)')
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((state) => {
                // Calculate the drawer mode
                this.drawerMode = state.matches ? 'side' : 'over';

                // Mark for check
                this.changeDetectorRef.markForCheck();
            });

        this.events$ = this.eventsService.events$;

        this.eventsService.pagination$
            .pipe(takeUntil(this.unsubscribeAll))
            .subscribe((pagination: Pagination) => {
                // Update the pagination
                this.pagination = pagination;

                // Mark for check
                this.changeDetectorRef.markForCheck();
            });
    }

    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this.unsubscribeAll.next(null);
        this.unsubscribeAll.complete();
    }

    ngAfterViewInit(): void
    {
        if (this.paginator) {
            this.paginator.page.subscribe({
                next: () => {
                    this.getEvents().subscribe();
                }
            })
        }
    }

    sortChange(): void
    {
        if (this.paginator) {
            // Reset back to the first page
            this.paginator.pageIndex = 0;
        }

        this.getEvents().subscribe();
    }

    getEvents()
    {
        const eventFilter = this.filtersForm.getRawValue();

        return this.eventsService.getEvents(
            (this.paginator?.pageIndex ?? 0)+1,
            this.paginator?.pageSize ?? 50,
            this.sort?.active,
            this.sort?.direction,
            eventFilter
        );
    }

    /**
     * Delete the event using the form data
     */
    deleteEvent(eventId: number): void
    {
        // Open the confirmation dialog
        const confirmation = this.fuseConfirmationService.open({
            title  : 'Supprimer l\'événement',
            message: 'Êtes-vous sûr de vouloir supprimer cette événement ? Cette action est irréversible.',
            actions: {
                confirm: {
                    label: 'Supprimer',
                },
                cancel: {
                    label: 'Annuler',
                }
            }
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            if (result === 'confirmed') {
                // Delete the event on the server
                this.eventsService.deleteEvent(eventId).subscribe();
            }
        });
    }

    getFilePath(path: string): string
    {
        if (!path) {
            return null;
        }

        return environment.apiUrl + '/' + path;
    }

    saveFilterForm(): void
    {
        let savedFilterForm: EventFilter = this.storageService.getInLocalStorage('eventsFilters');

        if (!savedFilterForm || !this.haveSameKeys(savedFilterForm, this.filtersForm.controls)) {
            this.storageService.setInLocalStorage('eventsFilters', this.filtersForm.getRawValue());
        }

        savedFilterForm = this.storageService.getInLocalStorage('eventsFilters');

        this.filtersForm.setValue(savedFilterForm);
    }

    inputValueChanges(): void
    {
        // Subscribe to search input field value changes
        this.filtersForm.valueChanges
            .pipe(
                takeUntil(this.unsubscribeAll),
                debounceTime(800),
                map((filters) => {
                    this.storageService.setInLocalStorage('eventsFilters', filters);

                    return this.getEvents().subscribe();
                }),
            )
            .subscribe();
    }

    onBackdropClick(): void
    {
        // Go back to the list
        this.router.navigate(['./'], { relativeTo: this.activatedRoute });

        // Mark for check
        this.changeDetectorRef.markForCheck();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

    private haveSameKeys(obj1: object, obj2: object): boolean {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        return (
            keys1.length === keys2.length &&
            keys1.every((key) => keys2.includes(key))
        );
    }
}
