import { Project } from '../types';

// Servicio para manejar colores de proyectos
export class ColorService {
    // Paleta de colores predefinida para proyectos
    private static readonly COLORS = [
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Yellow
        '#EF4444', // Red
        '#8B5CF6', // Purple
        '#06B6D4', // Cyan
        '#F97316', // Orange
        '#EC4899', // Pink
        '#84CC16', // Lime
        '#6366F1', // Indigo
        '#14B8A6', // Teal
        '#F43F5E', // Rose
        '#A855F7', // Violet
        '#0EA5E9', // Sky
        '#22C55E', // Emerald
        '#EAB308', // Amber
    ];

    /**
     * Obtiene la paleta de colores disponible
     * @returns Array de colores hexadecimales
     */
    static getColorPalette(): string[] {
        return [...this.COLORS];
    }

    /**
     * Obtiene el siguiente color disponible de la lista
     * @param usedColors - Array de colores ya utilizados
     * @returns El siguiente color disponible o un color aleatorio si se han usado todos
     */
    static getNextAvailableColor(usedColors: string[]): string {
        const availableColors = this.COLORS.filter(color => !usedColors.includes(color));
        
        if (availableColors.length > 0) {
            return availableColors[0];
        }
        
        // Si se han usado todos los colores, generar uno aleatorio
        return this.generateRandomColor();
    }

    /**
     * Genera un color aleatorio en formato hexadecimal
     * @returns Color aleatorio en formato #RRGGBB
     */
    static generateRandomColor(): string {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    /**
     * Asigna colores automáticamente a proyectos que no tienen color
     * @param projects - Array de proyectos a procesar
     * @returns Array de proyectos con colores asignados
     */
    static assignColorsToProjects(projects: Project[]): Project[] {
        const usedColors = projects
            .map(p => p.color)
            .filter((color): color is string => !!color);
        
        return projects.map(project => {
            if (!project.color) {
                return {
                    ...project,
                    color: this.getNextAvailableColor(usedColors)
                };
            }
            return project;
        });
    }

    /**
     * Obtiene un color para un proyecto específico
     * @param project - Proyecto para el cual obtener el color
     * @param allProjects - Todos los proyectos para verificar colores existentes
     * @returns Color asignado al proyecto
     */
    static getProjectColor(project: Project, allProjects: Project[]): string {
        if (project.color) {
            return project.color;
        }
        
        const usedColors = allProjects
            .map(p => p.color)
            .filter((color): color is string => !!color);
        
        return this.getNextAvailableColor(usedColors);
    }

    /**
     * Obtiene el color de contraste para texto basado en el color de fondo
     * @param backgroundColor - Color de fondo en formato hexadecimal
     * @returns Color de texto que contrasta bien con el fondo
     */
    static getContrastingTextColor(backgroundColor: string): string {
        // Convertir hex a RGB
        const hex = backgroundColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calcular luminancia
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Retornar blanco o negro basado en la luminancia
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }
}
