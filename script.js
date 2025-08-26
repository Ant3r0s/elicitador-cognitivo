document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos del DOM ---
    const uploadView = document.getElementById('upload-view');
    const studyView = document.getElementById('study-view');
    const pdfUpload = document.getElementById('pdf-upload');
    const statusText = document.getElementById('status-text');
    const documentTitle = document.getElementById('document-title');
    const questionContainer = document.getElementById('question-container');
    const answerContainer = document.getElementById('answer-container');
    const answerText = document.getElementById('answer-text');
    const revealBtn = document.getElementById('reveal-btn');
    const nextBtn = document.getElementById('next-btn');
    const backToUploadBtn = document.getElementById('back-to-upload-btn');
    const themeToggle = document.getElementById('theme-checkbox');

    // --- Estado de la Aplicación ---
    let documentChunks = [];
    let usedChunkIndices = new Set();
    let currentAnswer = '';
    let aiPipeline = null;

    // --- Lógica Principal ---

    // 1. Procesamiento del PDF
    pdfUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        resetState();
        documentTitle.textContent = `Sesión de Estudio: ${file.name}`;

        try {
            statusText.textContent = 'Extrayendo texto del PDF...';
            const pdfText = await readPdf(file);
            
            statusText.textContent = 'Analizando y fragmentando el contenido...';
            const chunks = pdfText.match(/[^.!?\n]+[.!?\n]+/g) || [];

            if (!aiPipeline) {
                statusText.textContent = 'Cargando modelo de IA (sólo la primera vez)...';
                aiPipeline = await window.pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
                    progress_callback: data => {
                        if (data.status === 'progress') {
                            statusText.textContent = `Descargando modelo... ${Math.round(data.progress)}%`;
                        }
                    }
                });
            }

            documentChunks = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i].trim();
                if (chunk.split(' ').length < 15) continue;
                documentChunks.push(chunk);
                statusText.textContent = `Procesando texto... ${Math.round((i / chunks.length) * 100)}%`;
            }

            if (documentChunks.length === 0) {
                throw new Error("El documento no contiene fragmentos de texto válidos para generar preguntas.");
            }
            
            // **CORRECCIÓN:** Cambiar de vista SÓLO cuando todo ha terminado.
            uploadView.classList.add('hidden');
            studyView.classList.remove('hidden');
            
            generateAndDisplayQuestion();

        } catch (error) {
            console.error('Error en el procesamiento:', error);
            statusText.textContent = `Error: ${error.message}`;
            alert(`Hubo un error al procesar el PDF. Asegúrese de que es un documento de texto válido. \nDetalle: ${error.message}`);
            resetState();
        }
    });
    
    // 2. Lógica de los botones
    revealBtn.addEventListener('click', () => {
        answerText.textContent = currentAnswer;
        answerContainer.classList.remove('hidden');
        revealBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
    });

    nextBtn.addEventListener('click', () => {
        generateAndDisplayQuestion();
    });

    // **NUEVO:** Botón para volver a la pantalla de carga
    backToUploadBtn.addEventListener('click', () => {
        studyView.classList.add('hidden');
        uploadView.classList.remove('hidden');
        resetState();
    });

    // --- Funciones Auxiliares ---

    function generateAndDisplayQuestion() {
        if (usedChunkIndices.size >= documentChunks.length) {
            questionContainer.innerHTML = `<p>Ha completado todos los conceptos del documento. ¡Excelente trabajo!</p>`;
            revealBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
            return;
        }

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * documentChunks.length);
        } while (usedChunkIndices.has(randomIndex));

        usedChunkIndices.add(randomIndex);
        
        currentAnswer = documentChunks[randomIndex];
        
        // **CORRECCIÓN:** Lógica para encontrar una palabra clave y formular una pregunta real.
        const words = currentAnswer.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(/\s/);
        const keyword = words.find(w => w.length > 7 && /^[A-Z]/.test(w)) || words.find(w => w.length > 9);

        if (keyword) {
            questionContainer.innerHTML = `<p>Explique el siguiente concepto clave extraído del documento:</p><h2>${keyword}</h2>`;
        } else {
            questionContainer.innerHTML = `<p>Analice y resuma la idea principal del siguiente pasaje:</p><p><i>"${currentAnswer.substring(0, 100)}..."</i></p>`;
        }
        
        // Resetear la UI para la nueva pregunta
        answerContainer.classList.add('hidden');
        answerText.textContent = '';
        revealBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
    }
    
    async function readPdf(file) {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n';
        }
        return fullText;
    }

    function resetState() {
        documentChunks = [];
        usedChunkIndices.clear();
        currentAnswer = '';
        pdfUpload.value = ''; // Limpiar el input de archivo
        statusText.textContent = '';
    }

    // --- Gestión del Tema (Claro/Oscuro) ---
    themeToggle.addEventListener('change', (e) => {
        document.body.classList.toggle('dark-mode', e.target.checked);
        localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }
});
