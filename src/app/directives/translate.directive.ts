import { Directive, ElementRef, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { Subscription } from 'rxjs';

@Directive({
  selector: '[appTranslate]',
  standalone: true
})
export class TranslateDirective implements OnInit, OnDestroy {
  @Input('appTranslate') translationKey!: string;
  @Input() translateParams?: Record<string, any>;

  private i18nService = inject(I18nService);
  private el = inject(ElementRef);
  private subscription?: Subscription;

  ngOnInit() {
    this.updateTranslation();
    
    // Suscribirse a cambios de idioma
    this.subscription = this.i18nService.language$.subscribe(() => {
      this.updateTranslation();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private updateTranslation() {
    if (this.translationKey) {
      const translatedText = this.i18nService.translate(this.translationKey, this.translateParams);
      this.el.nativeElement.textContent = translatedText;
    }
  }
}
