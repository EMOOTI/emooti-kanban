import { Task, Project, Priority } from '../types';

interface AITaskGenerationRequest {
    projectName: string;
    projectDescription: string;
    existingTasks: Task[];
    projectContext: string;
}

interface AITaskGenerationResponse {
    title: string;
    description: string;
    priority: Priority;
    estimatedDays: number;
    reasoning: string;
}

export class AIService {
    private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
    private static readonly API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';

    static async generateTaskForProject(
        project: Project, 
        existingTasks: Task[]
    ): Promise<AITaskGenerationResponse> {
        try {
            console.log('🤖 Iniciando generación de tarea con IA para proyecto:', project.name);
            console.log('🔑 API Key configurada:', this.API_KEY ? 'SÍ' : 'NO');
            
            // Preparar el contexto del proyecto
            const projectContext = this.buildProjectContext(project, existingTasks);
            
            const prompt = this.buildPrompt(projectContext);
            
            const response = await fetch(this.OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un asistente experto en gestión de proyectos que ayuda a crear tareas relevantes y útiles basadas en el contexto del proyecto.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error(`Error en la API de OpenAI: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            return this.parseAIResponse(aiResponse);
        } catch (error) {
            console.error('Error generando tarea con IA:', error);
            throw new Error('No se pudo generar la tarea con IA. Verifica tu API key de OpenAI.');
        }
    }

    private static buildProjectContext(project: Project, existingTasks: Task[]): string {
        const taskTitles = existingTasks.map(task => task.title).join(', ');
        const taskDescriptions = existingTasks
            .filter(task => task.description)
            .map(task => task.description)
            .join(', ');

        return `
            Proyecto: ${project.name}
            Descripción del proyecto: ${project.description || 'Sin descripción'}
            Tareas existentes: ${taskTitles || 'Ninguna tarea existente'}
            Descripciones de tareas existentes: ${taskDescriptions || 'Sin descripciones'}
        `;
    }

    private static buildPrompt(projectContext: string): string {
        return `
        Basándote en el siguiente contexto de proyecto, genera una nueva tarea que sea relevante y útil:

        ${projectContext}

        Por favor, genera una tarea que:
        1. Sea específica y accionable
        2. Se relacione con el contexto del proyecto
        3. Complemente las tareas existentes
        4. Tenga una prioridad apropiada (Baja, Media, Alta, Urgente)
        5. Incluya una estimación de días razonable

        Responde en el siguiente formato JSON:
        {
            "title": "Título de la tarea",
            "description": "Descripción detallada de la tarea",
            "priority": "Medium",
            "estimatedDays": 3,
            "reasoning": "Explicación de por qué esta tarea es relevante para el proyecto"
        }
        `;
    }

    private static parseAIResponse(response: string): AITaskGenerationResponse {
        try {
            // Intentar extraer JSON del response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No se pudo parsear la respuesta de la IA');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            return {
                title: parsed.title || 'Nueva tarea generada por IA',
                description: parsed.description || 'Descripción de la tarea generada por IA',
                priority: this.mapPriority(parsed.priority) || Priority.Medium,
                estimatedDays: parsed.estimatedDays || 1,
                reasoning: parsed.reasoning || 'Tarea generada automáticamente por IA'
            };
        } catch (error) {
            console.error('Error parseando respuesta de IA:', error);
            // Fallback a una tarea por defecto
            return {
                title: 'Nueva tarea generada por IA',
                description: 'Esta tarea fue generada automáticamente por inteligencia artificial basándose en el contexto del proyecto.',
                priority: Priority.Medium,
                estimatedDays: 1,
                reasoning: 'Tarea generada automáticamente por IA'
            };
        }
    }

    private static mapPriority(priority: string): Priority {
        const priorityMap: { [key: string]: Priority } = {
            'Low': Priority.Low,
            'Medium': Priority.Medium,
            'High': Priority.High,
            'Urgent': Priority.Urgent,
            'Baja': Priority.Low,
            'Media': Priority.Medium,
            'Alta': Priority.High,
            'Urgente': Priority.Urgent
        };
        
        return priorityMap[priority] || Priority.Medium;
    }
} 