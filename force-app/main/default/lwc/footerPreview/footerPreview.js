import { LightningElement, api, track } from 'lwc';
import * as footerState from 'c/footerState';

export default class FooterPreview extends LightningElement {
    @api highlightDivIds = [];
    @api highlightEnabled = false;
    @api instanceId = 'main'; // Added for debugging
    @api formFactor;

    @track activeTab = 'Preview';
    @track currentPreviewDevice = 'desktop';
    @track lastUpdatedTime = '';
    @track hasRenderedExactPreview = false;
    @track _configurations = {}; // Local copy of configurations

    // Getter to determine the current device from the state, falling back to the property
    get currentDevice() {
        return this.formFactor || this.currentPreviewDevice;
    }

    connectedCallback() {
        this.currentPreviewDevice = this.currentDevice;
        this.updateLastUpdatedTime();
        this.renderWithDelay();

        // Initialize local configurations from state service
        this._configurations = footerState.getConfigurations();

        // Subscribe to state changes
        footerState.subscribe('configChanged', this.handleConfigStateChange.bind(this));
        footerState.subscribe('gridChanged', this.handleGridStateChange.bind(this));
        footerState.subscribe('footerStyleChanged', this.handleFooterStyleStateChange.bind(this));
        footerState.subscribe('styleChanged', this.handleDivStyleStateChange.bind(this));
        footerState.subscribe('formFactorChanged', this.handleFormFactorChange.bind(this));
    }

    disconnectedCallback() {
        // Unsubscribe from state changes
        footerState.unsubscribe('configChanged', this.handleConfigStateChange.bind(this));
        footerState.unsubscribe('gridChanged', this.handleGridStateChange.bind(this));
        footerState.unsubscribe('footerStyleChanged', this.handleFooterStyleStateChange.bind(this));
        footerState.unsubscribe('styleChanged', this.handleDivStyleStateChange.bind(this));
        footerState.unsubscribe('formFactorChanged', this.handleFormFactorChange.bind(this));
    }

    handleFormFactorChange(formFactor) {
        this.currentPreviewDevice = formFactor;
        this.renderExactPreview();
    }

    handleConfigStateChange(newConfig) {
        this._configurations = newConfig;
        this.renderExactPreview();
    }

    handleGridStateChange({ device }) {
        // Only re-render if the change is relevant to the current preview device
        if (device === this.currentPreviewDevice) {
            this._configurations = footerState.getConfigurations();
            this.renderExactPreview();
        }
    }

    handleFooterStyleStateChange({ device }) {
        // Only re-render if the change is relevant to the current preview device
        if (device === this.currentPreviewDevice) {
            this._configurations = footerState.getConfigurations();
            this.renderExactPreview();
        }
    }

    handleDivStyleStateChange({ divId, device, newStyles }) {
        // Only re-render if the change is relevant to the current preview device
        if (device === this.currentPreviewDevice) {
            // Force reactivity by creating a new object reference
            this._configurations = { ...footerState.getConfigurations() };
            this.renderExactPreview();
        }
    }

    

    renderWithDelay() {
        setTimeout(() => {
            this.refreshPreview();
        }, 100);
    }

    showPreviewTab() {
        this.activeTab = 'Preview';
        this.hasRenderedExactPreview = false; // Force re-render
        this.renderWithDelay();
    }
    showHtmlTab() { this.activeTab = 'HTML'; }
    showCssTab() { this.activeTab = 'CSS'; }

    showDesktopPreview() {
        this.currentPreviewDevice = 'desktop';
        this.renderExactPreview();
    }

    showTabletPreview() {
        this.currentPreviewDevice = 'tablet';
        this.renderExactPreview();
    }

    showMobilePreview() {
        this.currentPreviewDevice = 'mobile';
        this.renderExactPreview();
    }

    handleCopyCode(event) {
        this.copyToClipboard(this.displayedCode, event.currentTarget);
    }

    copyFullHtmlFile(event) {
        const fullHtml = this.createFullHtmlFile(this.generatedHtmlCode, this.generatedCssCode);
        this.copyToClipboard(fullHtml, event.currentTarget, 'Copied File!');
    }

    downloadFullHtmlFile(event) {
        const fullHtml = this.createFullHtmlFile(this.generatedHtmlCode, this.generatedCssCode);
        this.downloadFile('footer.html', fullHtml, event.currentTarget);
    }

    createFullHtmlFile(html, css) {
        return `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Footer</title>\n    <style>\n${css}\n    </style>\n</head>\n<body>\n${html}\n</body>\n</html>`;
    }

    copyToClipboard(text, button, successMessage = 'Copied!') {
        let textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.showButtonSuccess(button, successMessage);
    }

    downloadFile(filename, content, button) {
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        this.showButtonSuccess(button, 'Downloaded!');
    }

    showButtonSuccess(button, message) {
        if (!button) return;
        let buttonText = button.querySelector('.btn-text') || button;
        let originalText = buttonText.textContent;
        buttonText.textContent = message;
        button.classList.add('success');
        setTimeout(() => {
            buttonText.textContent = originalText;
            button.classList.remove('success');
        }, 2000);
    }

    @api
    clearExactPreview() {
        const container = this.template.querySelector('[data-id="exact-preview"]');
        if (container) {
            container.innerHTML = '';
            this.hasRenderedExactPreview = false;
        }
    }

    @api
    refreshPreview() {
        this.clearExactPreview();
        setTimeout(() => {
            this.renderExactPreview();
        }, 50);
    }

    renderExactPreview() {
        if (!this.showPreviewContent) return;

        const container = this.template.querySelector('[data-id="exact-preview"]');
        if (!container) {
            this.hasRenderedExactPreview = false;
            return;
        }

        container.innerHTML = '';

        const style = document.createElement('style');
        style.textContent = this.generatedCssCodeForPreview;
        container.appendChild(style);

        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = this.generatedHtmlCode;
        container.appendChild(contentDiv);

        this.hasRenderedExactPreview = true;
        this.updateLastUpdatedTime();
    }

    updateLastUpdatedTime() {
        this.lastUpdatedTime = new Date().toLocaleTimeString();
    }
    // #endregion

    // #region Getters
    get showPreviewContent() { return this.activeTab === 'Preview'; }
    get showCodeContent() { return this.activeTab === 'HTML' || this.activeTab === 'CSS'; }

    get previewTabClass() { return this.activeTab === 'Preview' ? 'tab-button active' : 'tab-button'; }
    get htmlTabClass() { return this.activeTab === 'HTML' ? 'tab-button active' : 'tab-button'; }
    get cssTabClass() { return this.activeTab === 'CSS' ? 'tab-button active' : 'tab-button'; }

    get desktopPreviewClass() { return this.currentPreviewDevice === 'desktop' ? 'device-btn active' : 'device-btn'; }
    get tabletPreviewClass() { return this.currentPreviewDevice === 'tablet' ? 'device-btn active' : 'device-btn'; }
    get mobilePreviewClass() { return this.currentPreviewDevice === 'mobile' ? 'device-btn active' : 'device-btn'; }

    get currentConfig() {
        return this._configurations[this.currentPreviewDevice] || {};
    }

    get displayedCode() {
        return this.activeTab === 'CSS' ? this.generatedCssCode : this.generatedHtmlCode;
    }

    get devicePreviewStyle() {
        switch (this.currentDevice) {
            case 'mobile': return 'max-width: 480px; margin: 0 auto;';
            case 'tablet': return 'max-width: 768px; margin: 0 auto;';
            default: return 'max-width: 1200px; margin: 0 auto;';
        }
    }

    get currentDeviceLabel() {
        return this.currentPreviewDevice.charAt(0).toUpperCase() + this.currentPreviewDevice.slice(1);
    }

    get currentDimensions() {
        const config = this.currentConfig;
        return `${config.deviceColumns || 'N/A'} × ${config.deviceRows || 'N/A'}`;
    }

    get totalElements() {
        return (this.currentConfig.gridItems || []).filter(item => !item.isEmpty).length;
    }

    get currentGrid() {
        const config = this.currentConfig;
        return `${config.deviceColumns || 'N/A'}×${config.deviceRows || 'N/A'}`;
    }

    _getFinalClassName(cell) {
        // Ensure customClassName is a string before trimming and processing
        if (typeof cell.customClassName === 'string' && cell.customClassName.trim() !== '') {
            return cell.customClassName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        }
        let baseName;
        switch (cell.contentType) {
            case 'image':
                baseName = 'image-container';
                break;
            case 'social-icons':
                baseName = 'social-icons';
                break;
            case 'text':
            default:
                // Ensure cell.content is a string before trimming
                baseName = typeof cell.content === 'string' ? cell.content.trim() : 'text-block';
                break;
        }
        // Ensure baseName is a string before processing
        const sanitized = String(baseName).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
        if (/^\d/.test(sanitized)) {
            return `class-${sanitized}`;
        }
        return sanitized || 'footer-div';
    }


    get _uniqueElementsByClass() {
        const uniqueElements = new Map();

        ['desktop', 'tablet', 'mobile'].forEach(device => {
            const config = this._configurations[device];
            if (config && config.gridItems) {
                config.gridItems.forEach(cell => {
                    if (!cell.isEmpty) {
                        let finalClassName = this._getFinalClassName(cell);
                        
                        if (!uniqueElements.has(finalClassName)) {
                            uniqueElements.set(finalClassName, { ...cell, finalClassName });
                        }
                    }
                });
            }
        });
        return Array.from(uniqueElements.values());
    }

    get generatedHtmlCode() {
        let html = `<div class="footer-container">\n`;
        this._uniqueElementsByClass.forEach(cell => {
            let validClassName = cell.finalClassName;
            if (this.highlightEnabled && this.highlightDivIds.includes(cell.id)) {
                validClassName += ' highlighted-div';
            }
            html += `    <div class="${validClassName}" data-id="${cell.id}">\n`;

            if (cell.contentType === 'social-icons') {
                html += `        <div class="social-icons-container">\n`;
                if (cell.socialIcons && cell.socialIcons.length > 0) {
                    cell.socialIcons.forEach(icon => {
                        if (icon.iconUrl) {
                            if (icon.linkUrl) {
                                let target = icon.linkTarget === '_blank' ? ' target="_blank"' : '';
                                html += `            <a href="${icon.linkUrl}"${target}><img src="${icon.iconUrl}" alt="${icon.platform}" class="social-icon"></a>\n`;
                            } else {
                                html += `            <img src="${icon.iconUrl}" alt="${icon.platform}" class="social-icon">\n`;
                            }
                        }
                    });
                }
                html += `        </div>\n`;
            } else if (cell.contentType === 'image') {
                let imageInlineStyle = this.getInlineImageStyle(cell.divStyles.imageStyles);
                if (cell.linkUrl) {
                    let target = cell.linkTarget === '_blank' ? ' target="_blank"' : '';
                    html += `        <a href="${cell.linkUrl}"${target} class="image-link"><img src="${window.location.origin + cell.imageUrl}" alt="${cell.content || 'Image'}" style="${imageInlineStyle}"></a>\n`;
                } else {
                    html += `        <img src="${window.location.origin + cell.imageUrl}" alt="${cell.content || 'Image'}" style="${imageInlineStyle}">
`;

                }
            }
            else {
                const processedContent = this.processTextWithLineBreaks(cell.content);
                if (cell.linkUrl) {
                    let target = cell.linkTarget === '_blank' ? ' target="_blank"' : '';
                    html += `        <a href="${cell.linkUrl}"${target} class="text-content">${processedContent}</a>\n`;
                } else {
                    html += `        <span class="text-content">${processedContent}</span>\n`;
                }
            }
            html += `    </div>\n`;
        });
        html += `</div>`;
        return html;
    }


    get generatedCssCode() {
        const desktopConfig = this._configurations.desktop || {};
        const indent = '    ';
        let css = `.footer-container {\n`;
        css += `    max-width: 1200px;\n`;
        css += `    margin: auto;\n`;
        css += `    display: grid;\n`;
        css += `    gap: ${desktopConfig.deviceGap || 8}px;\n`;
        Object.entries(desktopConfig.footerStyles || {}).forEach(([key, value]) => {
            if (value && !this.isZero(value)) {
            css += `    ${this.camelToKebab(key)}: ${value};
`;
            }
        });
        css += `}\n\n`;

        if (this.highlightEnabled) {
            css += `.highlighted-div {\n    border: 1px solid #28a745 !important;\n    box-shadow: 0 0 0 1px rgba(40, 167, 69, 0.5) !important;\n}\n\n`;
        }

        css += `* {\n`;
        css += `    margin: 0;\n`;
        css += `    padding: 0;\n`;
        css += `    text-decoration: none;\n`;
        css += `}\n\n`;

        ['desktop', 'tablet', 'mobile'].forEach(device => {
            const config = this._configurations[device];
            if (!config || !config.gridItems) return;

            const mediaQuery = {
                desktop: '@media (min-width: 769px)',
                tablet: '@media (max-width: 768px) and (min-width: 481px)',
                mobile: '@media (max-width: 480px)'
            }[device];

            const rawCellHeight = config.deviceCellHeight || 'auto';
            const rawCellWidth = config.deviceCellWidth || 'auto';
            const cellHeightValue = (rawCellHeight === 'auto') ? 'minmax(80px, auto)' : rawCellHeight;
            const cellWidthValue = (rawCellWidth === 'auto') ? '1fr' : rawCellWidth;

            css += `${mediaQuery} {\n`;
            css += `${indent}.footer-container {
`;
            css += `${indent}    grid-template-columns: repeat(${config.deviceColumns}, ${cellWidthValue});
`;
            css += `${indent}    grid-template-rows: repeat(${config.deviceRows}, ${cellHeightValue});
`;
            css += `${indent}    gap: ${config.deviceGap}px;
`;
            css += `${indent}}
`;
            css += this.generateCellCssForDevice(this._uniqueElementsByClass, indent, device);
            css += `}

`;
        });

        return css;
    }

    get generatedCssCodeForPreview() {
        const config = this._configurations[this.currentPreviewDevice];
        if (!config || !config.gridItems) return '';

        let css = `.footer-container {\n`;
        css += `    display: grid;\n`;
        const rawCellHeight = config.deviceCellHeight || 'auto';
        const rawCellWidth = config.deviceCellWidth || 'auto';
        const cellHeightValue = (rawCellHeight === 'auto') ? 'minmax(80px, auto)' : rawCellHeight;
        const cellWidthValue = (rawCellWidth === 'auto') ? '1fr' : rawCellWidth;
        css += `    grid-template-columns: repeat(${config.deviceColumns}, ${cellWidthValue});\n`;
        css += `    grid-template-rows: repeat(${config.deviceRows}, ${cellHeightValue});\n`;
        css += `    gap: ${config.deviceGap}px;\n`;
        Object.entries(config.footerStyles || {}).forEach(([key, value]) => {
            if (value && !this.isZero(value)) {
            css += `    ${this.camelToKebab(key)}: ${value};
`;
            }
        });
        css += `}\n\n`;

        if (this.highlightEnabled) {
            css += `.highlighted-div {\n    border: 1px solid #28a745 !important;\n    box-shadow: 0 0 0 1px rgba(40, 167, 69, 0.5) !important;\n}\n\n`;
        }

        css += `* {\n`;
        css += `    margin: 0;\n`;
        css += `    padding: 0;\n`;
        css += `    text-decoration: none;\n`;
        css += `}\n\n`;

        css += this.generateCellCssForDevice(this._uniqueElementsByClass, '', this.currentPreviewDevice);

        return css;
    }
  
    generateCellCssForDevice(cells, indent = '', device) {
        let css = '';
        const deviceGridItems = this._configurations[device]?.gridItems || [];

        cells.forEach(uniqueCell => {
            const validClassName = uniqueCell.finalClassName;
            const deviceCell = deviceGridItems.find(c => !c.isEmpty && this._getFinalClassName(c) === validClassName);

            if (deviceCell) {
                const spanCol = deviceCell.colSpan > 1 ? ` / span ${deviceCell.colSpan}` : '';
                const spanRow = deviceCell.rowSpan > 1 ? ` / span ${deviceCell.rowSpan}` : '';
                const containerStyles = this.getOptimizedContainerStyles(deviceCell.divStyles);

                // New alignment logic
                let alignment = deviceCell.divStyles.textAlign || 'left';
                if (deviceCell.contentType === 'image') {
                    alignment = deviceCell.divStyles.imageStyles?.objectPosition || 'center';
                }

                const justifyContentMap = {
                    left: 'flex-start',
                    center: 'center',
                    right: 'flex-end',
                    'top': 'center',
                    'bottom': 'center',
                    'top left': 'flex-start',
                    'top right': 'flex-end',
                    'bottom left': 'flex-start',
                    'bottom right': 'flex-end'
                };

                const alignItemsMap = {
                    left: 'center',
                    center: 'center',
                    right: 'center',
                    'top': 'flex-start',
                    'bottom': 'flex-end',
                    'top left': 'flex-start',
                    'top right': 'flex-start',
                    'bottom left': 'flex-end',
                    'bottom right': 'flex-end'
                };

                const justifyContent = justifyContentMap[alignment] || alignment;
                const alignItems = alignItemsMap[alignment] || 'center';

                containerStyles.push('display: flex');
                containerStyles.push(`justify-content: ${justifyContent}`);
                containerStyles.push(`align-items: ${alignItems}`);

                css += `${indent}.${validClassName} {
`;
                css += `${indent}    grid-column: ${deviceCell.gridColumn}${spanCol};
`;
                css += `${indent}    grid-row: ${deviceCell.gridRow}${spanRow};
`;
                if (containerStyles.length > 0) {
                    css += `${indent}    ${containerStyles.join(`;
${indent}    `)};
`;
                }
                css += `${indent}}

`;

                if (deviceCell.contentType === 'social-icons') {
                    const iconSize = this.getIconSizeValue(deviceCell.iconSize || 'medium');
                    const flexDirection = deviceCell.iconLayout === 'horizontal' ? 'row' : 'column';
                    const iconJustifyContent = justifyContentMap[deviceCell.iconAlignment] || deviceCell.iconAlignment;
                    const iconAlignItems = alignItemsMap[deviceCell.iconAlignment] || 'center';


                    const gap = deviceCell.iconSpacing || '12px';
                    css += `${indent}.${validClassName} .social-icons-container {
`;
                    css += `${indent}    display: flex;
`;
                    css += `${indent}    flex-direction: ${flexDirection};
`;
                    css += `${indent}    justify-content: ${iconJustifyContent};
`;
                    css += `${indent}    align-items: ${iconAlignItems};
`;
                    css += `${indent}    gap: ${gap};
`;
                    css += `${indent}    flex-wrap: wrap;
`;
                    css += `${indent}    width: 100%;
`;
                    css += `${indent}    height: 100%;
`;
                    css += `${indent}}
`;
                    css += `${indent}.${validClassName} .social-icon {
`;
                    css += `${indent}    width: ${iconSize};
`;
                    css += `${indent}    height: ${iconSize};
`;
                    css += `${indent}    object-fit: contain;
`;
                    css += `${indent}    transition: all 0.2s ease;
`;
                    css += `${indent}    border-radius: 4px;
`;
                    css += `${indent}}
`;
                    css += `${indent}.${validClassName} .social-icon:hover {
`;
                    css += `${indent}    transform: scale(1.1);
`;
                    css += `${indent}    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
`;
                    css += `${indent}}

`;
                } else if (deviceCell.contentType === 'image') {
                    const imageStyles = this.getOptimizedImageStyles(deviceCell.divStyles.imageStyles || {});
                    if (imageStyles.length > 0) {
                        css += `${indent}.${validClassName} img {\n${indent}    ${imageStyles.join(`;\n${indent}    `)};\n${indent}}\n`;
                    }
                    if (deviceCell.linkUrl) {
                        css += `${indent}.${validClassName} a.image-link { display: inline-block; text-decoration: none; transition: all 0.2s ease; border-radius: 4px; overflow: hidden; ${deviceCell.showPointer !== false ? 'cursor: pointer;' : ''} }\n`;
                        css += `${indent}.${validClassName} a.image-link:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }\n`;
                        css += `${indent}.${validClassName} a.image-link:hover img { filter: brightness(1.1); }\n\n`;
                    }
                } else {
                    const textStyles = this.getOptimizedTextStyles(deviceCell.divStyles);
                    if (textStyles.length > 0) {
                        css += `${indent}.${validClassName} .text-content {\n${indent}    ${textStyles.join(`;\n${indent}    `)};\n${indent}}\n`;
                    }
                    if (deviceCell.linkUrl) {
                        css += `${indent}.${validClassName} a.text-content:hover { opacity: 0.8; }\n\n`;
                    }
                }
            } else {
                css += `${indent}.${validClassName} {\n`;
                css += `${indent}    display: none;\n`;
                css += `${indent}}\n\n`;
            }
        });
        return css;
    }

    isZero(value) {
        return value === '0px' || value === '0' || !value;
    }

    processShorthand(styles, shorthand, individuals, result) {
        let baseValue = styles[shorthand];
        let individualValues = individuals.map(prop => styles[prop]);

        if (baseValue && !this.isZero(baseValue)) {
            result.push(`${this.camelToKebab(shorthand)}: ${baseValue}`);
        }

        individualValues.forEach((val, i) => {
            if (val && !this.isZero(val) && val !== baseValue) {
                result.push(`${this.camelToKebab(individuals[i])}: ${val}`);
            }
        });
    }

    getOptimizedContainerStyles(divStyles) {
        let result = [];
        let defaults = { boxShadow: 'none', borderStyle: 'solid', borderColor: '#000' };

        // Explicitly add width and height if they exist
        if (divStyles.width) result.push(`width: ${divStyles.width}`);
        if (divStyles.height) result.push(`height: ${divStyles.height}`);

        this.processShorthand(divStyles, 'padding', ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'], result);
        this.processShorthand(divStyles, 'margin', ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'], result);
        this.processShorthand(divStyles, 'borderRadius', ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'], result);

        // Border properties
        if (divStyles.borderWidth && !this.isZero(divStyles.borderWidth)) {
            result.push(`border-width: ${divStyles.borderWidth}`);
            result.push(`border-style: ${divStyles.borderStyle || defaults.borderStyle}`);
            result.push(`border-color: ${divStyles.borderColor || defaults.borderColor}`);
        }

        // Background color: Always include if present and not transparent
        if (divStyles.backgroundColor) {
            result.push(`background-color: ${divStyles.backgroundColor}`);
        }

        // Box Shadow
        if (divStyles.boxShadow && divStyles.boxShadow !== defaults.boxShadow) {
            result.push(`box-shadow: ${divStyles.boxShadow}`);
        }

        result.push('white-space: nowrap');

        return result;
    }

    getInlineImageStyle(imageStyles) {
        if (!imageStyles) return '';
        let imageSpecificProperties = ['width', 'height', 'maxWidth', 'maxHeight', 'objectFit', 'objectPosition', 'opacity', 'cursor', 'borderRadius', 'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius', 'borderWidth', 'borderStyle', 'borderColor', 'backgroundColor'];
        return Object.entries(imageStyles)
            .filter(([key]) => imageSpecificProperties.includes(key))
            .map(([key, value]) => {
                if (key.startsWith('border') && key.includes('Radius')) {
                    return `${this.camelToKebab(key)}: ${value}px`; // Add px for border-radius
                }
                return `${this.camelToKebab(key)}: ${value}`;
            })
            .join('; ');
    }

    getOptimizedImageStyles(imageStyles) {
        let result = [];
        let defaults = { opacity: '1', cursor: 'default', width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: 'none', borderRadius: '0px', borderWidth: '0px', borderStyle: 'solid', borderColor: '#000', backgroundColor: 'transparent' };

        ['width', 'height', 'maxWidth', 'maxHeight', 'objectFit', 'objectPosition', 'opacity', 'cursor'].forEach(prop => {
            if (imageStyles[prop] && imageStyles[prop] !== defaults[prop]) {
                result.push(`${this.camelToKebab(prop)}: ${imageStyles[prop]}`);
            }
        });

        // Border Radius
        this.processShorthand(imageStyles, 'borderRadius', ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'], result);

        // Border properties
        if (imageStyles.borderWidth && !this.isZero(imageStyles.borderWidth)) {
            result.push(`border-width: ${imageStyles.borderWidth}`);
            result.push(`border-style: ${imageStyles.borderStyle || defaults.borderStyle}`);
            result.push(`border-color: ${imageStyles.borderColor || defaults.borderColor}`);
        }

        // Background color
        if (imageStyles.backgroundColor && imageStyles.backgroundColor !== defaults.backgroundColor) {
            result.push(`background-color: ${imageStyles.backgroundColor}`);
        }

        if (!result.some(s => s.startsWith('max-width'))) {
            result.push('max-width: 100%');
        }
        
        return result;
    }

    getOptimizedTextStyles(divStyles) {
        let result = [];
        let defaults = { color: '#212529', fontSize: '14px', fontWeight: '400', fontStyle: 'normal', textDecoration: 'none', letterSpacing: '0px', textShadow: 'none', cursor: 'default' };

        this.processShorthand(divStyles, 'padding', ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'], result);
        this.processShorthand(divStyles, 'margin', ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'], result);

        ['color', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textDecoration', 'textShadow', 'cursor'].forEach(prop => {
            if (divStyles[prop] && divStyles[prop] !== defaults[prop]) {
                result.push(`${this.camelToKebab(prop)}: ${divStyles[prop]}`);
            }
        });

        // Text Align: Always include if present
        if (divStyles.textAlign) {
            result.push(`text-align: ${divStyles.textAlign}`);
        }

        // Text Shadow
        if (divStyles.textShadow && divStyles.textShadow !== defaults.textShadow) {
            result.push(`text-shadow: ${divStyles.textShadow}`);
        }

        // Removed display: block and width: 100% as they can interfere with grid layout

        return result;
    }

    getIconSizeValue(size) {
        const sizes = { small: '24px', medium: '32px', large: '48px', xl: '64px' };
        return sizes[size] || '32px';
    }

    camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    processTextWithLineBreaks(text) {
        if (!text) return '';
        // Only wrap in <p> tags if newlines are present
        if (text.includes('\n')) {
            return text.split('\n').map(line => `<p>${line}</p>`).join('');
        } else {
            return text;
        }
    }
}