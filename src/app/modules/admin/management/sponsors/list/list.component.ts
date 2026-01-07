import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {
    FormBuilder,
    ReactiveFormsModule,
    UntypedFormGroup,
} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {MatButton} from "@angular/material/button";
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
import {SponsorsService} from "../sponsors.service";
import {FuseConfirmationService} from "@fuse/services/confirmation";
import {Sponsor, SponsorFilters, Sponsorship} from "../sponsors.types";
import {Pagination} from "../../../pagination.types";
import {AsyncPipe, CurrencyPipe} from "@angular/common";
import {MatDivider} from "@angular/material/divider";
import {MatTooltipModule} from "@angular/material/tooltip";
import {environment} from "environments/environment";
import {StorageService} from "../../../../../core/storage/storage.service";
import {capitalizeFirstLetter} from "../../../../../core/utils/tool";

@Component({
    selector: 'sponsor-list',
    templateUrl: './list.component.html',
    styles: [
        `
            .sponsor-titles-grid {
                grid-template-columns: 40px 60px auto 140px 200px 130px 180px 60px;
            }

            .sponsor-grid {
                grid-template-columns: 40px 60px auto 140px fit-content(100%) 60px;
            }

            .sponsorship-grid {
                grid-template-columns: 200px 130px 180px;
            }

            .no-sponsorship-grid {
                grid-template-columns: 542px; // sponsorship-grid size + gap size
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
        MatDivider,
        MatPaginator,
        MatSort,
        MatSortHeader,
        MatTooltipModule,
        CurrencyPipe,
    ]
})
export class SponsorListComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) private sort: MatSort;
    filtersForm: UntypedFormGroup;
    pagination: Pagination;
    sponsors$: Observable<Sponsor[]>;
    drawerMode: 'side' | 'over';
    protected readonly environment = environment;
    protected readonly capitalizeFirstLetter = capitalizeFirstLetter;
    private unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private sponsorService: SponsorsService,
        private formBuilder: FormBuilder,
        private fuseMediaWatcherService: FuseMediaWatcherService,
        private fuseConfirmationService: FuseConfirmationService,
        private changeDetectorRef: ChangeDetectorRef,
        private activatedRoute: ActivatedRoute,
        private router: Router,
        private storageService: StorageService,
        private title: Title
    ) {
        this.title.setTitle('Sponsors • Normandie Racing Admin');
    }

    ngOnInit(): void
    {
        this.filtersForm = this.formBuilder.group({
            name: [null],
            contact: [null],
            status: [''],
            minAmount: [null],
            maxAmount: [null],
            otherCounterpart: [null],
            hasContract: [null]
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

        this.sponsors$ = this.sponsorService.sponsors$;

        this.sponsorService.pagination$
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
                    this.getSponsors().subscribe();
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

        this.getSponsors().subscribe();
    }

    getSponsors()
    {
        const sponsorFilters = this.filtersForm.getRawValue();

        return this.sponsorService.getSponsors(
            (this.paginator?.pageIndex ?? 0)+1,
            this.paginator?.pageSize ?? 50,
            this.sort?.active,
            this.sort?.direction,
            sponsorFilters
        );
    }

    /**
     * Delete the sponsor using the form data
     */
    deleteSponsor(sponsorId: number): void
    {
        // Open the confirmation dialog
        const confirmation = this.fuseConfirmationService.open({
            title  : 'Supprimer le sponsor',
            message: 'Êtes-vous sûr de vouloir supprimer ce sponsor ? Cette action est irréversible.',
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
                // Delete the sponsor on the server
                this.sponsorService.deleteSponsor(sponsorId).subscribe();
            }
        });
    }

    getSponsorshipTotalAmount(sponsorship: Sponsorship): number
    {
        return sponsorship.sponsorshipCounterparts.reduce((sum, item) => sum + (item.amount || 0), 0);
    }

    getSponsorshipOtherCounterparts(sponsorship: Sponsorship): string[]
    {
        return sponsorship.sponsorshipCounterparts
            .filter(item => item.counterpartType === 'other')
            .map(item => item.otherCounterpart);
    }

    saveFilterForm(): void
    {
        let savedFilterForm: SponsorFilters = this.storageService.getInLocalStorage('sponsorFilters');

        if (!savedFilterForm || !this.haveSameKeys(savedFilterForm, this.filtersForm.controls)) {
            this.storageService.setInLocalStorage('sponsorFilters', this.filtersForm.getRawValue());
        }

        savedFilterForm = this.storageService.getInLocalStorage('sponsorFilters');

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
                    this.storageService.setInLocalStorage('sponsorFilters', filters);

                    return this.getSponsors().subscribe();
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

    getFilePath(path: string, type: 'image'|'sponsor' = 'image'): string
    {
        if (!path) {
            return null;
        }

        switch (type) {
            case 'image':
                return environment.apiUrl + '/' + path;
            case 'sponsor':
                return environment.apiUrl + '/' + path;
        }
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
