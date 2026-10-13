# Banco — Subtema 1.2 · Desarrollo de software profesional

Banco de **ejemplos y ejercicios** (práctica) de la lección `l1.2`, según
`src/data/unit1Content.ts` + `src/data/banks/l1.2.ts`.

- Los ejercicios `cross1.2a`, `fill1.2c`, `ord1.2a` vienen de `src/data/banks/l1.2.ts`.
- `id` de cada ítem: único.

# PARTE A — Ejemplos

### exA1.2 — match
- **Título:** Atributos del buen software
- **Prompt:** Enlaza cada atributo con su descripción
- **Pares:**
  - Mantenimiento → Puede evolucionar ante necesidades cambiantes
  - Confiabilidad y seguridad → No causa daño y resiste ataques
  - Eficiencia → No desperdicia memoria ni ciclos del procesador
  - Aceptabilidad → Comprensible, utilizable y compatible
- **Pasos:**
  1. Leer el atributo Mantenimiento (identificar la propiedad de calidad antes de buscar su definición).
  2. Buscar la definición que habla de evolución y cambio (el cambio del software es inevitable en un entorno empresarial variable).
  3. Enlazar eficiencia con el uso de recursos (memoria, ciclos y tiempo de respuesta).
  4. Comprobar que ninguna definición se repita (cada atributo tiene una consecuencia verificable).
- **Pistas:** Concéntrate en la consecuencia de cada atributo, no en su nombre. Confiabilidad habla de daño y ataques; eficiencia, de recursos. Aceptabilidad se juzga desde el usuario.
- **Explicación:** Mantenimiento permite evolucionar con el cambio; confiabilidad y seguridad evitan daño y ataques; eficiencia cuida los recursos; aceptabilidad mira la comprensión y compatibilidad.

# PARTE B — Ejercicios (práctica)

### B1. ord1.2 — order
- **Prompt:** Actividades fundamentales del proceso
- **Respuesta (orden):** 1. Especificación del software · 2. Desarrollo del software · 3. Validación del software · 4. Evolución del software
- **Explicación:** Las actividades del proceso son especificación, desarrollo, validación y evolución; en la práctica se solapan e iteran.

### B2. fill1.2 — fill
- **Prompt:** Completa los conceptos del desarrollo profesional
- **Frases ({{respuesta}}):**
  1. El buen software debe entregar la {{funcionalidad}} y el desempeño requeridos.
  2. Los productos {{genéricos}} se venden en el mercado abierto a cualquier cliente.
  3. Los productos {{personalizados}} se desarrollan para un cliente en particular.
  4. Aproximadamente el {{60}}% de los costos del software son de desarrollo.
- **Banco (distractores):** mantenimiento, confiabilidad, eficiencia, hardware, 40
- **Explicación:** El buen software debe ser funcional, genérico o personalizado según su mercado; cerca del 60% de los costos son de desarrollo.

### B3. match1.2 — match
- **Prompt:** Enlaza cada atributo con su descripción
- **Pares:**
  - Mantenimiento → Puede evolucionar ante necesidades cambiantes
  - Confiabilidad y seguridad → No causa daño y resiste ataques
  - Eficiencia → No desperdicia memoria ni ciclos del procesador
  - Aceptabilidad → Comprensible, utilizable y compatible
- **Explicación:** Cada atributo describe una propiedad distinta: evolución, seguridad, uso de recursos y aceptación por el usuario.

### B4. match1.2b — match
- **Prompt:** Enlaza cada tipo de producto con su ejemplo
- **Pares:**
  - Producto genérico → Sistema de contabilidad que se vende a cualquier cliente
  - Producto personalizado → Sistema de control de tráfico aéreo para un cliente
  - Producto genérico adaptado → ERP configurado con las reglas de una empresa
- **Explicación:** El sistema de contabilidad es genérico; el control de tráfico aéreo es personalizado; el ERP es un genérico adaptado.

### B5. cross1.2 — crossword (16×13)
- **Prompt:** Crucigrama de atributos del software
- **Entradas:**
  - H1 across (3,0) → ACEPTABILIDAD → Cualidad que hace al software comprensible, fácil de usar y compatible con otros sistemas; si falla, los usuarios lo rechazan.
  - V1 down (3,1) → CONFIABILIDAD → Cualidad por la que el sistema responde sin fallas y resiste ataques maliciosos: puedes contar con él.
  - V2 down (3,2) → EFICIENCIA → Atributo de un sistema que aprovecha bien la memoria y el procesador, sin malgastar ciclos.
  - V3 down (3,7) → INGENIERIA → ___ de software: disciplina que abarca todo el proceso de producción, desde la especificación hasta el mantenimiento.
- **Banco (distractores):** MANTENIMIENTO, SOFTWARE, REUTILIZACION, CONFIGURACION
- **Explicación:** Aceptabilidad, confiabilidad y eficiencia son atributos de calidad; la ingeniería de software es la disciplina que busca lograrlos.

### B6. fill1.2b — fill
- **Prompt:** Completa los tipos de producto y la calidad
- **Frases ({{respuesta}}):**
  1. Un sistema profesional incluye programas separados y archivos de {{configuración}}.
  2. Los ERP como SAP son productos {{genéricos}} adaptados al cliente.
  3. En los productos {{personalizados}}, el cliente controla la especificación.
  4. La calidad considera también los atributos {{no funcionales}} del software.
- **Banco (distractores):** seguridad, funcionales, manuales, monolíticos, medibles
- **Explicación:** El ERP es un producto genérico adaptado; la calidad incluye atributos no funcionales.

### B7. cross1.2a — crossword (12×13) — [banks/l1.2.ts]
- **Prompt:** Crucigrama: atributos y tipos de software
- **Entradas:**
  - H1 across (0,0) → MANTENIMIENTO → Atributo: facilidad para modificar el software cuando el cliente cambia sus necesidades.
  - V1 down (0,4) → EFICIENCIA → Atributo de un sistema que hace buen uso de la memoria y del procesador: no malgasta recursos.
  - H2 across (5,3) → GENERICO → Un procesador de textos es un producto ___: se desarrolla para venderlo a cualquier cliente del mercado.
  - V2 down (3,10) → EVOLUCION → Actividad de seguir cambiando un sistema ya entregado para que continúe siendo útil al negocio.
  - H3 across (9,7) → MEDIDA → Software personalizado: se desarrolla "a la ___" del cliente.
- **Banco (distractores):** ACEPTABILIDAD, SOFTWARE, CONFIGURACION
- **Explicación:** Mantenimiento y eficiencia son atributos; genérico y "a la medida" son los dos tipos de producto; la evolución es la actividad que mantiene vivo al sistema después de entregarlo.

### B8. fill1.2c — fill — [banks/l1.2.ts]
- **Prompt:** Completa los atributos esenciales del buen software
- **Frases ({{respuesta}}):**
  1. El atributo que permite evolucionar ante necesidades cambiantes es el {{mantenimiento}}.
  2. No causar daño ante un fallo se relaciona con la {{confiabilidad}} y seguridad.
  3. No desperdiciar memoria ni ciclos del procesador es tener {{eficiencia}}.
  4. Ser comprensible, utilizable y compatible define la {{aceptabilidad}}.
- **Banco (distractores):** seguridad, usabilidad, portabilidad, escalabilidad
- **Explicación:** Los atributos esenciales son mantenimiento, confiabilidad y seguridad, eficiencia y aceptabilidad.

### B9. ord1.2a — order — [banks/l1.2.ts]
- **Prompt:** Ordena las actividades del proceso en un sistema de facturación
- **Respuesta (orden):** 1. Definir con el cliente qué debe hacer el sistema y sus restricciones · 2. Diseñar e implementar los módulos de facturación y reportes · 3. Verificar que las facturas cumplen los requisitos definidos · 4. Modificar el sistema cuando cambian las regulaciones fiscales
- **Explicación:** La secuencia representa especificación, desarrollo, validación y evolución. En proyectos reales estas actividades pueden solaparse e iterarse.

# Notas para tu merge

- Mantén `id` únicos (no colisiones con los listados).
- En crucigramas, verifica que las intersecciones compartan letra (ver `docs/crucigramas-unidad1.md`).