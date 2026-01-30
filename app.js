document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const darkModeToggle = document.getElementById('dark-mode-checkbox');
    const subjectCards = document.querySelectorAll('.subject-card');
    const questionInput = document.getElementById('question-input');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const getAnswerBtn = document.getElementById('get-answer-btn');
    const btnText = document.getElementById('btn-text');
    const resultWrapper = document.getElementById('result-wrapper');
    const quickResultText = document.getElementById('quick-result-text');
    const detailedSolutionText = document.getElementById('detailed-solution-text');

    // --- NEW: Camera Elements ---
    const captureImageBtn = document.getElementById('capture-image-btn');
    const cameraModal = document.getElementById('camera-modal');
    const videoStream = document.getElementById('video-stream');
    const imageCanvas = document.getElementById('image-canvas');
    const snapPhotoBtn = document.getElementById('snap-photo-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // --- State Variables ---
    let selectedSubject = 'General';
    let base64Image = null;

    // --- Dark Mode Logic ---
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    } else {
         document.body.classList.remove('dark-mode');
         darkModeToggle.checked = false;
    }
    darkModeToggle.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });

    // --- Subject Selection Logic ---
    subjectCards.forEach(card => {
        card.addEventListener('click', () => {
            subjectCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedSubject = card.getAttribute('data-subject');
        });
    });

    // --- Image Upload from File Logic ---
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        imagePreview.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Reading file...`;
        const reader = new FileReader();
        reader.onloadend = () => {
            base64Image = reader.result.split(',')[1];
            imagePreview.innerHTML = `<i class="fas fa-check-circle"></i> ${file.name} uploaded!`;
        };
        reader.onerror = () => {
            imagePreview.innerHTML = `<i class="fas fa-times-circle" style="color: #e74c3c;"></i> Error reading file.`;
            base64Image = null;
        }
        reader.readAsDataURL(file);
    });
    
    // --- NEW: Camera Capture Logic ---
    async function openCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            videoStream.srcObject = stream;
            cameraModal.style.display = 'flex';
        } catch (err) {
            console.error("Error accessing camera: ", err);
            alert("Could not access the camera. Please ensure you have given permission and are using a secure (https) connection.");
        }
    }

    function closeCamera() {
        cameraModal.style.display = 'none';
        const stream = videoStream.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }
        videoStream.srcObject = null;
    }

    captureImageBtn.addEventListener('click', openCamera);
    closeModalBtn.addEventListener('click', closeCamera);

    snapPhotoBtn.addEventListener('click', () => {
        const context = imageCanvas.getContext('2d');
        imageCanvas.width = videoStream.videoWidth;
        imageCanvas.height = videoStream.videoHeight;
        context.drawImage(videoStream, 0, 0, imageCanvas.width, imageCanvas.height);
        
        const dataUrl = imageCanvas.toDataURL('image/jpeg');
        base64Image = dataUrl.split(',')[1];
        
        imagePreview.innerHTML = `<i class="fas fa-check-circle"></i> Image captured successfully!`;
        closeCamera();
    });

    // --- Get Answer API Call ---
    getAnswerBtn.addEventListener('click', async () => {
        const questionText = questionInput.value.trim();
        if (!questionText && !base64Image) {
            alert('Please type a question or upload/capture an image.');
            return;
        }
        
        setLoading(true);

        // IMPORTANT: Replace with your own personal API key.
        // const API_KEY = "AIzaSyC-2THQq7gAicQneqPBwL3USNLV9gX2PZk"; // <<< PUT YOUR KEY HERE
        // const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

        // const API_KEY = "AIzaSyClhxwFCpSt3omx0jSXNmgil__ziJMhRxo"; // ⚠️ Keep it private!
        // const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        // AIzaSyAhJI4aua4d3TZvFaSx02NWV8uGbL52eb8
        // --
        // const API_KEY = "AIzaSyA6A_KXgOswnLbW3ZA-HvzRFJzZ511gx0o";
        // const API_KEY = "AIzaSyAhJI4aua4d3TZvFaSx02NWV8uGbL52eb8";
        // const MODEL_NAME = "gemini-2.5-flash";
        // const API_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

        // const API_KEY = "AIzaSyBzIPE-c5jZFOWI38na_OqKYwCOyZjeUWA"; // use a new key (revoke the old one)
        // const MODEL_NAME = "gemini-1.5-flash";

        // const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

        const API_KEY = "AIzaSyBzIPE-c5jZFOWI38na_OqKYwCOyZjeUWA";
        const MODEL_NAME = "gemini-1.5-flash-latest";

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

        
        // --
        
        const prompt = `
        IMPORTANT: You must follow this response format strictly.
        You are "BTech BrainBox", an expert AI assistant specializing in ${selectedSubject}.
        The user has asked the following question: "${questionText}".
        First, provide only the final, concise answer.
        - If it is an MCQ, your answer should be just the correct option and its value (e.g., "B) ₹75").
        - If it is a calculation, give only the final number (e.g., "4").
        - If it's conceptual, give a one-sentence answer.
        After this short answer, you MUST insert a special separator: '|||ANSWER_SEPARATOR|||'.
        After the separator, provide a detailed, step-by-step explanation. Do not use complex LaTeX.`;

        const requestBody = { contents: [{ parts: [{ text: prompt }] }] };
        if (base64Image) {
            requestBody.contents[0].parts.push({ inline_data: { mime_type: "image/jpeg", data: base64Image } });
        }
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error.message || `API Error: ${response.status}`);
            }
            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts) {
                const fullAnswer = data.candidates[0].content.parts[0].text;
                const answerParts = fullAnswer.split('|||ANSWER_SEPARATOR|||');
                if (answerParts.length >= 2) {
                    quickResultText.textContent = answerParts[0].trim();
                    detailedSolutionText.textContent = answerParts[1].trim();
                } else {
                    quickResultText.textContent = "See full response below";
                    detailedSolutionText.textContent = fullAnswer.trim();
                }
                detailedSolutionText.classList.remove('error');
                resultWrapper.style.display = 'block';
            } else {
                throw new Error("No valid response from the AI. The content might have been blocked.");
            }
        } catch (error) {
            quickResultText.textContent = "Error";
            detailedSolutionText.textContent = `An error occurred: ${error.message}`;
            detailedSolutionText.classList.add('error');
            resultWrapper.style.display = 'block';
            console.error('API Call Failed:', error);
        } finally {
            setLoading(false);
            base64Image = null;
            imageUpload.value = '';
            imagePreview.innerHTML = '';
        }
    });
    
    function setLoading(isLoading) {
        if (isLoading) {
            getAnswerBtn.classList.add('loading');
            getAnswerBtn.disabled = true;
            btnText.innerHTML = '<span class="loader"></span> Processing...';
            resultWrapper.style.display = 'none';
            quickResultText.textContent = '';
            detailedSolutionText.textContent = '';
        } else {
            getAnswerBtn.classList.remove('loading');
            getAnswerBtn.disabled = false;
            btnText.innerHTML = 'Get Answer';
        }
    }
});
