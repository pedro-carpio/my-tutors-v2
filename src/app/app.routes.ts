import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  // Rutas públicas (solo para usuarios no autenticados)
  {
    path: 'login',
    loadComponent: () => import('./SharedModule/views/login/login.component').then(m => m.LoginComponent),
    canActivate: [GuestGuard],
  },

  {
    path: 'postular',
    loadComponent: () => import('./modules/institution/components/postulate/tutor/tutor.component').then(m => m.TutorPostulationFormComponent),
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

  // Rutas específicas por rol - Estudiantes
  {
    path: 'student',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'student' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./SharedModule/views/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'calendar',
        loadComponent: () => import('./SharedModule/views/calendar/calendar.component').then(m => m.LayoutCalendarComponent),
      },
    ]
  },

  // Rutas específicas por rol - Tutores
  {
    path: 'tutor',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'tutor' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./SharedModule/views/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'pending-verification',
        loadComponent: () => import('./SharedModule/views/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./SharedModule/views/calendar/calendar.component').then(m => m.LayoutCalendarComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Rutas específicas por rol - Instituciones
  {
    path: 'institution',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'institution' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./SharedModule/views/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'pending-verification',
        loadComponent: () => import('./SharedModule/views/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./SharedModule/views/calendar/calendar.component').then(m => m.LayoutCalendarComponent),
      },
      {
        path: 'students',
        loadComponent: () => import('./modules/institution/components/students/students.component').then(m => m.StudentsComponent)
      },
      {
        path: 'tutors',
        loadComponent: () => import('./modules/institution/components/tutors/tutors.component').then(m => m.TutorsComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
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
