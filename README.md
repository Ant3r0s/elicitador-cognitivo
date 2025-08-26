# Elicitador Cognitivo: Herramienta de Autoevaluación a partir de PDF

## Resumen

Elicitador Cognitivo es una aplicación web del lado del cliente diseñada para facilitar el aprendizaje activo a través de la autoevaluación. La herramienta procesa un documento PDF proporcionado por el usuario y genera preguntas abiertas basadas en su contenido. El objetivo es fomentar el método de estudio de recuerdo activo (`active recall`), donde el usuario debe recuperar información de su memoria en lugar de simplemente reconocerla, fortaleciendo así la retención del conocimiento.

## Tecnología Subyacente

La aplicación opera enteramente en el navegador del usuario, garantizando la privacidad y eliminando la necesidad de un backend. Su funcionalidad se basa en las siguientes tecnologías:

* **PDF.js (de Mozilla):** Una biblioteca de JavaScript que permite analizar y extraer de forma segura el contenido textual de los archivos PDF.
* **Transformers.js (de Xenova):** Una implementación de la popular biblioteca de modelos de IA `transformers` que se ejecuta directamente en el navegador. Se utiliza un modelo de `feature-extraction` (`Xenova/all-MiniLM-L6-v2`) para convertir fragmentos de texto en vectores semánticos, permitiendo a la aplicación identificar pasajes significativos del documento.

## Modo de Uso

1.  **Carga del Documento:** Inicie la aplicación y utilice el botón "Seleccionar Documento PDF" para cargar el material de estudio.
2.  **Procesamiento:** La aplicación analizará el texto. La primera vez que se utiliza, puede requerir un tiempo adicional para descargar y almacenar en caché el modelo de IA. El progreso se indicará en pantalla.
3.  **Interrogación:** Una vez procesado, el sistema presentará una pregunta o un concepto clave extraído del documento.
4.  **Recuperación Activa:** El usuario debe intentar formular una respuesta completa basándose en su conocimiento del tema.
5.  **Verificación:** Al presionar el botón "Revelar Respuesta", la aplicación mostrará el extracto exacto del PDF del cual se originó la pregunta, permitiendo al usuario comparar y verificar la exactitud y completitud de su propia respuesta.
6.  **Continuación:** El usuario puede proceder a la siguiente pregunta para continuar con la sesión de estudio.

## Despliegue

Como aplicación web estática (compuesta únicamente por HTML, CSS y JavaScript), puede ser desplegada en cualquier servicio de alojamiento de archivos estáticos, tales como:

* GitHub Pages
* Netlify
* Vercel

No se requiere ninguna configuración del lado del servidor.
