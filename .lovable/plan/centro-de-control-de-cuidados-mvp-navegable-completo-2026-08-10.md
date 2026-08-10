# Centro de Control de Cuidados — MVP navegable completo

Aplicación web responsive y mobile-first para gestionar el cuidado integral de una paciente mayor con enfermedad renal crónica en diálisis peritoneal. Todo en español, moneda en bolivianos (Bs), unidades métricas.

## Qué se entrega en esta fase

Los 10 módulos navegables y funcionales, con login y roles, datos ficticios realistas, voz e IA funcionando.

### 1. Acceso y roles
- Login con email/contraseña.
- Roles: Administrador, Familiar, Enfermería, Médico, Lectura.
- Cada registro guarda quién lo creó/modificó, con auditoría de cambios consultable.
- Usuario demo de administrador para recorrer la app de inmediato.

### 2. Inicio (Resumen de hoy)
Tarjetas visuales con: próximas citas, medicación pendiente, tareas del día, últimas constantes, peso, última sesión de diálisis con ultrafiltración, incidencias recientes, alertas clínicas, stock crítico DP, próximos laboratorios, gasto del mes y documentos recientes.

### 3. Agenda
- Vistas día, semana y mes.
- Tipos: cita médica, laboratorio, tratamiento, visita de enfermería, medicación, recogida de suministros, trámite CNS, compra, actividad personal, tarea familiar.
- Campos: fecha, hora, responsable, estado, prioridad, notas, recordatorio y contacto relacionado.

### 4. Salud (constantes y control diario)
- Registro de presión arterial, frecuencia cardíaca, saturación, temperatura, peso, glucemia, ingesta de líquidos, diuresis, deposiciones, edema, dolor, conciencia, apetito, descanso, síntomas y observaciones.
- Gráficas de evolución con filtros por rango de fechas.

### 5. Diálisis peritoneal
- Registro de sesión: fecha, hora, peso previo/posterior, concentración, número de bolsas, volumen infundido y drenado, ultrafiltración calculada, duración, datos de cicladora, alarmas, características del líquido, incidencias, presión arterial y observaciones.
- Gráficas de ultrafiltración, peso, volúmenes e incidencias con tendencias.

### 6. Medicación
- Ficha por medicamento: nombre, principio activo, dosis, frecuencia, horario, vía, médico prescriptor, inicio, suspensión, motivo, observaciones.
- Estados: ACTIVO, SUSPENDIDO, TEMPORAL, PRN.
- Historial de cambios y registro de cada administración.

### 7. Documentos y analíticas
- Subida de PDF, foto desde móvil, imagen o documento (receta, informe, epicrisis, resultado).
- OCR/extracción automática de valores de laboratorio: parámetro, valor, unidad, rango, fecha, laboratorio.
- Organización por áreas clínicas (renal, electrolitos, hematología, metabolismo mineral, PTH, nutrición, hepática, infección, inflamación, cardiología, coagulación, otros).
- Gráficas por parámetro; cada valor conserva enlace al documento original y requiere validación antes de guardar.

### 8. Inventario CNS / suministros DP
- Producto, categoría, presentación, cantidad recibida y disponible, consumo diario estimado, lote, caducidad, fecha de entrega y próxima entrega.
- Alertas automáticas: stock bajo, próxima caducidad, consumo por encima de lo previsto, reposición próxima.

### 9. Gastos
- Categorías: medicamentos, médicos, enfermería, laboratorio, transporte, suministros, alimentación, diálisis, trámites, otros.
- Alta manual o por foto/subida de factura con extracción de fecha, proveedor, concepto e importe, y pantalla de validación.
- Vistas: gasto mensual, por categoría, evolución, extraordinarios y comparación entre períodos.

### 10. Directorio asistencial
- Categorías: familia, médicos, enfermería, laboratorios, clínicas, hospitales, farmacias, CNS, proveedores DP, transporte, otros.
- Ficha con foto opcional, categoría, especialidad, institución, cargo, teléfono, WhatsApp, correo, dirección, ciudad, horarios y observaciones.
- Campos extra para médicos (lugares de atención, quién lo recomendó, motivo de referencia, áreas que sigue, primera/última/próxima consulta) y para familiares (relación, responsabilidad, permisos, tareas, disponibilidad, contacto de emergencia).
- Vista "Equipo actual de cuidados" con función, teléfono, disponibilidad, última interacción y próxima actividad.

### 11. Historial / línea de tiempo clínica
Cronología unificada de ingresos, infecciones, diagnósticos, tratamientos, antibióticos, cambios de medicación, síntomas, analíticas, consultas, procedimientos, eventos neurológicos, incidencias DP y hospitalizaciones, con filtros por fecha, categoría, especialidad y profesional.

### 12. Voz y botón universal de acción rápida
- Botón flotante presente en toda la app: escribir, hablar, fotografiar o subir archivo.
- Dictado por voz con transcripción real; la IA interpreta la intención y prellena el módulo correcto (constantes, síntomas, gastos, citas, tareas, incidencias).
- Consultas por voz ("¿Cuánto fue la ultrafiltración de ayer?") con respuesta hablada opcional.
- Toda información clínica obtenida por voz pasa por pantalla de confirmación antes de guardarse.

### 13. Asistente IA
Chat con acceso a los datos registrados (historial, analíticas, medicación, constantes, DP, citas, documentos, directorio, incidencias, gastos, suministros). Las respuestas separan siempre DATOS REGISTRADOS / INTERPRETACIÓN / DATOS FALTANTES y nunca inventan información clínica.

### 14. Modo enfermería / cuidador
Interfaz simplificada con accesos directos: Constantes, Medicación, Diálisis, Incidencia, Nota de voz, Foto/Documento.

### 15. Alertas e informes
- Alertas configurables manualmente (constantes fuera de rango, valores de laboratorio, cambios de peso, alteraciones de ultrafiltración, medicación pendiente, citas, stock, caducidades, entregas CNS, tareas críticas). Sin umbrales fijados automáticamente.
- Informes: resumen clínico, nefrología, diálisis, analíticas, medicación, incidencias, resumen familiar, 7/30/90 días y previo a consulta, con exportación a PDF.

## Navegación
Barra inferior en móvil con Inicio, Agenda, Salud, Diálisis y Más; desde "Más" se accede a Medicación, Documentos, Gastos, Inventario, Directorio, Historial, Informes, Asistente IA y Modo enfermería. En escritorio, barra lateral completa.

## Diseño
Estética sobria e institucional pero amable y moderna, no hospitalaria: azul sereno con verde salvia como acento, tipografía muy legible, tarjetas amplias, gráficas simples, iconografía clara y jerarquía visual fuerte. Objetivos táctiles grandes, pensados para uso con una mano.

## Detalles técnicos
- Lovable Cloud para autenticación, base de datos, almacenamiento de archivos, permisos por rol (RLS) y auditoría.
- Modelo de datos estructurado: cada registro se relaciona con paciente, fecha, usuario, tipo de evento, profesional, institución, documento fuente, medicación y episodio clínico. Nada clínico se guarda solo como texto libre; los valores de laboratorio quedan normalizados (parámetro, valor, unidad, rango) para gráficas y análisis IA.
- Voz: transcripción y síntesis de voz vía Lovable AI; interpretación de intención y extracción estructurada con confirmación previa.
- OCR de documentos y facturas mediante Lovable AI multimodal, con validación humana antes de persistir.
- Asistente IA en el servidor con herramientas de consulta sobre los datos reales del paciente; arquitectura lista para ampliar a proveedores externos.
- Datos ficticios realistas cargados por migración (paciente, ~90 días de constantes y sesiones DP, medicación, analíticas, contactos, inventario, gastos, agenda) para que todos los flujos y gráficas se vean poblados desde el primer momento.
- Preparado para fases siguientes: OCR avanzado, informes automáticos, notificaciones push e integraciones externas.

## Nota de alcance
Es un MVP amplio: cada módulo queda navegable y funcional con sus campos, gráficas y alertas principales, pero no con todos los refinamientos posibles. Tras revisarlo podremos profundizar en los módulos que más uses.
