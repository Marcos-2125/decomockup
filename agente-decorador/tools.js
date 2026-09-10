export const agentTools = [
  {
    type: "function",
    function: {
      name: "setCanvasSize",
      description: "Cambia las dimensiones físicas del lienzo en centímetros.",
      parameters: {
        type: "object",
        properties: {
          widthCm: {
            type: "number",
            description: "Ancho del lienzo en centímetros."
          },
          heightCm: {
            type: "number",
            description: "Alto del lienzo en centímetros."
          }
        },
        required: ["widthCm", "heightCm"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "setCanvasShape",
      description: "Cambia la forma del lienzo.",
      parameters: {
        type: "object",
        properties: {
          shape: {
            type: "string",
            enum: [
              "rect_banner",
              "round_panel"
            ],
            description: "Forma del lienzo."
          }
        },
        required: ["shape"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "setCanvasBackground",
      description: "Cambia el color de fondo del lienzo.",
      parameters: {
        type: "object",
        properties: {
          bgColor: {
            type: "string",
            description: "Color hexadecimal. Ejemplo: #ffffff"
          }
        },
        required: ["bgColor"]
      }
    }
  },

  // =========================================================
  // ELEMENTOS / RECURSOS
  // =========================================================

  {
    type: "function",
    function: {
      name: "addElement",
      description: "Agrega un recurso visual existente de la biblioteca al lienzo. Nunca genera imágenes nuevas. Debe utilizar un resourceId existente.",
      parameters: {
        type: "object",
        properties: {
          resourceId: {
            type: "string",
            description: "ID exacto del recurso existente."
          },

          xCm: {
            type: "number",
            description: "Posición horizontal del CENTRO del elemento en centímetros."
          },

          yCm: {
            type: "number",
            description: "Posición vertical del CENTRO del elemento en centímetros."
          },

          widthCm: {
            type: "number",
            description: "Ancho final del elemento en centímetros."
          },

          heightCm: {
            type: "number",
            description: "Alto final del elemento en centímetros."
          },

          rotation: {
            type: "number",
            description: "Rotación en grados. 0 significa sin rotación."
          },

          flipX: {
            type: "boolean",
            description: "Voltear horizontalmente."
          },

          flipY: {
            type: "boolean",
            description: "Voltear verticalmente."
          },

          keepAspectRatio: {
            type: "boolean",
            description: "Mantener la proporción original del recurso."
          }
        },

        required: [
          "resourceId",
          "xCm",
          "yCm",
          "widthCm",
          "heightCm"
        ]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "moveElement",
      description: "Mueve un elemento existente a una posición específica del lienzo.",
      parameters: {
        type: "object",
        properties: {
          elementId: {
            type: "string",
            description: "ID exacto del elemento existente."
          },

          xCm: {
            type: "number",
            description: "Nueva posición horizontal del CENTRO en centímetros."
          },

          yCm: {
            type: "number",
            description: "Nueva posición vertical del CENTRO en centímetros."
          }
        },

        required: [
          "elementId",
          "xCm",
          "yCm"
        ]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "resizeElement",
      description: "Cambia el tamaño físico de un elemento existente en centímetros.",
      parameters: {
        type: "object",
        properties: {
          elementId: {
            type: "string",
            description: "ID exacto del elemento."
          },

          widthCm: {
            type: "number",
            description: "Nuevo ancho en centímetros."
          },

          heightCm: {
            type: "number",
            description: "Nuevo alto en centímetros."
          },

          keepAspectRatio: {
            type: "boolean",
            description: "Indica si debe conservar la proporción."
          }
        },

        required: [
          "elementId",
          "widthCm",
          "heightCm"
        ]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "rotateElement",
      description: "Rota un elemento existente.",
      parameters: {
        type: "object",
        properties: {
          elementId: {
            type: "string",
            description: "ID exacto del elemento."
          },

          rotation: {
            type: "number",
            description: "Rotación absoluta en grados entre 0 y 360."
          }
        },

        required: [
          "elementId",
          "rotation"
        ]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "flipElement",
      description: "Voltea horizontal o verticalmente un elemento existente.",
      parameters: {
        type: "object",
        properties: {
          elementId: {
            type: "string",
            description: "ID exacto del elemento."
          },

          horizontal: {
            type: "boolean",
            description: "Voltear horizontalmente."
          },

          vertical: {
            type: "boolean",
            description: "Voltear verticalmente."
          }
        },

        required: [
          "elementId",
          "horizontal",
          "vertical"
        ]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "duplicateElement",
      description: "Duplica un elemento existente.",
      parameters: {
        type: "object",
        properties: {
          elementId: {
            type: "string",
            description: "ID exacto del elemento que se quiere duplicar."
          }
        },

        required: [
          "elementId"
        ]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "deleteElement",
      description: "Elimina un elemento existente del lienzo.",
      parameters: {
        type: "object",
        properties: {
          elementId: {
            type: "string",
            description: "ID exacto del elemento que se quiere eliminar."
          }
        },

        required: [
          "elementId"
        ]
      }
    }
  },

  // =========================================================
  // CAPAS
  // =========================================================

  {
    type: "function",
    function: {
      name: "bringToFront",
      description: "Coloca un elemento por encima de todos los demás elementos.",
      parameters: {
        type: "object",
        properties: {
          elementId: {
            type: "string",
            description: "ID exacto del elemento."
          }
        },

        required: [
          "elementId"
        ]
      }
    }
  },

  {
  type: "function",
  function: {
    name: "sendToBack",

    description:
      "Envía un elemento existente al fondo. Si el elemento acaba de ser creado y solo se conoce su resourceId, utiliza resourceId en lugar de elementId.",

    parameters: {
      type: "object",

      properties: {

        elementId: {
          type: "string",
          description:
            "ID exacto del elemento existente en el lienzo."
        },

        resourceId: {
          type: "string",
          description:
            "ID exacto del recurso. Úsalo cuando quieras enviar al fondo un recurso que acabas de agregar."
        }

      },

      additionalProperties: false
    }
  }
  },

  // =========================================================
  // TEXTO
  // =========================================================

  {
    type: "function",
    function: {
      name: "addText",
      description: "Agrega un nuevo elemento de texto editable al lienzo.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Contenido del texto."
          },

          xCm: {
            type: "number",
            description: "Posición horizontal del CENTRO en centímetros."
          },

          yCm: {
            type: "number",
            description: "Posición vertical del CENTRO en centímetros."
          },

          fontSize: {
            type: "number",
            description: "Tamaño de fuente."
          },

          color: {
            type: "string",
            description: "Color hexadecimal."
          },

          fontFamily: {
            type: "string",
            description: "Familia de fuente."
          },

          textAlign: {
            type: "string",
            enum: [
              "left",
              "center",
              "right"
            ]
          },

          rotation: {
            type: "number",
            description: "Rotación en grados."
          }
        },

        required: [
          "text",
          "xCm",
          "yCm",
          "fontSize"
        ]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "updateText",
      description: "Modifica las propiedades de un texto existente.",
      parameters: {
        type: "object",
        properties: {
          elementId: {
            type: "string",
            description: "ID exacto del elemento de texto."
          },

          text: {
            type: "string",
            description: "Nuevo contenido del texto."
          },

          fontSize: {
            type: "number",
            description: "Nuevo tamaño de fuente."
          },

          color: {
            type: "string",
            description: "Nuevo color hexadecimal."
          },

          fontFamily: {
            type: "string",
            description: "Nueva familia de fuente."
          },

          textAlign: {
            type: "string",
            enum: [
              "left",
              "center",
              "right"
            ]
          }
        },

        required: [
          "elementId"
        ]
      }
    }
  }

];