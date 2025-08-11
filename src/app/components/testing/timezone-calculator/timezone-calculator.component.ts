import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimezoneService, TimezoneInfo } from '../../../services/timezone.service';

interface ConversionRow {
    local1: Date;
    utc: Date;
    local2: Date;
    localTz: TimezoneInfo;
    targetTz: TimezoneInfo;
    local1Dst: boolean;
    local2Dst: boolean;
}

interface TimezoneFormState {
    localDateTime: string;
    localCountry: string;
    localState?: string;
    localTimezone?: string;
    targetCountry: string;
    targetState?: string;
    targetTimezone?: string;
}

@Component({
    selector: 'app-timezone-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './timezone-calculator.component.html',
    styleUrls: ['./timezone-calculator.component.scss']
})
export class TimezoneCalculatorComponent {
    private tzService = inject(TimezoneService);

    form: TimezoneFormState = {
        localDateTime: '',
        localCountry: 'US',
        localState: 'AK',
        localTimezone: 'America/Anchorage',
        targetCountry: 'BO',
        targetTimezone: 'America/La_Paz'
    };

    countries = this.tzService.getCountries();
    usStates = this.tzService.getUSStates();

    localTimezoneOptions: TimezoneInfo[] = [];
    targetTimezoneOptions: TimezoneInfo[] = [];

    rows: ConversionRow[] = [];

        constructor() {
            this.refreshLocalTimezones();
            this.refreshTargetTimezones();
        }

    onLocalCountryChange() {
        this.form.localState = this.form.localCountry === 'US' ? this.form.localState : undefined;
        this.refreshLocalTimezones();
    }
    onLocalStateChange() { this.refreshLocalTimezones(); }

    onTargetCountryChange() {
        this.form.targetState = this.form.targetCountry === 'US' ? this.form.targetState : undefined;
        this.refreshTargetTimezones();
    }
    onTargetStateChange() { this.refreshTargetTimezones(); }

    private refreshLocalTimezones() {
        this.localTimezoneOptions = this.tzService.getTimezoneOptions(this.form.localCountry, this.form.localState);
        if (!this.localTimezoneOptions.find(t => t.timezone === this.form.localTimezone)) {
            this.form.localTimezone = this.localTimezoneOptions[0]?.timezone;
        }
    }
    private refreshTargetTimezones() {
        this.targetTimezoneOptions = this.tzService.getTimezoneOptions(this.form.targetCountry, this.form.targetState);
        if (!this.targetTimezoneOptions.find(t => t.timezone === this.form.targetTimezone)) {
            this.form.targetTimezone = this.targetTimezoneOptions[0]?.timezone;
        }
    }

    addConversion() {
        // ⚠️ TEMPORALMENTE DESHABILITADO: Las funciones de conversión DST fueron removidas
        console.warn('🚧 Timezone Calculator: Funcionalidad temporalmente deshabilitada debido a cambios en TimezoneService');
        return;
        
        /* COMENTADO HASTA REIMPLEMENTAR
        if (!this.form.localDateTime || !this.form.localTimezone || !this.form.targetTimezone) return;
        const localDate = new Date(this.form.localDateTime);
        const toUtc = this.tzService.convertToUTC(localDate, this.form.localTimezone, this.form.localCountry, this.form.localState);
        if (!toUtc) return;
        const fromUtc = this.tzService.convertFromUTC(new Date(toUtc.utc_datetime), this.form.targetTimezone, this.form.targetCountry, this.form.targetState);
        if (!fromUtc) return;
        const localTzInfo = this.localTimezoneOptions.find(t => t.timezone === this.form.localTimezone)!;
        const targetTzInfo = this.targetTimezoneOptions.find(t => t.timezone === this.form.targetTimezone)!;
        this.rows.unshift({
            local1: new Date(toUtc.local_datetime),
            utc: new Date(toUtc.utc_datetime),
            local2: new Date(fromUtc.local_datetime),
            localTz: localTzInfo,
            targetTz: targetTzInfo,
            local1Dst: toUtc.dst_active,
            local2Dst: fromUtc.dst_active
        });
        */
    }
}