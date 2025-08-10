
import { GoogleGenAI, Type } from "@google/genai";
import { Subtask } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
  console.warn("La variable de entorno VITE_API_KEY no está configurada. Las funciones de IA estarán deshabilitadas.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const subtaskSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: "Un título de subtarea conciso y procesable.",
            },
            completed: {
                type: Type.BOOLEAN,
                description: "El estado de finalización de la subtarea, inicialmente siempre debe ser falso.",
            },
        },
        required: ["title", "completed"],
    },
};

export const suggestSubtasks = async (taskTitle: string, taskDescription?: string): Promise<Omit<Subtask, 'id'>[]> => {
    if (!API_KEY) {
        throw new Error("La clave de API no está configurada.");
    }

    const prompt = `Eres un experto gestor de proyectos. Basándote en el título de la tarea "${taskTitle}" ${taskDescription ? `y la descripción "${taskDescription}"` : ''}, desglósala en una lista de subtareas pequeñas y procesables. Asegúrate de que las subtareas sean pasos distintos y lógicos para completar la tarea principal.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: subtaskSchema,
            },
        });

        const jsonText = response.text?.trim() || '';
        const suggested = JSON.parse(jsonText);
        
        // Ensure the response is an array before returning
        if (Array.isArray(suggested)) {
            return suggested.map(item => ({...item, completed: false}));
        }

        console.error("La API de Gemini devolvió una respuesta que no es un array:", suggested);
        return [];

    } catch (error) {
        console.error("Error al generar subtareas con la API de Gemini:", error);
        throw new Error("No se pudieron obtener sugerencias del asistente de IA.");
    }
};

export const suggestDescription = async (taskTitle: string): Promise<string> => {
    if (!API_KEY) {
        throw new Error("La clave de API no está configurada.");
    }

    const prompt = `Eres un Project Manager experto con más de 10 años de experiencia en gestión de proyectos. Tu tarea es escribir una descripción profesional y detallada para la tarea: "${taskTitle}".

La descripción debe incluir:

**OBJETIVO PRINCIPAL:**
- El propósito específico de esta tarea
- Qué se pretende lograr al completarla

**CONTEXTO Y ALCANCE:**
- El contexto del proyecto donde se enmarca esta tarea
- El alcance específico de lo que incluye y no incluye
- Dependencias o prerrequisitos necesarios

**CRITERIOS DE ÉXITO:**
- Cómo se medirá el éxito de esta tarea
- Entregables específicos esperados
- Criterios de calidad y aceptación

**CONSIDERACIONES TÉCNICAS:**
- Limitaciones o restricciones a considerar
- Riesgos potenciales y mitigaciones
- Recursos necesarios (humanos, técnicos, tiempo)

**IMPACTO Y VALOR:**
- Cómo contribuye esta tarea al objetivo general del proyecto
- El valor que aporta al equipo y a la organización

Escribe la descripción en un tono profesional, claro y estructurado, como lo haría un Project Manager experimentado. Debe tener entre 4-6 párrafos bien organizados.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text?.trim() || '';

    } catch (error) {
        console.error("Error al generar descripción con la API de Gemini:", error);
        throw new Error("No se pudo obtener sugerencia de descripción del asistente de IA.");
    }
};