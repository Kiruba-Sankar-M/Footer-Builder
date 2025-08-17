import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';
import * as footerState from 'c/footerState';
import PRESETS_ZIP from '@salesforce/resourceUrl/Footer_Samples';

export default class FooterConfigManager extends LightningElement {
    // @api configurations; // Removed, now managed by footerState
    @track activeTab = 'save';
    @track designName = '';
    @track savedDesigns = [];

  @track presets = [
        { name: 'Footer_Sample_01', path: '/Footer_Samples/Footer_Sample_01.json' },
        { name: 'Footer_Sample_02', path: '/Footer_Samples/Footer_Sample_02.json' },
        { name: 'Footer_Sample_03', path: '/Footer_Samples/Footer_Sample_03.json' },
        { name: 'Footer_Sample_04', path: '/Footer_Samples/Footer_Sample_04.json' },
        { name: 'Footer_Sample_05', path: '/Footer_Samples/Footer_Sample_05.json' },
        { name: 'Footer_Sample_06', path: '/Footer_Samples/Footer_Sample_06.json' }
    ];

    connectedCallback() {
        this.loadSavedDesignsList();
    }

    // Computed properties for conditional rendering
    get isSaveTabActive() { return this.activeTab === 'save'; }
    get isLoadTabActive() { return this.activeTab === 'load'; }
    
    get saveTabClass() { return this.activeTab === 'save' ? 'tab-button active' : 'tab-button'; }
    get loadTabClass() { return this.activeTab === 'load' ? 'tab-button active' : 'tab-button'; }
    
    get savedDesignsWithFormattedDates() {
        return this.savedDesigns.map(design => ({
            ...design,
            formattedDate: this.formatDate(design.timestamp)
        }));
    }

    get deviceConfigurations() {
        const configurations = footerState.getConfigurations();
        const deviceData = [];
        if (configurations) {
            ['desktop', 'tablet', 'mobile'].forEach(deviceType => {
                const config = configurations[deviceType];
                if (config) {
                    const filledDivsCount = (config.gridItems || []).filter(item => !item.isEmpty).length;
                    deviceData.push({
                        name: deviceType.charAt(0).toUpperCase() + deviceType.slice(1),
                        columns: config.deviceColumns || 'N/A',
                        rows: config.deviceRows || 'N/A',
                        gap: config.deviceGap !== undefined ? `${config.deviceGap}px` : 'N/A',
                        width: config.deviceCellWidth || 'N/A',
                        height: config.deviceCellHeight || 'N/A',
                        divs: filledDivsCount
                    });
                }
            });
        }
        return deviceData;
    }

    get totalElements() {
        // This getter is now redundant if we show per-device info, but keeping for now
        const configurations = footerState.getConfigurations();
        if (configurations && configurations.desktop && configurations.desktop.gridItems) {
            return configurations.desktop.gridItems.filter(item => !item.isEmpty).length;
        }
        return 0;
    }

    get currentGridInfo() {
        const configurations = footerState.getConfigurations();
        if (configurations && configurations.desktop) {
            const cols = configurations.desktop.deviceColumns || 'N/A';
            const rows = configurations.desktop.deviceRows || 'N/A';
            return `${cols}×${rows}`;
        }
        return 'N/A';
    }

    get lastModified() {
        const configurations = footerState.getConfigurations();
        if (configurations && configurations.timestamp) {
            return this.formatDate(configurations.timestamp);
        }
        return this.formatDate(new Date().toISOString());
    }

    get hasSavedDesigns() {
        return this.savedDesigns?.length > 0;
    }

    handleTabChange(event) {
        this.activeTab = event.target.dataset.tab;
    }

    handleDesignNameChange(event) {
        this.designName = event.target.value;
    }

    // Save to Local Storage
    async saveToLocal() {
        if (!this.designName.trim()) {
            this.showToast('Error', 'Design name cannot be empty.', 'error');
            return;
        }

        const designId = `footerBuilder_design_${this.designName.trim()}`;
        const existingDesign = this.savedDesigns.find(d => d.id === designId);

        if (existingDesign) {
            const result = await LightningConfirm.open({
                message: `A design named '${this.designName.trim()}' already exists. Do you want to overwrite it?`, 
                variant: 'headerless',
                label: 'Overwrite Design',
                theme: 'warning'
            });

            if (!result) {
                this.showToast('Info', 'Save operation cancelled.', 'info');
                return;
            }
        }

        const designData = {
            configurations: footerState.getConfigurations(),
            timestamp: new Date().toISOString(),
            name: this.designName.trim()
        };

        try {
            localStorage.setItem(designId, JSON.stringify(designData));
            // Update the list of saved designs (references)
            if (existingDesign) {
                this.savedDesigns = this.savedDesigns.map(d => 
                    d.id === designId ? { ...d, timestamp: designData.timestamp } : d
                );
            } else {
                this.savedDesigns = [...this.savedDesigns, { id: designId, name: this.designName.trim(), timestamp: designData.timestamp }];
            }
            this.saveSavedDesignsList(); // Save the updated list of references
            this.loadSavedDesignsList(); // Refresh the displayed list
            this.showToast('Success', `Design '${this.designName.trim()}' saved to local storage.`, 'success');
        } catch (error) {
            console.error('Error saving design to local storage:', error);
            this.showToast('Error', 'Error saving design to local storage.', 'error');
        }
    }

    // Download as File
    downloadAsFile() {
        if (!this.designName.trim()) {
            // Show error message to user
            this.showToast('Error', 'Design name cannot be empty for download.', 'error');
            return;
        }

        const designData = {
            configurations: footerState.getConfigurations(),
            timestamp: new Date().toISOString(),
            name: this.designName.trim()
        };

        const dataStr = JSON.stringify(designData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.designName.trim()}.json`;
        link.click();

        URL.revokeObjectURL(url);
        this.showToast('Success', `Design '${this.designName.trim()}' downloaded as file.`, 'success');
        // TODO: Show success message
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const loadedData = JSON.parse(content);
                if (loadedData && loadedData.configurations) {
                    footerState.setConfigurations(loadedData.configurations);
                    this.showToast('Success', `Design '${loadedData.name || 'Uploaded Design'}' loaded from file.`, 'success');
                } else {
                    this.showToast('Error', 'Invalid file format: Missing configurations data.', 'error');
                }
            } catch (error) {
                console.error('Error loading file:', error);
                this.showToast('Error', 'Error loading file.', 'error');
            }
        };
        reader.readAsText(file);
    }

    triggerFileInput() {
        this.template.querySelector('.file-input').click();
    }

    // Load design from local storage
    loadDesign(event) {
        const designId = event.currentTarget.dataset.designId;
        try {
            const savedData = localStorage.getItem(designId);
            if (savedData) {
                const loadedData = JSON.parse(savedData);
                if (loadedData && loadedData.configurations) {
                    footerState.setConfigurations(loadedData.configurations);
                    this.showToast('Success', `Design '${loadedData.name || 'Loaded Design'}' loaded from local storage.`, 'success');
                    this.handleClose(); // Close modal after loading
                } else {
                    this.showToast('Error', 'Invalid saved data format.', 'error');
                }
            } else {
                this.showToast('Error', `Design with ID ${designId} not found in local storage.`, 'error');
            }
        } catch (error) {
            console.error('Error loading design from local storage:', error);
            this.showToast('Error', 'Error loading design from local storage:', 'error');
        }
    }

    // Delete design from local storage
    async deleteDesign(event) {
        const designId = event.currentTarget.dataset.designId;
        const designName = event.currentTarget.dataset.designName;

        const result = await LightningConfirm.open({
            message: `Are you sure you want to delete the design '${designName}'? This action cannot be undone.`, 
            variant: 'headerless',
            label: 'Confirm Deletion',
            theme: 'warning'
        });

        if (result) {
            try {
                localStorage.removeItem(designId);
                this.savedDesigns = this.savedDesigns.filter(design => design.id !== designId);
                this.saveSavedDesignsList(); // Update the list of references
                this.showToast('Success', `Design '${designName}' deleted successfully.`, 'success');
            } catch (error) {
                console.error('Error deleting design from local storage:', error);
                this.showToast('Error', 'Error deleting design from local storage.', 'error');
            }
        } else {
            this.showToast('Info', 'Deletion cancelled.', 'info');
        }
    }

    // Update design in local storage
    async updateDesign(event) {
        const designId = event.currentTarget.dataset.designId;
        const designName = event.currentTarget.dataset.designName;

        const result = await LightningConfirm.open({
            message: `Are you sure you want to update the design '${designName}'? This will overwrite the existing saved design.`, 
            variant: 'headerless',
            label: 'Confirm Update',
            theme: 'warning'
        });

        if (result) {
            const designData = {
                configurations: footerState.getConfigurations(),
                timestamp: new Date().toISOString(),
                name: designName
            };

            try {
                localStorage.setItem(designId, JSON.stringify(designData));
                // Update the timestamp in the savedDesigns list
                this.savedDesigns = this.savedDesigns.map(design => 
                    design.id === designId ? { ...design, timestamp: designData.timestamp } : design
                );
                this.saveSavedDesignsList();
                this.showToast('Success', `Design '${designName}' updated successfully.`, 'success');
            } catch (error) {
                console.error('Error updating design in local storage:', error);
                this.showToast('Error', 'Error updating design in local storage.', 'error');
            }
        } else {
            this.showToast('Info', 'Update cancelled.', 'info');
        }
    }

    // Download design to file
    handleDownload(event) {
        const designId = event.currentTarget.dataset.designId;
        const designName = event.currentTarget.dataset.designName;

        try {
            const savedData = localStorage.getItem(designId);
            if (savedData) {
                const designData = JSON.parse(savedData);
                const dataStr = JSON.stringify(designData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `${designName}.json`;
                link.click();

                URL.revokeObjectURL(url);
                this.showToast('Success', `Design '${designName}' downloaded as file.`, 'success');
            } else {
                this.showToast('Error', `Design with ID ${designId} not found.`, 'error');
            }
        } catch (error) {
            console.error('Error downloading design:', error);
            this.showToast('Error', 'Error downloading design.', 'error');
        }
    }

    loadSavedDesignsList() {
        try {
            const savedList = localStorage.getItem('footerBuilder_savedDesignsList');
            console.log('savedList ' + JSON.stringify(savedList));
            if (savedList) {
                this.savedDesigns = JSON.parse(savedList);
            }
        } catch (error) {
            console.error('Error loading saved designs list:', error);
        }
    }

    saveSavedDesignsList() {
        try {
            localStorage.setItem('footerBuilder_savedDesignsList', JSON.stringify(this.savedDesigns));
        } catch (error) {
            console.error('Error saving designs list:', error);
        }
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString() + ' ' + 
               new Date(timestamp).toLocaleTimeString();
    }

    stopPropagation(event) {
        event.stopPropagation();
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }

    async loadPreset(event) {
        const presetName = event.currentTarget.dataset.presetName;
        const preset = this.presets.find(p => p.name === presetName);
        if (!preset) {
            this.showToast('Error', `Preset '${presetName}' not found.`, 'error');
            return;
        }

        const resourceUrl = PRESETS_ZIP + preset.path;

        try {
            const response = await fetch(resourceUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const presetData = await response.json();

            if (presetData && presetData.configurations) {
                footerState.setConfigurations(presetData.configurations);
                this.showToast('Success', `Preset '${presetName}' loaded successfully.`, 'success');
                this.handleClose(); // Close modal after loading
            } else {
                this.showToast('Error', 'Invalid preset file format.', 'error');
            }
        } catch (error) {
            console.error('Error loading preset:', error);
            this.showToast('Error', `Error loading preset '${presetName}'.`, 'error');
        }
    }
}