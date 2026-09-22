# DECISIONES TÉCNICAS — META IA AGENTE DECORADOR

Este documento registra las decisiones importantes de arquitectura tomadas durante el desarrollo del proyecto.

Su objetivo es conservar el motivo de cada elección y evitar cambios contradictorios en el futuro.

---

# DECISIÓN 001

## Fecha

22/09/2026


## Tema

Definición del tipo de agente IA.


## Decisión

META IA será construido como un agente diseñador y decorador profesional integrado dentro del editor web.

No será un chatbot tradicional ni un simple generador de imágenes.


## Motivo

El objetivo es que la IA pueda:

- crear diseños;
- modificar diseños;
- usar herramientas reales del editor;
- trabajar con recursos existentes;
- asesorar usuarios;
- analizar referencias visuales.


## Estado

Activo.

---

# DECISIÓN 002

## Fecha

22/09/2026


## Tema

Separación de responsabilidades del sistema.


## Decisión

El sistema tendrá tres partes principales:

## Ojos

Sistema de visión.

Responsabilidad:

Analizar imágenes, diseños y composición.


## Motor

Sistema de razonamiento.

Responsabilidad:

Interpretar, planificar y decidir.


## Manos

Sistema de herramientas.

Responsabilidad:

Ejecutar acciones dentro del editor.


## Motivo

Separar percepción, razonamiento y ejecución permite construir un agente más estable y escalable.


## Estado

Activo.

---

# DECISIÓN 003

## Fecha

22/09/2026


## Tema

Control de ejecución.


## Decisión

La IA no tendrá control directo del sistema.

El flujo será:

```
IA decide

↓

Node.js valida

↓

Tools ejecutan

↓

Editor cambia
```


## Motivo

Evitar acciones inválidas y mantener control del sistema.


## Estado

Activo.

---

# DECISIÓN 004

## Fecha

22/09/2026


## Tema

Uso de modelos IA.


## Decisión

Los modelos no deben estar directamente escritos dentro del código principal del agente.


Debe existir un sistema intermediario:

Model Router.


## Motivo

Permitir cambiar entre:

- Ollama;
- Qwen;
- Llama;
- Gemini;
- otros proveedores.

Sin modificar la lógica del agente.


## Estado

Pendiente de implementación.

---

# DECISIÓN 005

## Fecha

22/09/2026


## Tema

Uso de Ollama.


## Decisión

Ollama será utilizado como motor local de razonamiento durante la etapa de desarrollo.


## Motivo

Permite:

- pruebas locales;
- independencia de proveedor;
- experimentación con diferentes modelos.


## Modelos considerados

- Qwen.
- Llama.
- modelos compatibles con Ollama.


## Estado

Activo.

---

# DECISIÓN 006

## Fecha

22/09/2026


## Tema

Sistema visual.


## Decisión

La visión será un módulo separado del razonamiento.


Puede utilizar:

- Gemini Vision.
- Qwen-VL.
- otros modelos multimodales.


## Motivo

La percepción visual y el razonamiento cumplen funciones diferentes.


## Estado

Activo.

---

# DECISIÓN 007

## Fecha

22/09/2026


## Tema

Recursos del diseño.


## Decisión

El agente debe trabajar utilizando los recursos reales disponibles dentro de la plataforma.


No debe inventar recursos inexistentes.


## Motivo

El objetivo es que el agente diseñe dentro del ecosistema real del editor.


## Estado

Activo.

---

# DECISIÓN 008

## Fecha

22/09/2026


## Tema

Orden de desarrollo.


## Decisión

Primero construir capacidad operativa.

Después construir memoria y aprendizaje.


Orden:

1. Modelo y herramientas.
2. Estado del agente.
3. Planificación.
4. Verificación.
5. Memoria.
6. Aprendizaje.


## Motivo

Un sistema de aprendizaje necesita experiencias reales y resultados confiables.


## Estado

Activo.

---

# DECISIÓN 009

## Fecha

22/09/2026


## Tema

Documentación del proyecto.


## Decisión

La documentación será parte del repositorio.

Ubicación:

```
docs/
```


Documentos principales:

- META_IA_DOCUMENTO_MAESTRO.md
- ARQUITECTURA_TECNICA.md
- ROADMAP.md
- DECISIONES_TECNICAS.md


## Motivo

Permitir continuar el proyecto desde cualquier computadora o entorno.


## Estado

Activo.

---

# PRÓXIMAS DECISIONES IMPORTANTES

Pendientes:

- Definir arquitectura exacta del Model Router.
- Definir estructura del Agent State.
- Definir contrato de Tools.
- Definir formato de memoria de experiencias.
- Definir estrategia de aprendizaje.

# DECISIÓN 010

## Tema

Uso inteligente de modelos IA.


## Decisión

Los modelos IA no serán utilizados para todas las operaciones.

El sistema priorizará soluciones deterministas mediante Node.js.

Los modelos serán llamados únicamente cuando exista necesidad de:

- razonamiento;
- interpretación ambigua;
- análisis visual;
- creación de estrategias.


## Motivo

Reducir costos, latencia y dependencia de modelos externos.


## Estado

Activo.
---

# DECISIÓN 011

## Fecha

22/09/2026


## Tema

Capa de decisión del agente.


## Decisión

El agente no utilizará modelos IA para todas las operaciones.

Antes de llamar un modelo, existirá una capa de decisión que evaluará la naturaleza de la tarea.


El sistema decidirá entre:

- ejecución determinista mediante Node.js;
- razonamiento mediante modelo IA;
- análisis visual mediante modelo de visión.


## Motivo

Reducir:

- consumo de tokens;
- latencia;
- dependencia de proveedores externos.

Además permite que las tareas repetitivas y conocidas sean ejecutadas directamente por el sistema.


## Ejemplos

Movimiento de elementos:

Node.js resuelve directamente.


Creación de una composición profesional:

Necesita razonamiento IA.


Análisis de una imagen de referencia:

Necesita visión.


## Arquitectura esperada

```
Usuario

↓

Agent Decision Layer

↓

¿Necesita IA?

├── No → Node.js + Tools

└── Sí → Modelo adecuado
```


## Estado

Activo.