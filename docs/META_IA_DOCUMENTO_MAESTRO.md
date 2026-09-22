# META IA — AGENTE DISEÑADOR Y DECORADOR PROFESIONAL

## Estado del proyecto

Proyecto: Decomockup

Objetivo:
Construir un agente IA profesional integrado dentro de un editor web de diseño.

El agente no es un chatbot.
Es un diseñador profesional autónomo capaz de crear, modificar, analizar y asesorar diseños dentro del editor.

---

# 1. Visión del agente

El agente debe comportarse como un:

"Diseñador gráfico profesional y decorador digital".

Debe ser capaz de:

- Crear diseños completos.
- Mejorar diseños existentes.
- Analizar referencias visuales.
- Recomendar mejoras.
- Utilizar recursos reales de la plataforma.
- Ejecutar acciones mediante herramientas del editor.

---

# 2. Primera especialización

Actualmente:

Diseños de eventos y cumpleaños.

Ejemplos:

- cumpleaños infantiles;
- princesas;
- personajes;
- invitaciones;
- paneles decorativos.

Futuro:

Decoración profesional de escenarios.

Incluye:

- distribución espacial;
- fondos;
- estructuras;
- decoración física;
- composición tridimensional.

---

# 3. Cómo debe pensar el agente

El agente debe actuar como diseñador.

No debe crear diseños básicos.

Ejemplo:

Usuario:
"Hazme un diseño de princesas rosa"

No debe hacer:

- fondo rosa;
- princesa al centro.

Debe analizar:

- protagonista;
- colores;
- profundidad;
- equilibrio;
- decoración secundaria;
- jerarquía visual.

Puede decidir agregar:

- flores;
- mariposas;
- brillos;
- coronas;
- elementos complementarios;
- efectos visuales.

---

# 4. Capacidades principales

## Modo diseñador automático

El usuario da una instrucción y el agente crea el diseño.

Ejemplo:

"Hazme un diseño elegante de princesa rosa"


## Modo asistente

Ayuda al usuario:

- elegir colores;
- mejorar composición;
- ordenar elementos;
- decidir estilos.


## Modo reconstrucción

El usuario sube una imagen.

El agente debe:

- analizar la referencia;
- identificar composición;
- identificar colores;
- identificar elementos;
- buscar equivalentes dentro de los recursos disponibles;
- reconstruir usando el editor.


---

# 5. Arquitectura conceptual

El agente tiene:

## OJOS

Responsable:

Analizar imágenes y diseños.

Tecnologías posibles:

- Gemini Vision
- Qwen-VL
- otros modelos visuales


## MOTOR

Responsable:

Razonamiento y planificación.

Tecnologías:

- Ollama
- Qwen
- Llama
- otros modelos


## MANOS

Responsable:

Ejecutar acciones.

Son las herramientas del editor.

Ejemplos:

- agregar elemento;
- mover;
- cambiar tamaño;
- rotar;
- ordenar capas;
- editar texto.


---

# 6. Principio fundamental

La IA decide.

Node.js valida.

El editor ejecuta.

Nunca:

La IA modifica directamente el sistema.

---

# 7. Arquitectura actual

Frontend:

mi-editor-eventos

Responsabilidad:

- editor visual;
- capas;
- recursos;
- canvas.


Backend:

agente-decorador

Responsabilidad:

- agente IA;
- herramientas;
- conexión modelos;
- validación.


---

# 8. Objetivo técnico

Crear un agente capaz de:

Usuario:
"Crear diseño de princesa"

↓

Analizar pedido

↓

Analizar recursos disponibles

↓

Crear estrategia de diseño

↓

Ejecutar herramientas

↓

Crear composición

↓

Verificar resultado

↓

Mejorar si es necesario

---

# 9. Próximos pasos de desarrollo

Orden recomendado:

## Fase 1

Crear Model Router.

Objetivo:

Cambiar modelos sin modificar código.

Ejemplo:

Qwen3
Llama
Gemini


## Fase 2

Crear Agent State.

Debe contener:

- objetivo;
- canvas;
- elementos;
- recursos;
- acciones;
- resultado.


## Fase 3

Crear Planner.

Separar:

Pensamiento

de

Ejecución.


## Fase 4

Crear Verifier.

Revisar:

- errores técnicos;
- composición visual.


## Fase 5

Crear memoria.

Guardar experiencias de diseño.


## Fase 6

Crear aprendizaje.

Convertir experiencias en conocimiento.

---

# 10. Regla de arquitectura

No construir aprendizaje antes de tener un agente operativo estable.

Primero:

Observar.

Razonar.

Actuar.

Verificar.

Después:

Aprender.

---

# 11. Estado actual

Ya existe:

✅ Editor React  
✅ Sistema de capas  
✅ Recursos gráficos  
✅ Backend Node  
✅ Tools iniciales  
✅ Ollama conectado  
✅ Visión preparada  


Pendiente:

⬜ Model Router  
⬜ Agent State  
⬜ Planner  
⬜ Verifier  
⬜ Memory  
⬜ Learning Engine  


---

# Instrucción para continuar en otro ChatGPT

Este documento representa el contexto completo del proyecto.

Continuar desde este punto.

No crear un chatbot.

Construir un agente IA diseñador profesional integrado en un editor web.