# CHANGELOG — META IA AGENTE DISEÑADOR Y DECORADOR

Este documento registra los avances importantes realizados durante las jornadas de desarrollo.

No registra cambios pequeños de código.

Registra:

- avances de arquitectura;
- decisiones relevantes;
- nuevas capacidades definidas;
- etapas completadas;
- próximos objetivos.

---

# 22/09/2026 — Definición de arquitectura base del agente

## Resumen de la jornada

Se definió la visión completa de META IA como un agente diseñador y decorador profesional integrado dentro del editor Decomockup.

El objetivo dejó de ser construir un chatbot y pasó a ser construir un agente capaz de trabajar dentro del editor utilizando recursos y herramientas reales del sistema.

---

# Definición del agente IA

Se estableció que el agente debe poder:

- crear diseños desde cero;
- mejorar diseños existentes;
- asesorar usuarios;
- analizar referencias visuales;
- utilizar recursos disponibles;
- ejecutar acciones dentro del editor;
- aprender mediante experiencias reales.

---

# Concepto de arquitectura

Se definieron tres componentes principales:

## Ojos

Sistema visual.

Responsabilidad:

- analizar imágenes;
- comprender composición;
- evaluar colores;
- detectar jerarquía visual.


Tecnologías consideradas:

- Gemini Vision;
- Qwen-VL.

---

## Motor

Sistema de razonamiento.

Responsabilidad:

- interpretar objetivos;
- crear estrategias;
- resolver problemas nuevos.


Tecnologías consideradas:

- Ollama;
- Qwen;
- Llama.

---

## Manos

Sistema de herramientas.

Responsabilidad:

Ejecutar acciones reales dentro del editor:

- agregar elementos;
- mover;
- redimensionar;
- modificar capas;
- editar propiedades.

---

# Decisiones importantes tomadas

## Uso inteligente de IA

Se definió que la inteligencia artificial no debe utilizarse para todas las acciones.

El sistema debe resolver primero mediante Node.js cuando sea posible.

Ejemplos:

Acciones simples:
- mover elementos;
- validar posiciones;
- calcular tamaños.

Son resueltas por Node.js.


Acciones complejas:
- crear composiciones;
- interpretar estilos;
- analizar referencias.

Requieren modelos IA.

---

# Separación de inteligencia

Se definió la separación entre:

## Inteligencia fija

Ubicada en código.

Responsable de:

- reglas;
- validaciones;
- ejecución;
- seguridad.


## Inteligencia acumulada

Ubicada en Supabase.

Responsable de:

- memoria;
- experiencias;
- patrones;
- conocimiento.


## Inteligencia de razonamiento

Proporcionada por modelos IA.

Responsable de:

- interpretación;
- creatividad;
- resolución de casos nuevos.

---

# Modos de trabajo del agente

Se definieron tres formas principales:

## Creación desde cero

El usuario solicita un diseño nuevo.

Ejemplo:

"Crear diseño de princesa rosa"

---

## Mejora de diseño existente

El usuario trabaja sobre un diseño actual.

Ejemplo:

"Hazlo más elegante"

---

## Asesoramiento profesional

El agente recomienda:

- colores;
- composición;
- distribución;
- mejoras.

---

# Documentación creada

Durante esta jornada se crearon:

```
docs/

META_IA_DOCUMENTO_MAESTRO.md

ARQUITECTURA_TECNICA.md

ROADMAP.md

DECISIONES_TECNICAS.md

CHANGELOG.md
```

---

# Estado actual del proyecto

Completado:

✅ Editor React funcional.

✅ Backend Node.js.

✅ Sistema inicial de herramientas.

✅ Integración con modelos IA.

✅ Base documental del proyecto.

---

# Próximo objetivo

Construcción del núcleo operativo del agente:

## Agent Decision Layer

Objetivo:

Crear la capa que decide:

- cuándo usar Node.js;
- cuándo usar razonamiento IA;
- cuándo usar visión;
- qué herramientas ejecutar.

Después continuar con:

1. Model Router.
2. Agent State.
3. Tool Registry.
4. Planner.
5. Verifier.
6. Memoria.
7. Aprendizaje.