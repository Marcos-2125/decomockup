import { agentTools } from './tools.js';

// ============================================================
// 🛡️ REGLAS TÉCNICAS DEL AGENTE
// ============================================================
//
// Este archivo NO decide cómo debe verse un diseño.
// Su función es comprobar que las acciones propuestas por
// la IA sean técnicamente válidas antes de llegar al editor.
//
// Flujo:
//
// OLLAMA
//   ↓
// normalizeToolArguments()
//   ↓
// validateToolCalls()
//   ↓
// technicalValidator
//   ↓
// App.jsx
//
// ============================================================


// ============================================================
// 🔧 HERRAMIENTAS PERMITIDAS
// ============================================================

const VALID_TOOL_NAMES = new Set(
  agentTools
    .map(tool => tool?.function?.name)
    .filter(Boolean)
);


// ============================================================
// 🎨 VALORES PERMITIDOS
// ============================================================

const VALID_SHAPES = new Set([
  'rect_banner',
  'round_panel'
]);

const VALID_TEXT_ALIGNS = new Set([
  'left',
  'center',
  'right'
]);


// ============================================================
// 📐 LIMITES TÉCNICOS
// ============================================================

const MIN_DIMENSION_CM = 0.1;

const MAX_DIMENSION_CM = 10000;

const MAX_FONT_SIZE = 1000;

const MAX_ABSOLUTE_COORDINATE_CM = 10000;


// ============================================================
// 🔢 UTILIDADES
// ============================================================

function hasOwn(
  object,
  property
) {
  return Object.prototype.hasOwnProperty.call(
    object,
    property
  );
}


// ------------------------------------------------------------
// ¿Es objeto normal?
// ------------------------------------------------------------

function isPlainObject(
  value
) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}


// ------------------------------------------------------------
// Número finito
// ------------------------------------------------------------

function isFiniteNumber(
  value
) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  );
}


// ------------------------------------------------------------
// Convertir a número si es posible
// ------------------------------------------------------------

function toFiniteNumber(
  value
) {
  if (
    isFiniteNumber(value)
  ) {
    return value;
  }

  if (
    typeof value === 'string' &&
    value.trim() !== ''
  ) {
    const number =
      Number(value);

    if (
      Number.isFinite(number)
    ) {
      return number;
    }
  }

  return null;
}


// ------------------------------------------------------------
// Número positivo
// ------------------------------------------------------------

function isPositiveNumber(
  value
) {
  return (
    isFiniteNumber(value) &&
    value > 0
  );
}


// ------------------------------------------------------------
// Normalizar rotación
// ------------------------------------------------------------

function normalizeRotation(
  value
) {
  const number =
    toFiniteNumber(value);

  if (
    number === null
  ) {
    return null;
  }

  return (
    ((number % 360) + 360) % 360
  );
}


// ------------------------------------------------------------
// Booleano
// ------------------------------------------------------------

function isBoolean(
  value
) {
  return typeof value === 'boolean';
}


// ------------------------------------------------------------
// Color hexadecimal
// ------------------------------------------------------------

function isValidHexColor(
  value
) {
  if (
    typeof value !== 'string'
  ) {
    return false;
  }

  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
    value.trim()
  );
}


// ============================================================
// 🔎 BUSCAR ELEMENTO
// ============================================================

function findElement(
  elements,
  elementId
) {
  if (
    !Array.isArray(elements) ||
    !elementId
  ) {
    return null;
  }

  return (
    elements.find(
      element =>
        String(element?.id) ===
        String(elementId)
    ) || null
  );
}


// ============================================================
// 🔎 BUSCAR RECURSO
// ============================================================

function findResource(
  resources,
  resourceId
) {
  if (
    !Array.isArray(resources) ||
    !resourceId
  ) {
    return null;
  }

  return (
    resources.find(
      resource =>
        String(resource?.id) ===
        String(resourceId)
    ) || null
  );
}


// ============================================================
// 🧹 COPIAR TOOL CALL
// ============================================================
//
// Evitamos modificar directamente el objeto original
// recibido desde Ollama.
//

function cloneToolCall(
  toolCall
) {
  return {
    ...toolCall,

    function: {
      ...(toolCall?.function || {}),

      arguments:
        isPlainObject(
          toolCall?.function?.arguments
        )
          ? {
              ...toolCall.function.arguments
            }
          : {}
    }
  };
}


// ============================================================
// 🚫 VALIDAR ARGUMENTOS DESCONOCIDOS
// ============================================================
//
// Si la IA inventa un argumento que no existe en la tool,
// lo rechazamos.
//
// Ejemplo:
//
// moveElement
// {
//   elementId: "...",
//   xCm: 100,
//   yCm: 40,
//   color: "red"  ← ❌
// }
//

function validateAllowedArguments(
  args,
  allowedArguments,
  toolName
) {
  const unknownArguments = [];

  Object.keys(args).forEach(
    key => {
      if (
        !allowedArguments.has(key)
      ) {
        unknownArguments.push(key);
      }
    }
  );

  if (
    unknownArguments.length > 0
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: argumentos no permitidos: ${unknownArguments.join(', ')}.`
    };
  }

  return {
    valid: true
  };
}


// ============================================================
// 🆔 VALIDAR ELEMENT ID
// ============================================================

function validateElementId(
  args,
  elements,
  toolName
) {
  if (
    !hasOwn(args, 'elementId')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: elementId es obligatorio.`
    };
  }

  if (
    typeof args.elementId !== 'string' ||
    !args.elementId.trim()
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: elementId debe ser un string válido.`
    };
  }

  const element =
    findElement(
      elements,
      args.elementId
    );

  if (
    !element
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: el elementId "${args.elementId}" no existe en el lienzo actual.`
    };
  }

  return {
    valid: true,
    element
  };
}


// ============================================================
// 📦 VALIDAR RESOURCE ID
// ============================================================

function validateResourceId(
  args,
  resources,
  toolName
) {
  if (
    !hasOwn(args, 'resourceId')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: resourceId es obligatorio.`
    };
  }

  if (
    typeof args.resourceId !== 'string' ||
    !args.resourceId.trim()
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: resourceId debe ser un string válido.`
    };
  }

  const resource =
    findResource(
      resources,
      args.resourceId
    );

  if (
    !resource
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: el resourceId "${args.resourceId}" no existe en los recursos disponibles.`
    };
  }

  return {
    valid: true,
    resource
  };
}


// ============================================================
// 📐 VALIDAR DIMENSIÓN
// ============================================================

function validateDimension(
  value,
  fieldName,
  toolName
) {
  const number =
    toFiniteNumber(value);

  if (
    number === null
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: ${fieldName} debe ser un número válido.`
    };
  }

  if (
    number < MIN_DIMENSION_CM
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: ${fieldName} debe ser mayor o igual a ${MIN_DIMENSION_CM} cm.`
    };
  }

  if (
    number > MAX_DIMENSION_CM
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: ${fieldName} supera el máximo técnico permitido de ${MAX_DIMENSION_CM} cm.`
    };
  }

  return {
    valid: true,
    value: number
  };
}


// ============================================================
// 📍 VALIDAR COORDENADA
// ============================================================

function validateCoordinate(
  value,
  fieldName,
  toolName
) {
  const number =
    toFiniteNumber(value);

  if (
    number === null
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: ${fieldName} debe ser un número válido.`
    };
  }

  if (
    Math.abs(number) >
    MAX_ABSOLUTE_COORDINATE_CM
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: ${fieldName} supera el límite técnico permitido.`
    };
  }

  return {
    valid: true,
    value: number
  };
}


// ============================================================
// 🔘 VALIDAR BOOLEANO
// ============================================================

function validateBoolean(
  args,
  fieldName,
  toolName
) {
  if (
    !hasOwn(args, fieldName)
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: ${fieldName} es obligatorio.`
    };
  }

  if (
    !isBoolean(
      args[fieldName]
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: ${fieldName} debe ser boolean.`
    };
  }

  return {
    valid: true
  };
}


// ============================================================
// 📐 VALIDAR ROTACIÓN OPCIONAL
// ============================================================

function validateOptionalRotation(
  args,
  toolName
) {
  if (
    !hasOwn(args, 'rotation')
  ) {
    return {
      valid: true
    };
  }

  const rotation =
    normalizeRotation(
      args.rotation
    );

  if (
    rotation === null
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: rotation debe ser numérica.`
    };
  }

  args.rotation =
    rotation;

  return {
    valid: true
  };
}


// ============================================================
// 🎨 setCanvasSize
// ============================================================

function validateSetCanvasSize(
  args
) {
  const toolName =
    'setCanvasSize';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'widthCm',
        'heightCm'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  if (
    !hasOwn(args, 'widthCm')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: widthCm es obligatorio.`
    };
  }

  if (
    !hasOwn(args, 'heightCm')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: heightCm es obligatorio.`
    };
  }

  const width =
    validateDimension(
      args.widthCm,
      'widthCm',
      toolName
    );

  if (
    !width.valid
  ) {
    return width;
  }

  const height =
    validateDimension(
      args.heightCm,
      'heightCm',
      toolName
    );

  if (
    !height.valid
  ) {
    return height;
  }

  args.widthCm =
    width.value;

  args.heightCm =
    height.value;

  return {
    valid: true
  };
}


// ============================================================
// 🎨 setCanvasShape
// ============================================================

function validateSetCanvasShape(
  args
) {
  const toolName =
    'setCanvasShape';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'shape'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  if (
    !hasOwn(args, 'shape')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: shape es obligatorio.`
    };
  }

  if (
    !VALID_SHAPES.has(
      args.shape
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: shape inválido "${args.shape}".`
    };
  }

  return {
    valid: true
  };
}


// ============================================================
// 🎨 setCanvasBackground
// ============================================================

function validateSetCanvasBackground(
  args
) {
  const toolName =
    'setCanvasBackground';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'bgColor'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  if (
    !hasOwn(args, 'bgColor')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: bgColor es obligatorio.`
    };
  }

  if (
    !isValidHexColor(
      args.bgColor
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: bgColor debe ser un color hexadecimal válido.`
    };
  }

  args.bgColor =
    args.bgColor.trim();

  return {
    valid: true
  };
}


// ============================================================
// 🖼️ addElement
// ============================================================

function validateAddElement(
  args,
  context
) {
  const toolName =
    'addElement';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'resourceId',
        'xCm',
        'yCm',
        'widthCm',
        'heightCm',
        'rotation',
        'flipX',
        'flipY',
        'keepAspectRatio'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  // ----------------------------------------------------------
  // Nunca permitir elementId en elementos nuevos
  // ----------------------------------------------------------

  if (
    hasOwn(args, 'elementId')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: no se permite elementId al crear un elemento nuevo. El editor genera ese ID.`
    };
  }

  // ----------------------------------------------------------
  // Resource
  // ----------------------------------------------------------

  const resourceResult =
    validateResourceId(
      args,
      context.resources,
      toolName
    );

  if (
    !resourceResult.valid
  ) {
    return resourceResult;
  }

  // ----------------------------------------------------------
  // Coordenadas obligatorias
  // ----------------------------------------------------------

  if (
    !hasOwn(args, 'xCm')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: xCm es obligatorio.`
    };
  }

  if (
    !hasOwn(args, 'yCm')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: yCm es obligatorio.`
    };
  }

  const x =
    validateCoordinate(
      args.xCm,
      'xCm',
      toolName
    );

  if (
    !x.valid
  ) {
    return x;
  }

  const y =
    validateCoordinate(
      args.yCm,
      'yCm',
      toolName
    );

  if (
    !y.valid
  ) {
    return y;
  }

  args.xCm =
    x.value;

  args.yCm =
    y.value;

  // ----------------------------------------------------------
  // Dimensiones obligatorias
  // ----------------------------------------------------------

  if (
    !hasOwn(args, 'widthCm')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: widthCm es obligatorio.`
    };
  }

  if (
    !hasOwn(args, 'heightCm')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: heightCm es obligatorio.`
    };
  }

  const width =
    validateDimension(
      args.widthCm,
      'widthCm',
      toolName
    );

  if (
    !width.valid
  ) {
    return width;
  }

  const height =
    validateDimension(
      args.heightCm,
      'heightCm',
      toolName
    );

  if (
    !height.valid
  ) {
    return height;
  }

  args.widthCm =
    width.value;

  args.heightCm =
    height.value;

  // ----------------------------------------------------------
  // Rotación
  // ----------------------------------------------------------

  const rotationResult =
    validateOptionalRotation(
      args,
      toolName
    );

  if (
    !rotationResult.valid
  ) {
    return rotationResult;
  }

  // ----------------------------------------------------------
  // Booleanos opcionales
  // ----------------------------------------------------------

  for (
    const field of [
      'flipX',
      'flipY',
      'keepAspectRatio'
    ]
  ) {
    if (
      hasOwn(args, field) &&
      !isBoolean(args[field])
    ) {
      return {
        valid: false,
        reason:
          `${toolName}: ${field} debe ser boolean.`
      };
    }
  }

  // ----------------------------------------------------------
  // Si se especificaron ancho y alto,
  // deben respetarse exactamente.
  // ----------------------------------------------------------

  args.keepAspectRatio =
    false;

  return {
    valid: true,

    addedResourceId:
      String(args.resourceId)
  };
}


// ============================================================
// 📍 moveElement
// ============================================================

function validateMoveElement(
  args,
  state
) {
  const toolName =
    'moveElement';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'elementId',
        'xCm',
        'yCm'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  // ----------------------------------------------------------
  // Verificar que no fue eliminado antes
  // ----------------------------------------------------------

  if (
    state.deletedElementIds.has(
      String(args.elementId)
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: el elementId "${args.elementId}" fue eliminado anteriormente en esta misma solicitud.`
    };
  }

  // ----------------------------------------------------------
  // Elemento
  // ----------------------------------------------------------

  const elementResult =
    validateElementId(
      args,
      state.elements,
      toolName
    );

  if (
    !elementResult.valid
  ) {
    return elementResult;
  }

  // ----------------------------------------------------------
  // Coordenadas
  // ----------------------------------------------------------

  if (
    !hasOwn(args, 'xCm')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: xCm es obligatorio.`
    };
  }

  if (
    !hasOwn(args, 'yCm')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: yCm es obligatorio.`
    };
  }

  const x =
    validateCoordinate(
      args.xCm,
      'xCm',
      toolName
    );

  if (
    !x.valid
  ) {
    return x;
  }

  const y =
    validateCoordinate(
      args.yCm,
      'yCm',
      toolName
    );

  if (
    !y.valid
  ) {
    return y;
  }

  args.xCm =
    x.value;

  args.yCm =
    y.value;

  return {
    valid: true
  };
}


// ============================================================
// 📐 resizeElement
// ============================================================

function validateResizeElement(
  args,
  state
) {
  const toolName =
    'resizeElement';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'elementId',
        'widthCm',
        'heightCm',
        'keepAspectRatio'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  // ----------------------------------------------------------
  // Verificar eliminación previa
  // ----------------------------------------------------------

  if (
    state.deletedElementIds.has(
      String(args.elementId)
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: el elementId "${args.elementId}" fue eliminado anteriormente en esta misma solicitud.`
    };
  }

  // ----------------------------------------------------------
  // Elemento
  // ----------------------------------------------------------

  const elementResult =
    validateElementId(
      args,
      state.elements,
      toolName
    );

  if (
    !elementResult.valid
  ) {
    return elementResult;
  }

  // ----------------------------------------------------------
  // Al menos una dimensión
  // ----------------------------------------------------------

  const hasWidth =
    hasOwn(
      args,
      'widthCm'
    );

  const hasHeight =
    hasOwn(
      args,
      'heightCm'
    );

  if (
    !hasWidth &&
    !hasHeight
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: debes proporcionar widthCm, heightCm o ambos.`
    };
  }

  // ----------------------------------------------------------
  // Ancho
  // ----------------------------------------------------------

  if (
    hasWidth
  ) {
    const width =
      validateDimension(
        args.widthCm,
        'widthCm',
        toolName
      );

    if (
      !width.valid
    ) {
      return width;
    }

    args.widthCm =
      width.value;
  }

  // ----------------------------------------------------------
  // Alto
  // ----------------------------------------------------------

  if (
    hasHeight
  ) {
    const height =
      validateDimension(
        args.heightCm,
        'heightCm',
        toolName
      );

    if (
      !height.valid
    ) {
      return height;
    }

    args.heightCm =
      height.value;
  }

  // ----------------------------------------------------------
  // keepAspectRatio
  // ----------------------------------------------------------

  if (
    hasOwn(
      args,
      'keepAspectRatio'
    ) &&
    !isBoolean(
      args.keepAspectRatio
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: keepAspectRatio debe ser boolean.`
    };
  }

  // ----------------------------------------------------------
  // Si se especifican ambas dimensiones,
  // ambas tienen prioridad absoluta.
  // ----------------------------------------------------------

  if (
    hasWidth &&
    hasHeight
  ) {
    args.keepAspectRatio =
      false;
  }

  return {
    valid: true
  };
}


// ============================================================
// 🔄 rotateElement
// ============================================================

function validateRotateElement(
  args,
  state
) {
  const toolName =
    'rotateElement';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'elementId',
        'rotation'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  if (
    state.deletedElementIds.has(
      String(args.elementId)
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: el elementId "${args.elementId}" fue eliminado anteriormente en esta misma solicitud.`
    };
  }

  const elementResult =
    validateElementId(
      args,
      state.elements,
      toolName
    );

  if (
    !elementResult.valid
  ) {
    return elementResult;
  }

  if (
    !hasOwn(args, 'rotation')
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: rotation es obligatorio.`
    };
  }

  const rotation =
    normalizeRotation(
      args.rotation
    );

  if (
    rotation === null
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: rotation debe ser numérica.`
    };
  }

  args.rotation =
    rotation;

  return {
    valid: true
  };
}


// ============================================================
// 🔄 flipElement
// ============================================================

function validateFlipElement(
  args,
  state
) {
  const toolName =
    'flipElement';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'elementId',
        'horizontal',
        'vertical'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  if (
    state.deletedElementIds.has(
      String(args.elementId)
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: el elementId "${args.elementId}" fue eliminado anteriormente en esta misma solicitud.`
    };
  }

  const elementResult =
    validateElementId(
      args,
      state.elements,
      toolName
    );

  if (
    !elementResult.valid
  ) {
    return elementResult;
  }

  const horizontal =
    validateBoolean(
      args,
      'horizontal',
      toolName
    );

  if (
    !horizontal.valid
  ) {
    return horizontal;
  }

  const vertical =
    validateBoolean(
      args,
      'vertical',
      toolName
    );

  if (
    !vertical.valid
  ) {
    return vertical;
  }

  return {
    valid: true
  };
}


// ============================================================
// 📋 duplicateElement
// ============================================================

function validateDuplicateElement(
  args,
  state
) {
  const toolName =
    'duplicateElement';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'elementId'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  if (
    state.deletedElementIds.has(
      String(args.elementId)
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: el elementId "${args.elementId}" fue eliminado anteriormente en esta misma solicitud.`
    };
  }

  return validateElementId(
    args,
    state.elements,
    toolName
  );
}


// ============================================================
// 🗑️ deleteElement
// ============================================================

function validateDeleteElement(
  args,
  state
) {
  const toolName =
    'deleteElement';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'elementId'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  if (
    state.deletedElementIds.has(
      String(args.elementId)
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: el elementId "${args.elementId}" ya fue eliminado.`
    };
  }

  const elementResult =
    validateElementId(
      args,
      state.elements,
      toolName
    );

  if (
    !elementResult.valid
  ) {
    return elementResult;
  }

  return {
    valid: true,

    deletedElementId:
      String(args.elementId)
  };
}


// ============================================================
// ⬆️ bringToFront
// ============================================================

function validateBringToFront(
  args,
  state
) {
  const toolName =
    'bringToFront';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'elementId'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  if (
    state.deletedElementIds.has(
      String(args.elementId)
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: el elementId "${args.elementId}" fue eliminado anteriormente en esta misma solicitud.`
    };
  }

  return validateElementId(
    args,
    state.elements,
    toolName
  );
}


// ============================================================
// ⬇️ sendToBack
// ============================================================
//
// Puede funcionar de dos formas:
//
// 1. elementId
//    → elemento que ya existe.
//
// 2. resourceId
//    → recurso agregado anteriormente en esta misma
//      solicitud.
//
// Esto permite:
//
// addElement
// sendToBack resourceId
//
// sin inventar un elementId.
//

function validateSendToBack(
  args,
  context,
  state
) {
  const toolName =
    'sendToBack';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'elementId',
        'resourceId'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  const hasElementId =
    hasOwn(
      args,
      'elementId'
    ) &&
    typeof args.elementId === 'string' &&
    args.elementId.trim() !== '';

  const hasResourceId =
    hasOwn(
      args,
      'resourceId'
    ) &&
    typeof args.resourceId === 'string' &&
    args.resourceId.trim() !== '';

  // ----------------------------------------------------------
  // No puede utilizar ambos
  // ----------------------------------------------------------

  if (
    hasElementId &&
    hasResourceId
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: utiliza elementId o resourceId, no ambos.`
    };
  }

  // ----------------------------------------------------------
  // Debe utilizar al menos uno
  // ----------------------------------------------------------

  if (
    !hasElementId &&
    !hasResourceId
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: se requiere elementId o resourceId.`
    };
  }

  // ----------------------------------------------------------
  // Elemento existente
  // ----------------------------------------------------------

  if (
    hasElementId
  ) {
    if (
      state.deletedElementIds.has(
        String(args.elementId)
      )
    ) {
      return {
        valid: false,
        reason:
          `${toolName}: el elementId "${args.elementId}" fue eliminado anteriormente en esta misma solicitud.`
      };
    }

    const elementResult =
      validateElementId(
        args,
        state.elements,
        toolName
      );

    if (
      !elementResult.valid
    ) {
      return elementResult;
    }

    delete args.resourceId;

    return {
      valid: true
    };
  }

  // ----------------------------------------------------------
  // Recurso
  // ----------------------------------------------------------

  if (
    hasResourceId
  ) {
    const resourceResult =
      validateResourceId(
        args,
        context.resources,
        toolName
      );

    if (
      !resourceResult.valid
    ) {
      return resourceResult;
    }

    if (
      !state.createdResourceIds.has(
        String(args.resourceId)
      )
    ) {
      return {
        valid: false,
        reason:
          `${toolName}: el resourceId "${args.resourceId}" no corresponde a un recurso agregado en esta misma solicitud.`
      };
    }

    delete args.elementId;

    return {
      valid: true
    };
  }

  return {
    valid: false,
    reason:
      `${toolName}: operación inválida.`
  };
}


// ============================================================
// 🔤 addText
// ============================================================

function validateAddText(
  args
) {
  const toolName =
    'addText';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'text',
        'xCm',
        'yCm',
        'fontSize',
        'color',
        'fontFamily',
        'textAlign',
        'rotation'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  // ----------------------------------------------------------
  // Nunca permitir IDs de elementos o recursos
  // ----------------------------------------------------------

  if (
    hasOwn(
      args,
      'elementId'
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: no se permite elementId al crear texto.`
    };
  }

  if (
    hasOwn(
      args,
      'resourceId'
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: no se permite resourceId al crear texto.`
    };
  }

  // ----------------------------------------------------------
  // Texto
  // ----------------------------------------------------------

  if (
    !hasOwn(
      args,
      'text'
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: text es obligatorio.`
    };
  }

  if (
    typeof args.text !== 'string' ||
    !args.text.trim()
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: text no puede estar vacío.`
    };
  }

  // ----------------------------------------------------------
  // Coordenadas
  // ----------------------------------------------------------

  if (
    !hasOwn(
      args,
      'xCm'
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: xCm es obligatorio.`
    };
  }

  if (
    !hasOwn(
      args,
      'yCm'
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: yCm es obligatorio.`
    };
  }

  const x =
    validateCoordinate(
      args.xCm,
      'xCm',
      toolName
    );

  if (
    !x.valid
  ) {
    return x;
  }

  const y =
    validateCoordinate(
      args.yCm,
      'yCm',
      toolName
    );

  if (
    !y.valid
  ) {
    return y;
  }

  args.xCm =
    x.value;

  args.yCm =
    y.value;

  // ----------------------------------------------------------
  // Tamaño de texto
  // ----------------------------------------------------------

  if (
    !hasOwn(
      args,
      'fontSize'
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: fontSize es obligatorio.`
    };
  }

  const fontSize =
    validateDimension(
      args.fontSize,
      'fontSize',
      toolName
    );

  if (
    !fontSize.valid
  ) {
    return fontSize;
  }

  if (
    fontSize.value >
    MAX_FONT_SIZE
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: fontSize supera el máximo permitido de ${MAX_FONT_SIZE}.`
    };
  }

  args.fontSize =
    fontSize.value;

  // ----------------------------------------------------------
  // Color
  // ----------------------------------------------------------

  if (
    hasOwn(
      args,
      'color'
    )
  ) {
    if (
      !isValidHexColor(
        args.color
      )
    ) {
      return {
        valid: false,
        reason:
          `${toolName}: color debe ser hexadecimal válido.`
      };
    }

    args.color =
      args.color.trim();
  }

  // ----------------------------------------------------------
  // Fuente
  // ----------------------------------------------------------

  if (
    hasOwn(
      args,
      'fontFamily'
    )
  ) {
    if (
      typeof args.fontFamily !== 'string' ||
      !args.fontFamily.trim()
    ) {
      return {
        valid: false,
        reason:
          `${toolName}: fontFamily debe ser un texto válido.`
      };
    }

    args.fontFamily =
      args.fontFamily.trim();
  }

  // ----------------------------------------------------------
  // Alineación
  // ----------------------------------------------------------

  if (
    hasOwn(
      args,
      'textAlign'
    )
  ) {
    if (
      !VALID_TEXT_ALIGNS.has(
        args.textAlign
      )
    ) {
      return {
        valid: false,
        reason:
          `${toolName}: textAlign inválido "${args.textAlign}".`
      };
    }
  }

  // ----------------------------------------------------------
  // Rotación
  // ----------------------------------------------------------

  const rotationResult =
    validateOptionalRotation(
      args,
      toolName
    );

  if (
    !rotationResult.valid
  ) {
    return rotationResult;
  }

  return {
    valid: true
  };
}


// ============================================================
// 🔤 updateText
// ============================================================

function validateUpdateText(
  args,
  state
) {
  const toolName =
    'updateText';

  const allowed =
    validateAllowedArguments(
      args,
      new Set([
        'elementId',
        'text',
        'fontSize',
        'color',
        'fontFamily',
        'textAlign'
      ]),
      toolName
    );

  if (
    !allowed.valid
  ) {
    return allowed;
  }

  // ----------------------------------------------------------
  // Elemento eliminado
  // ----------------------------------------------------------

  if (
    state.deletedElementIds.has(
      String(args.elementId)
    )
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: el elementId "${args.elementId}" fue eliminado anteriormente en esta misma solicitud.`
    };
  }

  // ----------------------------------------------------------
  // Elemento
  // ----------------------------------------------------------

  const elementResult =
    validateElementId(
      args,
      state.elements,
      toolName
    );

  if (
    !elementResult.valid
  ) {
    return elementResult;
  }

  // ----------------------------------------------------------
  // Debe ser texto
  // ----------------------------------------------------------

  if (
    elementResult.element.type !== 'text'
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: el elemento "${args.elementId}" no es un elemento de texto.`
    };
  }

  // ----------------------------------------------------------
  // Debe modificar al menos un campo
  // ----------------------------------------------------------

  const editableFields = [
    'text',
    'fontSize',
    'color',
    'fontFamily',
    'textAlign'
  ];

  const hasModification =
    editableFields.some(
      field =>
        hasOwn(
          args,
          field
        )
    );

  if (
    !hasModification
  ) {
    return {
      valid: false,
      reason:
        `${toolName}: debes proporcionar al menos un campo para modificar.`
    };
  }

  // ----------------------------------------------------------
  // Texto
  // ----------------------------------------------------------

  if (
    hasOwn(
      args,
      'text'
    )
  ) {
    if (
      typeof args.text !== 'string' ||
      !args.text.trim()
    ) {
      return {
        valid: false,
        reason:
          `${toolName}: text no puede estar vacío.`
      };
    }
  }

  // ----------------------------------------------------------
  // Font size
  // ----------------------------------------------------------

  if (
    hasOwn(
      args,
      'fontSize'
    )
  ) {
    const fontSize =
      validateDimension(
        args.fontSize,
        'fontSize',
        toolName
      );

    if (
      !fontSize.valid
    ) {
      return fontSize;
    }

    if (
      fontSize.value >
      MAX_FONT_SIZE
    ) {
      return {
        valid: false,
        reason:
          `${toolName}: fontSize supera el máximo permitido.`
      };
    }

    args.fontSize =
      fontSize.value;
  }

  // ----------------------------------------------------------
  // Color
  // ----------------------------------------------------------

  if (
    hasOwn(
      args,
      'color'
    )
  ) {
    if (
      !isValidHexColor(
        args.color
      )
    ) {
      return {
        valid: false,
        reason:
          `${toolName}: color debe ser hexadecimal válido.`
      };
    }

    args.color =
      args.color.trim();
  }

  // ----------------------------------------------------------
  // Font family
  // ----------------------------------------------------------

  if (
    hasOwn(
      args,
      'fontFamily'
    )
  ) {
    if (
      typeof args.fontFamily !== 'string' ||
      !args.fontFamily.trim()
    ) {
      return {
        valid: false,
        reason:
          `${toolName}: fontFamily debe ser un texto válido.`
      };
    }

    args.fontFamily =
      args.fontFamily.trim();
  }

  // ----------------------------------------------------------
  // Text align
  // ----------------------------------------------------------

  if (
    hasOwn(
      args,
      'textAlign'
    )
  ) {
    if (
      !VALID_TEXT_ALIGNS.has(
        args.textAlign
      )
    ) {
      return {
        valid: false,
        reason:
          `${toolName}: textAlign inválido "${args.textAlign}".`
      };
    }
  }

  return {
    valid: true
  };
}


// ============================================================
// 🛡️ VALIDAR UNA TOOL
// ============================================================

function validateToolCall(
  toolCall,
  context,
  state
) {
  // ----------------------------------------------------------
  // Function
  // ----------------------------------------------------------

  if (
    !toolCall?.function
  ) {
    return {
      valid: false,
      reason:
        'Tool call inválido: falta function.'
    };
  }

  const name =
    toolCall.function.name;

  // ----------------------------------------------------------
  // Tool permitida
  // ----------------------------------------------------------

  if (
    typeof name !== 'string' ||
    !VALID_TOOL_NAMES.has(name)
  ) {
    return {
      valid: false,
      reason:
        `Herramienta desconocida o no permitida: "${name}".`
    };
  }

  // ----------------------------------------------------------
  // Argumentos
  // ----------------------------------------------------------

  const args =
    toolCall.function.arguments;

  if (
    !isPlainObject(args)
  ) {
    return {
      valid: false,
      reason:
        `${name}: los argumentos deben ser un objeto.`
    };
  }

  // ----------------------------------------------------------
  // zIndex
  // ----------------------------------------------------------
  //
  // NO lo eliminamos silenciosamente.
  // Si la IA intenta utilizarlo, queremos saberlo.
  //

  if (
    hasOwn(
      args,
      'zIndex'
    )
  ) {
    return {
      valid: false,
      reason:
        `${name}: zIndex no está permitido. Utiliza bringToFront o sendToBack.`
    };
  }

  // ----------------------------------------------------------
  // Ejecutar regla específica
  // ----------------------------------------------------------

  let result;

  switch (
    name
  ) {

    case 'setCanvasSize':

      result =
        validateSetCanvasSize(
          args
        );

      break;


    case 'setCanvasShape':

      result =
        validateSetCanvasShape(
          args
        );

      break;


    case 'setCanvasBackground':

      result =
        validateSetCanvasBackground(
          args
        );

      break;


    case 'addElement':

      result =
        validateAddElement(
          args,
          context
        );

      break;


    case 'moveElement':

      result =
        validateMoveElement(
          args,
          state
        );

      break;


    case 'resizeElement':

      result =
        validateResizeElement(
          args,
          state
        );

      break;


    case 'rotateElement':

      result =
        validateRotateElement(
          args,
          state
        );

      break;


    case 'flipElement':

      result =
        validateFlipElement(
          args,
          state
        );

      break;


    case 'duplicateElement':

      result =
        validateDuplicateElement(
          args,
          state
        );

      break;


    case 'deleteElement':

      result =
        validateDeleteElement(
          args,
          state
        );

      break;


    case 'bringToFront':

      result =
        validateBringToFront(
          args,
          state
        );

      break;


    case 'sendToBack':

      result =
        validateSendToBack(
          args,
          context,
          state
        );

      break;


    case 'addText':

      result =
        validateAddText(
          args
        );

      break;


    case 'updateText':

      result =
        validateUpdateText(
          args,
          state
        );

      break;


    default:

      result = {
        valid: false,
        reason:
          `No existe una regla de validación para "${name}".`
      };
  }

  // ----------------------------------------------------------
  // Tool rechazada
  // ----------------------------------------------------------

  if (
    !result.valid
  ) {
    return {
      valid: false,
      reason:
        result.reason ||
        `${name}: operación inválida.`
    };
  }

  // ----------------------------------------------------------
  // Tool aprobada
  // ----------------------------------------------------------

  return {
    valid: true,

    call: {
      ...toolCall,

      function: {
        ...toolCall.function,

        arguments: args
      }
    },

    addedResourceId:
      result.addedResourceId,

    deletedElementId:
      result.deletedElementId
  };
}


// ============================================================
// 🛡️ VALIDAR TODAS LAS TOOL CALLS
// ============================================================

export function validateToolCalls(
  toolCalls,
  {
    canvas = {},
    elements = [],
    resources = []
  } = {}
) {

  // ==========================================================
  // RESULTADOS
  // ==========================================================

  const validCalls = [];

  const rejectedCalls = [];


  // ==========================================================
  // 🧠 ESTADO INTERNO DE ESTA SOLICITUD
  // ==========================================================
  //
  // Esto permite validar secuencias como:
  //
  // addElement
  // sendToBack resourceId
  //
  // y también:
  //
  // deleteElement
  // moveElement
  //
  // donde el segundo debe ser rechazado.
  //

  const state = {

    elements:
      Array.isArray(elements)
        ? elements.map(
            element => ({
              ...element
            })
          )
        : [],

    createdResourceIds:
      new Set(),

    deletedElementIds:
      new Set()
  };


  // ==========================================================
  // 📦 CONTEXTO
  // ==========================================================

  const context = {

    canvas: {

      widthCm:
        toFiniteNumber(
          canvas.widthCm
        ) ?? 150,

      heightCm:
        toFiniteNumber(
          canvas.heightCm
        ) ?? 80,

      shape:
        canvas.shape ||
        'rect_banner'
    },

    resources:
      Array.isArray(resources)
        ? resources
        : []
  };


  // ==========================================================
  // LOG
  // ==========================================================

  console.log(
    '\n==================================================='
  );

  console.log(
    '🛡️ VALIDACIÓN TÉCNICA DE TOOL CALLS'
  );

  console.log(
    '==================================================='
  );


  console.log(
    `📦 Recursos disponibles: ${context.resources.length}`
  );

  console.log(
    `🧩 Elementos existentes: ${state.elements.length}`
  );

  console.log(
    `🔧 Tool calls recibidas: ${
      Array.isArray(toolCalls)
        ? toolCalls.length
        : 0
    }`
  );


  // ==========================================================
  // 🔄 RECORRER TOOL CALLS
  // ==========================================================

  for (
    const originalCall of
    Array.isArray(toolCalls)
      ? toolCalls
      : []
  ) {

    // --------------------------------------------------------
    // Copiar para no modificar Ollama directamente
    // --------------------------------------------------------

    const toolCall =
      cloneToolCall(
        originalCall
      );


    // --------------------------------------------------------
    // Nombre
    // --------------------------------------------------------

    const toolName =
      toolCall.function?.name ||
      'desconocida';


    // --------------------------------------------------------
    // Validar
    // --------------------------------------------------------

    const result =
      validateToolCall(
        toolCall,
        context,
        state
      );


    // ========================================================
    // ✅ APROBADA
    // ========================================================

    if (
      result.valid
    ) {

      validCalls.push(
        result.call
      );


      // ------------------------------------------------------
      // Registrar recurso creado
      // ------------------------------------------------------

      if (
        result.addedResourceId
      ) {

        state.createdResourceIds.add(
          result.addedResourceId
        );

        console.log(
          `📦 Recurso registrado como recién agregado: ${result.addedResourceId}`
        );
      }


      // ------------------------------------------------------
      // Registrar elemento eliminado
      // ------------------------------------------------------

      if (
        result.deletedElementId
      ) {

        const deletedId =
          result.deletedElementId;

        state.deletedElementIds.add(
          deletedId
        );

        state.elements =
          state.elements.filter(
            element =>
              String(element?.id) !==
              deletedId
          );

        console.log(
          `🗑️ Elemento marcado como eliminado: ${deletedId}`
        );
      }


      console.log(
        `✅ ${toolName} aprobada`
      );

    }

    // ========================================================
    // ❌ RECHAZADA
    // ========================================================

    else {

      rejectedCalls.push({

        toolCall,

        reason:
          result.reason ||
          'Razón desconocida.'
      });


      console.warn(
        `❌ ${toolName} rechazada: ${
          result.reason ||
          'Razón desconocida.'
        }`
      );
    }
  }


  // ==========================================================
  // 📊 RESUMEN
  // ==========================================================

  console.log(
    '\n==================================================='
  );

  console.log(
    `✅ Aprobadas: ${validCalls.length}`
  );

  console.log(
    `❌ Rechazadas: ${rejectedCalls.length}`
  );

  console.log(
    '===================================================\n'
  );


  // ==========================================================
  // 📤 RESULTADO
  // ==========================================================

  return {

    validCalls,

    rejectedCalls

  };
}