/* ==========================================================================
   SmartTute Studio - Tute Lab Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------------------------
    // 1. Initial State Data Model
    // ----------------------------------------------------------------------
    let tuteData = {
        title: "Advanced Mathematics & Geometry Practice",
        grade: "Grade 11 (O/L)",
        term: "Term 1",
        subject: "Mathematics",
        questions: [
            {
                id: "q1",
                title: "Solving Quadratic Equations & Roots",
                marks: 10,
                latex: `Consider the quadratic function $f(x) = x^2 - 5x + 6$.

1. Solve for $x$ when $f(x) = 0$ using the quadratic formula:
$$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$

The smaller root is $x_1 =$ {{answer1}} and the larger root is $x_2 =$ {{answer2}}.

2. Complete the table of values below for $y = x^2 - 5x + 6$:

\\diagram{table, x: 0 | 1 | 2 | 3 | 4 | 5, y: 6 | {{answer3}} | 0 | 0 | {{answer4}} | 6}`,
                answers: {
                    "answer1": { correctAnswer: "2", solution: "Factoring $(x-2)(x-3) = 0$ gives $x_1 = 2$.", marks: 2 },
                    "answer2": { correctAnswer: "3", solution: "Factoring $(x-2)(x-3) = 0$ gives $x_2 = 3$.", marks: 2 },
                    "answer3": { correctAnswer: "2", solution: "When $x = 1$, $y = 1^2 - 5(1) + 6 = 2$.", marks: 3 },
                    "answer4": { correctAnswer: "2", solution: "When $x = 4$, $y = 4^2 - 5(4) + 6 = 2$.", marks: 3 }
                }
            },
            {
                id: "q2",
                title: "Right-Angled Triangle & Trigonometry",
                marks: 10,
                latex: `Refer to the right-angled triangle $\\triangle ABC$ below:

\\diagram{geometry, a: 6, b: 8, angle: 90}

1. Calculate the length of hypotenuse $AC$ using Pythagoras' Theorem ($a^2 + b^2 = c^2$):
Hypotenuse length $AC =$ {{answer1}} cm.

2. Find the value of $\\sin(\\theta)$ where $\\theta = \\angle BAC$:
$\\sin(\\theta) =$ {{answer2}} (expressed as a decimal or fraction).`,
                answers: {
                    "answer1": { correctAnswer: "10", solution: "$AC = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10$ cm.", marks: 5 },
                    "answer2": { correctAnswer: "0.6", solution: "$\\sin(\\theta) = \\frac{\\text{opposite}}{\\text{hypotenuse}} = \\frac{6}{10} = 0.6$ or $\\frac{3}{5}$.", marks: 5 }
                }
            },
            {
                id: "q3",
                title: "Set Theory & Venn Diagram Analysis",
                marks: 10,
                latex: `In a class of 30 students, set $A$ represents students who play Cricket, and set $B$ represents students who play Football.

\\diagram{venn, setA: 12, setB: 10, intersect: 5, outside: 3}

1. How many total students play Cricket ONLY?
Answer: {{answer1}} students.

2. What is the total number of students in $A \\cup B$ (students playing at least one sport)?
Answer: $n(A \\cup B) =$ {{answer2}}.`,
                answers: {
                    "answer1": { correctAnswer: "7", solution: "Only Cricket = $n(A) - n(A \\cap B) = 12 - 5 = 7$.", marks: 5 },
                    "answer2": { correctAnswer: "17", solution: "$n(A \\cup B) = 7 + 5 + 5 = 17$.", marks: 5 }
                }
            }
        ]
    };

    let activeQuestionIndex = 0;
    let isStudentMode = false;
    let isSolutionPreviewVisible = false;
    let isPaperLight = false;

    // DOM Elements
    const tuteTitleInput = document.getElementById('tuteTitle');
    const tuteGradeSelect = document.getElementById('tuteGrade');
    const tuteTermSelect = document.getElementById('tuteTerm');
    const tuteSubjectSelect = document.getElementById('tuteSubject');
    
    const questionCountSpan = document.getElementById('questionCount');
    const questionPillsContainer = document.getElementById('questionPills');
    const btnAddQuestion = document.getElementById('btnAddQuestion');
    const btnDeleteQuestion = document.getElementById('btnDeleteQuestion');
    const btnDuplicateQuestion = document.getElementById('btnDuplicateQuestion');

    const activeQNumBadge = document.getElementById('activeQNumBadge');
    const activeQTitleInput = document.getElementById('activeQTitle');
    const activeQMarksInput = document.getElementById('activeQMarks');
    const latexEditor = document.getElementById('latexEditor');
    const charCountSpan = document.getElementById('charCount');

    const detectedAnswersCountSpan = document.getElementById('detectedAnswersCount');
    const answerKeysList = document.getElementById('answerKeysList');
    const toggleAnswerKeyHeader = document.getElementById('toggleAnswerKey');
    const answerKeySection = document.querySelector('.answer-key-section');

    const paperTuteTitle = document.getElementById('paperTuteTitle');
    const paperMetaTerm = document.getElementById('paperMetaTerm');
    const paperTotalMarks = document.getElementById('paperTotalMarks');
    const paperQuestionsList = document.getElementById('paperQuestionsList');
    const paperSolutionsContainer = document.getElementById('paperSolutionsContainer');
    const paperSolutionsList = document.getElementById('paperSolutionsList');
    const sheetModeTag = document.getElementById('sheetModeTag');

    const viewModeSelect = document.getElementById('viewModeSelect');
    const studentTestBanner = document.getElementById('studentTestBanner');
    const btnSubmitStudentAnswers = document.getElementById('btnSubmitStudentAnswers');

    const btnToggleSolutionPreview = document.getElementById('btnToggleSolutionPreview');
    const btnPreviewTheme = document.getElementById('btnPreviewTheme');
    const tutePaper = document.getElementById('tutePaper');

    const btnExportJson = document.getElementById('btnExportJson');
    const btnImportJson = document.getElementById('btnImportJson');
    const importFileInput = document.getElementById('importFileInput');
    const btnPrintTute = document.getElementById('btnPrintTute');

    // Split Resizer Elements
    const workspace = document.getElementById('workspace');
    const editorPane = document.getElementById('editorPane');
    const previewPane = document.getElementById('previewPane');
    const paneResizer = document.getElementById('paneResizer');

    // Modal Score Elements
    const scoreModalOverlay = document.getElementById('scoreModalOverlay');
    const btnCloseScoreModal = document.getElementById('btnCloseScoreModal');
    const btnModalClose = document.getElementById('btnModalClose');
    const btnModalReviewSolutions = document.getElementById('btnModalReviewSolutions');
    const scorePercent = document.getElementById('scorePercent');
    const scoreFraction = document.getElementById('scoreFraction');
    const scoreCirclePath = document.getElementById('scoreCirclePath');
    const scoreFeedbackText = document.getElementById('scoreFeedbackText');
    const scoreBreakdownList = document.getElementById('scoreBreakdownList');

    // ----------------------------------------------------------------------
    // 2. Core Rendering & Parser Functions
    // ----------------------------------------------------------------------

    // Synchronize UI from State
    function renderApp() {
        // Sync Drawer Form Inputs
        if (tuteTitleInput) tuteTitleInput.value = tuteData.title;
        if (tuteGradeSelect) tuteGradeSelect.value = tuteData.grade;
        if (tuteTermSelect) tuteTermSelect.value = tuteData.term;
        if (tuteSubjectSelect) tuteSubjectSelect.value = tuteData.subject;

        // Sync Top Navbar Header Title Display
        const headerTitleDisplay = document.getElementById('headerTuteTitleDisplay');
        if (headerTitleDisplay) {
            headerTitleDisplay.textContent = tuteData.title || "Untitled Tute";
        }

        paperTuteTitle.textContent = tuteData.title;
        paperMetaTerm.textContent = `${tuteData.term} • ${tuteData.grade} • ${tuteData.subject}`;

        // Ensure valid active question index
        if (activeQuestionIndex >= tuteData.questions.length) {
            activeQuestionIndex = Math.max(0, tuteData.questions.length - 1);
        }

        renderQuestionPills();
        renderActiveEditor();
        renderPaperPreview();
        calculateTotalMarks();
    }

    // Render Question Pills in Navigation Bar
    function renderQuestionPills() {
        questionCountSpan.textContent = tuteData.questions.length;
        questionPillsContainer.innerHTML = '';

        tuteData.questions.forEach((q, idx) => {
            const pill = document.createElement('button');
            pill.className = `q-pill ${idx === activeQuestionIndex ? 'active' : ''}`;
            const tagsCount = (q.latex.match(/\{\{([a-zA-Z0-9_\-]+)\}\}/g) || []).length;
            
            pill.innerHTML = `
                <span>Q${idx + 1}</span>
                ${tagsCount > 0 ? `<span class="q-tag-count" title="${tagsCount} answer boxes">${tagsCount} ans</span>` : ''}
            `;
            pill.onclick = () => {
                activeQuestionIndex = idx;
                renderApp();
            };
            questionPillsContainer.appendChild(pill);
        });
    }

    // Render Active Question in Editor Pane
    function renderActiveEditor() {
        const q = tuteData.questions[activeQuestionIndex];
        if (!q) return;

        activeQNumBadge.textContent = `Q${activeQuestionIndex + 1}`;
        activeQTitleInput.value = q.title || '';
        activeQMarksInput.value = q.marks || 10;
        latexEditor.value = q.latex || '';
        charCountSpan.textContent = `${q.latex.length} chars`;

        syncAnswersConfig();
    }

    // Automatically Detect {{answerX}} tags in active LaTeX text & Image Hotspots to build config UI
    function syncAnswersConfig() {
        const q = tuteData.questions[activeQuestionIndex];
        if (!q) return;

        const regex = /\{\{([a-zA-Z0-9_\-]+)\}\}/g;
        let match;
        const currentFoundTags = [];

        while ((match = regex.exec(q.latex)) !== null) {
            const tagId = match[1];
            if (!currentFoundTags.includes(tagId)) {
                currentFoundTags.push(tagId);
            }
        }

        // Also gather hotspot tags from images
        if (q.images) {
            Object.keys(q.images).forEach(imgKey => {
                const img = q.images[imgKey];
                if (img.hotspots && Array.isArray(img.hotspots)) {
                    img.hotspots.forEach(hs => {
                        if (hs.tagId && !currentFoundTags.includes(hs.tagId)) {
                            currentFoundTags.push(hs.tagId);
                        }
                    });
                }
            });
        }

        // Initialize missing answer keys in state
        if (!q.answers) q.answers = {};
        currentFoundTags.forEach(tagId => {
            if (!q.answers[tagId]) {
                q.answers[tagId] = {
                    correctAnswer: "",
                    solution: "",
                    marks: 2
                };
            }
        });

        detectedAnswersCountSpan.textContent = currentFoundTags.length;
        answerKeysList.innerHTML = '';

        if (currentFoundTags.length === 0) {
            answerKeysList.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">No {{answer1}} tags or Image Hotspots detected in this question. Insert an answer tag or add image hotspots.</p>`;
            return;
        }

        currentFoundTags.forEach((tagId) => {
            const ansObj = q.answers[tagId] || { correctAnswer: "", solution: "", marks: 2 };
            const card = document.createElement('div');
            card.className = 'ans-config-card';

            // Check if tag comes from a hotspot
            let hotspotOriginText = "";
            let isHotspotTag = false;
            let targetHotspotObj = null;

            if (q.images) {
                Object.keys(q.images).forEach(imgKey => {
                    const hsMatch = (q.images[imgKey].hotspots || []).find(h => h.tagId === tagId);
                    if (hsMatch) {
                        isHotspotTag = true;
                        targetHotspotObj = hsMatch;
                        hotspotOriginText = ` <span style="color:var(--blue); font-weight:600;">(Image Hotspot on ${imgKey})</span>`;
                    }
                });
            }

            if (!ansObj.displayStyle) {
                ansObj.displayStyle = 'input'; // Default: 'input', 'label', 'dot', 'checkbox'
            }

            const showCustomLabelInput = isHotspotTag && (ansObj.displayStyle === 'label' || ansObj.displayStyle === 'checkbox' || ansObj.displayStyle === 'dot');

            const hotspotFieldsHtml = isHotspotTag ? `
                <div class="ans-field-group">
                    <label><i class="fa-solid fa-eye"></i> Hotspot Display Style</label>
                    <select data-tag="${tagId}" class="select-hs-display-style drawer-select" style="padding: 4px 8px; font-size: 0.8rem; height: 32px;">
                        <option value="input" ${ansObj.displayStyle === 'input' ? 'selected' : ''}>Fill-in Answer Box</option>
                        <option value="label" ${ansObj.displayStyle === 'label' ? 'selected' : ''}>Text Badge / Label</option>
                        <option value="dot" ${ansObj.displayStyle === 'dot' ? 'selected' : ''}>Dot / Pin Marker</option>
                        <option value="checkbox" ${ansObj.displayStyle === 'checkbox' ? 'selected' : ''}>Selectable Checkbox Tag</option>
                    </select>
                </div>
                ${showCustomLabelInput ? `
                <div class="ans-field-group">
                    <label><i class="fa-solid fa-tag"></i> Display Label Text</label>
                    <input type="text" data-tag="${tagId}" class="input-hs-custom-label" placeholder="e.g. Point A or Angle θ" value="${escapeHtml(ansObj.labelText || targetHotspotObj.label || '')}">
                </div>
                ` : ''}
            ` : '';

            if (!ansObj.inputType) {
                ansObj.inputType = (ansObj.options && ansObj.options.length) ? 'select' : 'text';
            }

            const showOptionsInput = ansObj.inputType === 'select';
            const optionsValue = Array.isArray(ansObj.options) ? ansObj.options.join(', ') : (ansObj.options || '');

            card.innerHTML = `
                <div class="ans-config-header">
                    <span class="ans-tag-badge"><i class="fa-solid fa-tag"></i> {{${tagId}}}</span>
                    <span style="font-size: 0.72rem; color: var(--text-secondary);">Target Input ID: ${tagId}${hotspotOriginText}</span>
                </div>
                <div class="ans-inputs-row">
                    <div class="ans-field-group">
                        <label><i class="fa-solid fa-list-check"></i> Answer Input Type</label>
                        <select data-tag="${tagId}" class="select-ans-input-type drawer-select" style="padding: 4px 8px; font-size: 0.8rem; height: 32px;">
                            <option value="text" ${ansObj.inputType === 'text' ? 'selected' : ''}>Fill-in Text Box</option>
                            <option value="select" ${ansObj.inputType === 'select' ? 'selected' : ''}>Dropdown / Radio Options (MCQ)</option>
                        </select>
                    </div>
                    ${showOptionsInput ? `
                    <div class="ans-field-group">
                        <label><i class="fa-solid fa-square-poll-vertical"></i> Answer Options (comma separated)</label>
                        <input type="text" data-tag="${tagId}" class="input-ans-options" placeholder="e.g. Yes, No  OR  A, B, C, D  OR  2, 3, 4" value="${escapeHtml(optionsValue)}">
                    </div>
                    ` : ''}
                    <div class="ans-field-group">
                        <label>Correct Answer / Choice</label>
                        <input type="text" data-tag="${tagId}" class="input-correct-ans" placeholder="e.g. Yes or A or 5" value="${escapeHtml(ansObj.correctAnswer)}">
                    </div>
                    <div class="ans-field-group">
                        <label>Worked Solution (LaTeX)</label>
                        <input type="text" data-tag="${tagId}" class="input-solution-ans" placeholder="e.g. Option A is correct because..." value="${escapeHtml(ansObj.solution)}">
                    </div>
                    ${hotspotFieldsHtml}
                </div>
            `;

            const typeSelect = card.querySelector('.select-ans-input-type');
            if (typeSelect) {
                typeSelect.onchange = (e) => {
                    q.answers[tagId].inputType = e.target.value;
                    if (e.target.value === 'select' && (!q.answers[tagId].options || !q.answers[tagId].options.length)) {
                        q.answers[tagId].options = ['Yes', 'No'];
                    }
                    syncAnswersConfig();
                    renderPaperPreview();
                };
            }

            const optionsInput = card.querySelector('.input-ans-options');
            if (optionsInput) {
                optionsInput.oninput = (e) => {
                    const rawStr = e.target.value;
                    q.answers[tagId].options = rawStr.split(',').map(s => s.trim()).filter(Boolean);
                    renderPaperPreview();
                };
            }

            // Input handlers
            card.querySelector('.input-correct-ans').oninput = (e) => {
                q.answers[tagId].correctAnswer = e.target.value;
                renderPaperPreview();
            };
            card.querySelector('.input-solution-ans').oninput = (e) => {
                q.answers[tagId].solution = e.target.value;
                renderPaperPreview();
            };

            const customLabelInput = card.querySelector('.input-hs-custom-label');
            if (customLabelInput) {
                customLabelInput.oninput = (e) => {
                    q.answers[tagId].labelText = e.target.value;
                    renderPaperPreview();
                };
            }

            const styleSelect = card.querySelector('.select-hs-display-style');
            if (styleSelect) {
                styleSelect.onchange = (e) => {
                    q.answers[tagId].displayStyle = e.target.value;
                    syncAnswersConfig();
                    renderPaperPreview();
                };
            }

            answerKeysList.appendChild(card);
        });
    }

    // Render Full Tute Paper in Preview Pane
    function renderPaperPreview() {
        paperQuestionsList.innerHTML = '';
        paperSolutionsList.innerHTML = '';

        tuteData.questions.forEach((q, idx) => {
            const qBlock = document.createElement('div');
            qBlock.className = 'rendered-q-block';
            qBlock.id = `q-block-${idx}`;

            const qHeader = document.createElement('div');
            qHeader.className = 'rendered-q-header';
            qHeader.innerHTML = `
                <div class="rendered-q-title">
                    <span class="q-badge-num">Question ${idx + 1}</span>
                    <span>${escapeHtml(q.title || '')}</span>
                </div>
                <span class="rendered-q-marks">[${q.marks || 10} Marks]</span>
            `;
            qBlock.appendChild(qHeader);

            const qBody = document.createElement('div');
            qBody.className = 'rendered-latex-body';

            // Parse Diagram Snippets & Answer Tags into DOM string
            let parsedHtml = processLatexString(q.latex, idx, q.answers);
            qBody.innerHTML = parsedHtml;

            qBlock.appendChild(qBody);
            paperQuestionsList.appendChild(qBlock);

            // Render Solution Entry for master answer sheet
            const solItem = document.createElement('div');
            solItem.className = 'solution-q-item';
            
            let solContentHtml = `<strong>Q${idx + 1}: ${escapeHtml(q.title)}</strong><ul style="margin-top: 0.3rem; padding-left: 1.2rem;">`;
            if (q.answers) {
                Object.keys(q.answers).forEach(tagId => {
                    const a = q.answers[tagId];
                    solContentHtml += `<li style="margin-bottom: 0.35rem;">
                        <span class="ans-tag-badge">{{${tagId}}}</span> Key: <strong style="color: var(--accent-emerald);">${escapeHtml(a.correctAnswer || 'Not set')}</strong>
                        ${a.solution ? ` &mdash; <em>${escapeHtml(a.solution)}</em>` : ''}
                    </li>`;
                });
            }
            solContentHtml += `</ul>`;
            solItem.innerHTML = solContentHtml;
            paperSolutionsList.appendChild(solItem);
        });

        // White paper → transparent; dark mode invert via CSS .ink-figure
        if (window.SmartTuteInkFigure) {
            window.SmartTuteInkFigure.enhanceTuteFigures(paperQuestionsList);
        }

        // Trigger KaTeX auto-render on the paper container (ignoring form inputs & diagram boxes)
        if (window.renderMathInElement) {
            try {
                window.renderMathInElement(paperQuestionsList, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option", "input", "select", "svg"],
                    ignoredClasses: ["tute-answer-input", "answer-box-container", "diagram-visual-box"],
                    throwOnError: false
                });

                if (isSolutionPreviewVisible) {
                    window.renderMathInElement(paperSolutionsList, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false }
                        ],
                        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option", "input", "select", "svg"],
                        throwOnError: false
                    });
                }
            } catch (err) {
                console.error("KaTeX rendering error:", err);
            }
        }
    }

    // Process raw LaTeX text: parse \begin{tikzpicture}...\end{tikzpicture}, \diagram{...}, math blocks & replace {{answerX}} with interactive inputs
    function processLatexString(latexStr, qIndex, answersMap) {
        if (!latexStr) return '';

        const placeholders = [];

        function createPlaceholder(content, isBlock = true) {
            const token = `___DIAGRAM_PLACEHOLDER_${placeholders.length}___`;
            placeholders.push({ token, content, isBlock });
            return token;
        }

        // 1. Extract and convert \begin{tikzpicture}...\end{tikzpicture} (and optional surrounding \[...\])
        let processed = latexStr.replace(/(?:\\\[\s*)?\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}(?:\s*\\\])?/g, (fullMatch, tikzCode) => {
            const svgHtml = parseTikzToSvg(tikzCode);
            return createPlaceholder(svgHtml, true);
        });

        // 2. Extract and store \diagram{type, params} placeholders
        processed = processed.replace(/\\diagram\{([a-zA-Z0-9_\-]+)\s*,\s*([^}]+)\}/g, (fullMatch, type, paramsStr) => {
            const svgHtml = generateDiagramSvg(type.trim().toLowerCase(), paramsStr.trim());
            return createPlaceholder(svgHtml, true);
        });

        // 3. Extract and store {image} or {image_1}, {image_2} figure tags
        const currentQ = tuteData.questions[qIndex];
        const imagesMap = (currentQ && currentQ.images) ? currentQ.images : {};

        processed = processed.replace(/\{image(?:_([a-zA-Z0-9_\-]+))?\}/g, (fullMatch, imgKey) => {
            const key = imgKey || "image_1";
            const imgData = imagesMap[key] || imagesMap["image"] || imagesMap["image_1"];

            if (imgData && imgData.dataUrl) {
                const alignClass = `align-${imgData.align || 'center'}`;
                const sizeClass = `size-${imgData.size || 'medium'}`;
                const captionHtml = imgData.caption ? `<div class="tute-figure-caption">${escapeHtml(imgData.caption)}</div>` : '';
                
                // Build Hotspot pins & input fields overlay
                let hotspotsOverlayHtml = '';
                if (imgData.hotspots && Array.isArray(imgData.hotspots)) {
                    imgData.hotspots.forEach((hs, hsIdx) => {
                        const ansConfig = (answersMap && answersMap[hs.tagId]) ? answersMap[hs.tagId] : {};
                        const displayStyle = ansConfig.displayStyle || 'input';
                        const customText = ansConfig.labelText || hs.label || `Label ${hsIdx + 1}`;

                        // Answer collection popover speech bubble for non-textbox hotspot styles
                        const popoverBubbleHtml = `
                            <div class="hs-answer-popover" id="hs-popover-${qIndex}-${hs.tagId}">
                                <div class="popover-arrow"></div>
                                <span class="popover-title">Enter Answer:</span>
                                <input type="text" class="tute-answer-input hs-popover-input" data-q-idx="${qIndex}" data-ans-id="${hs.tagId}" placeholder="Type answer..." autocomplete="off" spellcheck="false">
                            </div>
                        `;

                        if (displayStyle === 'label') {
                            // Badge / Label Display with popover bubble
                            hotspotsOverlayHtml += `
                                <div class="hotspot-badge-wrap" style="left: ${hs.x}%; top: ${hs.y}%;" onclick="window.toggleHotspotPopover(event, 'hs-popover-${qIndex}-${hs.tagId}')">
                                    <span class="hs-display-badge"><i class="fa-solid fa-tag"></i> ${escapeHtml(customText)} <i class="fa-solid fa-chevron-down hs-popover-caret"></i></span>
                                    ${popoverBubbleHtml}
                                </div>
                            `;
                        } else if (displayStyle === 'dot') {
                            // Dot / Pulse Marker Display with popover bubble
                            hotspotsOverlayHtml += `
                                <div class="hotspot-dot-wrap" style="left: ${hs.x}%; top: ${hs.y}%;" onclick="window.toggleHotspotPopover(event, 'hs-popover-${qIndex}-${hs.tagId}')">
                                    <span class="hs-display-dot">${hsIdx + 1}</span>
                                    ${popoverBubbleHtml}
                                </div>
                            `;
                        } else if (displayStyle === 'checkbox') {
                            // Interactive Checkbox Tag Display with popover bubble
                            hotspotsOverlayHtml += `
                                <div class="hotspot-checkbox-wrap" style="left: ${hs.x}%; top: ${hs.y}%;">
                                    <label class="hs-checkbox-label">
                                        <input type="checkbox" class="tute-hs-checkbox" data-q-idx="${qIndex}" data-ans-id="${hs.tagId}">
                                        <span>${escapeHtml(customText)}</span>
                                    </label>
                                    <button type="button" class="btn-hs-answer-bubble-trigger" onclick="window.toggleHotspotPopover(event, 'hs-popover-${qIndex}-${hs.tagId}')" title="Click to enter detailed answer"><i class="fa-solid fa-pen"></i></button>
                                    ${popoverBubbleHtml}
                                </div>
                            `;
                        } else {
                            // Default: Direct Fill-in Answer Box Display
                            hotspotsOverlayHtml += `
                                <div class="hotspot-input-wrap" style="left: ${hs.x}%; top: ${hs.y}%;">
                                    <input type="text" class="tute-answer-input" data-q-idx="${qIndex}" data-ans-id="${hs.tagId}" placeholder="${escapeHtml(customText)}" autocomplete="off" spellcheck="false" title="Hotspot ${hs.tagId}">
                                </div>
                            `;
                        }
                    });
                }

                const figHtml = `
                    <div class="tute-figure-box ${alignClass} ${sizeClass}" data-img-key="${key}">
                        <button class="fig-edit-overlay-btn" onclick="window.editQuestionImage('${key}', event)" title="Edit, crop, or add hotspots to this figure"><i class="fa-solid fa-pen-to-square"></i> Edit &amp; Hotspots</button>
                        <div style="position: relative; display: inline-block; max-width: 100%;">
                            <img src="${imgData.dataUrl}" alt="${escapeHtml(imgData.caption || 'Figure')}" class="tute-figure-img">
                            ${hotspotsOverlayHtml}
                        </div>
                        ${captionHtml}
                    </div>
                `;
                return createPlaceholder(figHtml, true);
            } else {
                // Placeholder fallback if image tag is present but image is missing/not uploaded yet
                const fallbackHtml = `
                    <div class="tute-figure-box align-center size-medium">
                        <div style="border: 2px dashed var(--line); padding: 1.5rem 2rem; border-radius: 8px; text-align: center; background: var(--surface-input); color: var(--text-muted);">
                            <i class="fa-solid fa-image" style="font-size: 1.8rem; margin-bottom: 0.4rem; color: var(--blue);"></i>
                            <div><strong>[Image Figure Tag: ${key}]</strong></div>
                            <small>Upload image via "Insert Figure" in toolbar</small>
                        </div>
                    </div>
                `;
                return createPlaceholder(fallbackHtml, true);
            }
        });

        // 4. Replace {{answerX}} tags with clean interactive <input> or <select> fields
        processed = processed.replace(/\{\{([a-zA-Z0-9_\-]+)\}\}/g, (fullMatch, tagId) => {
            const ansConfig = (answersMap && answersMap[tagId]) ? answersMap[tagId] : {};
            const isSelect = ansConfig.inputType === 'select' || (Array.isArray(ansConfig.options) && ansConfig.options.length > 0);
            if (isSelect) {
                const opts = (Array.isArray(ansConfig.options) && ansConfig.options.length) ? ansConfig.options : ['Yes', 'No'];
                const optionsHtml = `<option value="">Select option…</option>` + opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
                return `<span class="answer-box-container"><select class="tute-answer-input tute-answer-select" data-q-idx="${qIndex}" data-ans-id="${tagId}">${optionsHtml}</select><span class="ans-tag-label">${tagId}</span></span>`;
            }
            return `<span class="answer-box-container"><input type="text" class="tute-answer-input" data-q-idx="${qIndex}" data-ans-id="${tagId}" placeholder="${tagId}" autocomplete="off" spellcheck="false"><span class="ans-tag-label">${tagId}</span></span>`;
        });

        // 5. Protect remaining display math blocks \[ ... \] and $$ ... $$
        processed = processed.replace(/(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$)/g, (mathMatch) => {
            return createPlaceholder(mathMatch, true);
        });

        // 6. Convert double line breaks into paragraphs for normal text blocks
        processed = processed.split(/\n\s*\n/).map(p => {
            const trimmed = p.trim();
            if (!trimmed) return '';
            return `<p style="margin-bottom: 0.8rem;">${trimmed.replace(/\n/g, '<br>')}</p>`;
        }).filter(p => p.length > 0).join('');

        // 7. Restore SVG Diagrams, Math blocks, & Image figures seamlessly
        placeholders.forEach(item => {
            const paragraphWrapper = `<p style="margin-bottom: 0.8rem;">${item.token}</p>`;
            if (processed.includes(paragraphWrapper)) {
                processed = processed.replace(paragraphWrapper, item.content);
            } else {
                processed = processed.replaceAll(item.token, item.content);
            }
        });

        return processed;
    }

    // ----------------------------------------------------------------------
    // TikZ Engine: Parser & Convert TikZ LaTeX commands to SVG graphics
    // ----------------------------------------------------------------------
    function parseTikzToSvg(tikzCode) {
        // Extract optional scale option: \begin{tikzpicture}[scale=1.5]
        let scaleFactor = 1;
        const scaleOptionMatch = tikzCode.match(/\[\s*scale\s*=\s*([0-9.]+)\s*\]/);
        if (scaleOptionMatch) {
            scaleFactor = parseFloat(scaleOptionMatch[1]) || 1;
        }

        // Base coordinate transformation
        const baseScale = 32 * scaleFactor;
        
        // First pass: collect all coordinates to calculate dynamic bounding box
        let points = [];
        const rawLines = tikzCode.split('\n').map(l => l.replace(/%.*$/, '').trim()).filter(l => l.length > 0);

        rawLines.forEach(line => {
            const coordMatches = [...line.matchAll(/\(([-0-9.]+)\s*,\s*([-0-9.]+)\)/g)];
            coordMatches.forEach(m => {
                points.push({ x: parseFloat(m[1]), y: parseFloat(m[2]) });
            });
        });

        let minX = points.length ? Math.min(...points.map(p => p.x)) : -3;
        let maxX = points.length ? Math.max(...points.map(p => p.x)) : 3;
        let minY = points.length ? Math.min(...points.map(p => p.y)) : -2;
        let maxY = points.length ? Math.max(...points.map(p => p.y)) : 3;

        // Add padding around diagram bounds
        minX -= 1; maxX += 1; minY -= 1; maxY += 1;

        const svgWidth = Math.max(260, Math.min(600, (maxX - minX) * baseScale));
        const svgHeight = Math.max(180, Math.min(500, (maxY - minY) * baseScale));

        function mapX(x) { return ((parseFloat(x) - minX) * baseScale); }
        function mapY(y) { return svgHeight - ((parseFloat(y) - minY) * baseScale); }

        let svgElements = [];

        rawLines.forEach(line => {
            // Match multi-segment path: \draw (0,0) -- (6,0) -- (3,4) -- cycle;
            const polyMatch = line.match(/\\draw(?:\[[^\]]*\])?\s*(\([^(]+\)(?:\s*--\s*\([^(]+\))+)/);
            if (polyMatch) {
                const isCycle = line.includes('cycle');
                const rawCoords = [...polyMatch[1].matchAll(/\(([-0-9.]+)\s*,\s*([-0-9.]+)\)/g)];
                const svgPts = rawCoords.map(m => `${mapX(m[1])},${mapY(m[2])}`).join(' ');

                if (isCycle) {
                    svgElements.push(`<polygon points="${svgPts}" fill="rgba(99, 102, 241, 0.12)" stroke="#6366f1" stroke-width="2.5" stroke-linejoin="round"/>`);
                } else {
                    svgElements.push(`<polyline points="${svgPts}" fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`);
                }
                return;
            }

            // Match \draw (-4,-3) rectangle (4,3);
            const rectMatch = line.match(/\\draw(?:\[[^\]]*\])?\s*\(([^,]+),([^)]+)\)\s*rectangle\s*\(([^,]+),([^)]+)\)/);
            if (rectMatch) {
                const x1 = mapX(rectMatch[1]);
                const y1 = mapY(rectMatch[2]);
                const x2 = mapX(rectMatch[3]);
                const y2 = mapY(rectMatch[4]);
                
                const rx = Math.min(x1, x2);
                const ry = Math.min(y1, y2);
                const rw = Math.abs(x2 - x1);
                const rh = Math.abs(y2 - y1);

                svgElements.push(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="none" stroke="var(--ink)" stroke-width="2" rx="6" opacity="0.8"/>`);
                return;
            }

            // Match \draw (-0.8,0) circle (2);
            const circleMatch = line.match(/\\draw(?:\[[^\]]*\])?\s*\(([^,]+),([^)]+)\)\s*circle\s*\(([^)]+)\)/);
            if (circleMatch) {
                const cx = mapX(circleMatch[1]);
                const cy = mapY(circleMatch[2]);
                const r = parseFloat(circleMatch[3]) * baseScale;

                svgElements.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(99, 102, 241, 0.12)" stroke="#6366f1" stroke-width="2.2"/>`);
                return;
            }

            // Match \node[options] at (x,y) {$Text$}; or \node at (x,y) {Text};
            const nodeMatch = line.match(/\\node(?:\[([^\]]*)\])?\s+at\s*\(([^,]+),([^)]+)\)\s*\{([\s\S]*?)\};?/);
            if (nodeMatch) {
                const options = nodeMatch[1] || '';
                let nx = mapX(nodeMatch[2]);
                let ny = mapY(nodeMatch[3]);
                let rawText = nodeMatch[4].trim();

                // Handle node position options like [below], [above], [left], [right]
                if (options.includes('below')) ny += 14;
                else if (options.includes('above')) ny -= 14;
                if (options.includes('left')) nx -= 12;
                else if (options.includes('right')) nx += 12;

                // Format math text inside node: strip $...$ and convert \text{cm} -> cm
                let cleanText = rawText.replace(/^\$(.*)\$$/, '$1').replace(/\\text\{([^}]+)\}/g, '$1');

                svgElements.push(`<text x="${nx}" y="${ny}" fill="var(--ink)" font-weight="bold" font-size="14" text-anchor="middle" dominant-baseline="middle">${escapeHtml(cleanText)}</text>`);
                return;
            }
        });

        return `
        <div class="diagram-visual-box">
            <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="max-width:100%; font-family: Inter, sans-serif;">
                ${svgElements.join('\n')}
            </svg>
        </div>`;
    }

    // ----------------------------------------------------------------------
    // 3. SVG Diagram Renderer Engine
    // ----------------------------------------------------------------------
    function generateDiagramSvg(type, paramsStr) {
        if (type === 'venn') {
            // Render Set Venn Diagram SVG
            return `
            <div class="diagram-visual-box">
                <svg width="340" height="200" viewBox="0 0 340 200" style="max-width:100%; font-family: Inter, sans-serif;">
                    <rect width="340" height="200" fill="none" stroke="var(--ink)" stroke-width="2" rx="8" opacity="0.6"/>
                    <text x="15" y="25" fill="var(--ink)" font-weight="bold" font-size="14">Universal Set ξ</text>
                    
                    <!-- Set A Circle -->
                    <circle cx="120" cy="110" r="65" fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" stroke-width="2.5" />
                    <text x="80" y="70" fill="#6366f1" font-weight="bold" font-size="16">Set A</text>
                    <text x="95" y="115" fill="var(--ink)" font-weight="bold" font-size="15">7</text>

                    <!-- Set B Circle -->
                    <circle cx="220" cy="110" r="65" fill="rgba(6, 182, 212, 0.2)" stroke="#06b6d4" stroke-width="2.5" />
                    <text x="240" y="70" fill="#06b6d4" font-weight="bold" font-size="16">Set B</text>
                    <text x="235" y="115" fill="var(--ink)" font-weight="bold" font-size="15">5</text>

                    <!-- Intersection Label -->
                    <text x="165" y="115" fill="#f59e0b" font-weight="bold" font-size="15" text-anchor="middle">5</text>
                    
                    <!-- Outside Circle Label -->
                    <text x="310" y="180" fill="var(--ink)" font-size="13">3</text>
                </svg>
            </div>`;
        }

        if (type === 'geometry') {
            // Render Right-Angled Triangle SVG
            return `
            <div class="diagram-visual-box">
                <svg width="300" height="200" viewBox="0 0 300 200" style="max-width:100%; font-family: Inter, sans-serif;">
                    <!-- Triangle vertices A(40,160), B(40,40), C(240,160) -->
                    <polygon points="40,160 40,40 240,160" fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" stroke-width="3" stroke-linejoin="round"/>
                    
                    <!-- Right angle box at A -->
                    <rect x="40" y="140" width="20" height="20" fill="none" stroke="#f59e0b" stroke-width="2"/>
                    
                    <!-- Vertex Labels -->
                    <text x="22" y="178" fill="var(--ink)" font-weight="bold" font-size="15">A</text>
                    <text x="22" y="38" fill="var(--ink)" font-weight="bold" font-size="15">B</text>
                    <text x="250" y="178" fill="var(--ink)" font-weight="bold" font-size="15">C</text>
                    
                    <!-- Side Dimension Labels -->
                    <text x="5" y="105" fill="#2563eb" font-weight="bold" font-size="14">6 cm</text>
                    <text x="130" y="186" fill="#2563eb" font-weight="bold" font-size="14">8 cm</text>
                    <text x="150" y="90" fill="#f43f5e" font-weight="bold" font-size="14">AC = ?</text>
                    
                    <!-- Angle Arc at C -->
                    <path d="M 200,160 A 40,40 0 0,0 215,145" fill="none" stroke="#10b981" stroke-width="2.5"/>
                    <text x="185" y="152" fill="#10b981" font-weight="bold" font-size="13">θ</text>
                </svg>
            </div>`;
        }

        if (type === 'graph') {
            // Render Cartesian Grid Parabola Graph
            return `
            <div class="diagram-visual-box">
                <svg width="320" height="220" viewBox="0 0 320 220" style="max-width:100%; font-family: Inter, sans-serif;">
                    <!-- Grid background -->
                    <defs>
                        <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--ink)" stroke-width="1" opacity="0.12"/>
                        </pattern>
                    </defs>
                    <rect width="320" height="220" fill="url(#gridPattern)"/>

                    <!-- X and Y Axes -->
                    <line x1="20" y1="170" x2="300" y2="170" stroke="var(--ink)" stroke-width="2"/>
                    <line x1="60" y1="20" x2="60" y2="200" stroke="var(--ink)" stroke-width="2"/>

                    <text x="295" y="162" fill="var(--ink)" font-weight="bold" font-size="13">X</text>
                    <text x="68" y="30" fill="var(--ink)" font-weight="bold" font-size="13">Y</text>

                    <!-- Quadratic Parabola Curve y = (x-2)^2 - 1 -->
                    <path d="M 40,30 Q 140,230 240,30" fill="none" stroke="#06b6d4" stroke-width="3"/>

                    <!-- Roots dots -->
                    <circle cx="90" cy="170" r="5" fill="#f43f5e"/>
                    <text x="82" y="190" fill="#f43f5e" font-weight="bold" font-size="12">x=2</text>

                    <circle cx="190" cy="170" r="5" fill="#f43f5e"/>
                    <text x="182" y="190" fill="#f43f5e" font-weight="bold" font-size="12">x=3</text>
                </svg>
            </div>`;
        }

        if (type === 'circle') {
            // Render Geometric Circle Arc & Radius SVG
            return `
            <div class="diagram-visual-box">
                <svg width="260" height="220" viewBox="0 0 260 220" style="max-width:100%; font-family: Inter, sans-serif;">
                    <!-- Outer Circle -->
                    <circle cx="130" cy="110" r="80" fill="rgba(99, 102, 241, 0.08)" stroke="#6366f1" stroke-width="2.5" />
                    <!-- Center Point O -->
                    <circle cx="130" cy="110" r="4" fill="#f43f5e" />
                    <text x="138" y="115" fill="var(--ink)" font-weight="bold" font-size="14">O</text>
                    
                    <!-- Radius Line to P(210, 110) -->
                    <line x1="130" y1="110" x2="210" y2="110" stroke="#06b6d4" stroke-width="2.5" />
                    <text x="165" y="102" fill="#06b6d4" font-weight="bold" font-size="13">r = 7 cm</text>
                    <circle cx="210" cy="110" r="4" fill="#06b6d4" />
                    <text x="216" y="115" fill="var(--ink)" font-weight="bold" font-size="13">P</text>

                    <!-- Angle Sector Arc to Q(186, 54) -->
                    <line x1="130" y1="110" x2="186.5" y2="53.5" stroke="#10b981" stroke-width="2.5" />
                    <path d="M 160,110 A 30,30 0 0,0 151.2,81.7" fill="none" stroke="#f59e0b" stroke-width="2" />
                    <text x="165" y="75" fill="#f59e0b" font-weight="bold" font-size="13">θ = 45°</text>
                </svg>
            </div>`;
        }

        if (type === 'axes') {
            // Render 2D Coordinate Grid with Vectors & Lines
            return `
            <div class="diagram-visual-box">
                <svg width="300" height="200" viewBox="0 0 300 200" style="max-width:100%; font-family: Inter, sans-serif;">
                    <!-- X and Y Axes -->
                    <line x1="20" y1="150" x2="280" y2="150" stroke="var(--ink)" stroke-width="2" />
                    <line x1="150" y1="20" x2="150" y2="190" stroke="var(--ink)" stroke-width="2" />
                    
                    <!-- Axis Arrows & Labels -->
                    <polygon points="280,150 272,146 272,154" fill="var(--ink)" />
                    <polygon points="150,20 146,28 154,28" fill="var(--ink)" />
                    <text x="275" y="142" fill="var(--ink)" font-weight="bold" font-size="13">X</text>
                    <text x="158" y="25" fill="var(--ink)" font-weight="bold" font-size="13">Y</text>
                    <text x="136" y="166" fill="var(--ink)" font-weight="bold" font-size="12">O</text>

                    <!-- Linear Vector Line y = mx + c -->
                    <line x1="50" y1="180" x2="250" y2="60" stroke="#6366f1" stroke-width="3" />
                    <circle cx="150" cy="120" r="4" fill="#f43f5e" />
                    <text x="160" y="125" fill="#f43f5e" font-weight="bold" font-size="12">(0, c)</text>
                    <text x="180" y="70" fill="#6366f1" font-weight="bold" font-size="13">y = mx + c</text>
                </svg>
            </div>`;
        }

        if (type === 'barchart') {
            // Render Vector Bar Chart / Histogram SVG
            return `
            <div class="diagram-visual-box">
                <svg width="320" height="200" viewBox="0 0 320 200" style="max-width:100%; font-family: Inter, sans-serif;">
                    <!-- Base line -->
                    <line x1="30" y1="160" x2="290" y2="160" stroke="var(--ink)" stroke-width="2"/>
                    <line x1="40" y1="20" x2="40" y2="160" stroke="var(--ink)" stroke-width="2"/>

                    <!-- Bars -->
                    <rect x="60" y="70" width="35" height="90" fill="#6366f1" rx="4"/>
                    <text x="70" y="62" fill="var(--ink)" font-weight="bold" font-size="12">15</text>
                    <text x="70" y="178" fill="var(--ink)" font-size="12">Q1</text>

                    <rect x="115" y="40" width="35" height="120" fill="#06b6d4" rx="4"/>
                    <text x="125" y="32" fill="var(--ink)" font-weight="bold" font-size="12">25</text>
                    <text x="125" y="178" fill="var(--ink)" font-size="12">Q2</text>

                    <rect x="170" y="90" width="35" height="70" fill="#10b981" rx="4"/>
                    <text x="180" y="82" fill="var(--ink)" font-weight="bold" font-size="12">10</text>
                    <text x="180" y="178" fill="var(--ink)" font-size="12">Q3</text>

                    <rect x="225" y="55" width="35" height="105" fill="#f59e0b" rx="4"/>
                    <text x="235" y="47" fill="var(--ink)" font-weight="bold" font-size="12">20</text>
                    <text x="235" y="178" fill="var(--ink)" font-size="12">Q4</text>
                </svg>
            </div>`;
        }

        if (type === 'table') {
            // Render Styled Data Table
            const rows = paramsStr.split(',').map(r => r.trim());
            let tableHtml = `<div class="diagram-visual-box"><table style="border-collapse: collapse; width: 90%; text-align: center; font-size: 0.9rem;">`;
            rows.forEach((row, i) => {
                const cells = row.split(':');
                const label = cells[0] ? cells[0].trim() : '';
                const vals = cells[1] ? cells[1].split('|').map(v => v.trim()) : [];

                tableHtml += `<tr style="${i === 0 ? 'border-bottom: 2px solid var(--accent-indigo); font-weight: bold;' : 'border-bottom: 1px solid var(--border-subtle);'}">`;
                tableHtml += `<td style="padding: 0.5rem; background: rgba(99,102,241,0.15); font-weight: bold; width: 60px;">${label}</td>`;
                vals.forEach(val => {
                    tableHtml += `<td style="padding: 0.5rem; border-left: 1px solid var(--border-subtle);">${val}</td>`;
                });
                tableHtml += `</tr>`;
            });
            tableHtml += `</table></div>`;
            return tableHtml;
        }

        return `<div class="diagram-visual-box">[Diagram: ${type}]</div>`;
    }

    // Helper: Calculate total marks for tute
    function calculateTotalMarks() {
        const total = tuteData.questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);
        paperTotalMarks.textContent = `${total} Marks`;
    }

    // ----------------------------------------------------------------------
    // 4. Input & Toolbar Event Handlers
    // ----------------------------------------------------------------------

    // Tute Meta Updates
    tuteTitleInput.oninput = (e) => {
        tuteData.title = e.target.value;
        paperTuteTitle.textContent = e.target.value || "Untitled Tute";
    };
    tuteGradeSelect.onchange = (e) => {
        tuteData.grade = e.target.value;
        paperMetaTerm.textContent = `${tuteData.term} • ${tuteData.grade} • ${tuteData.subject}`;
    };
    tuteTermSelect.onchange = (e) => {
        tuteData.term = e.target.value;
        paperMetaTerm.textContent = `${tuteData.term} • ${tuteData.grade} • ${tuteData.subject}`;
    };
    tuteSubjectSelect.onchange = (e) => {
        tuteData.subject = e.target.value;
        paperMetaTerm.textContent = `${tuteData.term} • ${tuteData.grade} • ${tuteData.subject}`;
    };

    // Active Question Meta Updates
    activeQTitleInput.oninput = (e) => {
        if (tuteData.questions[activeQuestionIndex]) {
            tuteData.questions[activeQuestionIndex].title = e.target.value;
            renderQuestionPills();
            renderPaperPreview();
        }
    };
    activeQMarksInput.oninput = (e) => {
        if (tuteData.questions[activeQuestionIndex]) {
            tuteData.questions[activeQuestionIndex].marks = parseInt(e.target.value) || 0;
            calculateTotalMarks();
            renderPaperPreview();
        }
    };

    // LaTeX Code Editor Input
    latexEditor.oninput = (e) => {
        const q = tuteData.questions[activeQuestionIndex];
        if (!q) return;

        q.latex = e.target.value;
        charCountSpan.textContent = `${q.latex.length} chars`;

        syncAnswersConfig();
        renderQuestionPills();
        renderPaperPreview();
    };

    // Toolbar Snippets Insertion
    document.querySelectorAll('.tb-btn').forEach(btn => {
        btn.onclick = () => {
            const snippet = btn.getAttribute('data-snippet');
            const diagramType = btn.getAttribute('data-diagram');
            
            if (btn.id === 'tbInsertAnswer') {
                // Find next available answer number
                const q = tuteData.questions[activeQuestionIndex];
                const existingTags = (q.latex.match(/\{\{([a-zA-Z0-9_\-]+)\}\}/g) || []);
                const nextNum = existingTags.length + 1;
                insertSnippetAtCursor(`{{answer${nextNum}}}`);
            } else if (diagramType) {
                if (diagramType === 'tikz') {
                    insertSnippetAtCursor(`\\begin{tikzpicture}
    % Universal set
    \\draw (-4,-3) rectangle (4,3);
    \\node at (-3.6,2.6) {$U$};

    % Set A
    \\draw (-0.8,0) circle (2);
    \\node at (-1.8,1.4) {$A$};

    % Set B
    \\draw (0.8,0) circle (2);
    \\node at (1.8,1.4) {$B$};

    % Elements
    \\node at (-1.8,0) {6};
    \\node at (0,0) {2};
    \\node at (1.8,0) {1};
    \\node at (-3, -1.8) {9};
\\end{tikzpicture}`);
                } else if (diagramType === 'venn') {
                    insertSnippetAtCursor(`\\diagram{venn, setA: 12, setB: 10, intersect: 5, outside: 3}`);
                } else if (diagramType === 'geometry') {
                    insertSnippetAtCursor(`\\diagram{geometry, a: 6, b: 8, angle: 90}`);
                } else if (diagramType === 'circle') {
                    insertSnippetAtCursor(`\\diagram{circle, radius: 7, angle: 45}`);
                } else if (diagramType === 'graph') {
                    insertSnippetAtCursor(`\\diagram{graph, f(x): x^2 - 5x + 6}`);
                } else if (diagramType === 'axes') {
                    insertSnippetAtCursor(`\\diagram{axes, line: y = mx + c}`);
                } else if (diagramType === 'barchart') {
                    insertSnippetAtCursor(`\\diagram{barchart, q1: 15, q2: 25, q3: 10, q4: 20}`);
                } else if (diagramType === 'table') {
                    insertSnippetAtCursor(`\\diagram{table, x: 0 | 1 | 2 | 3, y: 0 | 2 | {{answer1}} | 8}`);
                }
            } else if (snippet) {
                insertSnippetAtCursor(snippet);
            }
        };
    });

    function insertSnippetAtCursor(text) {
        const start = latexEditor.selectionStart;
        const end = latexEditor.selectionEnd;
        const val = latexEditor.value;

        latexEditor.value = val.substring(0, start) + text + val.substring(end);
        latexEditor.focus();
        latexEditor.selectionStart = latexEditor.selectionEnd = start + text.length;

        // Trigger input update
        latexEditor.dispatchEvent(new Event('input'));
    }

    // Add Question
    btnAddQuestion.onclick = () => {
        const newNum = tuteData.questions.length + 1;
        const newQ = {
            id: `q${Date.now()}`,
            title: `New Question ${newNum}`,
            marks: 10,
            latex: `Write question text here...\nFind the value of $x$: {{answer1}}`,
            answers: {
                "answer1": { correctAnswer: "", solution: "", marks: 5 }
            }
        };
        tuteData.questions.push(newQ);
        activeQuestionIndex = tuteData.questions.length - 1;
        renderApp();
    };

    // Delete Question
    btnDeleteQuestion.onclick = () => {
        if (tuteData.questions.length <= 1) {
            alert("Tute must contain at least one question!");
            return;
        }
        if (confirm(`Are you sure you want to delete Question ${activeQuestionIndex + 1}?`)) {
            tuteData.questions.splice(activeQuestionIndex, 1);
            activeQuestionIndex = Math.max(0, activeQuestionIndex - 1);
            renderApp();
        }
    };

    // Duplicate Question
    btnDuplicateQuestion.onclick = () => {
        const currentQ = tuteData.questions[activeQuestionIndex];
        const copyQ = JSON.parse(JSON.stringify(currentQ));
        copyQ.id = `q${Date.now()}`;
        copyQ.title = `${copyQ.title} (Copy)`;
        tuteData.questions.splice(activeQuestionIndex + 1, 0, copyQ);
        activeQuestionIndex = activeQuestionIndex + 1;
        renderApp();
    };

    // Toggle Answer Key Section Collapse
    toggleAnswerKeyHeader.onclick = () => {
        answerKeySection.classList.toggle('collapsed');
    };

    // ----------------------------------------------------------------------
    // 5. View Modes & Split Pane Resizer
    // ----------------------------------------------------------------------
    if (viewModeSelect) {
        viewModeSelect.onchange = (e) => {
            const selectedVal = e.target.value;
            if (selectedVal === 'student') {
                isStudentMode = true;
                setViewMode('preview');
                studentTestBanner.style.display = 'flex';
                sheetModeTag.textContent = "Interactive Student Test";
            } else {
                isStudentMode = false;
                setViewMode(selectedVal);
                sheetModeTag.textContent = "Authoring Mode";
            }
        };
    }

    function setViewMode(mode) {
        if (viewModeSelect) viewModeSelect.value = isStudentMode ? 'student' : mode;

        if (mode === 'split') {
            editorPane.style.display = 'flex';
            editorPane.style.width = '50%';
            previewPane.style.display = 'flex';
            previewPane.style.width = '50%';
            paneResizer.style.display = 'flex';
            if (!isStudentMode) studentTestBanner.style.display = 'none';
        } else if (mode === 'editor') {
            editorPane.style.display = 'flex';
            editorPane.style.width = '100%';
            previewPane.style.display = 'none';
            paneResizer.style.display = 'none';
            if (!isStudentMode) studentTestBanner.style.display = 'none';
        } else if (mode === 'preview') {
            editorPane.style.display = 'none';
            previewPane.style.display = 'flex';
            previewPane.style.width = '100%';
            paneResizer.style.display = 'none';
            if (!isStudentMode) studentTestBanner.style.display = 'none';
        }
    }

    function toggleStudentTestMode() {
        isStudentMode = !isStudentMode;
        if (isStudentMode) {
            setViewMode('preview');
            studentTestBanner.style.display = 'flex';
            sheetModeTag.textContent = "Interactive Student Test";
        } else {
            setViewMode('split');
            sheetModeTag.textContent = "Authoring Mode";
        }
    }

    // Toggle Solution Sheet Preview
    btnToggleSolutionPreview.onclick = () => {
        isSolutionPreviewVisible = !isSolutionPreviewVisible;
        paperSolutionsContainer.style.display = isSolutionPreviewVisible ? 'block' : 'none';
        btnToggleSolutionPreview.innerHTML = isSolutionPreviewVisible ? 
            `<i class="fa-solid fa-eye-slash"></i> Hide Solutions` : 
            `<i class="fa-solid fa-eye"></i> Show Solutions`;
        renderPaperPreview();
    };

    // Toggle Paper Theme (Dark vs Printable Light)
    btnPreviewTheme.onclick = () => {
        isPaperLight = !isPaperLight;
        if (isPaperLight) {
            tutePaper.classList.remove('paper-dark');
            tutePaper.classList.add('paper-light');
        } else {
            tutePaper.classList.remove('paper-light');
            tutePaper.classList.add('paper-dark');
        }
    };

    // Drag Resizer Implementation
    let isDraggingResizer = false;

    paneResizer.onmousedown = (e) => {
        isDraggingResizer = true;
        paneResizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
    };

    document.onmousemove = (e) => {
        if (!isDraggingResizer) return;
        const containerWidth = workspace.clientWidth;
        const newLeftWidth = (e.clientX / containerWidth) * 100;

        if (newLeftWidth > 20 && newLeftWidth < 80) {
            editorPane.style.width = `${newLeftWidth}%`;
            previewPane.style.width = `${100 - newLeftWidth}%`;
        }
    };

    document.onmouseup = () => {
        if (isDraggingResizer) {
            isDraggingResizer = false;
            paneResizer.classList.remove('resizing');
            document.body.style.cursor = 'default';
        }
    };

    // ----------------------------------------------------------------------
    // 6. Interactive Student Evaluation & Score System
    // ----------------------------------------------------------------------
    btnSubmitStudentAnswers.onclick = evaluateStudentAnswers;

    function evaluateStudentAnswers() {
        let totalQuestionMarks = 0;
        let earnedMarks = 0;
        let totalAnswerBoxes = 0;
        let correctCount = 0;
        const breakdownItems = [];

        tuteData.questions.forEach((q, qIdx) => {
            if (!q.answers) return;
            
            Object.keys(q.answers).forEach(tagId => {
                totalAnswerBoxes++;
                const expected = (q.answers[tagId].correctAnswer || "").trim().toLowerCase();
                const allocated = parseInt(q.answers[tagId].marks) || 2;
                totalQuestionMarks += allocated;

                // Find rendered input field
                const inputEl = document.querySelector(`.tute-answer-input[data-q-idx="${qIdx}"][data-ans-id="${tagId}"]`);
                const userVal = inputEl ? inputEl.value.trim().toLowerCase() : "";

                const isCorrect = checkAnswerMatch(userVal, expected);
                
                if (inputEl) {
                    inputEl.classList.remove('status-correct', 'status-incorrect');
                    if (isCorrect) {
                        inputEl.classList.add('status-correct');
                    } else {
                        inputEl.classList.add('status-incorrect');
                    }
                }

                if (isCorrect) {
                    earnedMarks += allocated;
                    correctCount++;
                }

                breakdownItems.push({
                    qTitle: `Q${qIdx + 1} (${tagId})`,
                    userVal: userVal || "(Empty)",
                    expected: expected,
                    isCorrect: isCorrect,
                    marks: allocated
                });
            });
        });

        const pct = totalQuestionMarks > 0 ? Math.round((earnedMarks / totalQuestionMarks) * 100) : 0;
        
        // Update Score Modal UI
        scorePercent.textContent = `${pct}%`;
        scoreFraction.textContent = `${earnedMarks} / ${totalQuestionMarks} Marks`;
        scoreCirclePath.setAttribute('stroke-dasharray', `${pct}, 100`);

        if (pct >= 80) {
            scoreFeedbackText.innerHTML = `🌟 <strong>Outstanding!</strong> You've mastered this tute!`;
        } else if (pct >= 50) {
            scoreFeedbackText.innerHTML = `👍 <strong>Good job!</strong> Review the incorrect answers below to improve.`;
        } else {
            scoreFeedbackText.innerHTML = `💪 <strong>Keep practicing!</strong> Click "Review Worked Solutions" to learn step-by-step.`;
        }

        // Render Breakdown items
        scoreBreakdownList.innerHTML = breakdownItems.map(item => `
            <div class="breakdown-item" style="border-left: 3px solid ${item.isCorrect ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">
                <div>
                    <strong>${escapeHtml(item.qTitle)}</strong>: ${escapeHtml(item.userVal)}
                    ${!item.isCorrect ? `<small style="color: var(--text-muted);"> (Expected: ${escapeHtml(item.expected)})</small>` : ''}
                </div>
                <span class="badge ${item.isCorrect ? 'version-badge' : 'btn-danger'}">
                    ${item.isCorrect ? `+${item.marks} Marks` : `0 Marks`}
                </span>
            </div>
        `).join('');

        scoreModalOverlay.style.display = 'flex';
    }

    // Smart Answer Matcher (handles numbers, decimals, fractions like 3/5 = 0.6)
    function checkAnswerMatch(userVal, expected) {
        if (!userVal && !expected) return true;
        if (!userVal) return false;
        if (userVal === expected) return true;

        // Try numeric conversion
        const numUser = parseFloat(userVal);
        const numExp = parseFloat(expected);
        if (!isNaN(numUser) && !isNaN(numExp) && Math.abs(numUser - numExp) < 0.01) {
            return true;
        }

        // Try fraction conversion e.g. "3/5" -> 0.6
        if (userVal.includes('/')) {
            const parts = userVal.split('/');
            if (parts.length === 2) {
                const val = parseFloat(parts[0]) / parseFloat(parts[1]);
                if (!isNaN(val) && !isNaN(numExp) && Math.abs(val - numExp) < 0.01) return true;
            }
        }

        return false;
    }

    // Modal Action Buttons
    btnCloseScoreModal.onclick = () => scoreModalOverlay.style.display = 'none';
    btnModalClose.onclick = () => scoreModalOverlay.style.display = 'none';
    btnModalReviewSolutions.onclick = () => {
        scoreModalOverlay.style.display = 'none';
        isSolutionPreviewVisible = true;
        paperSolutionsContainer.style.display = 'block';
        paperSolutionsContainer.scrollIntoView({ behavior: 'smooth' });
    };

    // ----------------------------------------------------------------------
    // 7. Database & JSON Export/Import Engine
    // ----------------------------------------------------------------------
    const btnSaveDb = document.getElementById('btnSaveDb');

    if (btnSaveDb) {
        btnSaveDb.onclick = async () => {
            const originalText = btnSaveDb.innerHTML;
            btnSaveDb.disabled = true;
            btnSaveDb.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

            try {
                // Calculate total marks across all questions
                calculateTotalMarks();

                const endpoint = tuteData._id ? `/api/tutes/${tuteData._id}` : '/api/tutes';
                const method = tuteData._id ? 'PUT' : 'POST';

                const response = await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tuteData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    tuteData._id = result.data._id;
                    // Keep the editor URL tied to this worksheet so refresh/edit stays on it
                    const url = new URL(window.location.href);
                    if (url.searchParams.get('id') !== String(tuteData._id)) {
                        url.searchParams.set('id', tuteData._id);
                        window.history.replaceState({}, '', url);
                    }
                    btnSaveDb.innerHTML = `<i class="fa-solid fa-check"></i> Saved!`;
                    setTimeout(() => {
                        btnSaveDb.disabled = false;
                        btnSaveDb.innerHTML = originalText;
                    }, 2000);
                } else {
                    throw new Error(result.error || 'Failed to save worksheet');
                }
            } catch (err) {
                console.error('Error saving Tute to DB:', err);
                alert(`Error saving to database: ${err.message}\n(Ensure server API endpoint /api/tutes is running)`);
                btnSaveDb.disabled = false;
                btnSaveDb.innerHTML = originalText;
            }
        };
    }

    btnExportJson.onclick = () => {
        const jsonStr = JSON.stringify(tuteData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tuteData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tute.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    btnImportJson.onclick = () => importFileInput.click();
    importFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.title && Array.isArray(data.questions)) {
                    tuteData = data;
                    activeQuestionIndex = 0;
                    renderApp();
                    alert("Tute successfully imported!");
                } else {
                    alert("Invalid SmartTute JSON file format.");
                }
            } catch (err) {
                alert("Error reading JSON file: " + err.message);
            }
        };
        reader.readAsText(file);
    };

    // Print Handler
    btnPrintTute.onclick = () => {
        window.print();
    };

    // ----------------------------------------------------------------------
    // Image Upload & Interactive Cropper Modal Event Handlers
    // ----------------------------------------------------------------------
    const tbInsertImage = document.getElementById('tbInsertImage');
    const imageModalOverlay = document.getElementById('imageModalOverlay');
    const btnCloseImageModal = document.getElementById('btnCloseImageModal');
    const btnCancelImageModal = document.getElementById('btnCancelImageModal');
    const btnConfirmImageModal = document.getElementById('btnConfirmImageModal');
    const imgModalTitle = document.getElementById('imgModalTitle');
    const btnConfirmImgText = document.getElementById('btnConfirmImgText');

    const imgDropZone = document.getElementById('imgDropZone');
    const imgDropInner = document.getElementById('imgDropInner');
    const imgFileInput = document.getElementById('imgFileInput');
    const imgPreviewWrap = document.getElementById('imgPreviewWrap');
    const imgPreviewEl = document.getElementById('imgPreviewEl');
    const btnImgRemove = document.getElementById('btnImgRemove');

    const btnApplyCrop = document.getElementById('btnApplyCrop');
    const btnRotateLeft = document.getElementById('btnRotateLeft');
    const btnRotateRight = document.getElementById('btnRotateRight');
    const btnResetCrop = document.getElementById('btnResetCrop');

    const imgCaptionInput = document.getElementById('imgCaptionInput');
    const imgWidthSelect = document.getElementById('imgWidthSelect');
    const imgAlignSelect = document.getElementById('imgAlignSelect');

    const btnModeCrop = document.getElementById('btnModeCrop');
    const btnModeHotspot = document.getElementById('btnModeHotspot');
    const cropToolsGroup = document.getElementById('cropToolsGroup');
    const hotspotManagerSection = document.getElementById('hotspotManagerSection');
    const hotspotsList = document.getElementById('hotspotsList');
    const hotspotCountBadge = document.getElementById('hotspotCountBadge');

    let currentImageDataUrl = null;
    let originalImageDataUrl = null;
    let cropperInstance = null;
    let editingImageKey = null; // Stores target image key when editing existing figure
    let currentHotspots = []; // Local state array for image hotspots
    let activeModalMode = 'crop'; // 'crop' or 'hotspot'

    function setModalMode(mode) {
        activeModalMode = mode;
        if (mode === 'crop') {
            btnModeCrop.classList.add('active');
            btnModeHotspot.classList.remove('active');
            if (cropToolsGroup) cropToolsGroup.style.display = 'flex';
            if (hotspotManagerSection) hotspotManagerSection.style.display = currentHotspots.length > 0 ? 'block' : 'none';
            initCropper();
        } else {
            btnModeHotspot.classList.add('active');
            btnModeCrop.classList.remove('active');
            if (cropToolsGroup) cropToolsGroup.style.display = 'none';
            if (hotspotManagerSection) hotspotManagerSection.style.display = 'block';
            
            // In Hotspot mode, destroy Cropper to enable direct clicking on image
            destroyCropper();
            setupHotspotClickOverlay();
        }
    }

    if (btnModeCrop) btnModeCrop.onclick = () => setModalMode('crop');
    if (btnModeHotspot) btnModeHotspot.onclick = () => setModalMode('hotspot');

    function renderHotspotsList() {
        if (!hotspotsList || !hotspotCountBadge) return;
        hotspotCountBadge.textContent = currentHotspots.length;
        hotspotsList.innerHTML = '';

        if (currentHotspots.length === 0) {
            hotspotsList.innerHTML = `<p style="font-size: 0.78rem; color: var(--text-muted); text-align: center; margin: 0; padding: 0.4rem;">No hotspots added yet. Click on the image to pin a hotspot.</p>`;
            return;
        }

        currentHotspots.forEach((hs, idx) => {
            const card = document.createElement('div');
            card.className = 'hotspot-item-card';
            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span class="hs-tag"><i class="fa-solid fa-bullseye"></i> {{${hs.tagId}}}</span>
                    <span class="hs-coords">(${Math.round(hs.x)}%, ${Math.round(hs.y)}%)</span>
                </div>
                <button type="button" class="btn-sm btn-subtle" style="color:var(--accent-red);" title="Remove Hotspot"><i class="fa-solid fa-xmark"></i></button>
            `;

            card.querySelector('button').onclick = () => {
                currentHotspots.splice(idx, 1);
                renderHotspotsList();
                renderHotspotPinsOnModalImage();
            };

            hotspotsList.appendChild(card);
        });

        if (activeModalMode === 'hotspot' || currentHotspots.length > 0) {
            if (hotspotManagerSection) hotspotManagerSection.style.display = 'block';
        }
    }

    function setupHotspotClickOverlay() {
        if (!imgPreviewEl) return;
        renderHotspotPinsOnModalImage();

        imgPreviewEl.onclick = (e) => {
            if (activeModalMode !== 'hotspot') return;

            const rect = imgPreviewEl.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            const xPercent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
            const yPercent = Math.max(0, Math.min(100, (clickY / rect.height) * 100));

            // Generate next hotspot tag ID: hs1, hs2, etc.
            const hsIndex = currentHotspots.length + 1;
            const tagId = `hs_${editingImageKey || 'img'}_${hsIndex}`;

            currentHotspots.push({
                tagId: tagId,
                x: Math.round(xPercent * 10) / 10,
                y: Math.round(yPercent * 10) / 10,
                label: `Hotspot ${hsIndex}`
            });

            renderHotspotsList();
            renderHotspotPinsOnModalImage();
        };
    }

    function renderHotspotPinsOnModalImage() {
        // Clear existing modal pins on the image stage
        const stageBox = document.getElementById('modalImgStage');
        if (!stageBox) return;

        const existingPins = stageBox.querySelectorAll('.img-hotspot-pin');
        existingPins.forEach(p => p.remove());

        if (activeModalMode !== 'hotspot') return;

        currentHotspots.forEach((hs, idx) => {
            const pin = document.createElement('div');
            pin.className = 'img-hotspot-pin active-pin';
            pin.style.left = `${hs.x}%`;
            pin.style.top = `${hs.y}%`;
            pin.textContent = idx + 1;
            pin.title = `Hotspot {{${hs.tagId}}}`;
            stageBox.appendChild(pin);
        });
    }

    function destroyCropper() {
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
    }

    function initCropper() {
        destroyCropper();
        renderHotspotPinsOnModalImage();
        if (imgPreviewEl && window.Cropper && activeModalMode === 'crop') {
            cropperInstance = new window.Cropper(imgPreviewEl, {
                viewMode: 1,
                dragMode: 'crop',
                autoCropArea: 0.9,
                restore: false,
                guides: true,
                center: true,
                highlight: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblClick: false
            });
        }
    }

    function openImageModal(editKey = null) {
        destroyCropper();

        const q = tuteData.questions[activeQuestionIndex];
        const imagesMap = (q && q.images) ? q.images : {};

        // Resolve exact matching key or fallback to image_1/image
        let resolvedKey = editKey;
        if (resolvedKey && !imagesMap[resolvedKey]) {
            if (imagesMap['image_' + resolvedKey]) resolvedKey = 'image_' + resolvedKey;
            else if (imagesMap['image']) resolvedKey = 'image';
            else if (imagesMap['image_1']) resolvedKey = 'image_1';
            else resolvedKey = Object.keys(imagesMap)[0] || null;
        }

        editingImageKey = resolvedKey;
        activeModalMode = 'crop';

        if (resolvedKey && imagesMap[resolvedKey]) {
            // Edit Mode for existing figure
            const imgData = imagesMap[resolvedKey];
            currentImageDataUrl = imgData.dataUrl;
            originalImageDataUrl = imgData.originalDataUrl || imgData.dataUrl;
            currentHotspots = imgData.hotspots ? JSON.parse(JSON.stringify(imgData.hotspots)) : [];

            if (imgModalTitle) imgModalTitle.textContent = `Edit Image Figure (${resolvedKey})`;
            if (btnConfirmImgText) btnConfirmImgText.textContent = "Save Changes";
            
            if (imgCaptionInput) imgCaptionInput.value = imgData.caption || '';
            if (imgWidthSelect) imgWidthSelect.value = imgData.size || 'medium';
            if (imgAlignSelect) imgAlignSelect.value = imgData.align || 'center';

            if (imgDropInner) imgDropInner.style.display = 'none';
            if (imgPreviewWrap) imgPreviewWrap.style.display = 'block';
            if (imgPreviewEl) {
                imgPreviewEl.src = currentImageDataUrl;
            }
            if (btnConfirmImageModal) btnConfirmImageModal.disabled = false;

            renderHotspotsList();
            setTimeout(() => {
                setModalMode('crop');
            }, 50);
        } else {
            // Insert New Image Mode
            editingImageKey = null;
            currentImageDataUrl = null;
            originalImageDataUrl = null;
            currentHotspots = [];

            if (imgModalTitle) imgModalTitle.textContent = "Insert Image Figure";
            if (btnConfirmImgText) btnConfirmImgText.textContent = "Insert Figure";

            if (imgFileInput) imgFileInput.value = '';
            if (imgCaptionInput) imgCaptionInput.value = '';
            if (imgWidthSelect) imgWidthSelect.value = 'medium';
            if (imgAlignSelect) imgAlignSelect.value = 'center';
            
            if (imgDropInner) imgDropInner.style.display = 'block';
            if (imgPreviewWrap) imgPreviewWrap.style.display = 'none';
            if (imgPreviewEl) imgPreviewEl.src = '';
            if (btnConfirmImageModal) btnConfirmImageModal.disabled = true;

            renderHotspotsList();
        }

        if (imageModalOverlay) imageModalOverlay.style.display = 'flex';
    }

    // Expose Popover Toggle Helper globally for Popover Answer Bubbles
    window.toggleHotspotPopover = function(e, popoverId) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const targetPopover = document.getElementById(popoverId);
        if (!targetPopover) return;

        const isCurrentlyOpen = targetPopover.classList.contains('open');

        // Close all existing open popovers first
        document.querySelectorAll('.hs-answer-popover.open').forEach(pop => {
            pop.classList.remove('open');
        });

        if (!isCurrentlyOpen) {
            targetPopover.classList.add('open');
            const inputField = targetPopover.querySelector('.hs-popover-input');
            if (inputField) {
                setTimeout(() => inputField.focus(), 50);
            }
        }
    };

    // Close popovers on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.hs-answer-popover') && !e.target.closest('.hotspot-badge-wrap') && !e.target.closest('.hotspot-dot-wrap') && !e.target.closest('.btn-hs-answer-bubble-trigger')) {
            document.querySelectorAll('.hs-answer-popover.open').forEach(pop => {
                pop.classList.remove('open');
            });
        }
    });

    // Expose globally for overlay button trigger
    window.editQuestionImage = function(key, e) {
        if (e && e.stopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
        openImageModal(key);
    };

    function closeImageModal() {
        destroyCropper();
        if (imageModalOverlay) imageModalOverlay.style.display = 'none';
    }

    function handleImageFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please select a valid image file (PNG, JPG, SVG, WebP, etc.)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            currentImageDataUrl = e.target.result;
            originalImageDataUrl = e.target.result;

            if (imgDropInner) imgDropInner.style.display = 'none';
            if (imgPreviewWrap) imgPreviewWrap.style.display = 'block';
            if (imgPreviewEl) imgPreviewEl.src = currentImageDataUrl;
            if (btnConfirmImageModal) btnConfirmImageModal.disabled = false;

            setTimeout(initCropper, 100);
        };
        reader.readAsDataURL(file);
    }

    if (tbInsertImage) tbInsertImage.onclick = () => openImageModal(null);
    if (btnCloseImageModal) btnCloseImageModal.onclick = closeImageModal;
    if (btnCancelImageModal) btnCancelImageModal.onclick = closeImageModal;

    if (imgDropZone) {
        imgDropZone.onclick = (e) => {
            if (e.target.closest('#imgCropToolbar') || e.target.closest('.cropper-container')) return;
            if (e.target !== btnImgRemove && !btnImgRemove.contains(e.target)) {
                if (imgFileInput && imgDropInner.style.display !== 'none') {
                    imgFileInput.click();
                }
            }
        };

        imgDropZone.ondragover = (e) => {
            e.preventDefault();
            imgDropZone.classList.add('drag-over');
        };

        imgDropZone.ondragleave = () => {
            imgDropZone.classList.remove('drag-over');
        };

        imgDropZone.ondrop = (e) => {
            e.preventDefault();
            imgDropZone.classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleImageFile(e.dataTransfer.files[0]);
            }
        };
    }

    if (imgFileInput) {
        imgFileInput.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                handleImageFile(e.target.files[0]);
            }
        };
    }

    // Cropper Toolbar Button Actions (Crop, Rotate Left, Rotate Right, Reset)
    if (btnApplyCrop) {
        btnApplyCrop.onclick = () => {
            if (!cropperInstance) return;
            const croppedCanvas = cropperInstance.getCroppedCanvas({
                maxWidth: 1600,
                maxHeight: 1600
            });
            if (croppedCanvas) {
                currentImageDataUrl = croppedCanvas.toDataURL('image/png');
                destroyCropper();
                if (imgPreviewEl) imgPreviewEl.src = currentImageDataUrl;
                setTimeout(initCropper, 100);
            }
        };
    }

    if (btnRotateLeft) {
        btnRotateLeft.onclick = () => {
            if (cropperInstance) cropperInstance.rotate(-90);
        };
    }

    if (btnRotateRight) {
        btnRotateRight.onclick = () => {
            if (cropperInstance) cropperInstance.rotate(90);
        };
    }

    if (btnResetCrop) {
        btnResetCrop.onclick = () => {
            if (originalImageDataUrl) {
                currentImageDataUrl = originalImageDataUrl;
                destroyCropper();
                if (imgPreviewEl) imgPreviewEl.src = currentImageDataUrl;
                setTimeout(initCropper, 100);
            }
        };
    }

    if (btnImgRemove) {
        btnImgRemove.onclick = (e) => {
            e.stopPropagation();
            destroyCropper();
            currentImageDataUrl = null;
            originalImageDataUrl = null;
            if (imgFileInput) imgFileInput.value = '';
            if (imgDropInner) imgDropInner.style.display = 'block';
            if (imgPreviewWrap) imgPreviewWrap.style.display = 'none';
            if (imgPreviewEl) imgPreviewEl.src = '';
            if (btnConfirmImageModal) btnConfirmImageModal.disabled = true;
        };
    }

    if (btnConfirmImageModal) {
        btnConfirmImageModal.onclick = () => {
            let finalDataUrl = currentImageDataUrl;

            // Get cropped version if cropper is active
            if (cropperInstance) {
                const canvas = cropperInstance.getCroppedCanvas({
                    maxWidth: 1600,
                    maxHeight: 1600
                });
                if (canvas) {
                    finalDataUrl = canvas.toDataURL('image/png');
                }
            }

            if (!finalDataUrl) return;

            const q = tuteData.questions[activeQuestionIndex];
            if (!q) return;

            if (!q.images) q.images = {};

            let targetImgKey = editingImageKey;

            if (!targetImgKey) {
                // Insert New Image Mode -> generate next image key: image_1, image_2, etc.
                let nextIndex = 1;
                while (q.images[`image_${nextIndex}`]) {
                    nextIndex++;
                }
                targetImgKey = `image_${nextIndex}`;
            }

            q.images[targetImgKey] = {
                dataUrl: finalDataUrl,
                originalDataUrl: originalImageDataUrl || finalDataUrl,
                caption: imgCaptionInput ? imgCaptionInput.value.trim() : '',
                size: imgWidthSelect ? imgWidthSelect.value : 'medium',
                align: imgAlignSelect ? imgAlignSelect.value : 'center',
                hotspots: JSON.parse(JSON.stringify(currentHotspots))
            };

            // Support fallback {image} tag for the first image
            if (targetImgKey === 'image_1') {
                q.images['image'] = q.images['image_1'];
            }

            // Only insert tag if creating a new image
            if (!editingImageKey) {
                const tagToInsert = `\n\n{${targetImgKey}}\n`;
                const startPos = latexEditor.selectionStart || latexEditor.value.length;
                const endPos = latexEditor.selectionEnd || latexEditor.value.length;
                
                const currentVal = latexEditor.value;
                latexEditor.value = currentVal.substring(0, startPos) + tagToInsert + currentVal.substring(endPos);
                q.latex = latexEditor.value;
            }

            closeImageModal();
            renderApp();

            if (!editingImageKey) {
                latexEditor.focus();
            }
        };
    }

    // Toolbar Tab Switching Logic
    const tabButtons = document.querySelectorAll('.tb-tab-btn');
    const tabContents = document.querySelectorAll('.tb-tab-content');

    tabButtons.forEach(btn => {
        btn.onclick = () => {
            const targetTab = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const content = document.getElementById(targetTab);
            if (content) content.classList.add('active');
        };
    });

    // Worksheet Settings Drawer Modal Logic
    const btnOpenMetaDrawer = document.getElementById('btnOpenMetaDrawer');
    const btnCloseMetaDrawer = document.getElementById('btnCloseMetaDrawer');
    const btnSaveMetaDrawer = document.getElementById('btnSaveMetaDrawer');
    const metaDrawer = document.getElementById('metaDrawer');
    const metaDrawerOverlay = document.getElementById('metaDrawerOverlay');

    function toggleMetaDrawer(open) {
        if (!metaDrawer || !metaDrawerOverlay) return;
        metaDrawer.classList.toggle('open', open);
        metaDrawerOverlay.classList.toggle('visible', open);
    }

    if (btnOpenMetaDrawer) btnOpenMetaDrawer.onclick = () => toggleMetaDrawer(true);
    if (btnCloseMetaDrawer) btnCloseMetaDrawer.onclick = () => toggleMetaDrawer(false);
    if (metaDrawerOverlay) metaDrawerOverlay.onclick = () => toggleMetaDrawer(false);
    if (btnSaveMetaDrawer) {
        btnSaveMetaDrawer.onclick = () => {
            if (tuteTitleInput) tuteData.title = tuteTitleInput.value.trim() || "Untitled Tute";
            if (tuteGradeSelect) tuteData.grade = tuteGradeSelect.value;
            if (tuteTermSelect) tuteData.term = tuteTermSelect.value;
            if (tuteSubjectSelect) tuteData.subject = tuteSubjectSelect.value;
            renderApp();
            toggleMetaDrawer(false);
        };
    }

    // Navigation Rail & Theme Toggle Handler
    const menuButton = document.getElementById('menuButton');
    const sideMenu = document.getElementById('sideMenu');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const closeMenu = document.getElementById('closeMenu');

    function toggleMenu(open) {
        if (!sideMenu) return;
        sideMenu.classList.toggle('open', open);
        menuBackdrop.classList.toggle('visible', open);
        if (menuButton) menuButton.setAttribute('aria-expanded', open);
    }

    if (menuButton) menuButton.onclick = () => toggleMenu(!sideMenu.classList.contains('open'));
    if (closeMenu) closeMenu.onclick = () => toggleMenu(false);
    if (menuBackdrop) menuBackdrop.onclick = () => toggleMenu(false);

    // Light / Dark Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-mode');
            themeToggle.classList.add('dark');
            themeToggle.setAttribute('aria-label', 'Switch to light mode');
        }

        themeToggle.onclick = () => {
            const isDark = document.body.classList.toggle('dark-mode');
            themeToggle.classList.toggle('dark', isDark);
            themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        };
    }

    // Utilities
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function mapLikeToObject(value) {
        if (!value) return {};
        if (value instanceof Map) return Object.fromEntries(value);
        if (typeof value === 'object') return value;
        return {};
    }

    function normalizeLoadedTute(raw) {
        if (!raw || typeof raw !== 'object') return null;
        return {
            _id: raw._id,
            title: raw.title || 'Untitled Tute',
            grade: raw.grade || 'Grade 11 (O/L)',
            term: raw.term || 'Term 1',
            subject: raw.subject || 'Mathematics',
            totalMarks: raw.totalMarks || 0,
            questions: Array.isArray(raw.questions)
                ? raw.questions.map((q, idx) => ({
                    id: q.id || ('q' + (idx + 1)),
                    title: q.title || ('Question ' + (idx + 1)),
                    marks: Number(q.marks) || 10,
                    latex: q.latex || '',
                    answers: mapLikeToObject(q.answers),
                    images: mapLikeToObject(q.images)
                }))
                : []
        };
    }

    async function loadTuteFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const tuteId = params.get('id') || params.get('tuteId') || '';
        if (!tuteId) return false;

        try {
            const response = await fetch('/api/tutes/' + encodeURIComponent(tuteId));
            const result = await response.json();
            if (!response.ok || !result.success || !result.data) {
                throw new Error((result && result.error) || 'Tute not found');
            }

            const loaded = normalizeLoadedTute(result.data);
            if (!loaded || !loaded.questions.length) {
                // Still open empty shell of the saved tute rather than the demo template
                tuteData = loaded || tuteData;
                if (!tuteData.questions || !tuteData.questions.length) {
                    tuteData.questions = [{
                        id: 'q1',
                        title: 'New Question',
                        marks: 10,
                        latex: '',
                        answers: {},
                        images: {}
                    }];
                }
            } else {
                tuteData = loaded;
            }

            activeQuestionIndex = 0;
            return true;
        } catch (err) {
            console.error('Failed to load tute for edit:', err);
            alert('Could not open that worksheet for editing.\n' + err.message + '\n\nStarting a blank editor instead.');
            return false;
        }
    }

    // Initial Launch — open existing tute when Library sends ?id=
    (async () => {
        await loadTuteFromUrl();
        renderApp();
    })();
});
