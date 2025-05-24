
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

Por favor, proporciona una lista de ideas relacionadas. Cada idea debe tener un 'title' (título) claro y 'details' (detalles) elaborados.
Si es aplicable, los 'details' pueden incluir:
- Fragmentos de código (usa Markdown para el formato, por ejemplo, \`\`\`lenguaje ...código...\`\`\`).
- Ejemplos de líneas de comando.
- Explicaciones o consejos de sintaxis.
- Puntos de lluvia de ideas para exploración adicional.
- Posibles expansiones del tema de la nota.
- Sugerencias para mejorar la claridad o el contenido de la nota.

**Instrucción Especial:**
Si el 'Contenido de la Nota' es muy breve (por ejemplo, solo una o dos palabras como "NEM" o "Python loops") y no proporciona suficiente contexto para generar sugerencias directamente relacionadas con un proyecto o nota específica:
1.  **Asume que el contenido de la nota es un tema o palabra clave sobre el que el usuario desea obtener información general, ejemplos o ideas iniciales.**
2.  **Actúa como si hubieras realizado una búsqueda en Internet sobre ese tema/palabra clave.**
3.  **Genera sugerencias basadas en el conocimiento común o la información típica que se encontraría para ese tema.** Estas pueden incluir definiciones, casos de uso comunes, ejemplos de sintaxis, comandos relevantes, o puntos de partida para investigar más a fondo.

Estructura tu salida de acuerdo con el esquema proporcionado.
Asegúrate de que tu respuesta esté en español.
Genera al menos 2 ideas, y como máximo 5.
Si la nota parece estar relacionada con programación (incluso si es solo un término corto), intenta proporcionar ejemplos de código o sintaxis relevantes.
Si la nota es sobre escritura o ideas generales, ofrece sugerencias de lluvia de ideas o mejoras.
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
