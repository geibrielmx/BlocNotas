
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

**INSTRUCCIÓN FUNDAMENTAL:**
SI EL 'Contenido de la Nota' ES MUY BREVE Y PARECE SER UN TÉRMINO CLAVE, UN COMANDO, UNA HERRAMIENTA O UN TEMA GENERAL (por ejemplo, solo "kubectl", "Python loops", "NEM", "marketing digital"):
1.  **TRATA ESTE TÉRMINO COMO UNA CONSULTA DIRECTA.** El usuario está buscando información sobre ese término.
2.  **TU MISIÓN ES PROPORCIONAR INFORMACIÓN ÚTIL Y ACCIONABLE SOBRE ESE TÉRMINO ESPECÍFICO.**
    *   Si es un término técnico/de programación (como "kubectl", "git command"):
        *   Explica brevemente qué es o para qué sirve.
        *   Proporciona ejemplos de uso (comandos, fragmentos de código). Usa Markdown para el formato, por ejemplo, \`\`\`lenguaje ...código...\`\`\`.
        *   Menciona conceptos clave relacionados o sintaxis importante.
    *   Si es un tema general:
        *   Ofrece una breve definición.
        *   Proporciona puntos de partida para investigar, ideas de lluvia de ideas relacionadas o ejemplos.
3.  **NO RESPONDAS** que "todo está bien", que "la nota parece estar en buen camino" o que "no hay sugerencias adicionales". Esto NO es útil. El usuario quiere información sobre el término proporcionado.
4.  Genera al menos 2 ideas informativas y como máximo 5.

SI EL 'Contenido de la Nota' ES MÁS EXTENSO Y DETALLADO (es decir, no es solo un término breve):
1.  Analiza el contenido completo de la nota.
2.  Proporciona una lista de ideas relacionadas que expandan, mejoren o complementen la nota.
3.  Cada idea debe tener un 'title' (título) claro y 'details' (detalles) elaborados.
4.  Si es aplicable, los 'details' pueden incluir:
    *   Fragmentos de código (usa Markdown).
    *   Ejemplos de líneas de comando.
    *   Explicaciones o consejos de sintaxis.
    *   Puntos de lluvia de ideas para exploración adicional.
    *   Posibles expansiones del tema de la nota.
    *   Sugerencias para mejorar la claridad o el contenido de la nota.
5.  Genera al menos 2 ideas y como máximo 5.

**PARA TODAS LAS RESPUESTAS:**
*   Estructura tu salida de acuerdo con el esquema JSON proporcionado.
*   Asegúrate de que tu respuesta esté en español.
*   Si la nota (incluso si es breve) parece estar relacionada con programación, intenta proporcionar ejemplos de código o sintaxis relevantes.
*   Si la nota es sobre escritura o ideas generales, ofrece sugerencias de lluvia de ideas o mejoras.
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
          console.warn('La IA no devolvió ideas válidas o el formato es incorrecto. Se devuelve un array vacío.');
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

