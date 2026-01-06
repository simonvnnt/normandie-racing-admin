import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {FormControl, UntypedFormGroup} from '@angular/forms';

@Injectable({
    providedIn: 'root'
})
export class FilterService {
    private initFiltersSubject = new BehaviorSubject<boolean | null>(null);
    private eventFilterFormSubject = new BehaviorSubject<FormControl | null>(null);
    private roundFilterFormSubject = new BehaviorSubject<FormControl | null>(null);
    private categoryFilterFormSubject = new BehaviorSubject<FormControl | null>(null);
    eventFilterForm$ = this.eventFilterFormSubject.asObservable();
    roundFilterForm$ = this.roundFilterFormSubject.asObservable();
    categoryFilterForm$ = this.categoryFilterFormSubject.asObservable();

    constructor() {}

    get initFilters(): Observable<boolean | null> {
        return this.initFiltersSubject.asObservable();
    }

    set initFilters(init: boolean) {
        this.initFiltersSubject.next(init);
    }

    setEventFilterForm(form: FormControl) {
        this.eventFilterFormSubject.next(form);
    }

    setRoundFilterForm(form: FormControl) {
        this.roundFilterFormSubject.next(form);
    }

    setCategoryFilterForm(form: FormControl) {
        this.categoryFilterFormSubject.next(form);
    }
}
