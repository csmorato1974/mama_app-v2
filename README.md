# Mama_app V2

Crea una aplicación web responsive, mobile-first, para la gestión integral del cuidado de una paciente mayor con enfermedad renal crónica en diálisis peritoneal.

OBJETIVO

Centralizar en una sola aplicación toda la información clínica, asistencial, administrativa, económica y logística relacionada con la paciente, permitiendo que familiares, enfermería y médicos trabajen sobre un historial estructurado, trazable y preparado para análisis mediante IA.

La app debe ser muy sencilla de usar desde móvil, pero suficientemente sólida para organizar información clínica compleja.

ESTRUCTURA PRINCIPAL

DASHBOARD GENERAL

Crear una pantalla inicial tipo “Resumen de hoy” con:

próximas citas

medicación pendiente

tareas del día

últimas constantes

peso

última sesión de diálisis

ultrafiltración

incidencias recientes

alertas clínicas

stock crítico de suministros DP

próximos controles de laboratorio

gasto mensual

documentos recientes

Mostrar solo información prioritaria mediante tarjetas claras y visuales.

AGENDA Y ACTIVIDADES

Calendario diario, semanal y mensual.

Registrar:

citas médicas

laboratorios

tratamientos

visitas de enfermería

medicación

recogida de suministros

trámites CNS

compras

actividades personales

tareas familiares

Cada actividad debe incluir:

fecha
hora
responsable
estado
prioridad
notas
recordatorio
contacto relacionado

CONSTANTES Y CONTROL DIARIO

Registrar:

presión arterial

frecuencia cardíaca

saturación de oxígeno

temperatura

peso

glucemia si corresponde

ingesta de líquidos

diuresis

deposiciones

edema

dolor

nivel de conciencia

apetito

descanso

síntomas

observaciones

Mostrar evolución mediante gráficas y filtros por fecha.

DIÁLISIS PERITONEAL

Crear un módulo específico para DP.

Registrar:

fecha

hora

peso previo y posterior

concentración de solución

número de bolsas

volumen infundido

volumen drenado

ultrafiltración

duración

datos de cicladora

alarmas

características del líquido

incidencias

presión arterial

observaciones

Permitir gráficas de:

ultrafiltración
peso
volumen
incidencias
tendencias

INVENTARIO CNS Y SUMINISTROS DP

Controlar los materiales proporcionados por la CNS.

Registrar:

producto

categoría

presentación

cantidad recibida

cantidad disponible

consumo diario estimado

lote

caducidad

fecha de entrega

próxima entrega

Generar alertas automáticas de:

stock bajo
productos próximos a caducar
consumo superior al previsto
próxima reposición

MEDICACIÓN

Crear ficha individual para cada medicamento:

nombre

principio activo

dosis

frecuencia

horario

vía

médico prescriptor

fecha de inicio

fecha de suspensión

motivo

observaciones

Estados:

ACTIVO
SUSPENDIDO
TEMPORAL
PRN / SEGÚN NECESIDAD

Mantener historial completo de cambios.

Permitir registrar cada administración realizada.

DOCUMENTOS CLÍNICOS Y ANALÍTICAS

Permitir subir:

PDF

fotografía

imagen desde móvil

documento

receta

informe

epicrisis

resultado de laboratorio

Aplicar OCR para extraer información.

En analíticas detectar y guardar:

parámetro

valor

unidad

rango de referencia

fecha

laboratorio

documento fuente

Organizar la información clínica por áreas:

renal

electrolitos

hematología

metabolismo mineral

PTH

nutrición

función hepática

infección

inflamación

cardiología

coagulación

otros

Crear gráficas temporales por parámetro.

Cada valor debe mantener vínculo con el documento original del que fue extraído.

HISTORIAL Y LÍNEA DE TIEMPO CLÍNICA

Crear una cronología única donde se relacionen:

ingresos

infecciones

diagnósticos

tratamientos

antibióticos

cambios de medicación

síntomas

analíticas

consultas

procedimientos

eventos neurológicos

incidencias de DP

hospitalizaciones

Permitir filtros por fecha, categoría, especialidad y profesional.

GASTOS

Crear módulo económico.

Categorías:

medicamentos
médicos
enfermería
laboratorio
transporte
suministros
alimentación
diálisis
trámites
otros

Permitir:

introducir gasto manualmente

fotografiar factura

subir factura

aplicar OCR

Extraer automáticamente:

fecha
proveedor
concepto
importe

Permitir validación antes de guardar.

Mostrar:

gasto mensual
gasto por categoría
evolución
gastos extraordinarios
comparación por períodos

DIRECTORIO ASISTENCIAL

Crear un directorio centralizado de todas las personas e instituciones vinculadas al cuidado.

Categorías:

FAMILIA
MÉDICOS
ENFERMERÍA
LABORATORIOS
CLÍNICAS
HOSPITALES
FARMACIAS
CNS
PROVEEDORES DP
TRANSPORTE
OTROS

Cada contacto debe incluir:

nombre

fotografía opcional

categoría

especialidad

institución

cargo

teléfono

WhatsApp

correo

dirección

ciudad

horarios

observaciones

Para médicos incluir además:

especialidad

lugares donde atiende

quién lo recomendó

motivo de referencia

áreas clínicas que sigue

fecha de primera consulta

última consulta

próxima consulta

notas relevantes

Relacionar cada profesional con:

citas

documentos

diagnósticos

tratamientos

medicamentos

analíticas

hospitalizaciones

Para familiares y cuidadores incluir:

parentesco o relación

responsabilidad

permisos

tareas asignadas

disponibilidad

contacto de emergencia

Crear una vista especial:

EQUIPO ACTUAL DE CUIDADOS

Mostrar:

nombre
función
teléfono
disponibilidad
última interacción
próxima actividad

INTERACCIÓN POR VOZ

La aplicación debe permitir interacción mediante voz desde móvil.

Debe permitir:

dictar notas

registrar constantes

registrar síntomas

registrar gastos

crear citas

crear tareas

registrar incidencias

consultar medicación

consultar historial

consultar resultados

preguntar al asistente IA

Ejemplos:

“Registra presión 125 sobre 70 y saturación 94.”

“Anota que hoy ha tenido poco apetito.”

“Registra un gasto de 180 bolivianos en laboratorio.”

“¿Cuánto fue la ultrafiltración de ayer?”

“¿Cuándo tiene la próxima consulta de nefrología?”

“¿Cuál es el teléfono del hematólogo?”

Preparar integración para:

Speech-to-Text
Text-to-Speech
comandos por voz
conversación por voz

Antes de guardar información clínica obtenida por voz, mostrar siempre una pantalla de confirmación.

BOTÓN UNIVERSAL DE ACCIÓN RÁPIDA

Crear un botón visible desde cualquier pantalla.

Debe permitir escribir, hablar, fotografiar o subir un archivo.

La aplicación debe identificar automáticamente la intención del usuario y dirigir la información al módulo correcto.

Ejemplo:

“Hoy tiene presión 130/75, saturación 93 y está más cansada.”

Interpretar como:

constantes + observación clínica.

Mostrar los campos identificados y pedir confirmación.

MODO ENFERMERÍA / CUIDADOR

Crear una interfaz simplificada para uso cotidiano.

Accesos directos:

CONSTANTES
MEDICACIÓN
DIÁLISIS
INCIDENCIA
NOTA DE VOZ
FOTO / DOCUMENTO

Evitar navegación compleja.

ASISTENTE IA

Crear un chatbot conectado a la información almacenada en la aplicación.

Debe poder consultar:

historial

analíticas

medicación

constantes

DP

citas

documentos

directorio

incidencias

gastos

suministros

Ejemplos:

“¿Cómo ha evolucionado el potasio en los últimos tres meses?”

“¿Qué antibióticos recibió durante la última infección?”

“¿Cuándo comenzó a bajar la ultrafiltración?”

“Resume la evolución clínica de los últimos 30 días.”

“Genera un resumen para nefrología.”

“¿Qué medicamentos cambiaron esta semana?”

“¿Quién recomendó al doctor X?”

La IA debe diferenciar claramente:

DATOS REGISTRADOS
INTERPRETACIÓN
DATOS FALTANTES

Nunca debe inventar información clínica.

Preparar arquitectura para conectar posteriormente una API externa de IA.

INFORMES

Permitir generar:

resumen clínico

informe para nefrología

informe de diálisis

evolución de analíticas

informe de medicación

informe de incidencias

resumen para familiares

informe de 7, 30 o 90 días

resumen previo a una consulta médica

Preparar exportación a PDF.

ALERTAS

Crear sistema configurable de alertas:

constantes fuera de rango

valores de laboratorio

cambios relevantes de peso

alteraciones de ultrafiltración

medicación pendiente

citas

stock bajo

caducidades

próximas entregas CNS

tareas críticas

Los límites clínicos deben ser configurables manualmente y no fijados de forma automática por la aplicación.

USUARIOS Y PERMISOS

Crear roles:

ADMINISTRADOR
FAMILIAR
ENFERMERÍA
MÉDICO
LECTURA

Registrar quién:

crea
modifica
valida
elimina

cada dato.

Mantener auditoría de cambios.

DISEÑO Y EXPERIENCIA

Estética:

sobria
institucional
amable
muy clara
moderna
no excesivamente hospitalaria

Priorizar móvil.

Utilizar:

tarjetas
gráficas simples
tipografía legible
iconografía clara
jerarquía visual fuerte

Navegación principal:

Inicio
Agenda
Salud
Diálisis
Medicación
Documentos
Gastos
Inventario
Directorio
Asistente IA

ARQUITECTURA

Utilizar Supabase para:

autenticación

base de datos

almacenamiento

permisos

historial

relaciones entre datos

Diseñar el modelo de datos para que cada registro pueda relacionarse con:

paciente
fecha
usuario
tipo de evento
profesional
institución
documento fuente
medicación
episodio clínico

Evitar almacenar información clínica únicamente como texto libre.

Priorizar datos estructurados para permitir búsquedas, gráficas y análisis posteriores con IA.

MVP

Construir primero un MVP completamente navegable y funcional.

Prioridad inicial:

Dashboard
Agenda
Constantes
Diálisis
Medicación
Analíticas
Documentos
Directorio
Inventario
Gastos
Voz

Dejar preparada la arquitectura para:

OCR avanzado
IA
informes automáticos
notificaciones
integraciones externas

Utilizar datos ficticios realistas para demostrar todos los flujos.

IMPORTANTE

No diseñar la aplicación como un simple historial médico.

Debe funcionar como un CENTRO DE CONTROL DEL CUIDADO de la paciente, donde se integren salud, diálisis, actividades, personas, documentación, suministros, gastos y comunicación.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0807c0aa-7dce-4262-a36a-c44079bc5661).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
