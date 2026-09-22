# ROADMAP — META IA AGENTE DISEÑADOR Y DECORADOR

## Objetivo del roadmap

Este documento define el orden de construcción del agente IA profesional integrado dentro del editor Decomockup.

La prioridad es construir primero un agente operativo, estable y controlado.

Después se agregarán memoria, aprendizaje y automatización.

---

# ESTADO GENERAL

## Completado

✅ Editor visual React funcionando.

✅ Sistema de capas y elementos.

✅ Biblioteca de recursos gráficos.

✅ Backend Node.js del agente.

✅ Conexión con Ollama.

✅ Sistema inicial de herramientas (Tools).

✅ Validación técnica inicial.

✅ Sistema de visión preparado.

✅ Documentación base del proyecto.

---

# FASE 1 — Model Router

## Objetivo

Eliminar la dependencia de un modelo fijo dentro del código.

Actualmente el modelo está definido directamente en el agente.

Debe evolucionar hacia un sistema configurable.

---

## Resultado esperado

El agente debe poder cambiar entre:

- Qwen.
- Llama.
- Gemini.
- Otros modelos compatibles.

Sin modificar la lógica del agente.

---

## Crear

```
ai/

├── router.js

├── ollama.js

├── gemini.js

└── config.js
```

---

## Configuración esperada

Ejemplo:

```
REASONING_PROVIDER=ollama

REASONING_MODEL=qwen3:8b


VISION_PROVIDER=ollama

VISION_MODEL=qwen3-vl:8b
```

---

# FASE 2 — Agent State

## Objetivo

Crear un estado central del agente.

Actualmente la información está distribuida entre editor, backend y modelo.

Debe existir una representación única del contexto.

---

## AgentState debe contener

- objetivo del usuario;
- lienzo actual;
- elementos existentes;
- recursos disponibles;
- restricciones;
- acciones realizadas;
- resultado.

---

## Resultado esperado

El agente podrá comprender:

- dónde está trabajando;
- qué existe actualmente;
- qué puede modificar.

---

# FASE 3 — Separación del ciclo del agente

## Objetivo

Pasar de:

```
Usuario
↓
IA
↓
Tool
```

a:

```
Observar

↓

Razonar

↓

Planificar

↓

Actuar

↓

Verificar
```

---

## Componentes nuevos

Crear:

```
Planner

Executor

Verifier
```

---

# FASE 4 — Diseñador profesional

## Objetivo

Agregar conocimiento de diseño.

El agente debe dejar de ejecutar acciones simples y comenzar a pensar como diseñador.

---

## Capacidades

Debe comprender:

- teoría del color;
- composición;
- jerarquía visual;
- punto focal;
- equilibrio;
- profundidad;
- capas;
- armonía;
- proporción;
- estilo.

---

## Resultado esperado

Ejemplo:

Usuario:

"Crear diseño de princesa rosa"

El agente debe crear una composición completa:

- protagonista;
- fondo;
- decoración secundaria;
- efectos;
- texto;
- profundidad visual.

---

# FASE 5 — Reconstrucción de referencias

## Objetivo

Permitir que el usuario entregue una imagen de referencia.

---

## El agente debe:

1. Analizar la imagen.

2. Detectar:

- estructura;
- colores;
- elementos;
- distribución;
- estilo.

3. Buscar equivalencias dentro de los recursos existentes.

4. Crear una versión editable dentro del editor.

---

# FASE 6 — Memoria de experiencias

## Objetivo

Guardar diseños realizados para aprender de experiencias reales.

---

## Guardar:

- objetivo;
- estrategia;
- composición;
- recursos utilizados;
- diseño final;
- resultado.

---

## No guardar:

- cada movimiento del mouse;
- cambios mínimos;
- datos innecesarios.

---

# FASE 7 — Sistema de conocimiento

## Objetivo

Convertir experiencias repetidas en conocimiento reutilizable.

Crear:

```
knowledge_concepts

knowledge_patterns

knowledge_relationships

knowledge_evidence
```

---

## Ejemplos de conocimiento

- combinaciones de colores exitosas;
- estructuras de composición;
- distribución de elementos;
- estrategias de diseño.

---

# FASE 8 — Aprendizaje del agente

## Objetivo

Permitir que el agente mejore con experiencias reales.

Proceso:

```
Experiencia

↓

Análisis

↓

Patrón

↓

Evidencia

↓

Conocimiento
```

---

# FASE 9 — Automatización avanzada

## Objetivo

Convertir conocimientos validados en acciones automáticas.

Ejemplo:

Un patrón probado:

"Princesa infantil pastel"

puede transformarse en:

Una estrategia automática de composición.

---

# FASE 10 — Decorador profesional de escenarios

## Objetivo futuro

Expandir el agente desde diseño gráfico hacia decoración física.

Capacidades futuras:

- distribución espacial;
- escenarios;
- fondos físicos;
- estructuras;
- decoración de eventos;
- composición tridimensional.

---

# PRINCIPIOS DEL DESARROLLO

1. Primero construir capacidad operativa.

2. Después construir memoria.

3. Después construir aprendizaje.

4. La IA propone.

5. Node.js controla.

6. Las herramientas ejecutan.

7. Los modelos pueden cambiar sin afectar la arquitectura.

8. El conocimiento pertenece al sistema, no al modelo.

---

# PRÓXIMO OBJETIVO ACTUAL

Crear el Model Router.

Motivo:

Permitir cambiar entre modelos IA sin modificar el código del agente.

Después continuar con Agent State y el ciclo completo del agente.