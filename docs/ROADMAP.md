# ROADMAP — META IA AGENTE DISEÑADOR Y DECORADOR

# Objetivo del roadmap

Este documento define el orden de construcción del agente IA profesional integrado dentro del editor Decomockup.

El objetivo final es construir un agente capaz de comportarse como un diseñador y decorador profesional dentro de la plataforma.

El agente debe poder:

- crear diseños;
- modificar diseños existentes;
- analizar referencias visuales;
- asesorar usuarios;
- utilizar recursos reales de la plataforma;
- ejecutar acciones mediante herramientas del editor;
- aprender de experiencias reales.

La prioridad inicial es construir un agente operativo, eficiente, controlado y escalable.

El sistema debe utilizar inteligencia artificial únicamente cuando aporte valor.

Las tareas que puedan resolverse mediante lógica determinista en Node.js no deben consumir modelos IA.

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

# FASE 1 — Agent Decision Layer

## Objetivo

Crear la capa de decisión principal del agente.

Esta capa determina qué tipo de procesamiento necesita cada solicitud antes de ejecutar cualquier acción.

El sistema debe decidir si una tarea puede resolverse:

- directamente mediante Node.js;
- mediante razonamiento IA;
- mediante análisis visual.

---

## Principio

La inteligencia artificial no debe utilizarse para todas las operaciones.

Primero se debe evaluar si la tarea puede resolverse mediante reglas, cálculos o conocimiento ya validado.

---

## Ejemplos

### Acción determinista

Usuario:

"Mueve la princesa 5 cm a la derecha"

Proceso:

```
Usuario

↓

Agent Decision Layer

↓

Node.js ejecuta movimiento

↓

Tool modifica editor
```

No necesita modelo IA.


---

### Acción creativa

Usuario:

"Créame un diseño elegante de princesa rosa"

Proceso:

```
Usuario

↓

Agent Decision Layer

↓

Necesita razonamiento

↓

Modelo IA

↓

Tools

↓

Editor
```

---

### Acción visual

Usuario:

"Quiero un diseño parecido a esta imagen"

Proceso:

```
Imagen

↓

Agent Decision Layer

↓

Necesita visión

↓

Modelo visual

↓

Razonamiento

↓

Tools
```

---

## Responsabilidades

Debe decidir:

- si la tarea es determinista;
- si requiere razonamiento;
- si requiere visión;
- qué contexto necesita cada componente;
- qué herramientas deben utilizarse.

---

## Crear

```
agent/

├── decisionEngine.js

├── taskClassifier.js

└── router.js
```

---

# FASE 2 — Model Router

## Objetivo

Separar los modelos IA de la lógica principal del agente.

El agente no debe depender de un modelo específico.

---

## Responsabilidad

El Model Router solamente decide qué proveedor y modelo utilizar cuando el Agent Decision Layer determina que se necesita IA.

---

## Resultado esperado

Poder cambiar entre:

- Qwen;
- Llama;
- Gemini;
- otros proveedores.

Sin modificar el código principal.

---

## Arquitectura

```
AGENTE

↓

MODEL ROUTER

↓

Ollama

Gemini

Otros proveedores
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

# FASE 3 — Agent State

## Objetivo

Crear un estado central del agente.

Actualmente la información está distribuida entre editor, backend y modelo.

Debe existir una representación única del contexto actual.

---

## AgentState debe contener

- objetivo del usuario;
- canvas actual;
- elementos existentes;
- recursos disponibles;
- restricciones;
- herramientas disponibles;
- observaciones;
- plan actual;
- acciones realizadas;
- resultado.

---

## Resultado esperado

El agente podrá comprender:

- dónde está trabajando;
- qué existe actualmente;
- qué puede modificar;
- cuál es la situación actual del diseño.

---

# FASE 4 — Tool Registry

## Objetivo

Crear una capa organizada para administrar las capacidades del agente.

---

## Principio

Las herramientas representan capacidades reales del sistema.

La IA no inventa acciones.

---

## Responsabilidades

Administrar:

- herramientas disponibles;
- parámetros;
- validaciones;
- permisos;
- resultados.

---

## Ejemplos

```
addElement

moveElement

resizeElement

rotateElement

changeLayer

editText

changeBackground
```

---

# FASE 5 — Ciclo completo del agente

## Objetivo

Evolucionar desde:

```
Usuario

↓

IA

↓

Tool
```

hacia un agente completo:

```
Observar

↓

Decidir

↓

Razonar

↓

Planificar

↓

Actuar

↓

Verificar

↓

Mejorar
```

---

## Componentes

Crear:

```
Planner

Executor

Verifier
```

---

# FASE 6 — Diseñador profesional

## Objetivo

Convertir el agente en un diseñador profesional.

El agente debe dejar de ejecutar solamente acciones y comenzar a crear estrategias visuales.

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
- estilos;
- intención del usuario.

---

## Resultado esperado

Ejemplo:

Usuario:

"Crear diseño de princesa rosa"

El agente debe generar una composición completa:

- protagonista;
- fondo;
- decoración secundaria;
- efectos;
- texto;
- profundidad visual;
- equilibrio compositivo.

No debe limitarse a colocar elementos básicos.

---

# FASE 7 — Reconstrucción de referencias

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
- estilo;
- jerarquía visual;
- profundidad.

3. Buscar equivalencias dentro de los recursos existentes.

4. Crear una versión editable dentro del editor.

---

# FASE 8 — Memoria de experiencias

## Objetivo

Guardar diseños realizados para aprender de experiencias reales.

---

## Guardar:

- objetivo;
- estrategia;
- composición;
- recursos utilizados;
- diseño final;
- resultado;
- modificaciones importantes.

---

## No guardar:

- cada movimiento del mouse;
- cambios mínimos;
- información innecesaria.

---

# FASE 9 — Sistema de conocimiento

## Objetivo

Convertir experiencias repetidas en conocimiento reutilizable.

---

## Crear:

```
knowledge_concepts

knowledge_patterns

knowledge_relationships

knowledge_evidence
```

---

## Ejemplos de conocimiento:

- combinaciones de colores exitosas;
- estructuras de composición;
- distribución de elementos;
- estrategias de diseño;
- relaciones entre estilos y recursos.

---

# FASE 10 — Aprendizaje del agente

## Objetivo

Permitir que el sistema mejore mediante experiencias reales.

---

## Proceso:

```
Experiencia

↓

Análisis

↓

Patrón

↓

Evidencia

↓

Validación

↓

Conocimiento
```

---

## Principio

El aprendizaje puede modificar conocimiento y estrategias.

No debe modificar arbitrariamente el código principal del sistema.

---

# FASE 11 — Automatización avanzada

## Objetivo

Convertir conocimientos validados en acciones automáticas.

---

## Ejemplo

Patrón validado:

```
Princesa infantil pastel
```

Puede convertirse en:

```
Estrategia automática de composición
```

sin necesidad de llamar siempre a un modelo IA.

---

# FASE 12 — Decorador profesional de escenarios

## Objetivo futuro

Expandir el agente desde diseño gráfico hacia decoración física de eventos.

---

## Capacidades futuras

- distribución espacial;
- escenarios;
- fondos físicos;
- estructuras;
- decoración de eventos;
- composición tridimensional.

---

# PRINCIPIOS DEL DESARROLLO

1. Primero construir capacidad operativa.

2. Resolver primero mediante Node.js cuando sea posible.

3. La IA se utiliza cuando agrega inteligencia real.

4. La visión solamente se llama cuando existe necesidad visual.

5. La IA propone.

6. Node.js controla.

7. Las herramientas ejecutan.

8. Los modelos pueden cambiar sin afectar la arquitectura.

9. El conocimiento pertenece al sistema, no al modelo.

10. Primero construir un agente confiable.

11. Después construir memoria y aprendizaje.

12. La arquitectura debe sobrevivir a cambios de computadora, modelos y proveedores.

---

# PRÓXIMO OBJETIVO ACTUAL

Crear el Agent Decision Layer.

Motivo:

Antes de implementar modelos, memoria o aprendizaje, el sistema debe aprender a decidir cuándo utilizar inteligencia artificial y cuándo resolver directamente mediante Node.js.

Después continuar con:

1. Model Router.

2. Agent State.

3. Tool Registry.

4. Planner.

5. Executor.

6. Verifier.

7. Memoria.

8. Sistema de conocimiento.

9. Aprendizaje.