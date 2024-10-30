import { backend } from 'declarations/backend';

// State management
let state = {
    selectedElement: null,
    history: [],
    historyIndex: -1,
    isDragging: false,
    currentX: 0,
    currentY: 0,
    initialX: 0,
    initialY: 0,
    xOffset: 0,
    yOffset: 0,
    deviceView: 'desktop',
    showGrid: false,
    elements: []
};

// Initialize the builder
function initBuilder() {
    initDragAndDrop();
    initPropertyPanel();
    initHistory();
    initButtons();
    loadSavedDesign();
}

// Drag and Drop functionality
function initDragAndDrop() {
    document.querySelectorAll('.element').forEach(element => {
        element.addEventListener('dragstart', handleDragStart);
        element.addEventListener('dragend', handleDragEnd);
    });

    const canvas = document.getElementById('canvas');
    if (canvas) {
        canvas.addEventListener('dragover', handleDragOver);
        canvas.addEventListener('drop', handleDrop);
        canvas.addEventListener('click', handleCanvasClick);
    }
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.type);
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleDrop(e) {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    const element = createCanvasElement(type);
    
    const canvas = document.getElementById('canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    
    canvas.appendChild(element);
    element.classList.add('animate-entrance');
    
    addToHistory({
        type: 'add',
        element: element.outerHTML,
        position: { x, y }
    });
    
    state.elements.push({
        id: element.id,
        type: type,
        position: { x, y },
        styles: element.style.cssText
    });
}

function createCanvasElement(type) {
    const element = document.createElement('div');
    element.className = 'canvas-element';
    element.id = 'element-' + Date.now();
    element.dataset.type = type;
    element.draggable = true;
    
    // Add element controls
    const controls = document.createElement('div');
    controls.className = 'element-controls';
    controls.innerHTML = `
        <button class="control-button" onclick="duplicateElement('${element.id}')">
            <i class="fas fa-copy"></i>
        </button>
        <button class="control-button" onclick="deleteElement('${element.id}')">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    element.appendChild(controls);
    
    // Set default content based on type
    switch(type) {
        case 'heading':
            element.innerHTML += '<h2>New Heading</h2>';
            break;
        case 'text':
            element.innerHTML += '<p>New Text Block</p>';
            break;
        case 'button':
            element.innerHTML += '<button class="button button-primary">New Button</button>';
            break;
        case 'image':
            element.innerHTML += `<img src="https://via.placeholder.com/300x200" alt="placeholder">`;
            break;
        case 'form':
            element.innerHTML += `
                <form>
                    <input type="text" placeholder="Name">
                    <input type="email" placeholder="Email">
                    <button type="submit">Submit</button>
                </form>
            `;
            break;
        case 'gallery':
            element.innerHTML += `
                <div class="gallery">
                    <img src="https://via.placeholder.com/150" alt="Image 1">
                    <img src="https://via.placeholder.com/150" alt="Image 2">
                    <img src="https://via.placeholder.com/150" alt="Image 3">
                </div>
            `;
            break;
    }
    
    element.addEventListener('mousedown', startDragging);
    element.addEventListener('click', selectElement);
    
    return element;
}

// Element manipulation functions
function startDragging(e) {
    if (e.target.classList.contains('canvas-element')) {
        state.isDragging = true;
        state.selectedElement = e.target;
        state.initialX = e.clientX - state.xOffset;
        state.initialY = e.clientY - state.yOffset;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
    }
}

function drag(e) {
    if (state.isDragging) {
        e.preventDefault();
        state.currentX = e.clientX - state.initialX;
        state.currentY = e.clientY - state.initialY;

        state.xOffset = state.currentX;
        state.yOffset = state.currentY;

        setTranslate(state.currentX, state.currentY, state.selectedElement);
    }
}

function endDrag(e) {
    if (state.isDragging) {
        state.initialX = state.currentX;
        state.initialY = state.currentY;
        state.isDragging = false;
        
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', endDrag);
        
        addToHistory({
            type: 'move',
            elementId: state.selectedElement.id,
            position: { x: state.currentX, y: state.currentY }
        });
    }
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

function selectElement(e) {
    e.stopPropagation();
    if (state.selectedElement) {
        state.selectedElement.classList.remove('selected');
    }
    
    state.selectedElement = e.target.closest('.canvas-element');
    state.selectedElement.classList.add('selected');
    showProperties();
}

function handleCanvasClick(e) {
    const canvas = document.getElementById('canvas');
    if (e.target === canvas) {
        if (state.selectedElement) {
            state.selectedElement.classList.remove('selected');
            state.selectedElement = null;
        }
        hideProperties();
    }
}

// Property panel functions
function initPropertyPanel() {
    const inputs = document.querySelectorAll('.property-input');
    inputs.forEach(input => {
        input.addEventListener('change', updateElementProperty);
    });
}

function showProperties() {
    const propertiesPanel = document.getElementById('properties-panel');
    if (propertiesPanel) {
        propertiesPanel.classList.add('active');
        updatePropertyInputs();
    }
}

function hideProperties() {
    const propertiesPanel = document.getElementById('properties-panel');
    if (propertiesPanel) {
        propertiesPanel.classList.remove('active');
    }
}

function updatePropertyInputs() {
    if (!state.selectedElement) return;
    
    const styles = window.getComputedStyle(state.selectedElement);
    
    const updateInput = (id, value) => {
        const input = document.getElementById(id);
        if (input) input.value = value;
    };

    updateInput('element-width', styles.width);
    updateInput('element-height', styles.height);
    updateInput('element-padding', styles.padding);
    updateInput('element-margin', styles.margin);
    updateInput('element-bgcolor', rgbToHex(styles.backgroundColor));
    updateInput('element-border-color', rgbToHex(styles.borderColor));
    updateInput('element-border-width', parseInt(styles.borderWidth));
    updateInput('element-border-radius', parseInt(styles.borderRadius));
    updateInput('element-font-family', styles.fontFamily.split(',')[0].replace(/['"]+/g, ''));
    updateInput('element-font-size', parseInt(styles.fontSize));
    updateInput('element-color', rgbToHex(styles.color));
    updateInput('element-opacity', styles.opacity);
    
    // Update color previews
    const updateColorPreview = (id, color) => {
        const preview = document.getElementById(id);
        if (preview) preview.style.backgroundColor = color;
    };

    updateColorPreview('bg-color-preview', styles.backgroundColor);
    updateColorPreview('border-color-preview', styles.borderColor);
    updateColorPreview('font-color-preview', styles.color);
}

function updateElementProperty(e) {
    if (!state.selectedElement) return;
    
    const property = e.target.id.replace('element-', '');
    const value = e.target.value;
    
    switch(property) {
        case 'width':
        case 'height':
        case 'padding':
        case 'margin':
            state.selectedElement.style[property] = value.includes('px') ? value : value + 'px';
            break;
        case 'bgcolor':
            state.selectedElement.style.backgroundColor = value;
            updateColorPreview('bg-color-preview', value);
            break;
        case 'border-color':
            state.selectedElement.style.borderColor = value;
            updateColorPreview('border-color-preview', value);
            break;
        case 'border-width':
            state.selectedElement.style.borderWidth = value + 'px';
            break;
        case 'border-radius':
            state.selectedElement.style.borderRadius = value + 'px';
            break;
        case 'font-family':
            state.selectedElement.style.fontFamily = value;
            break;
        case 'font-size':
            state.selectedElement.style.fontSize = value + 'px';
            break;
        case 'color':
            state.selectedElement.style.color = value;
            updateColorPreview('font-color-preview', value);
            break;
        case 'opacity':
            state.selectedElement.style.opacity = value;
            break;
        case 'shadow':
            applyShadow(value);
            break;
    }
    
    addToHistory({
        type: 'modify',
        elementId: state.selectedElement.id,
        property: property,
        value: value
    });
}

function updateColorPreview(id, color) {
    const preview = document.getElementById(id);
    if (preview) preview.style.backgroundColor = color;
}

function applyShadow(value) {
    let shadow;
    switch(value) {
        case 'light':
            shadow = '0 2px 4px rgba(0,0,0,0.1)';
            break;
        case 'medium':
            shadow = '0 4px 8px rgba(0,0,0,0.1)';
            break;
        case 'strong':
            shadow = '0 8px 16px rgba(0,0,0,0.1)';
            break;
        default:
            shadow = 'none';
    }
    state.selectedElement.style.boxShadow = shadow;
}

// History management
function initHistory() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);
}

function addToHistory(action) {
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(action);
    state.historyIndex++;
    updateHistoryPanel();
}

function undo() {
    if (state.historyIndex < 0) return;
    
    const action = state.history[state.historyIndex];
    revertAction(action);
    state.historyIndex--;
    updateHistoryPanel();
}

function redo() {
    if (state.historyIndex >= state.history.length - 1) return;
    
    state.historyIndex++;
    const action = state.history[state.historyIndex];
    applyAction(action);
    updateHistoryPanel();
}

function revertAction(action) {
    switch(action.type) {
        case 'add':
            const elementToRemove = document.getElementById(action.elementId);
            if (elementToRemove) elementToRemove.remove();
            break;
        case 'modify':
            const element = document.getElementById(action.elementId);
            if (element) element.style[action.property] = action.oldValue;
            break;
        case 'move':
            const movedElement = document.getElementById(action.elementId);
            if (movedElement) movedElement.style.transform = `translate3d(${action.oldPosition.x}px, ${action.oldPosition.y}px, 0)`;
            break;
    }
}

function applyAction(action) {
    switch(action.type) {
        case 'add':
            const newElement = document.createElement('div');
            newElement.outerHTML = action.element;
            const canvas = document.getElementById('canvas');
            if (canvas) canvas.appendChild(newElement);
            break;
        case 'modify':
            const element = document.getElementById(action.elementId);
            if (element) element.style[action.property] = action.value;
            break;
        case 'move':
            const movedElement = document.getElementById(action.elementId);
            if (movedElement) movedElement.style.transform = `translate3d(${action.position.x}px, ${action.position.y}px, 0)`;
            break;
    }
}

function updateHistoryPanel() {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;

    historyList.innerHTML = '';
    
    state.history.forEach((action, index) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = `${action.type} ${action.elementId || ''}`;
        if (index === state.historyIndex) {
            item.classList.add('current');
        }
        historyList.appendChild(item);
    });
}

// Device view functions
function setDeviceView(device) {
    state.deviceView = device;
    const canvas = document.getElementById('canvas');
    if (canvas) canvas.className = device;
    
    document.querySelectorAll('.device-button').forEach(button => {
        button.classList.remove('active');
    });
    const activeButton = document.querySelector(`.device-button[data-device="${device}"]`);
    if (activeButton) activeButton.classList.add('active');
}

// Grid toggle
function toggleGrid() {
    state.showGrid = !state.showGrid;
    const gridOverlay = document.querySelector('.grid-overlay');
    if (gridOverlay) gridOverlay.classList.toggle('active');
}

// Save and load functions
async function saveDesign() {
    const design = {
        elements: state.elements,
        history: state.history,
        deviceView: state.deviceView
    };
    
    try {
        await backend.saveDesign(JSON.stringify(design));
        alert('Design saved successfully!');
    } catch (error) {
        console.error('Error saving design:', error);
        alert('Failed to save design. Please try again.');
    }
}

async function loadSavedDesign() {
    try {
        const savedDesign = await backend.loadDesign();
        if (savedDesign) {
            try {
                const design = JSON.parse(savedDesign);
                const canvas = document.getElementById('canvas');
                if (canvas) {
                    canvas.innerHTML = ''; // Clear existing elements
                    design.elements.forEach(el => {
                        const element = createCanvasElement(el.type);
                        element.style.cssText = el.styles;
                        canvas.appendChild(element);
                    });
                }
                
                state.elements = design.elements;
                state.history = design.history;
                setDeviceView(design.deviceView);
            } catch (parseError) {
                console.error('Error parsing design data:', parseError);
                alert('Failed to parse design data. Please try again.');
            }
        } else {
            console.log('No saved design found.');
        }
    } catch (error) {
        console.error('Error loading design:', error);
        alert('Failed to load design. Please try again.');
    }
}

// Preview and publish functions
function previewDesign() {
    const previewWindow = window.open('', '_blank');
    const canvas = document.getElementById('canvas');
    
    if (previewWindow && canvas) {
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Preview</title>
                <style>
                    ${document.querySelector('style').textContent}
                    .canvas-element { position: relative !important; }
                    .element-controls { display: none; }
                </style>
            </head>
            <body>
                <div id="canvas" class="${state.deviceView}">
                    ${canvas.innerHTML}
                </div>
            </body>
            </html>
        `);
    }
}

async function publishDesign() {
    try {
        const designData = {
            elements: state.elements,
            deviceView: state.deviceView
        };
        const publishedUrl = await backend.publishDesign(JSON.stringify(designData));
        alert(`Your website has been published! URL: ${publishedUrl}`);
    } catch (error) {
        console.error('Error publishing design:', error);
        alert('Failed to publish design. Please try again.');
    }
}

// Utility functions
function rgbToHex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const rgbArray = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!rgbArray) return '#000000';
    const hex = (x) => ("0" + parseInt(x).toString(16)).slice(-2);
    return "#" + hex(rgbArray[1]) + hex(rgbArray[2]) + hex(rgbArray[3]);
}

function initButtons() {
    const toggleGridBtn = document.getElementById('toggleGridBtn');
    const previewBtn = document.getElementById('previewBtn');
    const publishBtn = document.getElementById('publishBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');

    if (toggleGridBtn) toggleGridBtn.addEventListener('click', toggleGrid);
    if (previewBtn) previewBtn.addEventListener('click', previewDesign);
    if (publishBtn) publishBtn.addEventListener('click', publishDesign);
    if (saveBtn) saveBtn.addEventListener('click', saveDesign);
    if (loadBtn) loadBtn.addEventListener('click', loadSavedDesign);

    document.querySelectorAll('.device-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const deviceType = e.target.closest('.device-button').dataset.device;
            if (deviceType) setDeviceView(deviceType);
        });
    });
}

// Initialize the builder
document.addEventListener('DOMContentLoaded', initBuilder);
