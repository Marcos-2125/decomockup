# ARQUITECTURA TÉCNICA — META IA AGENTE DISEÑADOR Y DECORADOR

# 1. Propósito del documento

Este documento describe la arquitectura técnica del proyecto Decomockup y sirve como guía para continuar el desarrollo del sistema en cualquier computadora o entorno.

Su objetivo es explicar:

- cómo está organizado actualmente el proyecto;
- qué responsabilidad tiene cada módulo;
- cómo funciona el agente IA;
- dónde vive la inteligencia del sistema;
- cómo evolucionará hacia un agente diseñador profesional.

---

# 2. Visión técnica general

Decomockup está compuesto por:

## Frontend

`mi-editor-eventos`

Responsable del editor visual donde el usuario crea y modifica diseños.


## Backend

`agente-decorador`

Responsable del sistema agente:

- toma decisiones;
- conecta componentes;
- ejecuta herramientas;
- administra modelos IA.


## Memoria y conocimiento

Supabase.

Responsable de almacenar:

- experiencias;
- patrones;
- conocimiento aprendido;
- evidencia histórica.

---

# 3. Arquitectura general del sistema

Flujo objetivo:

```
USUARIO

↓

EDITOR WEB

↓

AGENT DECISION LAYER

↓

¿Necesita IA?

        |
        |
        ├── No
        |
        ↓

     Node.js + Tools


        |
        |
        └── Sí

             ↓

        Model Router

             ↓

     Modelo adecuado

             ↓

        Tools

             ↓

        Editor
```

---

# 4. Principio fundamental

El agente no debe utilizar inteligencia artificial para todas las operaciones.

Primero debe evaluar si una tarea puede resolverse mediante lógica determinista.

Ejemplo:

Mover un elemento:

```
Usuario:
"Mueve la princesa 5 cm"

↓

Node.js ejecuta directamente
```

No requiere modelo IA.


Ejemplo:

Crear una composición profesional:

```
Usuario:
"Crear diseño elegante de princesa rosa"

↓

Necesita razonamiento
```

---

# 5. Frontend — mi-editor-eventos

## Responsabilidad

El editor representa el cuerpo visual del sistema.

Debe permitir:

- crear diseños;
- modificar elementos;
- administrar capas;
- cambiar posiciones;
- cambiar tamaños;
- editar textos;
- utilizar recursos gráficos.


---

## Estado del diseño

Cada elemento debe contener información suficiente para que el agente pueda comprenderlo.

Ejemplo:

```
elemento

{
 id,
 resourceId,
 posición,
 tamaño,
 rotación,
 profundidad,
 capa,
 transformaciones
}
```

El editor representa el estado real del diseño.

---

# 6. Backend — agente-decorador

## Responsabilidad

El backend es la autoridad del sistema.

Funciones:

- recibir solicitudes;
- analizar contexto;
- consultar conocimiento;
- decidir ejecución;
- comunicarse con modelos;
- ejecutar herramientas;
- validar acciones.


Principio:

```
IA propone.

Node.js controla.

Editor ejecuta.
```

---

# 7. Archivos principales actuales

## server.js

Responsabilidad:

Servidor principal.

Funciones:

- crear API;
- recibir solicitudes del editor;
- comunicar componentes.


---

## agent.js

Responsabilidad:

Motor actual del agente.

Funciones:

- preparar contexto;
- enviar instrucciones;
- recibir respuestas;
- procesar acciones.

Actualmente utiliza Ollama como motor local de razonamiento.

---

## tools.js

Responsabilidad:

Define las capacidades reales del sistema.

Ejemplos:

- agregar elementos;
- mover elementos;
- cambiar tamaño;
- rotar;
- modificar capas;
- editar propiedades.


La IA no modifica directamente el editor.

Utiliza herramientas controladas.

---

## technicalValidator.js

Responsabilidad:

Validar acciones.

Debe comprobar:

- límites del lienzo;
- existencia de recursos;
- tamaños;
- posiciones;
- reglas técnicas.

---

# 8. Agent Decision Layer

## Responsabilidad

Es la primera capa que analiza una solicitud.

Debe decidir:

- si puede resolverse con Node.js;
- si requiere razonamiento;
- si requiere visión;
- qué contexto necesita cada componente.


---

## Objetivo

Evitar llamadas innecesarias a modelos IA.

Reducir:

- costos;
- latencia;
- dependencia externa.


---

# 9. Model Router

## Responsabilidad

Seleccionar el modelo adecuado cuando el Agent Decision Layer determine que se necesita IA.

No decide cuándo usar IA.

Solamente decide qué modelo utilizar.


Arquitectura:

```
Agent Decision Layer

↓

Model Router

↓

Ollama

Gemini

Otros proveedores
```


Ejemplo:

```
REASONING_PROVIDER=ollama

REASONING_MODEL=qwen3:8b


VISION_PROVIDER=ollama

VISION_MODEL=qwen3-vl:8b
```

---

# 10. Ojos — Sistema visual

## Responsabilidad

Analizar información visual.

Puede utilizar:

- Gemini Vision;
- Qwen-VL;
- otros modelos multimodales.


Debe analizar:

- colores;
- composición;
- equilibrio;
- jerarquía;
- punto focal;
- profundidad;
- distribución.


La visión solamente se utiliza cuando existe necesidad visual.

No controla directamente el editor.

---

# 11. Motor — Sistema de razonamiento

## Responsabilidad

Resolver problemas donde la lógica determinista no es suficiente.

Debe:

- interpretar solicitudes;
- crear estrategias;
- resolver ambigüedades;
- planificar diseños.


Modelos posibles:

- Qwen;
- Llama;
- otros modelos compatibles.

---

# 12. Manos — Sistema de herramientas

## Responsabilidad

Ejecutar acciones reales dentro del editor.

Ejemplo:

```
Usuario solicita diseño

↓

Agente crea estrategia

↓

Selecciona recursos

↓

Ejecuta tools

↓

Editor cambia
```


---

# 13. Recursos del sistema

El agente debe trabajar con recursos reales disponibles.

Ejemplos:

- personajes;
- princesas;
- fondos;
- flores;
- efectos;
- brillos;
- decoraciones;
- textos.


El agente no debe inventar recursos inexistentes.

Debe consultar la biblioteca real del sistema.

---

# 14. Inteligencia del sistema

La inteligencia estará separada en tres niveles.


## Inteligencia fija

Vive en código.

Ejemplos:

- validaciones;
- seguridad;
- ejecución de herramientas;
- reglas técnicas.


## Inteligencia acumulada

Vive en Supabase.

Ejemplos:

- experiencias;
- patrones;
- estrategias;
- relaciones;
- evidencia.


## Inteligencia de razonamiento

Vive en los modelos IA.

Ejemplos:

- interpretación;
- creatividad;
- resolución de problemas nuevos.

---

# 15. Supabase — Memoria y conocimiento

Supabase será responsable de almacenar:


## Memoria episódica

Experiencias reales de diseños.

Guarda:

- objetivo;
- estrategia;
- composición;
- recursos;
- resultado.


## Memoria de conocimiento

Patrones aprendidos.

Ejemplos:

- combinaciones exitosas;
- reglas de composición;
- relaciones entre estilos y recursos.


## Evidencia

Información que permite validar conocimientos.

---

# 16. Agent State

## Objetivo

Crear un estado central del agente.

Debe contener:

```
AgentState

- objetivo usuario
- canvas actual
- elementos existentes
- recursos disponibles
- restricciones
- herramientas disponibles
- observaciones
- plan
- acciones realizadas
- resultado
```

---
El agente debe soportar dos contextos:

- creación desde cero;
- modificación de diseño existente.

El estado debe conservar el objetivo del usuario y el estado actual del editor.

# 17. Planner

## Objetivo

Separar pensamiento y ejecución.


Flujo:

```
Usuario

↓

Comprender objetivo

↓

Crear estrategia

↓

Crear plan

↓

Ejecutar herramientas
```

---

# 18. Verifier

El agente debe revisar sus propios resultados.


## Verificación técnica

Node.js:

- posiciones;
- tamaños;
- límites;
- reglas.


## Verificación visual

Modelos visuales:

- composición;
- equilibrio;
- armonía;
- jerarquía.

---

# 19. Orden recomendado de desarrollo

## Fase 1

Agent Decision Layer.


## Fase 2

Model Router.


## Fase 3

Agent State.


## Fase 4

Tool Registry.


## Fase 5

Planner, Executor y Verifier.


## Fase 6

Diseñador profesional.


## Fase 7

Reconstrucción de referencias.


## Fase 8

Memoria de experiencias.


## Fase 9

Sistema de conocimiento.


## Fase 10

Aprendizaje.


## Fase 11

Automatización avanzada.


## Fase 12

Decorador profesional de escenarios.

---

# 20. Principios técnicos

1. El agente no es un chatbot.

2. El agente es un diseñador profesional dentro del editor.

3. La IA no se utiliza para tareas que Node.js puede resolver.

4. La visión solo se llama cuando existe necesidad visual.

5. La IA propone.

6. Node.js mantiene autoridad.

7. Las herramientas ejecutan.

8. Los modelos pueden cambiar sin afectar arquitectura.

9. El conocimiento pertenece al sistema, no al modelo.

10. Supabase almacena memoria y aprendizaje.

11. El aprendizaje modifica conocimiento, no código automáticamente.

12. La arquitectura debe sobrevivir a cambios de computadora, modelos y proveedores.