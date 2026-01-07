import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {
    FormArray,
    FormBuilder, FormGroup,
    ReactiveFormsModule,
    UntypedFormGroup, Validators,
} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {
    debounceTime,
    filter,
    map,
    Observable,
    Subject,
} from "rxjs";
import {MatDrawerToggleResult, MatSidenavModule} from "@angular/material/sidenav";
import {SponsorsService} from "../sponsors.service";
import {SponsorListComponent} from "../list/list.component";
import {Router, RouterLink} from "@angular/router";
import {MatButtonModule, MatIconAnchor} from "@angular/material/button";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {Person} from "../../person.types";
import {PersonService} from "../../new-person/person.service";
import {NewPersonComponent} from "../../new-person/new-person.component";
import {MatDialog} from "@angular/material/dialog";
import {MatTooltip} from "@angular/material/tooltip";
import {round} from "lodash-es";
import {MatAutocomplete, MatAutocompleteTrigger} from "@angular/material/autocomplete";
import {LinkType} from "../sponsors.types";
import {AsyncPipe} from "@angular/common";
import {FormControlPipe} from "../../../../../core/utils/formControlPipe";
import {FormArrayPipe} from "../../../../../core/utils/formArrayPipe";
import {capitalizeFirstLetter} from "../../../../../core/utils/tool";
import {FormGroupPipe} from "../../../../../core/utils/formGroupPipe";

@Component({
    selector: 'sponsor-create',
    templateUrl: './create.component.html',
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatInputModule,
        MatIconModule,
        MatSlideToggleModule,
        MatSidenavModule,
        RouterLink,
        MatIconAnchor,
        MatButtonModule,
        MatProgressSpinner,
        FormControlPipe,
        MatTooltip,
        MatAutocomplete,
        MatAutocompleteTrigger,
        FormArrayPipe,
        AsyncPipe,
        FormGroupPipe
    ]
})
export class SponsorCreateComponent implements OnInit, OnDestroy {
    newSponsorForm: UntypedFormGroup;
    personResultSets: Person[];
    sponsorImgFile: File;
    sponsorImgPreviewUrl: string | null = null;
    contractFiles: File[] = [];
    linkTypes$: Observable<LinkType[]>;
    protected readonly round = round;
    protected readonly capitalizeFirstLetter = capitalizeFirstLetter;
    private unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private sponsorService: SponsorsService,
        private personService: PersonService,
        private formBuilder: FormBuilder,
        private matDialog: MatDialog,
        private router: Router,
        private changeDetectorRef: ChangeDetectorRef,
        private sponsorListComponent: SponsorListComponent
    ) {
    }

    ngOnInit(): void
    {
        // Open the drawer
        this.sponsorListComponent.matDrawer.open();

        this.newSponsorForm = this.formBuilder.group({
            name: [null, Validators.required],
            description: [null],
            filePath: [null],
            alt: [null],
            displayWebsite: [false],
            contactId: [''],
            sponsorships: this.formBuilder.array([]),
            links: this.formBuilder.array([])
        });

        this.linkTypes$ = this.sponsorService.linkTypes$;

        this.newSponsorForm.get('contactId').valueChanges
            .pipe(
                debounceTime(300),
                map((value) => {
                    // Set the personResultSets to null if there is no value or
                    // the length of the value is smaller than the minLength
                    // so the autocomplete panel can be closed
                    if ( !value || value.length < 3 )
                    {
                        this.personResultSets = null;
                    }

                    // Continue
                    return value;
                }),
                // Filter out undefined/null/false statements and also
                // filter out the values that are smaller than minLength
                filter(value => value && value.length >= 3)
            )
            .subscribe((value) => {
                this.personService.getPersons(1, 50, null, null, value).subscribe({
                    next: (persons) => {
                        // Store the result sets
                        this.personResultSets = persons.persons;
                    }
                });

            });
    }

    ngOnDestroy(): void
    {
        this.unsubscribeAll.next(null);
        this.unsubscribeAll.complete();
    }

    openNewPersonDialog(): void
    {
        const dialogRef = this.matDialog.open(NewPersonComponent);

        dialogRef.afterClosed().subscribe(
            (person: Person) => {
                if (person) {
                    this.personResultSets = [person];
                    this.newSponsorForm.get('contactId').setValue(person.id);
                }
            }
        );
    }

    createSponsor(): void
    {
        this.newSponsorForm.disable();

        // Get the sponsor object
        let sponsor = this.newSponsorForm.getRawValue();

        this.sponsorService.createSponsor(sponsor, this.sponsorImgFile, this.contractFiles).subscribe({
            next: () => {
                // this.toastr.success('Sponsor créé avec succès');
                this.router.navigate(['management/sponsors']);
                this.changeDetectorRef.markForCheck();
            },
            error: () => {
                this.newSponsorForm.enable();
                // this.toastr.error(`Erreur lors de la création du sponsor`);
            }
        })
    }

    closeDrawer(): Promise<MatDrawerToggleResult>
    {
        return this.sponsorListComponent.matDrawer.close();
    }

    displayPersonFn(value?: number): any
    {
        if (this.personResultSets) {
            const person: Person = this.personResultSets.find(p => p.id === value);

            return value ? person.firstName + ' ' + person.lastName + ' | ' + person.email : undefined;
        }
    }

    addLink(): void
    {
        const linkForm = this.formBuilder.group({
            id: null,
            linkTypeId: ['', Validators.required],
            link: ['', Validators.required],
        });

        linkForm.get('link').valueChanges.subscribe(value => {
            if (linkForm.get('linkTypeId').value && +linkForm.get('linkTypeId').value < 4) {
                const regex = /\/([^\/]+)\/?$/;
                const match = value.match(regex);
                if (match && match[1]) {
                    linkForm.patchValue({ link: match[1] }, { emitEvent: false });
                }
            }
        });

        (this.newSponsorForm.get('links') as FormArray).push(linkForm);
    }

    removeLink(index: number): void
    {
        (this.newSponsorForm.get('links') as FormArray).removeAt(index);
    }

    onContractFileChange(files: FileList, index: number): void
    {
        if (files && files.length > 0 && this.isValidFile(files[0])) {
            this.contractFiles[index] = files[0];
            this.changeDetectorRef.markForCheck();
        }
    }

    removeContractFile(index: number): void
    {
        this.contractFiles[index] = null;
        (this.newSponsorForm.get('sponsorships') as FormArray).at(index).patchValue({ contractFilePath: '' });
        this.changeDetectorRef.markForCheck();
    }

    addSponsorship(): void
    {
        (this.newSponsorForm.get('sponsorships') as FormArray).push(this.formBuilder.group({
            id: null,
            contractFilePath: null,
            status: [null, Validators.required],
            counterparts: this.formBuilder.array([])
        }));
    }

    removeSponsorship(index: number): void
    {
        (this.newSponsorForm.get('sponsorships') as FormArray).removeAt(index);
    }

    addCounterpart(sponsorship: FormGroup): void
    {
        const counterpartForm = this.formBuilder.group({
            id: null,
            counterpartType: ['amount', Validators.required],
            amount: null,
            otherCounterpart: null,
        });

        counterpartForm.get('counterpartType').valueChanges.subscribe(value => {
            if (value === 'amount') {
                counterpartForm.patchValue({ otherCounterpart: null });
            } else if (value === 'other') {
                counterpartForm.patchValue({ amount: null });
            }
        });

        (sponsorship.get('counterparts') as FormArray).push(counterpartForm);
    }

    removeCounterpart(sponsorship: FormGroup, index: number): void
    {
        (sponsorship.get('counterparts') as FormArray).removeAt(index);
    }

    onImageChange(files: FileList): void
    {
        if (files && files.length > 0 && this.isValidFile(files[0])) {
            this.sponsorImgFile = files[0];
            this.sponsorImgPreviewUrl = URL.createObjectURL(this.sponsorImgFile);
            this.changeDetectorRef.markForCheck();
        }
    }

    viewImage(): void
    {
        if (this.sponsorImgPreviewUrl) {
            window.open(this.sponsorImgPreviewUrl, '_blank');
        }
    }

    removeImage(): void
    {
        this.sponsorImgFile = null;
        this.newSponsorForm.patchValue({ filePath: '' });
        this.changeDetectorRef.markForCheck();
    }

    isValidFile(file: File): boolean
    {
        const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        return validExtensions.includes(fileExtension);
    }

    getLink(linkTypeId: number, link: string): string
    {
        if (!link) {
            return '';
        }

        switch (linkTypeId) {
            case 1: // Instagram
                return `https://www.instagram.com/${link}`;
            case 2: // Facebook
                return `https://www.facebook.com/${link}`;
            case 3: // Youtube
                return `https://www.youtube.com/${link}`;
            default:
                return link;
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
}
