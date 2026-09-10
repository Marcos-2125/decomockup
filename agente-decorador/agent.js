import fetch from 'node-fetch';
import fs from 'fs';
import { agentTools } from './tools.js';

// ===============================
// RECURSOS DISPONIBLES
// ===============================

const resources = JSON.parse(
  fs.readFileSync('./resources.json', 'utf-8')
);

// ===============================
// LIENZO DE PRUEBA
// ===============================

const canvas = {
  widthCm: 150,
  heightCm: 100
};

// ===============================
// FUNCIÓN REAL DE addElement
// ===============================

function addElement({
  resourceId,
  xCm,
  yCm,
  widthCm,
  heightCm,
  zIndex
}) {
  // Buscar el recurso
  const resource = resources.find(
    r => r.resourceId === resourceId
  );

  if (!resource) {
    throw new Error(
      `El resourceId "${resourceId}" no existe en resources.json`
    );
  }

  // ==========================================
  // VALIDAR DIMENSIONES
  // ==========================================

  if (!widthCm || widthCm <= 0) {
    widthCm = resource.anchoOriginalCm;
  }

  if (!heightCm || heightCm <= 0) {
    heightCm = resource.altoOriginalCm;
  }

  // ==========================================
  // CORREGIR POSICIÓN SI ESTÁ FUERA DEL LIENZO
  // ==========================================

  if (widthCm > canvas.widthCm) {
    throw new Error(
      `El elemento tiene ${widthCm} cm de ancho y el lienzo solo tiene ${canvas.widthCm} cm.`
    );
  }

  if (heightCm > canvas.heightCm) {
    throw new Error(
      `El elemento tiene ${heightCm} cm de alto y el lienzo solo tiene ${canvas.heightCm} cm.`
    );
  }

  // ==========================================
  // CÁLCULO MATEMÁTICO DEL CENTRADO
  // ==========================================
  //
  // En esta prueba sabemos que el usuario pidió
  // centrar el elemento.
  //
  // x e y representan la esquina superior izquierda.
  //

  xCm = (canvas.widthCm - widthCm) / 2;
  yCm = (canvas.heightCm - heightCm) / 2;

  // ==========================================
  // RESULTADO FINAL
  // ==========================================

  const element = {
    resourceId,
    nombre: resource.nombre,
    categoria: resource.categoria,

    xCm,
    yCm,

    widthCm,
    heightCm,

    zIndex
  };

  console.log('\n====================================');
  console.log('✅ ELEMENTO EJECUTADO');
  console.log('====================================');

  console.log(
    JSON.stringify(element, null, 2)
  );

  console.log('====================================\n');

  return element;
}

// ===============================
// AGENTE
// ===============================

async function ejecutarAgente(promptUsuario) {

  const systemPrompt = `
Eres un Agente Diseñador Profesional de eventos.

Tu trabajo es interpretar las instrucciones del usuario
y utilizar las herramientas disponibles para modificar
un lienzo de diseño.

DIMENSIONES DEL LIENZO ACTUAL:

Ancho: ${canvas.widthCm} cm
Alto: ${canvas.heightCm} cm

RECURSOS DISPONIBLES:

${JSON.stringify(resources, null, 2)}

REGLAS:

1. Solo puedes utilizar recursos que existan en la lista.

2. Utiliza exactamente el resourceId del recurso.

3. Debes utilizar la herramienta addElement para agregar
   elementos.

4. xCm e yCm representan la esquina superior izquierda
   del elemento.

5. widthCm y heightCm representan las dimensiones finales
   del elemento.

6. Si el usuario proporciona dimensiones, utiliza esas
   dimensiones.

7. Si no proporciona dimensiones, utiliza las dimensiones
   originales del recurso.

8. zIndex debe ser 1 para un elemento normal.

9. No inventes recursos.

10. Si el usuario pide colocar un elemento en el lienzo,
    utiliza addElement.

IMPORTANTE:

La aplicación se encargará posteriormente de validar
y calcular posiciones geométricas exactas.
`;

  console.log(
    `\n🤖 Procesando orden: "${promptUsuario}"...\n`
  );

  try {

    // ==========================================
    // LLAMADA A OLLAMA
    // ==========================================

    const response = await fetch(
      'http://localhost:11434/api/chat',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          model: 'llama3.1:8b',

          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: promptUsuario
            }
          ],

          tools: agentTools,

          stream: false
        })
      }
    );

    const data = await response.json();

    // ==========================================
    // ERROR DE OLLAMA
    // ==========================================

    if (!response.ok) {

      console.error(
        '\n❌ Error de Ollama:'
      );

      console.error(
        JSON.stringify(data, null, 2)
      );

      return;
    }

    // ==========================================
    // MOSTRAR RESPUESTA
    // ==========================================

    console.log(
      'Respuesta de Ollama:'
    );

    console.log(
      JSON.stringify(data, null, 2)
    );

    // ==========================================
    // OBTENER TOOL CALLS
    // ==========================================

    const toolCalls =
      data.message?.tool_calls || [];

    if (toolCalls.length === 0) {

      console.log(
        '\n⚠️ Ollama no devolvió ninguna herramienta.'
      );

      console.log(
        '\nContenido del modelo:'
      );

      console.log(
        data.message?.content || '(vacío)'
      );

      return;
    }

    console.log(
      `\n🔧 Herramientas recibidas: ${toolCalls.length}`
    );

    // ==========================================
    // EJECUTAR CADA TOOL CALL
    // ==========================================

    for (const toolCall of toolCalls) {

      const functionName =
        toolCall.function?.name;

      let argumentsData =
        toolCall.function?.arguments;

      // Algunas versiones/API pueden devolver
      // arguments como objeto o como string JSON.

      if (typeof argumentsData === 'string') {

        try {

          argumentsData =
            JSON.parse(argumentsData);

        } catch (error) {

          console.error(
            '\n❌ No se pudieron interpretar los argumentos:'
          );

          console.error(argumentsData);

          continue;
        }
      }

      console.log(
        '\n------------------------------------'
      );

      console.log(
        `🔧 Tool recibida: ${functionName}`
      );

      console.log(
        '📦 Argumentos enviados por la IA:'
      );

      console.log(
        JSON.stringify(
          argumentsData,
          null,
          2
        )
      );

      // ========================================
      // EJECUTAR addElement
      // ========================================

      if (functionName === 'addElement') {

        try {

          addElement(argumentsData);

        } catch (error) {

          console.error(
            '\n❌ Error ejecutando addElement:'
          );

          console.error(
            error.message
          );
        }

      } else {

        console.warn(
          `\n⚠️ Herramienta desconocida: ${functionName}`
        );
      }
    }

  } catch (error) {

    console.error(
      '\n❌ Error conectando con Ollama:'
    );

    console.error(
      error.message
    );
  }
}

// ===============================
// PRUEBA
// ===============================

ejecutarAgente(
  'Agrega la sirena de 50x70 cm centrada en el lienzo.'
);