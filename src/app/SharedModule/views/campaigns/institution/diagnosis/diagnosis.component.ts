import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MetaService } from '../../../../../services/meta.service';
import { generatePageMetaTags } from '../../../../../constants/meta.constants';

@Component({
  selector: 'app-campaign-institution-diagnosis',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './diagnosis.component.html',
  styleUrl: './diagnosis.component.scss'
})
export class CampaignInstitutionDiagnosisComponent implements OnInit, OnDestroy {
  private metaService = inject(MetaService);
  
  whyWeDoThis = [
    {
      icon: 'gps_fixed',
      title: 'Desarrollamos a medida',
      description: 'Tu experiencia nos guía para construir nuevas herramientas.'
    },
    {
      icon: 'psychology',
      title: 'Optimización real',
      description: 'Mejoras técnicas y pedagógicas basadas en cómo tú das clases.'
    },
    {
      icon: 'handshake',
      title: 'Cocreación constante',
      description: 'Tú no eres usuario. Eres parte del equipo que está creando algo global.'
    }
  ];

  tutorFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeOy2RjCbHBAs01zjE-AQhZM-sQjE4C10CEIZaTrqiKhdzmhQ/viewform?usp=header';
  institutionFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSeUVRbftUlxdTofB4T6dUjjtaPQAbvYaiIsdwnukz8GExyxDQ/viewform?usp=header';

  ngOnInit(): void {
    this.setMetaTags();
  }

  ngOnDestroy(): void {
    this.metaService.clearMetaTags();
  }

  private setMetaTags(): void {
    const metaData = generatePageMetaTags('INSTITUTION_DIAGNOSIS');
    this.metaService.setAllMetaTags(metaData);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openExternalForm(url: string): void {
    window.open(url, '_blank');
  }
}
