import { LightningElement, api, track } from 'lwc';

export default class FooterStyleModal extends LightningElement {
    @api styles = {};
    
    @track localStyles = {};
    @track activeSection = 'spacing';
    @track isLivePreview = true;


    connectedCallback() {
        this.localStyles = { ...this.styles };
        this.initializeDefaults();
    }

    initializeDefaults() {
        const defaults = {
            backgroundColor: '#2c3e50',
            color: '#ffffff',
            padding: '40px',
            paddingTop: '40px',
            paddingRight: '40px',
            paddingBottom: '40px',
            paddingLeft: '40px',
            margin: '0px',
            marginTop: '0px',
            marginRight: '0px',
            marginBottom: '0px',
            marginLeft: '0px',
            borderRadius: '0px',
            borderTopWidth: '0px',
            borderRightWidth: '0px',
            borderBottomWidth: '0px',
            borderLeftWidth: '0px',
            borderColor: '#ffffff',
            borderStyle: 'solid',
            textAlign: 'left',
            fontWeight: '400',
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            width: '100%',
            minHeight: '200px',
            boxShadow: 'none'
        };

        Object.keys(defaults).forEach(key => {
            if (!this.localStyles[key]) {
                this.localStyles[key] = defaults[key];
            }
        });
    }

    // Section Management
    get isSpacingActive() { return this.activeSection === 'spacing'; }
    get isColorsActive() { return this.activeSection === 'colors'; }
    get isLayoutActive() { return this.activeSection === 'layout'; }
    get isBordersActive() { return this.activeSection === 'borders'; }
    get isEffectsActive() { return this.activeSection === 'effects'; }

    get spacingTabClass() { return this.activeSection === 'spacing' ? 'section-tab active' : 'section-tab'; }
    get colorsTabClass() { return this.activeSection === 'colors' ? 'section-tab active' : 'section-tab'; }
    get layoutTabClass() { return this.activeSection === 'layout' ? 'section-tab active' : 'section-tab'; }
    get bordersTabClass() { return this.activeSection === 'borders' ? 'section-tab active' : 'section-tab'; }
    get effectsTabClass() { return this.activeSection === 'effects' ? 'section-tab active' : 'section-tab'; }

    handleSectionChange(event) {
        event.stopPropagation();
        this.activeSection = event.target.dataset.section;
        // Force re-render by updating a tracked property
        this.localStyles = { ...this.localStyles };
    }

    // Modal Event Handlers
    handleModalClick(event) {
        event.stopPropagation();
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleSave() {
        this.dispatchEvent(new CustomEvent('styleupdate', {
            detail: this.localStyles
        }));
        this.handleClose();
    }

    handleReset() {
        this.localStyles = {
            backgroundColor: '#2c3e50',
            color: '#ffffff',
            padding: '40px',
            paddingTop: '40px',
            paddingRight: '40px',
            paddingBottom: '40px',
            paddingLeft: '40px',
            margin: '0px',
            marginTop: '0px',
            marginRight: '0px',
            marginBottom: '0px',
            marginLeft: '0px',
            borderRadius: '0px',
            borderTopWidth: '0px',
            borderRightWidth: '0px',
            borderBottomWidth: '0px',
            borderLeftWidth: '0px',
            borderColor: '#ffffff',
            borderStyle: 'solid',
            textAlign: 'left',
            fontWeight: '400',
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            width: '100%',
            minHeight: '200px',
            boxShadow: 'none'
        };
    }

    toggleLivePreview() {
        this.isLivePreview = !this.isLivePreview;
    }

    // Enhanced spacing handlers
    handlePaddingSliderChange(event) {
        event.stopPropagation();
        const direction = event.target.dataset.direction;
        const value = parseFloat(event.target.value);
        const property = `padding${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
        this.updateStyle(property, value + 'px');
    }

    handlePaddingInputChange(event) {
        event.stopPropagation();
        const direction = event.target.dataset.direction;
        let value = event.target.value.trim();
        
        // Allow empty values
        if (value === '') return;
        
        // Parse numeric value and add px if it's a number
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            value = numValue + 'px';
        }
        
        const property = `padding${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
        this.updateStyle(property, value);
    }

    handleMarginSliderChange(event) {
        event.stopPropagation();
        const direction = event.target.dataset.direction;
        const value = parseFloat(event.target.value);
        const property = `margin${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
        this.updateStyle(property, value + 'px');
    }

    handleMarginInputChange(event) {
        event.stopPropagation();
        const direction = event.target.dataset.direction;
        let value = event.target.value.trim();
        
        if (value === '') return;
        
        // Handle 'auto' value
        if (value.toLowerCase() === 'auto') {
            value = 'auto';
        } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                value = numValue + 'px';
            }
        }
        
        const property = `margin${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
        this.updateStyle(property, value);
    }

    // Unified margin handler
    handleUnifiedMarginChange(event) {
        event.stopPropagation();
        let value = event.target.value.trim();
        
        if (value === '') return;
        
        if (value.toLowerCase() === 'auto') {
            value = 'auto';
        } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                value = numValue + 'px';
            }
        }
        
        // Apply to all margin directions
        this.updateStyle('margin', value);
        this.updateStyle('marginTop', value);
        this.updateStyle('marginRight', value);
        this.updateStyle('marginBottom', value);
        this.updateStyle('marginLeft', value);
    }

    handleUnifiedPaddingChange(event) {
        event.stopPropagation();
        let value = event.target.value.trim();
        
        if (value === '') return;
        
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            value = numValue + 'px';
        }
        
        // Apply to all padding directions
        this.updateStyle('padding', value);
        this.updateStyle('paddingTop', value);
        this.updateStyle('paddingRight', value);
        this.updateStyle('paddingBottom', value);
        this.updateStyle('paddingLeft', value);
    }

    // Standard style change handlers
    handleStyleChange(event) {
        event.stopPropagation();
        const property = event.target.dataset.property;
        let value = event.target.value;
        
        if (['borderRadius', 'fontSize', 'minHeight'].includes(property) && !isNaN(value) && value !== '') {
            value += 'px';
        }
        
        this.updateStyle(property, value);
    }

    handleColorChange(event) {
        event.stopPropagation();
        const property = event.target.dataset.property;
        const value = event.target.value;
        this.updateStyle(property, value);
    }

    handleBorderWidthChange(event) {
        event.stopPropagation();
        const direction = event.target.dataset.direction;
        let value = event.target.value;
        
        if (!isNaN(value) && value !== '') {
            value += 'px';
        }
        
        const property = `border${direction.charAt(0).toUpperCase() + direction.slice(1)}Width`;
        this.updateStyle(property, value);
    }

    updateStyle(property, value) {
        this.localStyles = {
            ...this.localStyles,
            [property]: value
        };
        
        if (this.isLivePreview) {
            this.dispatchEvent(new CustomEvent('styleupdate', {
                detail: this.localStyles
            }));
        }
    }

    // Preset handlers
    applyPreset(event) {
        event.stopPropagation();
        const preset = event.target.dataset.preset;
        const presets = this.getPresets();
        
        if (presets[preset]) {
            this.localStyles = {
                ...this.localStyles,
                ...presets[preset]
            };
            
            if (this.isLivePreview) {
                this.dispatchEvent(new CustomEvent('styleupdate', {
                    detail: this.localStyles
                }));
            }
        }
    }

    getPresets() {
        return {
            modern: {
                backgroundColor: '#1a202c',
                color: '#ffffff',
                padding: '60px',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            },
            minimal: {
                backgroundColor: '#ffffff',
                color: '#2d3748',
                padding: '40px',
                borderTopWidth: '1px',
                borderColor: '#e2e8f0',
                boxShadow: 'none'
            },
            corporate: {
                backgroundColor: '#2b6cb0',
                color: '#ffffff',
                padding: '50px',
                borderRadius: '0px',
                boxShadow: '0 4px 20px rgba(43, 108, 176, 0.3)'
            },
            elegant: {
                backgroundColor: '#4a5568',
                color: '#f7fafc',
                padding: '48px',
                borderRadius: '8px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
            }
        };
    }

    // Computed getters for input values
    get paddingTopValue() { return parseFloat(this.localStyles.paddingTop) || 0; }
    get paddingRightValue() { return parseFloat(this.localStyles.paddingRight) || 0; }
    get paddingBottomValue() { return parseFloat(this.localStyles.paddingBottom) || 0; }
    get paddingLeftValue() { return parseFloat(this.localStyles.paddingLeft) || 0; }

    get marginTopUnit() {
        return this.marginTopDisplayValue === 'auto' ? '' : 'px';
    }

    get marginRightUnit() {
        return this.marginRightDisplayValue === 'auto' ? '' : 'px';
    }

    get marginBottomUnit() {
        return this.marginBottomDisplayValue === 'auto' ? '' : 'px';
    }

    get marginLeftUnit() {
        return this.marginLeftDisplayValue === 'auto' ? '' : 'px';
    }

    // Complete display values with units
    get marginTopFullDisplay() {
        return this.marginTopDisplayValue + this.marginTopUnit;
    }

    get marginRightFullDisplay() {
        return this.marginRightDisplayValue + this.marginRightUnit;
    }

    get marginBottomFullDisplay() {
        return this.marginBottomDisplayValue + this.marginBottomUnit;
    }

    get marginLeftFullDisplay() {
        return this.marginLeftDisplayValue + this.marginLeftUnit;
    }
    
    get marginTopValue() { 
        const val = this.localStyles.marginTop;
        return val === 'auto' ? 0 : (parseFloat(val) || 0);
    }
    get marginRightValue() { 
        const val = this.localStyles.marginRight;
        return val === 'auto' ? 0 : (parseFloat(val) || 0);
    }
    get marginBottomValue() { 
        const val = this.localStyles.marginBottom;
        return val === 'auto' ? 0 : (parseFloat(val) || 0);
    }
    get marginLeftValue() { 
        const val = this.localStyles.marginLeft;
        return val === 'auto' ? 0 : (parseFloat(val) || 0);
    }
    
    get borderTopWidthValue() { return parseFloat(this.localStyles.borderTopWidth) || 0; }
    get borderRightWidthValue() { return parseFloat(this.localStyles.borderRightWidth) || 0; }
    get borderBottomWidthValue() { return parseFloat(this.localStyles.borderBottomWidth) || 0; }
    get borderLeftWidthValue() { return parseFloat(this.localStyles.borderLeftWidth) || 0; }
    
    get borderRadiusValue() { return parseFloat(this.localStyles.borderRadius) || 0; }
    get fontSizeValue() { return parseFloat(this.localStyles.fontSize) || 16; }
    get minHeightValue() { return parseFloat(this.localStyles.minHeight) || 200; }

    get backgroundColorValue() { return this.localStyles.backgroundColor || '#2c3e50'; }
    get textColorValue() { return this.localStyles.color || '#ffffff'; }
    get borderColorValue() { return this.localStyles.borderColor || '#ffffff'; }

    // Input display values
    get paddingTopDisplayValue() { return this.localStyles.paddingTop?.replace('px', '') || '0'; }
    get paddingRightDisplayValue() { return this.localStyles.paddingRight?.replace('px', '') || '0'; }
    get paddingBottomDisplayValue() { return this.localStyles.paddingBottom?.replace('px', '') || '0'; }
    get paddingLeftDisplayValue() { return this.localStyles.paddingLeft?.replace('px', '') || '0'; }
    
    get marginTopDisplayValue() { return this.localStyles.marginTop?.replace('px', '') || '0'; }
    get marginRightDisplayValue() { return this.localStyles.marginRight?.replace('px', '') || '0'; }
    get marginBottomDisplayValue() { return this.localStyles.marginBottom?.replace('px', '') || '0'; }
    get marginLeftDisplayValue() { return this.localStyles.marginLeft?.replace('px', '') || '0'; }

    get previewStyle() {
        return Object.entries(this.localStyles)
            .map(([key, value]) => {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                return `${cssKey}: ${value}`;
            })
            .join('; ') + '; min-height: 120px; display: flex; align-items: center; justify-content: center; border-radius: 8px;';
    }

    get livePreviewClass() {
        return this.isLivePreview ? 'toggle-switch active' : 'toggle-switch';
    }
}