import { LightningElement, api, track } from 'lwc';
import Sample_Logos from '@salesforce/resourceUrl/Sample_Logos';
import * as footerState from 'c/footerState';

const SAMPLE_LOGOS_BASE_URL = Sample_Logos + '/Sample_Logos';
export default class DivStyleModal extends LightningElement {
    @api currentDivId;
    @api selectedDivIds = [];
    @api currentDevice = 'desktop';
    
    @track localStyles = {};
    @track contentData = {};
    @track linkData = {};
    @track activeSection = 'content';
    @track contentMode = 'text';
    @track isLivePreview = false;
    @track isMultipleSelection = false;
    @track previewMode = 'both'; // 'individual', 'footer', 'both'
    @track highlightEnabled = true; // Default to true for better UX

    @track customClassName = '';

    @track socialIconsData = [];
    @track currentIconLayout = 'horizontal';
    @track currentIconAlignment = 'center';
    @track currentIconSize = 'medium';
    @track iconSpacingValue = 12;

    @track currentWidthType = '100%';
    @track currentHeightType = '100%';
    @track customDivWidthValue = '';
    @track customDivHeightValue = '';
    @track showCustomWidthInput = false;
    @track showCustomHeightInput = false;
    @track widthUnit = 'px';
    @track heightUnit = 'px';

    get formFactor() {
        return footerState.getFormFactor();
    }

    get configurations() {
        return footerState.getConfigurations();
    }

    connectedCallback() {
        this.isMultipleSelection = this.selectedDivIds.length > 1;
        this.initializeStyles();
    }

    initializeStyles() {
        const configurations = footerState.getConfigurations();
        const currentDeviceConfig = configurations[this.currentDevice];
        let currentDiv = null;
        
        if (this.currentDivId) {
            currentDiv = currentDeviceConfig?.gridItems.find(item => item.id === this.currentDivId);
        } else if (this.selectedDivIds.length > 0) {
            // For multi-selection, initialize with the first selected div's styles
            currentDiv = currentDeviceConfig?.gridItems.find(item => this.selectedDivIds.includes(item.id));
        }
        
        if (this.isMultipleSelection) {
            // For multi-selection, show default styles and clear content/link data
            this.localStyles = this.getDefaultDivStyles();
            this.localStyles.imageStyles = {}; // Ensure imageStyles is also reset
            this.contentData = {
                content: '',
                contentType: 'text',
                imageUrl: ''
            };
            this.linkData = {
                url: '',
                target: '_self',
                showPointer: false
            };
            this.contentMode = 'text';
            this.customClassName = '';
            this.socialIconsData = []; // Clear social icons for multi-selection
            this.activeSection = 'textStyling'; // Default to text styling when content tab is hidden
        } else if (currentDiv) {
            this.localStyles = { ...currentDiv.divStyles };
            this.localStyles.imageStyles = { ...currentDiv.divStyles.imageStyles };
            this.contentData = {
                content: currentDiv.content || '',
                contentType: currentDiv.contentType || 'text',
                imageUrl: currentDiv.imageUrl || ''
            };
            this.isLivePreview = currentDiv.contentType == 'image' || currentDiv.contentType == 'social-icons';
            this.linkData = {
                url: currentDiv.linkUrl || '',
                target: currentDiv.linkTarget || '_blank',
                showPointer: currentDiv.showPointer !== undefined ? currentDiv.showPointer : false
            };
            this.contentMode = this.contentData.contentType;
            this.customClassName = currentDiv.customClassName || this.generateClassName(currentDiv.content);
            
            // Initialize dimension types
            this.initializeDimensionTypes();
            
            // Initialize social icons if content type is social-icons
            this.initializeSocialIcons(currentDiv);
        } else {
            // Fallback for single selection if no currentDiv (e.g., new div)
            this.localStyles = this.getDefaultDivStyles();
            this.localStyles.imageStyles = {};
            this.contentData = {
                content: '',
                contentType: 'text',
                imageUrl: ''
            };
             this.isLivePreview = currentDiv.contentType == 'image' || currentDiv.contentType == 'social-icons';
            this.linkData = {
                url: '',
                target: '_self',
                showPointer: false
            };
            this.contentMode = 'text';
            this.customClassName = '';
            this.socialIconsData = [];
        }
        this.initializeDefaults();
    }   

    getDefaultDivStyles() {
        return {
            backgroundColor: 'transparent',
            color: '#212529',
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: '400',
            textAlign: 'left',
            lineHeight: '1.5',
            letterSpacing: '0px',
            textDecoration: 'none',
            fontStyle: 'normal',
            padding: '0px',
            paddingTop: '0px',
            paddingRight: '0px',
            paddingBottom: '0px',
            paddingLeft: '0px',
            margin: '0px',
            marginTop: '0px',
            marginRight: '0px',
            marginBottom: '0px',
            marginLeft: '0px',
            borderRadius: '0px',
            borderWidth: '0px',
            borderColor: '#dee2e6',
            borderStyle: 'solid',
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: 'none',
            opacity: '1',
            objectFit: 'cover',
            objectPosition: 'center',
            boxShadow: 'none',
            textShadow: 'none',
            cursor: 'default'
        };
    }

    initializeDimensionTypes() {
        // Initialize width type
        const width = this.localStyles.width || '100%';
        if (width === '100%' || width == 'auto') {
            this.currentWidthType = '100%';
        } else if (width === 'fit-content') {
            this.currentWidthType = 'fit-content';
        } else {
            this.currentWidthType = 'custom';
            this.showCustomWidthInput = true;
            const numValue = parseFloat(width);
            this.customDivWidthValue = numValue.toString();
            if (width.includes('%')) {
                this.widthUnit = '%';
            } else if (width.includes('px')) {
                this.widthUnit = 'px';
            } else if (width.includes('rem')) {
                this.widthUnit = 'rem';
            }
        }
        
        // Initialize height type
        const height = this.localStyles.height || '100%';
        if (height === '100%' || height == 'auto') {
            this.currentHeightType = '100%';
        } else if (height === 'fit-content') {
            this.currentHeightType = 'fit-content';
        } else {
            this.currentHeightType = 'custom';
            this.showCustomHeightInput = true;
            const numValue = parseFloat(height);
            this.customDivHeightValue = numValue.toString();
            if (height.includes('%')) {
                this.heightUnit = '%';
            } else if (height.includes('px')) {
                this.heightUnit = 'px';
            } else if (height.includes('rem')) {
                this.heightUnit = 'rem';
            }
        }
    }

    initializeDefaults() {
        const defaults = {
            backgroundColor: 'transparent',
            color: '#000000',
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: '400',
            textAlign: 'left',
            lineHeight: '1.5',
            letterSpacing: '0px',
            textDecoration: 'none',
            fontStyle: 'normal',
            padding: '0px',
            paddingTop: '0px',
            paddingRight: '0px',
            paddingBottom: '0px',
            paddingLeft: '0px',
            margin: '0px',
            marginTop: '0px',
            marginRight: '0px',
            marginBottom: '0px',
            marginLeft: '0px',
            borderRadius: '0px',
            borderWidth: '0px',
            borderColor: '#000000',
            borderStyle: 'solid',
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: 'none',
            opacity: '1',
            objectFit: 'cover',
            objectPosition: 'center',
            boxShadow: 'none',
            textShadow: 'none',
            cursor: 'default'
        };

        Object.keys(defaults).forEach(key => {
            if (this.localStyles[key] === undefined || this.localStyles[key] === null) {
                this.localStyles[key] = defaults[key];
            }
        });

        this.localStyles = { ...this.localStyles };
    }

    handleImageWidthChange(event) {
        event.stopPropagation();
        const value = event.target.value;
        this.updateImageStyle('width', value);
    }

    handleImageHeightChange(event) {
        event.stopPropagation();
        const value = event.target.value;
        this.updateImageStyle('height', value);
    }

    updateImageStyle(property, value) {
        // For image content, we need to store image-specific styles
        if (!this.localStyles.imageStyles) {
            this.localStyles.imageStyles = {};
        }
        
        let processedValue = value;
        // Ensure 'px' is appended for width, height, and borderRadius if numeric
        if (['width', 'height', 'borderRadius'].includes(property)) {
            if (value && !isNaN(value) && value !== 'auto' && value !== 'fit-content') {
                processedValue = value + 'px';
            }
        }
        
        // Handle background color separately, it should apply to the div, not the image
        if (property === 'backgroundColor') {
            this.updateStyle('backgroundColor', value);
            return;
        }

        this.localStyles.imageStyles[property] = processedValue;
        this.localStyles = { ...this.localStyles };
        
        if (this.isLivePreview) {
            this.dispatchStyleUpdate();
        }
    }

    // Social icons event handlers
    handleLayoutChange(event) {
        this.currentIconLayout = event.detail.value;
        this.updateSocialIconsData();
    }

    handleAlignmentChange(event) {
        this.currentIconAlignment = event.detail.value;
        this.updateSocialIconsData();
    }

    handleSizeChange(event) {
        this.currentIconSize = event.detail.value;
        this.updateSocialIconsData();
    }

    handleSpacingChange(event) {
        this.iconSpacingValue = parseInt(event.target.value);
        this.updateSocialIconsData();
    }

    handleAddIcon() {
        const newIcon = {
            id: `icon_${Date.now()}`,
            platform: 'facebook',
            iconUrl: this.getPlatformIconUrl('facebook'),
            linkUrl: '',
            linkTarget: '_blank',
            order: this.socialIconsData.length + 1,
            isCustom: false,
            customIconUrl: ''
        };
        
        this.socialIconsData = [...this.socialIconsData, newIcon];
        this.updateIconDisplayProperties();
        this.updateSocialIconsData();
    }

    handleAddPresetIcon(event) {
        const platform = event.currentTarget.dataset.platform;
        
        // Check if platform already exists
        const exists = this.socialIconsData.some(icon => icon.platform === platform);
        if (exists) {
            // You could show a toast message here
            console.warn(`${platform} icon already added`);
            return;
        }
        
        const newIcon = {
            id: `icon_${Date.now()}`,
            platform: platform,
            iconUrl: this.getPlatformIconUrl(platform),
            linkUrl: '',
            linkTarget: '_blank',
            order: this.socialIconsData.length + 1,
            isCustom: false,
            customIconUrl: ''
        };
        
        this.socialIconsData = [...this.socialIconsData, newIcon];
        this.updateIconDisplayProperties();
        this.updateSocialIconsData();
    }

    handlePlatformChange(event) {
        const iconId = event.currentTarget.dataset.iconId;
        const platform = event.detail.value;
        
        this.socialIconsData = this.socialIconsData.map(icon => {
            if (icon.id === iconId) {
                return {
                    ...icon,
                    platform: platform,
                    iconUrl: platform === 'custom' ? icon.customIconUrl : this.getPlatformIconUrl(platform),
                    isCustom: platform === 'custom',
                    // Ensure customIconUrl is cleared if switching from custom
                    ...(platform !== 'custom' && { customIconUrl: '' })
                };
            }
            return icon;
        });
        
        this.updateIconDisplayProperties();
        this.updateSocialIconsData();
    }

    handleCustomIconUrlChange(event) {
        const iconId = event.currentTarget.dataset.iconId;
        const customUrl = event.target.value;
        
        this.socialIconsData = this.socialIconsData.map(icon => {
            if (icon.id === iconId) {
                return {
                    ...icon,
                    customIconUrl: customUrl,
                    iconUrl: customUrl
                };
            }
            return icon;
        });
        
        this.updateSocialIconsData();
    }

    handleIconLinkChange(event) {
        const iconId = event.currentTarget.dataset.iconId;
        const linkUrl = event.target.value;
        
        this.socialIconsData = this.socialIconsData.map(icon => {
            if (icon.id === iconId) { return { ...icon, linkUrl: linkUrl }; }
            return icon;
        });
        
        this.updateSocialIconsData();
    }

    handleIconTargetChange(event) {
        const iconId = event.currentTarget.dataset.iconId;
        const linkTarget = event.detail.value;
        
        this.socialIconsData = this.socialIconsData.map(icon => {
            if (icon.id === iconId) { return { ...icon, linkTarget: linkTarget }; }
            return icon;
        });
        
        this.updateSocialIconsData();
    }

    handleMoveIconUp(event) {
        const iconId = event.currentTarget.dataset.iconId;
        const currentIndex = this.socialIconsData.findIndex(icon => icon.id === iconId);
        
        if (currentIndex > 0) {
            const newData = [...this.socialIconsData];
            [newData[currentIndex - 1], newData[currentIndex]] = [newData[currentIndex], newData[currentIndex - 1]];
            this.socialIconsData = newData;
            this.updateIconDisplayProperties();
            this.updateSocialIconsData();
        }
    }

    handleMoveIconDown(event) {
        const iconId = event.currentTarget.dataset.iconId;
        const currentIndex = this.socialIconsData.findIndex(icon => icon.id === iconId);
        
        if (currentIndex < this.socialIconsData.length - 1) {
            const newData = [...this.socialIconsData];
            [newData[currentIndex], newData[currentIndex + 1]] = [newData[currentIndex + 1], newData[currentIndex]];
            this.socialIconsData = newData;
            this.updateIconDisplayProperties();
            this.updateSocialIconsData();
        }
    }

    handleDeleteIcon(event) {
        const iconId = event.currentTarget.dataset.iconId;
        this.socialIconsData = this.socialIconsData.filter(icon => icon.id !== iconId);
        this.updateIconDisplayProperties();
        this.updateSocialIconsData();
    }

    // Update icon display properties (for first/last indicators)
    updateIconDisplayProperties() {
        this.socialIconsData = this.socialIconsData.map((icon, index) => ({
            ...icon,
            isFirst: index === 0,
            isLast: index === this.socialIconsData.length - 1
        }));
    }

    // Update and dispatch social icons data
    updateSocialIconsData() {
        if (this.isLivePreview) {
            this.dispatchStyleUpdate();
        }
    }

    // Section Management
    get isContentActive() { return this.activeSection === 'content' && !this.isMultipleSelection; }
    get isTextStylingActive() { return this.activeSection === 'textStyling'; }
    get isImageStylingActive() { return this.activeSection === 'imageStyling'; }
    get isSpacingActive() { return this.activeSection === 'spacing'; }
    get isEffectsActive() { return this.activeSection === 'effects'; }

    get contentTabClass() { return this.activeSection === 'content' ? 'section-tab active' : 'section-tab'; }
    get textStylingTabClass() { return this.activeSection === 'textStyling' ? 'section-tab active' : 'section-tab'; }
    get imageStylingTabClass() { return this.activeSection === 'imageStyling' ? 'section-tab active' : 'section-tab'; }
    get spacingTabClass() { return this.activeSection === 'spacing' ? 'section-tab active' : 'section-tab'; }
    get effectsTabClass() { return this.activeSection === 'effects' ? 'section-tab active' : 'section-tab'; }

    get isTextMode() { return this.contentMode === 'text'; }
    get isImageMode() { return this.contentMode === 'image'; }
    get isSocialIconsMode() { return this.contentMode === 'social-icons'; }

    get showContentTab() {
        return !this.isMultipleSelection;
    }

    // Preview Mode Management
    get showIndividual() {
        return this.previewMode === 'individual' || this.previewMode === 'both';
    }

    get showFooter() {
        return this.previewMode === 'footer' || this.previewMode === 'both';
    }

    get individualPreviewClass() {
        return this.previewMode === 'individual' ? 'preview-toggle-btn active' : 'preview-toggle-btn';
    }

    get footerPreviewClass() {
        return this.previewMode === 'footer' ? 'preview-toggle-btn active' : 'preview-toggle-btn';
    }

    get bothPreviewClass() {
        return this.previewMode === 'both' ? 'preview-toggle-btn active' : 'preview-toggle-btn';
    }

    // Highlight Toggle Management
    get highlightToggleClass() {
        return this.highlightEnabled ? 'preview-toggle-btn highlight-btn active' : 'preview-toggle-btn highlight-btn';
    }

    get highlightButtonText() {
        return this.highlightEnabled ? 'Highlight ON' : 'Highlight OFF';
    }

    get highlightDescription() {
        return this.highlightEnabled 
            ? 'Current div is highlighted in footer preview with green outline'
            : 'Highlight disabled - all divs shown normally in footer preview';
    }

    get highlightDivIds() {
        return this.highlightEnabled ? (this.isMultipleSelection ? this.selectedDivIds : [this.currentDivId]) : [];
    }

    handleSectionChange(event) {
        event.stopPropagation();
        this.activeSection = event.currentTarget.dataset.section;
        setTimeout(() => {
            this.localStyles = { ...this.localStyles };
        }, 50);
    }

    handleContentModeChange(event) {
        event.stopPropagation();
        this.contentMode = event.target.value;
        this.isLivePreview = this.contentMode == 'image' || currentDiv.contentType == 'social-icons';
        this.contentData = {
            ...this.contentData,
            contentType: this.contentMode
        };

        if (this.contentMode === 'social-icons' && this.socialIconsData.length === 0) {
            this.socialIconsData = [];
        }
        
        if (this.isLivePreview) {
            this.dispatchStyleUpdate();
        }
    }

    // Preview Mode Methods
    showIndividualPreview() {
        this.previewMode = 'individual';
    }

    showFooterPreview() {
        this.previewMode = 'footer';
        // Auto-enable highlight when switching to footer-only view for better UX
        if (!this.highlightEnabled) {
            this.highlightEnabled = true;
        }
    }

    showBothPreviews() {
        this.previewMode = 'both';
    }

    toggleHighlight() {
        this.highlightEnabled = !this.highlightEnabled;
        
        // Refresh footer preview immediately when highlight is toggled
        if (this.showFooter) {
            setTimeout(() => {
                const footerPreview = this.template.querySelector('c-footer-preview');
                if (footerPreview && footerPreview.refreshPreview) {
                    footerPreview.refreshPreview();
                }
            }, 50);
        }
    }

    handleModalClick(event) {
        event.stopPropagation();
    }

    handleClose() {
        this.highlightEnabled = false; // Turn off highlight when modal closes
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleSave() {
        this.dispatchStyleUpdate();
        this.highlightEnabled = false; // Turn off highlight when saving
        this.handleClose();
    }

    handleReset() {
        this.localStyles = {
            backgroundColor: 'transparent',
            color: '#000000',
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            fontWeight: '400',
            textAlign: 'left',
            lineHeight: '1.5',
            letterSpacing: '0px',
            textDecoration: 'none',
            fontStyle: 'normal',
            padding: '0px',
            paddingTop: '0px',
            paddingRight: '0px',
            paddingBottom: '0px',
            paddingLeft: '0px',
            margin: '0px',
            marginTop: '0px',
            marginRight: '0px',
            marginBottom: '0px',
            marginLeft: '0px',
            borderRadius: '0px',
            borderWidth: '0px',
            borderColor: '#000000',
            borderStyle: 'solid',
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: 'none',
            opacity: '1',
            objectFit: 'cover',
            objectPosition: 'center',
            boxShadow: 'none',
            textShadow: 'none',
            cursor: 'default'
        };
        
        this.contentData = {
            content: '',
            contentType: 'text',
            imageUrl: ''
        };
        
        this.linkData = {
            url: '',
            target: '_self',
            showPointer: false
        };
        
        this.contentMode = 'text';
    }

    toggleLivePreview() {
        this.isLivePreview = !this.isLivePreview;
    }

    // Content Handlers
    handleContentChange(event) {
        event.stopPropagation();
           this.contentData = {
            ...this.contentData,
            content: event.target.value
        };
        
        if (!this.customClassName) {
            this.customClassName = this.generateClassName(event.target.value);
        }

        if (this.isLivePreview) {
            this.dispatchStyleUpdate();
        }
    }

    handleClassNameChange(event) {
        this.customClassName = event.target.value;
    }

    generateClassName(content) {
        if (!content) return '';
        return content.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
    }

    handleImageUrlChange(event) {
        event.stopPropagation();
        this.contentData = {
            ...this.contentData,
            imageUrl: event.target.value
        };
        
        if (this.isLivePreview) {
            this.dispatchStyleUpdate();
        }
    }

    // Link Handlers
    handleLinkUrlChange(event) {
        event.stopPropagation();
        const url = event.target.value;
        this.linkData = {
            ...this.linkData,
            url: event.target.value
        };
        
        if (url && this.linkData.showPointer) {
            this.updateStyle('cursor', 'pointer');
        } else if (!url) {
            this.updateStyle('cursor', 'default');
        }
        
        if (this.isLivePreview) {
            this.dispatchStyleUpdate();
        }
    }

    handleLinkTargetChange(event) {
        event.stopPropagation();
        this.linkData = {
            ...this.linkData,
            target: event.detail.value
        };
        
        if (this.isLivePreview) {
            this.dispatchStyleUpdate();
        }
    }

    handleShowPointerChange(event) {
        event.stopPropagation();
        this.linkData = {
            ...this.linkData,
            showPointer: event.target.checked
        };

        if (this.linkData.url) {
            this.updateStyle('cursor', this.linkData.showPointer ? 'pointer' : 'default');
        }
        
        if (this.isLivePreview) {
            this.dispatchStyleUpdate();
        }

        //this.updateStyle('cursor', event.target.checked ? 'pointer' : 'default');
    }

    handlePresetImageSelect(event) {
        event.stopPropagation();
        const imageUrl = event.currentTarget.dataset.url;
        this.contentData = {
            ...this.contentData,
            imageUrl: imageUrl
        };
        
        if (this.isLivePreview) {
            this.dispatchStyleUpdate();
        }
    }

    // Style Change Handlers
    handleStyleChange(event) {
        event.stopPropagation();
        const property = event.target.dataset.property || event.target.name;
        let value = event.detail ? event.detail.value : event.target.value;
        
        // Determine if the property is an image-specific style
        const imageProperties = ['width', 'height', 'maxWidth', 'objectFit', 'objectPosition', 'opacity', 'borderRadius'];
        if (this.isImageMode && imageProperties.includes(property)) {
            this.updateImageStyle(property, value);
        } else {
            if (['fontSize', 'letterSpacing', 'borderRadius', 'borderWidth'].includes(property) && !isNaN(value) && value !== '') {
                value += 'px';
            }
            this.updateStyle(property, value);
        }
    }

    handleColorChange(event) {
        event.stopPropagation();
        const property = event.target.dataset.property;
        const value = event.target.value;
        this.updateStyle(property, value);
    }

    handleImageColorChange(event) {
        event.stopPropagation();
        const property = event.target.dataset.property;
        const value = event.target.value;
        // Background color should apply to the div, not the image
        this.updateStyle(property, value);
    }

    handleImageStyleChange(event) {
        event.stopPropagation();
        const property = event.target.dataset.property;
        const value = event.target.value;
        // Border radius should apply to the div, not the image
        if (property === 'borderRadius') {
            this.updateStyle(property, value);
        } else {
            this.updateImageStyle(property, value);
        }
    }

    // Spacing Handlers
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
        
        if (value === '') return;
        
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

    // Unified Controls
    handleUnifiedPaddingChange(event) {
        event.stopPropagation();
        let value = event.target.value.trim();
        
        if (value === '') return;
        
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            value = numValue + 'px';
        }
        
        this.updateStyle('padding', value);
        this.updateStyle('paddingTop', value);
        this.updateStyle('paddingRight', value);
        this.updateStyle('paddingBottom', value);
        this.updateStyle('paddingLeft', value);
    }

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
        
        this.updateStyle('margin', value);
        this.updateStyle('marginTop', value);
        this.updateStyle('marginRight', value);
        this.updateStyle('marginBottom', value);
        this.updateStyle('marginLeft', value);
    }

    updateStyle(property, value) {
        this.localStyles = {
            ...this.localStyles,
            [property]: value
        };
        if (this.isLivePreview) {
            // Clear any existing timer
            clearTimeout(this.debounceStyleUpdate);

            // Set a new timer
            this.debounceStyleUpdate = setTimeout(() => {
                this.dispatchStyleUpdate();
            }, 250); // 250ms delay
        }
    }

    dispatchStyleUpdate() {
        const updates = {
            divStyles: { ...this.localStyles, imageStyles: { ...this.localStyles.imageStyles } },
            customClassName: this.customClassName
        };

        // Only include content, link, and social icon data if not in multi-selection mode
        if (!this.isMultipleSelection) {
            updates.content = this.contentData.content;
            updates.contentType = this.contentMode;
            updates.imageUrl = this.contentData.imageUrl;
            updates.linkUrl = this.linkData.url;
            updates.linkTarget = this.linkData.target;
            updates.showPointer = this.linkData.showPointer;
            updates.socialIcons = this.socialIconsData;
            updates.iconLayout = this.currentIconLayout;
            updates.iconAlignment = this.currentIconAlignment;
            updates.iconSize = this.currentIconSize;
            updates.iconSpacing = this.iconSpacingValue + 'px';
        }
        console.log('Dispatching style update from divStyleModal. Updates:', JSON.stringify(updates));
        
        // Determine target IDs - prioritize selectedDivIds if multiple selection
        const targetIds = this.selectedDivIds.length > 0 ? this.selectedDivIds :
                        this.currentDivId ? [this.currentDivId] : [];
        
        if (targetIds.length === 0) {
            console.warn('No target divs found for style update');
            return;
        }

        targetIds.forEach(cellId => {
            footerState.updateGridItem(cellId, this.currentDevice, updates);
        });

        // No need to refresh footer preview here, state service handles it
    }

        // Add these methods after existing spacing handlers
    handleUnifiedBorderRadiusChange(event) {
        event.stopPropagation();
        let value = event.target.value.trim();
        if (value === '') return;
        
        let numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            value = numValue + 'px';
        }

        this.updateStyle('borderRadius', value);
        this.updateStyle('borderTopLeftRadius', value);
        this.updateStyle('borderTopRightRadius', value);
        this.updateStyle('borderBottomLeftRadius', value);
        this.updateStyle('borderBottomRightRadius', value);
    }

    handleBorderRadiusSliderChange(event) {
        event.stopPropagation();
        const direction = event.target.dataset.direction;
        const value = parseFloat(event.target.value);
        const property = `border${this.capitalizeDirection(direction)}Radius`;
        this.updateStyle(property, value + 'px');
    }

    handleBorderRadiusInputChange(event) {
        event.stopPropagation();
        const direction = event.target.dataset.direction;
        let value = event.target.value.trim();
        if (value === '') return;
        
        let numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            value = numValue + 'px';
        }
        
        const property = `border${this.capitalizeDirection(direction)}Radius`;
        this.updateStyle(property, value);
    }

    capitalizeDirection(direction) {
        const directionMap = {
            'topLeft': 'TopLeft',
            'topRight': 'TopRight', 
            'bottomLeft': 'BottomLeft',
            'bottomRight': 'BottomRight'
        };
        return directionMap[direction] || direction;
    }

    // Add getters for border radius values
    get borderRadiusUnifiedValue() { 
        return this.localStyles.borderRadius?.replace('px', '') || '0'; 
    }
    get borderTopLeftRadiusValue() { 
        return parseFloat(this.localStyles.borderTopLeftRadius) || 0; 
    }
    get borderTopRightRadiusValue() { 
        return parseFloat(this.localStyles.borderTopRightRadius) || 0; 
    }
    get borderBottomLeftRadiusValue() { 
        return parseFloat(this.localStyles.borderBottomLeftRadius) || 0; 
    }
    get borderBottomRightRadiusValue() { 
        return parseFloat(this.localStyles.borderBottomRightRadius) || 0; 
    }
    get borderTopLeftRadiusDisplayValue() { 
        return this.localStyles.borderTopLeftRadius?.replace('px', '') || '0'; 
    }
    get borderTopRightRadiusDisplayValue() { 
        return this.localStyles.borderTopRightRadius?.replace('px', '') || '0'; 
    }
    get borderBottomLeftRadiusDisplayValue() { 
        return this.localStyles.borderBottomLeftRadius?.replace('px', '') || '0'; 
    }
    get borderBottomRightRadiusDisplayValue() { 
        return this.localStyles.borderBottomRightRadius?.replace('px', '') || '0'; 
    }


    // Enhanced preview styles for social icons
    get socialIconsPreviewStyle() {
        const containerStyles = this.getContainerStylesForPreview(this.localStyles);
        const configurations = footerState.getConfigurations();
        const currentDeviceConfig = configurations[this.currentDevice];
        let background = this.localStyles.backgroundColor == 'transparent' ? 
                        currentDeviceConfig.footerStyles.backgroundColor : this.localStyles.backgroundColor;
        
        const flexDirection = this.currentIconLayout === 'horizontal' ? 'row' : 'column';
        const gap = this.iconSpacingValue + 'px';
        
        const socialStyles = `
            display: flex;
            flex-direction: ${flexDirection};
            justify-content: ${this.currentIconAlignment};
            align-items: center;
            gap: ${gap};
            flex-wrap: wrap;
            padding: 20px;
        `;
        
        return containerStyles + `; background: ${background}; ${socialStyles}; min-height: 120px; border-radius: 8px; word-break: break-word; position: relative;`;
    }   

    get socialIconPreviewStyle() {
        const size = this.getIconSizeInPx() + 'px';
        return `width: ${size}; height: ${size}; object-fit: contain; border-radius: 44px; transition: all 0.2s ease;`;
    }

    // Get icon size in pixels
    getIconSizeInPx() {
        const sizes = {
            small: '24',
            medium: '32',
            large: '48',
            xl: '64'
        };
        return sizes[this.currentIconSize] || '32';
    }


    // Preset Handlers
    applyTextPreset(event) {
        event.stopPropagation();
        const preset = event.target.dataset.preset;
        const presets = this.getTextPresets();
        
        if (presets[preset]) {
            Object.keys(presets[preset]).forEach(key => {
                this.localStyles[key] = presets[preset][key];
            });
            
            this.localStyles = { ...this.localStyles };
            
            if (this.isLivePreview) {
                this.dispatchStyleUpdate();
            }
        }
    }

    applyImagePreset(event) {
        event.stopPropagation();
        const preset = event.target.dataset.preset;
        const presets = this.getImagePresets();
        
        if (presets[preset]) {
            Object.keys(presets[preset]).forEach(key => {
                // Use updateImageStyle for image-specific properties
                if (['width', 'height', 'objectFit', 'objectPosition', 'opacity', 'borderRadius'].includes(key)) {
                    this.updateImageStyle(key, presets[preset][key]);
                } else {
                    this.localStyles[key] = presets[preset][key];
                }
            });
            
            this.localStyles = { ...this.localStyles };
            
            if (this.isLivePreview) {
                this.dispatchStyleUpdate();
            }
        }
    }

    getTextPresets() {
        return {
            heading: {
                fontSize: '24px',
                fontWeight: '600',
                color: '#000000',
                textAlign: 'center',
                lineHeight: '1.2',
                textDecoration: 'none'
            },
            body: {
                fontSize: '16px',
                fontWeight: '400',
                color: '#333333',
                textAlign: 'left',
                lineHeight: '1.6',
                textDecoration: 'none'
            },
            caption: {
                fontSize: '12px',
                fontWeight: '300',
                color: '#666666',
                textAlign: 'center',
                lineHeight: '1.4',
                textDecoration: 'none'
            },
            link: {
                fontSize: '14px',
                fontWeight: '500',
                color: '#0066cc',
                textDecoration: 'underline',
                textAlign: 'left',
                cursor: 'pointer'
            }
        };
    }

    getImagePresets() {
        return {
            cover: {
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                objectPosition: 'center',
                opacity: '1',
                borderRadius: '0px'
            },
            contain: {
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                objectPosition: 'center',
                opacity: '1',
                borderRadius: '0px'
            },
            circle: {
                width: '100px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '50%',
                opacity: '1'
            },
            rounded: {
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
                borderRadius: '12px',
                opacity: '1'
            }
        };
    }

    // Enhanced preview styles that separate container and content styles
    get previewStyle() {
        if (this.isSocialIconsMode) {
            return this.socialIconsPreviewStyle;
        }
        // Only container styles for the wrapper div
        const containerStyles = this.getContainerStylesForPreview(this.localStyles);
        const configurations = footerState.getConfigurations();
        const currentDeviceConfig = configurations[this.currentDevice];
        let background = this.localStyles.backgroundColor == 'transparent' ? 
                        currentDeviceConfig.footerStyles.backgroundColor : this.localStyles.backgroundColor;
        
        // Ensure background is always set, even if transparent
        if (!background) {
            background = 'transparent';
        }

        return containerStyles + `; background : ${background}; display: flex; align-items: center; justify-content: center;`;
    }

    get textContentStyle() {
        // Only text-specific styles for the text content
        const textStyles = this.getTextStylesForPreview(this.localStyles);
        return textStyles;
    }

    get imageContentStyle() {
        // Only image-specific styles for the image
        let imageStyles = this.getImageStylesForPreview(this.localStyles);
        if (this.linkData.url && this.linkData.showPointer) {
            imageStyles += "; cursor: pointer;";
        }

        return imageStyles;
    }

    // Helper methods to separate styles (similar to footerPreview)
    getContainerStylesForPreview(divStyles) {
        const containerProperties = [
            'backgroundColor', 'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
            'borderRadius', 'borderWidth', 'borderColor', 'borderStyle', 'boxShadow', 
            'width', 'height'
        ];
        
        let styles = Object.entries(divStyles || {})
            .filter(([key]) => containerProperties.includes(key))
            .map(([key, value]) => {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                return `${cssKey}: ${value}`;
            })
            .join('; ');

        // Add specific border-radius properties if they exist
        if (divStyles.borderTopLeftRadius) styles += `; border-top-left-radius: ${divStyles.borderTopLeftRadius};`;
        if (divStyles.borderTopRightRadius) styles += `; border-top-right-radius: ${divStyles.borderTopRightRadius};`;
        if (divStyles.borderBottomLeftRadius) styles += `; border-bottom-left-radius: ${divStyles.borderBottomLeftRadius};`;
        if (divStyles.borderBottomRightRadius) styles += `; border-bottom-right-radius: ${divStyles.borderBottomRightRadius};`;

        return styles;
    }

    getTextStylesForPreview(divStyles) {
        const textProperties = [
            'color', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
            'textAlign', 'lineHeight', 'letterSpacing',
            'textShadow', 'cursor'
        ];
        
        let styles = Object.entries(divStyles || {})
            .filter(([key]) => textProperties.includes(key))
            .map(([key, value]) => {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                return `${cssKey}: ${value}`;
            })
            .join('; ');
        
        // Add display properties to make text-align work properly
        return styles + '; display: block; width: 100%;';
    }

    getImageStylesForPreview(divStyles) {
        const imageProperties = [
            'width', 'height', 'maxWidth', 'maxHeight',
            'objectFit', 'objectPosition', 'opacity',
            'cursor' // Border radius and background color are for the div container
        ];
        
        const styles = Object.entries(divStyles.imageStyles || {})
            .filter(([key]) => imageProperties.includes(key))
            .map(([key, value]) => {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                return `${cssKey}: ${value}`;
            })
            .join('; ');
        
        return styles + '; max-width: 100%;';
    }

    handleDivWidthTypeChange(event) {
        this.currentWidthType = event.detail.value;
        
        switch (this.currentWidthType) {
            case '100%':
                this.updateStyle('width', '100%');
                this.showCustomWidthInput = false;
                break;
            case 'fit-content':
                this.updateStyle('width', 'fit-content');
                this.showCustomWidthInput = false;
                break;
            case 'custom':
                this.showCustomWidthInput = true;
                if (this.customDivWidthValue) {
                    this.updateStyle('width', this.customDivWidthValue + this.widthUnit);
                } else {
                    this.customDivWidthValue = '200';
                    this.updateStyle('width', '200px');
                }
                break;
        }
    }

    // Height type change handler
    handleDivHeightTypeChange(event) {
        this.currentHeightType = event.detail.value;
        
        switch (this.currentHeightType) {
            case '100%':
                this.updateStyle('height', '100%');
                this.showCustomHeightInput = false;
                break;
            case 'fit-content':
                this.updateStyle('height', 'fit-content');
                this.showCustomHeightInput = false;
                break;
            case 'custom':
                this.showCustomHeightInput = true;
                if (this.customDivHeightValue) {
                    this.updateStyle('height', this.customDivHeightValue + this.heightUnit);
                } else {
                    this.customDivHeightValue = '100';
                    this.updateStyle('height', '100px');
                }
                break;
        }
    }

    // Custom dimension handlers
    handleCustomDivWidthChange(event) {
        const value = event.target.value;
        this.customDivWidthValue = value;
        
        if (value && !isNaN(parseFloat(value))) {
            this.updateStyle('width', value + this.widthUnit);
        }
    }

    handleCustomDivHeightChange(event) {
        const value = event.target.value;
        this.customDivHeightValue = value;
        
        if (value && !isNaN(parseFloat(value))) {
            this.updateStyle('height', value + this.heightUnit);
        }
    }

    // Unit change handlers
    handleWidthUnitChange(event) {
        this.widthUnit = event.detail.value;
        if (this.customDivWidthValue && !isNaN(parseFloat(this.customDivWidthValue))) {
            this.updateStyle('width', this.customDivWidthValue + this.widthUnit);
        }
    }

    handleHeightUnitChange(event) {
        this.heightUnit = event.detail.value;
        if (this.customDivHeightValue && !isNaN(parseFloat(this.customDivHeightValue))) {
            this.updateStyle('height', this.customDivHeightValue + this.heightUnit);
        }
    }

    initializeSocialIcons(currentDiv) {
        if (currentDiv && currentDiv.contentType === 'social-icons') {
            this.socialIconsData = currentDiv.socialIcons || [];
            this.currentIconLayout = currentDiv.iconLayout || 'horizontal';
            this.currentIconAlignment = currentDiv.iconAlignment || 'center';
            this.currentIconSize = currentDiv.iconSize || 'medium';
            this.iconSpacingValue = parseFloat(currentDiv.iconSpacing) || 12;
            
            // Update display properties for icons
            this.updateIconDisplayProperties();
        } else {
            this.socialIconsData = [];
            this.currentIconLayout = 'horizontal';
            this.currentIconAlignment = 'center';
            this.currentIconSize = 'medium';
            this.iconSpacingValue = 12;
        }
    }

    get processedTextLines() {
        if (!this.contentData.content) return [];
        const unescapedContent = this.contentData.content.replace(/\\n/g, '\n');
        let result =  unescapedContent.trim().split('\n').map((line, index) => ({
            id: `line-${index}`,
            text: line
        }));
        return result;
    }

    // Lightning Combobox Options
    get textAlignOptions() {
        return [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
            { label: 'Justify', value: 'justify' }
        ];
    }

    get fontWeightOptions() {
        return [
            { label: 'Light (300)', value: '300' },
            { label: 'Normal (400)', value: '400' },
            { label: 'Medium (500)', value: '500' },
            { label: 'Semi Bold (600)', value: '600' },
            { label: 'Bold (700)', value: '700' }
        ];
    }

    get fontFamilyOptions() {
        return [
            { label: 'Arial', value: 'Arial, sans-serif' },
            { label: 'Georgia', value: 'Georgia, serif' },
            { label: 'Times New Roman', value: "'Times New Roman', serif" },
            { label: 'Courier New', value: "'Courier New', monospace" },
            { label: 'Helvetica', value: 'Helvetica, sans-serif' },
            { label: 'Verdana', value: 'Verdana, sans-serif' }
        ];
    }

    get fontStyleOptions() {
        return [
            { label: 'Normal', value: 'normal' },
            { label: 'Italic', value: 'italic' }
        ];
    }

    get textDecorationOptions() {
        return [
            { label: 'No Decoration', value: 'none' },
            { label: 'Underline', value: 'underline' },
            { label: 'Strike Through', value: 'line-through' },
            { label: 'Overline', value: 'overline' }
        ];
    }

    get objectFitOptions() {
        return [
            { label: 'Cover', value: 'cover' },
            { label: 'Contain', value: 'contain' },
            { label: 'Fill', value: 'fill' },
            { label: 'Scale Down', value: 'scale-down' },
            { label: 'None', value: 'none' }
        ];
    }

    get objectPositionOptions() {
        return [
            { label: 'Center', value: 'center' },
            { label: 'Top', value: 'top' },
            { label: 'Bottom', value: 'bottom' },
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
            { label: 'Top Left', value: 'top left' },
            { label: 'Top Right', value: 'top right' },
            { label: 'Bottom Left', value: 'bottom left' },
            { label: 'Bottom Right', value: 'bottom right' }
        ];
    }

    get linkTargetOptions() {
    return [
        { label: 'Same Tab (_self)', value: '_self' },
        { label: 'New Tab (_blank)', value: '_blank' },
        { label: 'Parent Frame (_parent)', value: '_parent' },
        { label: 'Top Frame (_top)', value: '_top' }
    ];
}

    // Link display getters for preview
    get linkTargetDisplay() {
        const targetLabels = {
            '_self': 'Same Tab',
            '_blank': 'New Tab',
            '_parent': 'Parent Frame',
            '_top': 'Top Frame'
        };
        return targetLabels[this.linkData.target] || 'Same Tab';
    }

    get pointerCursorDisplay() {
        return this.linkData.showPointer ? 'Pointer (hand)' : 'Default';
    }

    get borderStyleOptions() {
        return [
            { label: 'Solid', value: 'solid' },
            { label: 'Dashed', value: 'dashed' },
            { label: 'Dotted', value: 'dotted' },
            { label: 'None', value: 'none' }
        ];
    }

    get boxShadowOptions() {
        return [
            { label: 'None', value: 'none' },
            { label: 'Subtle', value: '0 2px 4px rgba(0,0,0,0.1)' },
            { label: 'Medium', value: '0 4px 12px rgba(0,0,0,0.15)' },
            { label: 'Strong', value: '0 8px 25px rgba(0,0,0,0.25)' },
            { label: 'Dramatic', value: '0 15px 35px rgba(0,0,0,0.3)' }
        ];
    }

    get textShadowOptions() {
        return [
            { label: 'None', value: 'none' },
            { label: 'Subtle', value: '1px 1px 2px rgba(0,0,0,0.3)' },
            { label: 'Medium', value: '2px 2px 4px rgba(0,0,0,0.5)' },
            { label: 'Strong', value: '3px 3px 6px rgba(0,0,0,0.7)' }
        ];
    }

    get linkTargetOptions() {
        return [
            { label: 'Same Tab', value: '_self' },
            { label: 'New Tab', value: '_blank' }
        ];
    }

    get widthOptions() {
        return [
            { label: 'Auto', value: 'auto' },
            { label: 'Full Width (100%)', value: '100%' },
            { label: '75%', value: '75%' },
            { label: '50%', value: '50%' },
            { label: '25%', value: '25%' },
            { label: 'Fixed 200px', value: '200px' },
            { label: 'Fixed 150px', value: '150px' },
            { label: 'Fixed 100px', value: '100px' }
        ];
    }

    get heightOptions() {
        return [
            { label: 'Auto', value: 'auto' },
            { label: '200px', value: '200px' },
            { label: '150px', value: '150px' },
            { label: '100px', value: '100px' },
            { label: '75px', value: '75px' },
            { label: '50px', value: '50px' }
        ];
    }

    get maxWidthOptions() {
        return [
            { label: '100%', value: '100%' },
            { label: '300px', value: '300px' },
            { label: '200px', value: '200px' },
            { label: '150px', value: '150px' },
            { label: 'No Limit', value: 'none' }
        ];
    }

    // Computed getters for input values
    get paddingTopValue() { return parseFloat(this.localStyles.paddingTop) || 0; }
    get paddingRightValue() { return parseFloat(this.localStyles.paddingRight) || 0; }
    get paddingBottomValue() { return parseFloat(this.localStyles.paddingBottom) || 0; }
    get paddingLeftValue() { return parseFloat(this.localStyles.paddingLeft) || 0; }
    
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

    get fontSizeValue() { return parseFloat(this.localStyles.fontSize) || 14; }
    get letterSpacingValue() { return parseFloat(this.localStyles.letterSpacing) || 0; }
    get borderRadiusValue() { return parseFloat(this.localStyles.imageStyles?.borderRadius) || 0; }
    get borderWidthValue() { return parseFloat(this.localStyles.borderWidth) || 0; }
    get opacityValue() { return parseFloat(this.localStyles.imageStyles?.opacity) || 1; }
    get lineHeightValue() { return parseFloat(this.localStyles.lineHeight) || 1.5; }

    // Width and Height display values
    get widthDisplayValue() {
        const width = this.localStyles?.imageStyles?.width;
        if (width === 'auto' || width === '100%') return '';
        return parseFloat(width) || '';
    }
    get heightDisplayValue() {
        const height = this.localStyles?.imageStyles?.height;
        if (height === 'auto' || height === '100%') return '';
        return parseFloat(height) || '';
    }

    // Display values for inputs
    get paddingToDisplay() { return this.localStyles.padding?.replace('px', '') || '0'; }
    get marginToDisplay() { return this.localStyles.margin?.replace('px', '') || '0'; }

    get paddingTopDisplayValue() { return this.localStyles.paddingTop?.replace('px', '') || '0'; }
    get paddingRightDisplayValue() { return this.localStyles.paddingRight?.replace('px', '') || '0'; }
    get paddingBottomDisplayValue() { return this.localStyles.paddingBottom?.replace('px', '') || '0'; }
    get paddingLeftDisplayValue() { return this.localStyles.paddingLeft?.replace('px', '') || '0'; }
    
    get marginTopDisplayValue() { return this.localStyles.marginTop?.replace('px', '') || '0'; }
    get marginRightDisplayValue() { return this.localStyles.marginRight?.replace('px', '') || '0'; }
    get marginBottomDisplayValue() { return this.localStyles.marginBottom?.replace('px', '') || '0'; }
    get marginLeftDisplayValue() { return this.localStyles.marginLeft?.replace('px', '') || '0'; }

    // Color values
    get backgroundColorValue() { 
        return this.localStyles.backgroundColor || '#bdbdbdff';
    }
    get textColorValue() { return this.localStyles.color || '#000000'; }
    get borderColorValue() { return this.localStyles.borderColor || '#000000'; }
    get imageBackgroundColorValue() { return this.localStyles.imageStyles?.backgroundColor || 'transparent'; }

    // Current select values for dropdowns
    get currentTextAlign() { return this.localStyles.textAlign || 'left'; }
    get currentFontWeight() { return this.localStyles.fontWeight || '400'; }
    get currentFontFamily() { return this.localStyles.fontFamily || 'Arial, sans-serif'; }
    get currentFontStyle() { return this.localStyles.fontStyle || 'normal'; }
    get currentTextDecoration() { return this.localStyles.textDecoration || 'none'; }
    get currentObjectFit() { return this.localStyles.imageStyles?.objectFit || 'cover'; }
    get currentObjectPosition() { return this.localStyles.imageStyles?.objectPosition || 'center'; }
    get currentBorderStyle() { return this.localStyles.borderStyle || 'solid'; }
    get currentBoxShadow() { return this.localStyles.boxShadow || 'none'; }
    get currentTextShadow() { return this.localStyles.textShadow || 'none'; }
    get currentLinkTarget() { return this.linkData.target || '_blank'; }

    // Computed getters for margin units
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
    get divWidthOptions() {
        return [
            { label: 'Full Width (100%)', value: '100%' },
            { label: 'Fit Content', value: 'fit-content' },
            { label: 'Custom', value: 'custom' }
        ];
    }

    get divHeightOptions() {
        return [
            { label: 'Full Height (100%)', value: '100%' },
            { label: 'Fit Content', value: 'fit-content' },
            { label: 'Custom', value: 'custom' },
        ];
    }

    get dimensionUnitOptions() {
        return [
            { label: 'px', value: 'px' },
            { label: '%', value: '%' },
            { label: 'rem', value: 'rem' }
        ];
    }

    // Preset image URLs
    get presetImages() {
        return [
            {
                id: 'square-logo',
                url: `${SAMPLE_LOGOS_BASE_URL}/Sample_Logo_01.png`,
                name: 'Sample Logo 01',
                dimensions: '100×100'
            },
            {
                id: 'wide-logo',
                url: `${SAMPLE_LOGOS_BASE_URL}/Sample_Logo_02.png`,
                name: 'Sample Logo 02',
                dimensions: '200×100'
            },
            {
                id: 'tall-logo',
                url: `${SAMPLE_LOGOS_BASE_URL}/Sample_Logo_03.png`,
                name: 'Sample Logo 03',
                dimensions: '100×200'
            },
            {
                id: 'rectangle-logo',
                url: `${SAMPLE_LOGOS_BASE_URL}/Sample_Logo_04.png`,
                name: 'Sample Logo 04',
                dimensions: '300×150'
            },
            {
                id: 'banner-logo',
                url: `${SAMPLE_LOGOS_BASE_URL}/Sample_Logo_05.png`,
                name: 'Sample Logo 05',
                dimensions: '400×100'
            }
        ];
    }

    get livePreviewClass() {
        return this.isLivePreview ? 'toggle-switch active' : 'toggle-switch';
    }

    get modalTitle() {
        return this.isMultipleSelection ? `Style ${this.selectedDivIds.length} Divs` : 'Style Div';
    }

    get modalSubtitle() {
        return this.isMultipleSelection ? 'Apply styles to selected divs' : 'Customize this div appearance';
    }

    get showLinkOptions() {
        return this.isTextMode;
    }

   

    get hasSocialIcons() {
        return this.socialIconsData && this.socialIconsData.length > 0;
    }

    // Social icons options
    get layoutOptions() {
        return [
            { label: 'Horizontal (Side by Side)', value: 'horizontal' },
            { label: 'Vertical (Stacked)', value: 'vertical' }
        ];
    }

    get alignmentOptions() {
        return [
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Right', value: 'right' },
            { label: 'Top Left', value: 'top left' },
            { label: 'Top Right', value: 'top right' },
            { label: 'Bottom Left', value: 'bottom left' },
            { label: 'Bottom Right', value: 'bottom right' },
            { label: 'Space Between', value: 'space-between' },
            { label: 'Space Around', value: 'space-around' }
        ];
    }

    get sizeOptions() {
        return [
            { label: 'Small (24px)', value: 'small' },
            { label: 'Medium (32px)', value: 'medium' },
            { label: 'Large (48px)', value: 'large' },
            { label: 'Extra Large (64px)', value: 'xl' }
        ];
    }

    get platformOptions() {
        return [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'WhatsApp', value: 'whatsapp' },
            { label: 'Telegram', value: 'telegram' },
            { label: 'Discord', value: 'discord' },
            { label: 'Custom Icon', value: 'custom' }
        ];
    }

    get popularPlatforms() {
        return [
            {
                label: 'Facebook', 
                value: 'facebook',
                iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg'
            },
            {
                label: 'Twitter', 
                value: 'twitter',
                iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg'
            },
            {
                label: 'Instagram', 
                value: 'instagram',
                iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg'
            },
            {
                label: 'LinkedIn', 
                value: 'linkedin',
                iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg'
            },
            {
                label: 'YouTube', 
                value: 'youtube',
                iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg'
            },
            {
                label: 'TikTok', 
                value: 'tiktok',
                iconUrl: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg'
            }
        ];
    }

    // Platform icon URLs mapping
    getPlatformIconUrl(platform) {
        const platformIcons = {
            facebook: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg',
            twitter: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg',
            instagram: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg',
            linkedin: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg',
            youtube: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
            tiktok: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg',
            whatsapp: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/whatsapp.svg',
            telegram: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/telegram.svg',
            discord: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg'
        };
        
        return platformIcons[platform] || '';
    }

}