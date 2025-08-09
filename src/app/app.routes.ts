import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  // Temporary route for language seeder (remove in production)
  {
    path: 'language-seeder',
    loadComponent: () => import('./components/language-seeder/language-seeder.component').then(m => m.LanguageSeederComponent),
  },
  
  // Rutas públicas (solo para usuarios no autenticados)
  {
    path: 'login',
    loadComponent: () => import('./SharedModule/views/login/login.component').then(m => m.LoginComponent),
    canActivate: [GuestGuard],
  },
  {
    path: 'campaigns',
    children: [
      {
        path: 'tutor',
        children: [
          {
            path: 'postulate',
            loadComponent: () => import('./SharedModule/views/campaigns/tutor/postulate/postulate.component').then(m => m.CampaignTutorPostulateComponent),
          }
        ]
      },
      {
        path: 'institution',
        children: [
          {
            path: 'diagnosis',
            loadComponent: () => import('./SharedModule/views/campaigns/institution/diagnosis/diagnosis.component').then(m => m.CampaignInstitutionDiagnosisComponent),
          }
        ]
      }
    ],
    canActivate: [GuestGuard]
  },

  {
    path: 'forms',
    children: [
      {
        path: 'tutor',
        children: [
          {
            path: 'postular',
            loadComponent: () => import('./modules/institution/components/postulate/tutor/tutor.component').then(m => m.TutorPostulationFormComponent),
          }
        ]
      }
    ],
    canActivate: [GuestGuard]
  },

  {
        path: 'forgot-password',
        loadComponent: () => import('./SharedModule/views/forgotpassword/forgotpassword.component').then(m => m.ForgotpasswordComponent)
      },
  
  // Rutas de registro
  {
    path: 'register',
    canActivate: [GuestGuard],
    children: [
      {
        path: 'student',
        loadComponent: () => import('./modules/student/components/student-register/student-register.component').then(m => m.StudentRegisterComponent)
      },
      {
        path: 'tutor',
        loadComponent: () => import('./modules/tutor/components/tutor-register/tutor-register.component').then(m => m.TutorRegisterComponent)
      },
      {
        path: 'institution',
        loadComponent: () => import('./modules/institution/components/institution-register/institution-register.component').then(m => m.InstitutionRegisterComponent)
      },
      {
        path: '',
        redirectTo: 'student',
        pathMatch: 'full'
      }
    ]
  },

  // Rutas protegidas generales
  // {
  //   path: 'chat',
  //   loadComponent: () => import('./SharedModule/views/chat/chat.component').then(m => m.ChatComponent),
  //   canActivate: [AuthGuard]
  // },

  {
    path: 'home',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Dashboard general (temporal hasta crear dashboards específicos)
  {
    path: 'dashboard',
    loadComponent: () => import('./SharedModule/views/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'configuration',
    loadComponent: () => import('./SharedModule/views/configuration/configuration.component').then(m => m.ConfigurationComponent),
    canActivate: [AuthGuard]
  },
  // TODO: Implementar componente de búsqueda de tutores
  {
    path: 'tutors',
    loadComponent: () => import('./SharedModule/views/tutors/tutors.component').then(m => m.TutorsComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['student', 'institution'] } // Múltiples roles permitidos
  },
  // Perfil - permitido para todos los roles autenticados
  {
    path: 'profile',
    loadComponent: () => import('./SharedModule/views/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['student', 'tutor', 'institution', 'admin'] } // Todos los roles
  },
  {
    path: 'calendar',
    loadComponent: () => import('./SharedModule/views/calendar/calendar.component').then(m => m.LayoutCalendarComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['student', 'tutor', 'institution', 'admin'] } // Todos los roles
  },
  // Convocatorias de trabajo - permitido para tutores e instituciones
  {
    path: 'job-postings',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['tutor', 'institution', 'admin'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./SharedModule/views/job-postings/job-postings.component').then(m => m.JobPostingsComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./SharedModule/views/job-postings/job-posting-form/job-posting-form.component').then(m => m.JobPostingFormComponent),
        data: { roles: ['institution', 'admin'] }
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('./SharedModule/views/job-postings/job-posting-form/job-posting-form.component').then(m => m.JobPostingFormComponent),
        data: { roles: ['institution', 'admin'] }
      }
    ]
  },

  // Rutas específicas por rol - Estudiantes
  {
    path: 'student',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'student' },
    children: [
      // TODO: Implementar componente para agregar tutores
      {
        path: 'tutors',
        loadComponent: () => import('./modules/student/views/tutors/tutors.component').then(m => m.TutorsComponent)
      },
      
    ]
  },

  // Rutas específicas por rol - Tutores
  {
    path: 'tutor',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'tutor' },
    children: [
      // TODO: Implementar componente para agregar tutores
      {
        path: 'students',
        loadComponent: () => import('./modules/student/views/tutors/tutors.component').then(m => m.TutorsComponent)
      },
      
    ]
  },

  // Rutas específicas por rol - Instituciones
  {
    path: 'institution',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'institution' },
    children: [
      // TODO: Implementar componente para agregar tutores
      {
        path: 'tutors',
        loadComponent: () => import('./modules/institution/views/tutors/tutors.component').then(m => m.TutorsComponent)
      },
      // TODO: Implementar componente para agregar estudiantes
      {
        path: 'students',
        loadComponent: () => import('./modules/institution/views/students/students.component').then(m => m.StudentsComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Rutas específicas por rol - Administradores
  // TODO: Implementar módulo completo de administración
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' },
    children: [
      // TODO: Implementar componente de overview del sistema
      {
        path: 'overview',
        loadComponent: () => import('./modules/admin/views/system-overview/system-overview.component').then(m => m.SystemOverviewComponent)
      },
      // TODO: Implementar componente de gestión de usuarios
      {
        path: 'users',
        loadComponent: () => import('./modules/admin/views/user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      // Nuevo: Gestión de roles múltiples
      {
        path: 'roles',
        loadComponent: () => import('./SharedModule/components/role-management/role-management.component').then(m => m.RoleManagementComponent)
      },
      // TODO: Implementar componente de configuración del sistema
      {
        path: 'settings',
        loadComponent: () => import('./modules/admin/views/system-settings/system-settings.component').then(m => m.SystemSettingsComponent)
      },
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      }
    ]
  },

  // ✅ NUEVO: Rutas de testing (solo para desarrollo/debug)
  {
    path: 'testing',
    children: [
      {
        path: 'timezones',
        loadComponent: () => import('./components/testing/timezone-calculator/timezone-calculator.component').then(m => m.TimezoneCalculatorComponent),
      },
      {
        path: '',
        redirectTo: 'timezones',
        pathMatch: 'full'
      }
    ]
  },

  // Ruta por defecto
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // Ruta de error 404 (temporal)
  {
    path: '**',
    redirectTo: '/login'
  }
];
