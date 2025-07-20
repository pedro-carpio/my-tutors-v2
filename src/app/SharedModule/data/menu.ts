import { Navigation } from "../types/navigation";

export const spanish_menu: Navigation[] = [
    {
        title: 'Perfil',
        type: 'group',
        children: [
            {
                title: 'Mi perfil',
                type: 'item',
                url: '/profile',
            }
        ]
    },
    {
        title: 'Cursos',
        type: 'group',
        children: [
            {
                title: 'Mis cursos',
                type: 'item',
                url: '/courses/my-courses'
            },
            
            {
                title: 'Calendario',
                type: 'item',
                url: '/calendar'
            }
        ]
    }
];