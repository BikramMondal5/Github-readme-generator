// Import the Google Generative AI library
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const generateBtn = document.getElementById('generateBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const editBtn = document.getElementById('editBtn');
    const apiKeyModal = document.getElementById('apiKeyModal');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const closeModalBtn = document.getElementById('closeModal');
    const outputSection = document.getElementById('outputSection');
    const loader = document.getElementById('loader');
    const markdownContent = document.getElementById('markdownContent');
    const previewPane = document.getElementById('previewPane');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const rawTab = document.getElementById('rawTab');
    const previewTab = document.getElementById('previewTab');
    const rawPane = document.getElementById('rawPane');

    // Tech stack selectors
    const techIconContainers = document.querySelectorAll('.tech-icons');

    // Initialize tech stack selection
    techIconContainers.forEach(container => {
        container.querySelectorAll('.tech-icon').forEach(icon => {
            icon.addEventListener('click', () => {
                icon.classList.toggle('selected');
            });
        });
    });

    // Initialize marked.js for markdown rendering
    marked.setOptions({
        breaks: true,
        gfm: true
    });

    // Check if API key exists
    let apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        apiKeyModal.classList.add('visible');
    }

    // Save API key
    saveApiKeyBtn.addEventListener('click', () => {
        const keyInput = document.getElementById('apiKey');
        if (keyInput.value.trim() === '') {
            showError('Please enter a valid API key');
            return;
        }

        localStorage.setItem('geminiApiKey', keyInput.value.trim());
        apiKey = keyInput.value.trim();
        apiKeyModal.classList.remove('visible');
        showSuccess('API key saved successfully!');
    });

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        apiKeyModal.classList.remove('visible');
    });

    // Tab switching
    rawTab.addEventListener('click', () => {
        rawTab.classList.add('active');
        previewTab.classList.remove('active');
        rawPane.classList.add('active');
        previewPane.classList.remove('active');
    });

    previewTab.addEventListener('click', () => {
        previewTab.classList.add('active');
        rawTab.classList.remove('active');
        previewPane.classList.add('active');
        rawPane.classList.remove('active');

        // Render the markdown content
        previewPane.innerHTML = marked.parse(markdownContent.textContent);
    });

    // Generate README
    generateBtn.addEventListener('click', generateReadme);
    regenerateBtn.addEventListener('click', generateReadme);

    // Copy to clipboard
    copyBtn.addEventListener('click', () => {
        const textToCopy = markdownContent.textContent;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showSuccess('README content copied to clipboard!');
            })
            .catch(err => {
                showError('Failed to copy text: ' + err);
            });
    });

    // Edit content
    editBtn.addEventListener('click', () => {
        outputSection.classList.remove('visible');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Function to get selected tech icons
    function getSelectedTechIcons(containerId) {
        const container = document.getElementById(containerId);
        const selectedIcons = container.querySelectorAll('.tech-icon.selected');
        return Array.from(selectedIcons).map(icon => icon.getAttribute('data-tech'));
    }

    async function generateReadme() {
        // Get values
        const projectName = document.getElementById('projectName').value;
        const description = document.getElementById('description').value;
        const keyFeatures = document.getElementById('keyFeatures').value;
        const frontendTech = getSelectedTechIcons('frontendTechIcons');
        const backendTech = getSelectedTechIcons('backendTechIcons');
        const databaseTech = getSelectedTechIcons('databaseTechIcons');
        const blockchainTech = getSelectedTechIcons('blockchainTechIcons');
        const mlTech = getSelectedTechIcons('mlTechIcons');
        const otherTech = document.getElementById('otherTech').value;
        const installation = document.getElementById('installation').value;
        const usage = document.getElementById('usage').value;
        const repoUrl = document.getElementById('repoUrl').value;
        const license = document.getElementById('license').value;
        const contributors = document.getElementById('contributors').value;
        const includeScreenshot = document.getElementById('includeScreenshot').checked;

        // Validate inputs
        if (!projectName) {
            showError('Please enter a project name');
            return;
        }

        if (!description) {
            showError('Please enter a project description');
            return;
        }

        if (!license) {
            showError('Please select a license');
            return;
        }

        // Check API key
        if (!apiKey) {
            apiKeyModal.classList.add('visible');
            return;
        }

        try {
            // Show loader
            loader.classList.add('visible');
            outputSection.classList.remove('visible');
            hideError();
            hideSuccess();

            // Create prompt
            const prompt = createPrompt(
                projectName,
                description,
                keyFeatures,
                frontendTech,
                backendTech,
                databaseTech,
                blockchainTech,
                mlTech,
                otherTech,
                installation,
                usage,
                repoUrl,
                license,
                contributors,
                includeScreenshot
            );

            // Call Gemini API
            const generatedContent = await callGeminiApi(prompt);

            // Display result
            markdownContent.textContent = generatedContent;

            // Switch to Raw tab initially
            rawTab.click();

            // Show output section
            outputSection.classList.add('visible');

            // Scroll to result
            outputSection.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            showError('Error generating README: ' + error.message);
            console.error('Error:', error);
        } finally {
            // Hide loader
            loader.classList.remove('visible');
        }
    }

    function createPrompt(
        projectName,
        description,
        keyFeatures,
        frontendTech,
        backendTech,
        databaseTech,
        blockchainTech,
        mlTech,
        otherTech,
        installation,
        usage,
        repoUrl,
        license,
        contributors,
        includeScreenshot
    ) {
        let prompt = `Create a professional GitHub README.md file in proper markdown format for a project called "${projectName}" with the following description: "${description}".`;

        // Add key features
        if (keyFeatures.trim()) {
            prompt += ` The key features include:\n${keyFeatures}`;
        }

        // Add tech stack
        prompt += " The technology stack includes:";

        if (frontendTech.length > 0) {
            prompt += `\nFrontend: ${frontendTech.join(', ')}`;
        }

        if (backendTech.length > 0) {
            prompt += `\nBackend: ${backendTech.join(', ')}`;
        }

        if (databaseTech.length > 0) {
            prompt += `\nDatabase: ${databaseTech.join(', ')}`;
        }

        if (blockchainTech.length > 0) {
            prompt += `\nBlockchain: ${blockchainTech.join(', ')}`;
        }

        if (mlTech.length > 0) {
            prompt += `\nMachine Learning: ${mlTech.join(', ')}`;
        }

        if (otherTech.trim()) {
            prompt += `\nOther Technologies: ${otherTech}`;
        }

        // Add installation instructions
        if (installation.trim()) {
            prompt += `\n\nThe installation steps are:\n${installation}`;
        } else if (repoUrl) {
            const repoName = repoUrl.split('/').pop();
            prompt += `\n\nUse standard git clone instructions for repository ${repoUrl} with project name ${repoName}.`;
        } else {
            prompt += `\n\nUse standard git clone instructions with a placeholder repository URL.`;
        }

        // Add usage instructions
        if (usage.trim()) {
            prompt += `\n\nUsage instructions are as follows:\n${usage}`;
        }

        // Add license
        prompt += `\n\nThe project is licensed under the ${license} License.`;

        // Add contributors
        if (contributors.trim()) {
            prompt += `\n\nContributors to the project include:\n${contributors}`;
        }

        // Add screenshot section
        if (includeScreenshot) {
            prompt += `\n\nInclude a screenshot section in the README.`;
        }

        prompt += `\n\nFollow this example structure but adapt it to this specific project:
     # (appropriate emojis based on project) Project Name
     <A short overview for the project>
     ## 🌟 Features
     - features1
     - features2
     - features3

     ## 🛠️ Technologies Used
     <Technologies used for this project with their functions>
     ## ⚙️ Installation
     1. Clone the repository:
     \`\`\`bash
     git clone https://github.com/username/your-projects.git
     \`\`\`
     2. Navigate to the project directory:
     \`\`\`bash
     cd your-projects
     \`\`\`
     (additional installation steps based on tech stack)
     ## 📸 Screenshots
     ![Preview Image](screenshot.png)
     ## 🚀 How to Use
     1. step1
     2. step2
     3. step3

     ## 🤝 Contribution
     Feel free to fork this repository, raise issues, or submit pull requests to add features or improve the design.
     ## 📜 License
     This project is licensed under the \`Your License\`.

     Make sure to add appropriate emojis for each section heading.
     Please ensure the README is well-formatted with proper Markdown syntax, including code blocks with the appropriate language specified.
     The README should be professional, comprehensive and showcase the project effectively.
     Do not include any explanations or commentary outside of the README content - just provide the complete markdown file ready for GitHub.`;

        return prompt;
    }

    async function callGeminiApi(prompt) {
        try {
            // Initialize Gemini API with the correct class
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            // Generate content
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            return text;
        } catch (error) {
            console.error('API Error:', error);
            if (error.message && error.message.includes('API key')) {
                localStorage.removeItem('geminiApiKey');
                apiKeyModal.classList.add('visible');
                throw new Error('Invalid API key. Please enter a valid Google Gemini API key.');
            }
            throw error;
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('visible');
        setTimeout(() => {
            errorMessage.classList.remove('visible');
        }, 5000);
    }

    function hideError() {
        errorMessage.classList.remove('visible');
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add('visible');
        setTimeout(() => {
            successMessage.classList.remove('visible');
        }, 3000);
    }

    function hideSuccess() {
        successMessage.classList.remove('visible');
    }
});