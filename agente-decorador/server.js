import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { agentTools } from './tools.js';
import { validateToolCalls } from './technicalValidator.js';

const app = express();

/*
===========================================================
🤖 GEMINI
===========================================================
*/

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/*
===========================================================
⚙️ EXPRESS
===========================================================
*/

app.use(cors());

app.use(
  express.json({
    limit: '20mb'
  })
);

/*
===========================================================
🔢 UTILIDADES
===========================================================
*/

function normalizeNumberValue(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }

  return value;
}

function normalizeBooleanValue(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}

/*
===========================================================
🆔 RESOLVER RESOURCE ID
===========================================================
*/

function resolveResourceId(resourceId, resources = []) {
  if (typeof resourceId !== 'string') {
    return resourceId;
  }

  const value = resourceId.trim();

  if (!value) {
    return resourceId;
  }

  // 1. Ya es un ID real
  const exactId = resources.find(
    resource => String(resource?.id) === value
  );

  if (exactId) {
    return exactId.id;
  }

  // 2. Buscar por name o label
  const normalizedValue = value.toLowerCase();

  const matches = resources.filter(resource => {
    const name =
      typeof resource?.name === 'string'
        ? resource.name.trim().toLowerCase()
        : '';

    const label =
      typeof resource?.label === 'string'
        ? resource.label.trim().toLowerCase()
        : '';

    return name === normalizedValue || label === normalizedValue;
  });

  // 3. Solo aceptamos coincidencia única
  if (matches.length === 1) {
    const resolvedId = matches[0].id;
    console.log(`🔁 Resource ID resuelto: "${resourceId}" → "${resolvedId}"`);
    return resolvedId;
  }

  return resourceId;
}

/*
===========================================================
👁️ CONSTRUIR CONTEXTO DEL DISEÑO
===========================================================
*/

function buildDesignContext(canvas, elements, resources) {
  const resourceMap = new Map(
    resources.map(resource => [String(resource.id), resource])
  );

  const cleanElements = elements.map((element, index) => {
    const resource = element.resourceId
      ? resourceMap.get(String(element.resourceId))
      : null;

    const cleanElement = {
      id: element.id,
      type: element.type,
      xCm: element.xCm,
      yCm: element.yCm,
      widthCm: element.widthCm,
      heightCm: element.heightCm,
      rotation: element.rotation || 0,
      layer: index + 1
    };

    if (element.resourceId) {
      cleanElement.resourceId = element.resourceId;
      cleanElement.resourceName =
        resource?.name || resource?.label || 'Recurso desconocido';
    }

    if (element.type === 'text') {
      cleanElement.text = element.text || '';
      cleanElement.fontSize = element.fontSize;
      cleanElement.color = element.color;
      cleanElement.fontFamily = element.fontFamily;
      cleanElement.textAlign = element.textAlign;
    }

    if (element.flipX !== undefined) {
      cleanElement.flipX = element.flipX;
    }

    if (element.flipY !== undefined) {
      cleanElement.flipY = element.flipY;
    }

    return cleanElement;
  });

  const cleanResources = resources.map(resource => ({
    id: resource.id,
    name: resource.name,
    label: resource.label,
    category: resource.category,
    widthPx: resource.widthPx,
    heightPx: resource.heightPx,
    aspectRatio: resource.aspectRatio,
    tags: resource.tags
  }));

  return {
    canvas: {
      widthCm: canvas.widthCm,
      heightCm: canvas.heightCm,
      shape: canvas.shape,
      center: {
        xCm: canvas.widthCm / 2,
        yCm: canvas.heightCm / 2
      }
    },
    elements: cleanElements,
    resources: cleanResources
  };
}

/*
===========================================================
🧹 NORMALIZAR ARGUMENTOS DE TOOLS
===========================================================
*/

function normalizeToolArguments(toolCall, resources = []) {
  if (!toolCall?.function) {
    return toolCall;
  }

  let args = toolCall.function.arguments;

  if (typeof args === 'string') {
    try {
      args = JSON.parse(args);
    } catch {
      args = {};
    }
  }

  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    args = {};
  }

  const numericFields = [
    'xCm',
    'yCm',
    'widthCm',
    'heightCm',
    'rotation',
    'fontSize'
  ];

  numericFields.forEach(field => {
    if (args[field] !== undefined) {
      args[field] = normalizeNumberValue(args[field]);
    }
  });

  const booleanFields = [
    'flipX',
    'flipY',
    'horizontal',
    'vertical',
    'keepAspectRatio'
  ];

  booleanFields.forEach(field => {
    if (args[field] !== undefined) {
      args[field] = normalizeBooleanValue(args[field]);
    }
  });

  if (typeof args.resourceId === 'string') {
    args.resourceId = resolveResourceId(args.resourceId, resources);
  }

  if (typeof args.rotation === 'number' && Number.isFinite(args.rotation)) {
    args.rotation = ((args.rotation % 360) + 360) % 360;
  }

  toolCall.function.arguments = args;
  return toolCall;
}

/*
===========================================================
🔧 NORMALIZAR TOOL CALLS
===========================================================
*/

function normalizeToolCalls(toolCalls, resources = []) {
  const normalized = [];

  console.log('\n🧠 NORMALIZACIÓN TÉCNICA DE IA');

  for (const originalCall of toolCalls || []) {
    if (!originalCall?.function) {
      console.warn('⚠️ Tool call sin function. Se ignora.');
      continue;
    }

    const toolCall = normalizeToolArguments(
      {
        ...originalCall,
        function: {
          ...originalCall.function
        }
      },
      resources
    );

    if (!toolCall?.function) {
      continue;
    }

    normalized.push(toolCall);
  }

  console.log('\n✅ TOOL CALLS NORMALIZADOS:');
  console.log(JSON.stringify(normalized, null, 2));

  return normalized;
}

/*
===========================================================
🤖 ENDPOINT PRINCIPAL — CHAT AGENT
===========================================================
*/

app.post('/api/chat-agent', async (req, res) => {
  const { prompt, canvas, elements, resources, visualAnalysis } = req.body;

  console.log('\n====================================');
  console.log('🤖 NUEVA ORDEN DE IA');
  console.log('====================================');
  console.log('Prompt:', prompt);

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({
      success: false,
      error: 'No se recibió ninguna instrucción.'
    });
  }

  const currentCanvas = {
    widthCm: Number(canvas?.widthCm) || 150,
    heightCm: Number(canvas?.heightCm) || 80,
    shape: canvas?.shape || 'rect_banner'
  };

  const currentElements = Array.isArray(elements) ? elements : [];
  const availableResources = Array.isArray(resources) ? resources : [];

  const designContext = buildDesignContext(
    currentCanvas,
    currentElements,
    availableResources
  );

  console.log(`📦 Recursos recibidos: ${availableResources.length}`);
  console.log(`🧩 Elementos actuales: ${currentElements.length}`);

  const systemPrompt = `
Eres un agente que controla un editor gráfico.

Tu trabajo es ejecutar la orden del usuario utilizando las herramientas disponibles.

REGLAS:

1. Usa las herramientas cuando el usuario quiera modificar el diseño.
2. No expliques lo que vas a hacer.
3. No escribas planes ni recomendaciones.
4. No agregues elementos que el usuario no pidió.
5. Usa exactamente los recursos disponibles.
6. Para agregar una imagen usa addElement.
7. Para agregar texto usa addText.
8. REGLA DE COORDENADAS:
   Las posiciones (xCm, yCm) corresponden SIEMPRE al CENTRO del elemento.
   - xCm = 0 representa el borde izquierdo del lienzo.
   - yCm = 0 representa el borde superior del lienzo.
   - Ejemplo: En un canvas de 100x100 cm, colocar xCm: 50 e yCm: 50 pone el CENTRO del objeto exactamente en el centro del canvas.
9. Si el usuario indica ancho y alto, respeta exactamente ambos.
10. No inventes resourceId.
11. No inventes elementId.
12. No uses zIndex.
13. El pedido del usuario tiene prioridad sobre cualquier análisis visual de Gemini.
14. El análisis de Gemini NO es una orden para modificar el diseño.
15. Devuelve las acciones utilizando las herramientas disponibles.

IMPORTANTE SOBRE RESOURCE ID:

Cuando el usuario mencione un recurso por su nombre,
debes utilizar el recurso correspondiente de los recursos disponibles.
El resourceId debe ser siempre el ID real del recurso.
Nunca uses el nombre del recurso como resourceId.

EJEMPLO:

Si el canvas mide 150x80 cm y el usuario dice:
"Agrega Princesa Test de 50 x 70 cm al centro"

debes usar addElement con:
resourceId = ID REAL DE Princesa Test
xCm = 75
yCm = 40
widthCm = 50
heightCm = 70

No agregues ningún otro elemento.
`;

  const conversationMessages = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  try {
    console.log('\n🧠 ENVIANDO DECISIÓN COMPLETA A OLLAMA...');

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3.1:8b',
        messages: conversationMessages,
        tools: agentTools,
        stream: false
      })
    });

    const data = await response.json();

    console.log('\n====================================');
    console.log('📡 OLLAMA — DECISIÓN FINAL');
    console.log('====================================');
    console.log(JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ Error HTTP de Ollama:', data);
      return res.status(500).json({
        success: false,
        error: data?.error || 'Ollama devolvió un error'
      });
    }

    const rawToolCalls = Array.isArray(data.message?.tool_calls)
      ? data.message.tool_calls
      : [];

    console.log(`🔧 Tool calls generados por Ollama: ${rawToolCalls.length}`);

    if (rawToolCalls.length === 0) {
      console.log('ℹ️ Ollama no generó herramientas.');
      return res.json({
        success: true,
        toolCalls: [],
        message: data.message?.content || ''
      });
    }

    const normalizedToolCalls = normalizeToolCalls(
      rawToolCalls,
      availableResources
    );

    const validationResult = validateToolCalls(normalizedToolCalls, {
      canvas: currentCanvas,
      elements: currentElements,
      resources: availableResources
    });

    const toolCalls = validationResult.validCalls;
    const rejectedToolCalls = validationResult.rejectedCalls;

    console.log(`\n🔧 Tool calls aprobadas por el validador: ${toolCalls.length}`);
    console.log(`❌ Tool calls rechazadas: ${rejectedToolCalls.length}`);

    if (rejectedToolCalls.length > 0) {
      console.log('\n❌ DETALLE DE TOOL CALLS RECHAZADAS:');
      console.log(JSON.stringify(rejectedToolCalls, null, 2));
    }

    console.log('\n====================================');
    console.log('✅ DECISIÓN FINAL DEL AGENTE');
    console.log('====================================');
    console.log(JSON.stringify(toolCalls, null, 2));

    return res.json({
      success: true,
      toolCalls: toolCalls,
      rejectedToolCalls: rejectedToolCalls,
      message: data.message?.content || ''
    });
  } catch (error) {
    console.error('\n❌ Error conectando con Ollama:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/*
===========================================================
👁️ GEMINI VISION
===========================================================
*/

app.post('/api/vision', async (req, res) => {
  console.log('\n====================================');
  console.log('👁️ NUEVO ANÁLISIS VISUAL');
  console.log('====================================');

  try {
    const { image, designContext } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'No se recibió ninguna imagen del lienzo.'
      });
    }

    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    const visionPrompt = `
Eres los OJOS de un agente profesional de diseño gráfico.
Tu función es analizar visualmente el diseño que aparece en la imagen y relacionarlo con el estado estructurado del lienzo.

NO debes modificar el diseño.
NO debes generar imágenes.
NO debes ejecutar herramientas.

ESTADO ESTRUCTURADO DEL DISEÑO:
${JSON.stringify(designContext || {}, null, 2)}

FORMATO DE RESPUESTA:
Debes devolver EXACTAMENTE un objeto JSON con la estructura:
{
  "overallAssessment": "",
  "composition": "",
  "hierarchy": "",
  "balance": "",
  "spacing": "",
  "alignment": "",
  "contrast": "",
  "strengths": [],
  "issues": [
    {
      "elementId": null,
      "problem": "",
      "severity": "low",
      "evidence": "",
      "recommendedAction": ""
    }
  ],
  "observations": [],
  "confidence": 0
}
`;

    console.log('\n🧠 ENVIANDO IMAGEN A GEMINI...');

    const response = await gemini.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Image
              }
            },
            {
              text: visionPrompt
            }
          ]
        }
      ]
    });

    const rawText = response.text || '';
    let cleanText = rawText.trim();

    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let visualAnalysis;
    try {
      visualAnalysis = JSON.parse(cleanText);
    } catch (jsonError) {
      console.error('❌ Gemini no devolvió JSON válido:', cleanText);
      visualAnalysis = {
        overallAssessment: '',
        composition: '',
        hierarchy: '',
        balance: '',
        spacing: '',
        alignment: '',
        contrast: '',
        strengths: [],
        issues: [],
        observations: [cleanText],
        confidence: 0
      };
    }

    return res.json({
      success: true,
      visualAnalysis
    });
  } catch (error) {
    console.error('\n❌ Error en análisis visual:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/*
===========================================================
🚀 SERVIDOR
===========================================================
*/

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend ejecutándose en http://localhost:${PORT}`);
});