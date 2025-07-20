export interface NavigationItem {
  title: string;
  type: 'item' | 'group';
  matIcon?: string;
  hidden?: boolean;
  url?: string;
  target?: '_blank' | '_self';
  children?: Navigation[];
}

export interface Navigation extends NavigationItem {
  children?: NavigationItem[];
}

export const defaultNavItem: Navigation = 
    {
        title: 'Default Navigation',
        type: 'item'
    }