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
    let structuredContent = []; // NUEVO: Ya no son frases sueltas, son objetos con estructura
    let usedContentIndices = new Set();
    let currentAnswer = '';
    let aiPipeline = null; // Mantenemos la IA para futuras mejoras, aunque no se usa activamente ahora

    // --- Lógica Principal ---
    pdfUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        resetState();
        documentTitle.textContent = `Sesión de Estudio: ${file.name}`;

        try {
            statusText.textContent = 'Extrayendo texto del PDF...';
            const pdfText = await readPdf(file);
            
            statusText.textContent = 'Analizando estructura del documento...';
            
            // **NUEVA LÓGICA DE PROCESAMIENTO ESTRUCTURAL**
            structuredContent = parseTextToStructure(pdfText);

            if (structuredContent.length === 0) {
                throw new Error("No se pudo identificar una estructura de Títulos o Artículos en el documento.");
            }
            
            uploadView.classList.add('hidden');
            studyView.classList.remove('hidden');
            generateAndDisplayQuestion();

        } catch (error) {
            console.error('Error en el procesamiento:', error);
            statusText.textContent = `Error: ${error.message}`;
            alert(`Hubo un error al procesar el PDF. \nDetalle: ${error.message}`);
            resetState();
        }
    });

    function parseTextToStructure(text) {
        const content = [];
        // Expresión regular para encontrar Títulos, Capítulos o Artículos.
        const regex = /^(Título\s+[IVXLCDM]+|Capítulo\s+[IVXLCDM\d]+|Artículo\s+\d+)/gim;
        const sections = text.split(regex).filter(s => s.trim() !== '');

        for (let i = 0; i < sections.length; i += 2) {
            if (sections[i] && sections[i+1]) {
                content.push({
                    title: sections[i].trim(),
                    text: sections[i+1].trim()
                });
            }
        }
        return content;
    }
    
    // --- Lógica de los botones (sin cambios) ---
    revealBtn.addEventListener('click', () => {
        answerText.textContent = currentAnswer;
        answerContainer.classList.remove('hidden');
        revealBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
    });
    nextBtn.addEventListener('click', () => generateAndDisplayQuestion());
    backToUploadBtn.addEventListener('click', () => {
        studyView.classList.add('hidden');
        uploadView.classList.remove('hidden');
        resetState();
    });

    // --- Funciones Auxiliares ---

    function generateAndDisplayQuestion() {
        if (usedContentIndices.size >= structuredContent.length) {
            questionContainer.innerHTML = `<p>Ha completado todas las secciones del documento. ¡Excelente trabajo!</p>`;
            revealBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
            return;
        }

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * structuredContent.length);
        } while (usedContentIndices.has(randomIndex));

        usedContentIndices.add(randomIndex);
        
        const section = structuredContent[randomIndex];
        currentAnswer = section.text;
        
        // **NUEVA LÓGICA DE PREGUNTAS CONCEPTUALES**
        const questionPrompt = `¿Qué establece o de qué trata el siguiente apartado?`;
        questionContainer.innerHTML = `<p>${questionPrompt}</p><h2>${section.title}</h2>`;
        
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
            // Unimos los items con un espacio y añadimos un salto de línea por página.
            fullText += textContent.items.map(item => item.str).join(' ') + '\n\n';
        }
        return fullText;
    }

    function resetState() {
        structuredContent = [];
        usedContentIndices.clear();
        currentAnswer = '';
        pdfUpload.value = '';
        statusText.textContent = '';
    }

    // --- Gestión del Tema (sin cambios) ---
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
