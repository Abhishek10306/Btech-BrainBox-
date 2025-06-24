document.addEventListener('DOMContentLoaded', () => {
    // Element references
    const darkModeToggle = document.getElementById('dark-mode-checkbox');
    const subjectCards = document.querySelectorAll('.subject-card');
    const questionInput = document.getElementById('question-input');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const getAnswerBtn = document.getElementById('get-answer-btn');
    const btnText = document.getElementById('btn-text');
    // Result element references
    const resultWrapper = document.getElementById('result-wrapper');
    const quickResultText = document.getElementById('quick-result-text');
    const detailedSolutionText = document.getElementById('detailed-solution-text');

    let selectedSubject = 'General';
    let base64Image = null;

    // Dark Mode Logic
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

    // Subject Selection Logic
    subjectCards.forEach(card => {
        card.addEventListener('click', () => {
            subjectCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedSubject = card.getAttribute('data-subject');
        });
    });

    // Image Upload Logic
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

    // Get Answer Button Click Handler
    getAnswerBtn.addEventListener('click', async () => {
        const questionText = questionInput.value.trim();
        if (!questionText && !base64Image) {
            alert('Please type a question or upload an image.');
            return;
        }
        
        setLoading(true);

        // IMPORTANT: Replace with your own personal API key.
        const API_KEY = "AIzaSyDlk_YHMKWBHPAZ9ta8aUIN8IIHpJLSaJQ"; // <<< PUT YOUR PERSONAL API KEY HERE
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

        // Enhanced Prompt for structured response
        const prompt = `
        IMPORTANT: You must follow this response format strictly.
        You are "BTech BrainBox", an expert AI assistant specializing in ${selectedSubject}.
        The user has asked the following question: "${questionText}".

        First, provide only the final, concise answer.
        - If it is a multiple-choice question (MCQ), your answer should be just the correct option and its value (e.g., "B) ₹75" or "Option C").
        - If it is a calculation, give only the final number (e.g., "4" or "15.7").
        - If it's a conceptual question, give a one-sentence answer.
        
        After this short answer, you MUST insert a special separator: '|||ANSWER_SEPARATOR|||'.
        
        After the separator, provide a detailed, step-by-step explanation for the solution. Format it clearly using paragraphs and bullet points if needed. Do not use complex LaTeX like \\boxed{}.
        `;

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
            
            if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts) {
                const fullAnswer = data.candidates[0].content.parts[0].text;
                const answerParts = fullAnswer.split('|||ANSWER_SEPARATOR|||');

                // Check if the AI followed our format
                if (answerParts.length >= 2) {
                    quickResultText.textContent = answerParts[0].trim();
                    detailedSolutionText.textContent = answerParts[1].trim();
                } else {
                    // Fallback if the AI doesn't use the separator
                    quickResultText.textContent = "See full response below";
                    detailedSolutionText.textContent = fullAnswer.trim();
                }
                detailedSolutionText.classList.remove('error');
                resultWrapper.style.display = 'block';

            } else {
                throw new Error("No valid response from the AI. The content might have been blocked due to safety settings.");
            }

        } catch (error) {
            // Display error in the result boxes
            quickResultText.textContent = "Error";
            detailedSolutionText.textContent = `An error occurred: ${error.message}`;
            detailedSolutionText.classList.add('error');
            resultWrapper.style.display = 'block';
            console.error('API Call Failed:', error);
        } finally {
            setLoading(false);
            // Reset image after getting answer
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
            resultWrapper.style.display = 'none'; // Hide previous results
            quickResultText.textContent = '';
            detailedSolutionText.textContent = '';
        } else {
            getAnswerBtn.classList.remove('loading');
            getAnswerBtn.disabled = false;
            btnText.innerHTML = 'Get Answer';
        }
    }
});
