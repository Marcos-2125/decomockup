# ARQUITECTURA TÉCNICA — META IA AGENTE DECORADOR

## 1. Propósito del documento

Este documento describe la arquitectura técnica del proyecto Decomockup y sirve como guía para continuar el desarrollo del sistema en cualquier computadora o entorno.

Su objetivo es explicar:

- cómo está organizado actualmente el proyecto;
- qué responsabilidad tiene cada módulo;
- cómo funciona el agente IA;
- cómo evolucionará hacia un agente diseñador profesional.

---

# 2. Visión técnica general

Decomockup está compuesto por dos aplicaciones principales:

## Frontend

`mi-editor-eventos`

Responsable del editor visual donde el usuario crea y modifica diseños.


## Backend

`agente-decorador`

Responsable del agente IA, razonamiento, herramientas y comunicación con modelos.

---

# 3. Arquitectura actual

Flujo actual:

```
USUARIO

↓

mi-editor-eventos
(Editor React)

↓

Backend Node.js

↓

Agente IA

↓

Modelo IA

↓

Tools

↓

Resultado en editor
```

---

# 4. Frontend — mi-editor-eventos

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

Cada elemento del editor debe contener información suficiente para que el agente pueda comprenderlo.

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

# 5. Backend — agente-decorador

## Responsabilidad

El backend es la autoridad del agente.

Funciones:

- recibir solicitudes del usuario;
- preparar contexto;
- comunicarse con modelos IA;
- ejecutar herramientas;
- validar acciones;
- devolver resultados.

Principio:

La IA decide.

Node.js valida.

El editor ejecuta.

---

# 6. Archivos principales del agente

## server.js

Responsabilidad:

Servidor principal.

Funciones:

- crear API;
- recibir solicitudes del editor;
- comunicarse con el agente;
- devolver respuestas.

---

## agent.js

Responsabilidad:

Motor actual del agente.

Funciones:

- crear instrucciones del sistema;
- enviar contexto al modelo;
- recibir respuestas;
- procesar tool calls;
- ejecutar acciones.

Actualmente utiliza Ollama como motor de razonamiento.

---

## tools.js

Responsabilidad:

Define las capacidades que el agente puede utilizar.

Las herramientas representan acciones reales disponibles dentro del editor.

Ejemplos:

- agregar elementos;
- mover elementos;
- cambiar tamaño;
- rotar;
- modificar capas;
- cambiar propiedades.

El modelo IA no modifica directamente el editor.

Utiliza herramientas controladas.

---

## technicalValidator.js

Responsabilidad:

Validar las acciones antes de ejecutarlas.

Debe comprobar:

- límites del lienzo;
- existencia de recursos;
- tamaños válidos;
- posiciones correctas;
- reglas del sistema.

---

# 7. Arquitectura del agente IA

El agente está compuesto por tres partes principales:

```
                 AGENTE IA

                     |

        ----------------------------

        OJOS       MOTOR       MANOS

        Visión     IA          Tools
```

---

# 8. Ojos — Sistema visual

Responsabilidad:

Comprender información visual.

Puede utilizar:

- Gemini Vision;
- Qwen-VL;
- otros modelos multimodales.

Debe analizar:

- colores;
- composición;
- equilibrio;
- jerarquía visual;
- punto focal;
- profundidad;
- distribución de elementos.

La visión observa.

No controla directamente el editor.

---

# 9. Motor — Sistema de razonamiento

Responsabilidad:

Pensar y tomar decisiones.

Debe:

- comprender pedidos del usuario;
- crear estrategias;
- elegir recursos;
- decidir herramientas;
- resolver ambigüedades.

Actualmente:

Ollama local.

Modelos posibles:

- Qwen;
- Llama;
- otros modelos compatibles.

---

# 10. Manos — Sistema de herramientas

Responsabilidad:

Ejecutar acciones dentro del editor.

Ejemplo:

Usuario:

"Crear diseño de princesa rosa"

Proceso:

```
IA analiza

↓

Decide composición

↓

Selecciona recursos

↓

Utiliza tools

↓

Editor ejecuta
```

---

# 11. Recursos del sistema

El agente debe trabajar con los recursos disponibles dentro de la plataforma.

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

Debe utilizar la biblioteca real del sistema.

---

# 12. Model Router (futuro)

Actualmente el modelo está definido directamente en el código.

Esto debe cambiar.

Objetivo:

Cambiar modelos sin modificar archivos del agente.

Arquitectura:

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

Ejemplo de configuración:

```
REASONING_PROVIDER=ollama

REASONING_MODEL=qwen3:8b


VISION_PROVIDER=ollama

VISION_MODEL=qwen3-vl:8b
```

---

# 13. Agent State (futuro)

Crear un estado central del agente.

Debe contener:

```
AgentState

- objetivo del usuario
- canvas actual
- elementos existentes
- recursos disponibles
- restricciones
- plan actual
- acciones realizadas
- resultado
```

Esto permitirá que el agente tenga contexto real.

---

# 14. Planner (futuro)

Separar:

## Pensamiento

de

## Ejecución

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

# 15. Verifier (futuro)

El agente debe revisar sus propios resultados.

Debe existir:

## Verificación técnica

Realizada por Node.js.

Ejemplos:

- elementos fuera del lienzo;
- errores de tamaño;
- posiciones inválidas.

## Verificación visual

Realizada por modelos visuales.

Ejemplos:

- composición;
- equilibrio;
- armonía;
- jerarquía.

---

# 16. Memoria futura

El agente tendrá tres niveles:

## Memoria de trabajo

Información durante la ejecución actual.

Ejemplo:

AgentState.


## Memoria episódica

Experiencias reales de diseños creados.

Debe guardar:

- objetivo;
- estrategia;
- composición;
- resultado.


## Memoria de conocimiento

Patrones aprendidos.

Ejemplos:

- combinaciones exitosas;
- estrategias de composición;
- reglas de diseño.

---

# 17. Orden recomendado de desarrollo

## Fase 1

Crear Model Router.

Objetivo:

Cambiar modelos sin modificar código.


## Fase 2

Crear Agent State.

Objetivo:

Dar contexto completo al agente.


## Fase 3

Crear Planner.

Objetivo:

Separar razonamiento y ejecución.


## Fase 4

Crear Verifier.

Objetivo:

Permitir autocorrección.


## Fase 5

Crear memoria.


## Fase 6

Crear aprendizaje.


---

# 18. Principios que deben mantenerse

1. El agente no es un chatbot.

2. El agente es un diseñador profesional dentro del editor.

3. La IA propone decisiones.

4. Node.js mantiene autoridad.

5. Las tools representan capacidades reales.

6. El agente utiliza recursos existentes.

7. Los modelos IA deben poder cambiarse sin modificar arquitectura.

8. El conocimiento debe sobrevivir aunque cambie el modelo.

9. Primero construir un agente operativo.

10. Después construir aprendizaje.