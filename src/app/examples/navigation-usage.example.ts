/**
 * EJEMPLO DE USO DEL SISTEMA DE NAVEGACIÓN CON ROLES
 * 
 * Este archivo muestra cómo implementar menús personalizados
 * usando el mismo sistema de roles y traducciones del layout principal.
 * 
 * NOTA: Este es un ejemplo conceptual. Para usarlo en un componente real,
 * debes importar los módulos necesarios y implementar los métodos requeridos.
 */

// Ejemplo de definición de menú con roles
const exampleMenu = [
  {
    title: 'navigation.profile',
    translationKey: 'navigation.profile',
    type: 'item',
    url: '/profile',
    matIcon: 'person',
    roles: ['student', 'tutor', 'institution', 'admin']
  },
  {
    title: 'navigation.billing',
    translationKey: 'navigation.billing',
    type: 'item',
    url: '/billing',
    matIcon: 'payment',
    roles: ['student', 'tutor', 'institution']
  },
  {
    title: 'navigation.analytics',
    translationKey: 'navigation.analytics',
    type: 'item',
    url: '/analytics',
    matIcon: 'analytics',
    roles: ['institution', 'admin']
  },
  {
    title: 'navigation.systemLogs',
    translationKey: 'navigation.systemLogs',
    type: 'item',
    url: '/logs',
    matIcon: 'bug_report',
    roles: ['admin']
  }
];

// Ejemplo de lógica de filtrado (similar a la del LayoutComponent)
function filterMenuByRole(menu: any[], userRole: string | null): any[] {
  if (!userRole) return [];
  
  return menu.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });
}

// Ejemplo de uso en template
const templateExample = `
<!-- En tu componente, puedes usar: -->
@for (item of filteredMenu; track item.title) {
  <a mat-list-item [routerLink]="item.url">
    <mat-icon>{{ item.matIcon }}</mat-icon>
    {{ item.translationKey | translate }}
  </a>
}
`;

export { exampleMenu, filterMenuByRole, templateExample };
