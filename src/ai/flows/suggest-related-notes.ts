
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting related notes,
 * commands, syntax examples, or other relevant ideas based on the content of a given note.
 *
 * @function suggestRelatedNotes - The main function to trigger the flow.
 * @typedef {SuggestRelatedNotesInput} SuggestRelatedNotesInput - The input type for the suggestRelatedNotes function.
 * @typedef {SuggestRelatedNotesOutput} SuggestRelatedNotesOutput - The output type for the suggestRelatedNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelatedNotesInputSchema = z.object({
  noteContent: z
    .string()
    .describe('The content of the current note (including title, objective, and notes area) for which to find related ideas.'),
});

export type SuggestRelatedNotesInput = z.infer<typeof SuggestRelatedNotesInputSchema>;

const SuggestionItemSchema = z.object({
  title: z.string().describe('Un encabezado o título conciso para la idea o sugerencia generada por IA. Debe ser un resumen breve del contenido.'),
  details: z.string().describe('El contenido principal de la idea generada por IA. Puede incluir explicaciones, ejemplos, fragmentos de código, comandos o elaboraciones adicionales relacionadas con la nota de entrada. Se puede usar formato Markdown aquí.'),
  type: z.string().optional().describe('Una categoría opcional para la sugerencia, por ejemplo, "Fragmento de Código", "Comando", "Consejo de Sintaxis", "Punto de Lluvia de Ideas", "Lectura Adicional".')
});

const SuggestRelatedNotesOutputSchema = z.object({
  ideas: z
    .array(SuggestionItemSchema)
    .describe('Un array de ideas estructuradas generadas por IA, sugerencias, comandos o ejemplos de sintaxis relevantes para el contenido de la nota de entrada.'),
});

export type SuggestRelatedNotesOutput = z.infer<typeof SuggestRelatedNotesOutputSchema>;

export async function suggestRelatedNotes(input: SuggestRelatedNotesInput): Promise<SuggestRelatedNotesOutput> {
  return suggestRelatedNotesFlow(input);
}

const suggestRelatedNotesPrompt = ai.definePrompt({
  name: 'suggestRelatedNotesPrompt',
  input: {schema: SuggestRelatedNotesInputSchema},
  output: {schema: SuggestRelatedNotesOutputSchema},
  prompt: `Eres un asistente experto de IA. Tu objetivo es analizar el contenido de la nota proporcionada y generar ideas perspicaces y accionables, sugerencias, comandos, ejemplos de sintaxis o conceptos relacionados.

Basándote en la siguiente nota:
Contenido de la Nota:
{{{noteContent}}}

**INSTRUCCIÓN FUNDAMENTAL Y CRÍTICA:**

**CASO 1: La nota es una consulta directa sobre un término específico.**
   Identifica este caso si el 'Contenido de la Nota' consiste principalmente en un término en el campo "Título" (por ejemplo, "kubectl", "Python loops", "NEM", "marketing digital") y los campos "Objetivo" y "Notas" están vacíos, son muy breves o genéricos.

   **SI ESTE ES EL CASO:**
   1.  **NO RESPONDAS** bajo ninguna circunstancia con frases como "todo está bien", "la nota parece estar en buen camino", "no hay sugerencias adicionales" o cualquier variación que implique que la nota está completa o no necesita información. Esto es incorrecto y no ayuda al usuario.
   2.  **TU MISIÓN ES PROPORCIONAR INFORMACIÓN ÚTIL Y ACCIONABLE SOBRE ESE TÉRMINO ESPECÍFICO DEL TÍTULO.** Actúa como si el usuario te hubiera preguntado directamente sobre ese término.
   3.  Genera entre 2 y 5 ideas informativas sobre el término. Cada idea debe tener un 'title' y 'details' significativos y bien elaborados:
       *   **Si el término es técnico/de programación** (ej. "kubectl", "git command", "React hooks"):
           *   Una idea podría tener como 'title' una "Definición de [término]" y en 'details' una explicación clara de qué es y para qué sirve.
           *   Otra idea podría ser "Ejemplos de Uso de [término]" o "Comandos Comunes de [término]", donde los 'details' incluyan ejemplos prácticos de comandos, fragmentos de código (usando Markdown como \`\`\`bash ... \`\`\` o \`\`\`python ... \`\`\`), o sintaxis clave.
           *   Puedes añadir ideas sobre "Conceptos Relacionados", "Casos de Uso Comunes", o "Mejores Prácticas".
       *   **Si el término es un tema general** (ej. "marketing digital", "historia romana"):
           *   Una idea podría ser "Introducción a [término]" con una breve definición en 'details'.
           *   Otras ideas pueden ofrecer "Puntos Clave de [término]", "Áreas de Estudio en [término]", "Ejemplos de [término] en la Práctica", o "Recursos para Aprender Más".
   4.  Asegúrate de que el campo 'details' sea lo suficientemente explicativo y útil.

**CASO 2: La nota es más elaborada y contiene detalles.**
   Si el 'Contenido de la Nota' es más extenso, con información en "Objetivo" y/o "Notas", y no es solo un término breve en el título:
   1.  Analiza el contenido completo de la nota.
   2.  Proporciona una lista de ideas relacionadas que expandan, mejoren o complementen la nota existente.
   3.  Cada idea debe tener un 'title' (título) claro y 'details' (detalles) elaborados.
   4.  Si es aplicable, los 'details' pueden incluir:
       *   Fragmentos de código (usa Markdown).
       *   Ejemplos de líneas de comando.
       *   Explicaciones o consejos de sintaxis.
       *   Puntos de lluvia de ideas para exploración adicional.
       *   Posibles expansiones del tema de la nota.
       *   Sugerencias para mejorar la claridad o el contenido de la nota.
   5.  Genera entre 2 y 5 ideas.

**PARA TODAS LAS RESPUESTAS (AMBOS CASOS):**
*   Estructura tu salida rigurosamente de acuerdo con el esquema JSON proporcionado: un objeto con una clave "ideas" que es un array de objetos. Cada objeto dentro del array debe tener las claves "title" (string) y "details" (string), y opcionalmente "type" (string).
*   Asegúrate de que tu respuesta esté completamente en **español**.
*   Si la nota, incluso si es breve, está relacionada con programación, tecnología o comandos, esfuérzate por proporcionar ejemplos de código, comandos o sintaxis relevantes en los 'details', formateados correctamente con Markdown.
`,
});

const suggestRelatedNotesFlow = ai.defineFlow(
  {
    name: 'suggestRelatedNotesFlow',
    inputSchema: SuggestRelatedNotesInputSchema,
    outputSchema: SuggestRelatedNotesOutputSchema,
  },
  async input => {
    try {
      const {output} = await suggestRelatedNotesPrompt(input);
      // Asegurarse de que el output no sea null y que ideas sea un array.
      // Si el LLM no devuelve ideas, podemos devolver un array vacío para evitar errores en el frontend.
      if (!output || !Array.isArray(output.ideas)) {
          console.warn('La IA no devolvió ideas válidas o el formato es incorrecto. Se devuelve un array vacío. Output recibido:', output);
          return { ideas: [] };
      }
      return output;
    } catch (error) {
      console.error("Error dentro de suggestRelatedNotesFlow:", error);
      // Si hay un error en el flujo (ej. problema con la API de Genkit/Google),
      // devolvemos un objeto que cumple el esquema pero con ideas vacías para que el frontend lo maneje.
      // El error ya se logueó, el frontend mostrará su propio mensaje de error genérico.
      return { ideas: [] };
    }
  }
);

