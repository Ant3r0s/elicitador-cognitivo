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
    let currentFullSentence = '';
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
                // Aumentamos el requisito para frases más significativas
                if (chunk.split(' ').length < 10) continue; 
                documentChunks.push(chunk);
                statusText.textContent = `Procesando texto... ${Math.round((i / chunks.length) * 100)}%`;
            }

            if (documentChunks.length === 0) {
                throw new Error("El documento no contiene fragmentos de texto válidos para generar preguntas.");
            }
            
            uploadView.classList.add('hidden');
            studyView.classList.remove('hidden');
            
            generateAndDisplayQuestion();

        } catch (error) {
            console.error('Error en el procesamiento:', error);
            statusText.textContent = `Error: ${error.message}`;
            alert(`Hubo un error al procesar el PDF. Asegúrese de que es un documento de texto válido. \nDetalle: ${error.message}`);
            resetState(); // Aseguramos que se limpia el estado si hay un error
        }
    });
    
    // 2. Lógica de los botones
    revealBtn.addEventListener('click', () => {
        answerText.textContent = currentFullSentence;
        answerContainer.classList.remove('hidden');
        revealBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
    });

    nextBtn.addEventListener('click', () => {
        generateAndDisplayQuestion();
    });

    // **CORRECCIÓN:** Funcionalidad del botón para volver atrás
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
        
        const sentence = documentChunks[randomIndex];
        currentFullSentence = sentence;
        
        // **NUEVA LÓGICA DE PREGUNTAS:** Crear un "rellena el hueco"
        const words = sentence.split(/\s+/);
        if (words.length < 5) { // Si la frase es muy corta, pasamos a la siguiente
            generateAndDisplayQuestion();
            return;
        }
        
        // Buscamos la palabra más larga para ocultarla
        let longestWord = '';
        let longestWordIndex = -1;
        words.forEach((word, index) => {
            const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
            if (cleanWord.length > longestWord.length) {
                longestWord = cleanWord;
                longestWordIndex = index;
            }
        });

        if (longestWordIndex !== -1) {
            const keyword = words[longestWordIndex];
            const questionText = sentence.replace(keyword, '______');
            questionContainer.innerHTML = `<p>Complete el siguiente enunciado extraído del texto:</p><h3>${questionText}</h3>`;
        } else {
            // Si algo falla, mostramos el texto como antes pero es muy improbable
            questionContainer.innerHTML = `<p>Analice y resuma la idea principal del siguiente pasaje.</p>`;
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
        currentFullSentence = '';
        pdfUpload.value = ''; // **IMPORTANTE:** Limpiar el input para poder recargar el mismo archivo
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
