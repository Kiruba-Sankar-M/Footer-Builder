import { LightningElement, track } from 'lwc';
import * as footerState from 'c/footerState';
import Documentation_Link from '@salesforce/label/c.Documentation_Link';

const HISTORY_STACK_LIMIT = 10;

export default class FooterGeneratorParent extends LightningElement {
    @track columns = 4;
    @track rows = 3;
    @track gap = 8;
    @track cellWidth = 'auto';
    @track cellHeight = 'fit-content(100%)';
    @track gridItems = [];
    @track previewMode = 'desktop';
    
    // Modal states
    @track showFooterStyleModal = false;
    @track showDivStyleModal = false;
    @track showConfigModal = false;
    @track selectedDivIds = [];
    @track currentDivId = null;
    @track currentDivData = {};
    @track isDivStyleModalOpen = false;

    @track currentCellWidthType = 'auto';
    @track currentCellHeightType = 'fit-content(100%)';
    @track customWidthValue = '';
    @track customHeightValue = '';
    @track showCustomWidthInput = false;
    @track showCustomHeightInput = false;
    
    // Enhanced responsive configurations (now local copies updated by state service)
    @track configurations = {}; 
    
    // Footer styles with professional defaults (now local copies updated by state service)
    @track footerStyles = {}; 

    // Drag and resize state
    @track draggedItemId = null;
    @track dragOverCellId = null;
    @track isResizing = false;
    @track resizeData = {};

    @track copiedDivData = null; // Stores the data of the copied div
    @track isCopyModeActive = false; // Flag to indicate if copy mode is active
    @track showCopiedTooltip = false; // Controls visibility of the copied tooltip
    @track copiedTooltipText = 'Copied!'; // Text for the copied tooltip
    @track copiedDivCounts = {}; // Stores counts for copied div types

    // Undo/Redo state
    @track undoStack = [];
    @track redoStack = [];
    @track isLoading = false;

    connectedCallback() {
        // Initialize footerState with default configurations if not already set
        if (Object.keys(footerState.getConfigurations()).length === 0) {
            footerState.setConfigurations({
                desktop: { 
                    gridItems: [], 
                    footerStyles: {},
                    deviceColumns: 4, 
                    deviceRows: 3,
                    deviceGap: 8,
                    deviceCellWidth: 'auto',
                    deviceCellHeight: '80px'
                },
                tablet: { 
                    gridItems: [], 
                    footerStyles: {},
                    deviceColumns: 3, 
                    deviceRows: 3,
                    deviceGap: 6,
                    deviceCellWidth: 'auto',
                    deviceCellHeight: '80px'
                },
                mobile: { 
                    gridItems: [], 
                    footerStyles: {},
                    deviceColumns: 2, 
                    deviceRows: 4,
                    deviceGap: 4,
                    deviceCellWidth: 'auto',
                    deviceCellHeight: '80px'
                }
            });
        }

        this.initializeResponsiveGrid();
        this.setupEventListeners();
        this.initializeDimensionTypes(); 
        setTimeout(() => {
            this.resetGrid();
        }, 100);

        // Subscribe to state changes
        footerState.subscribe('configChanged', this.handleConfigStateChange.bind(this));
        footerState.subscribe('gridChanged', this.handleGridStateChange.bind(this));
        footerState.subscribe('footerStyleChanged', this.handleFooterStyleStateChange.bind(this));
    }

    disconnectedCallback() {
        this.removeEventListeners();
        // Unsubscribe from state changes
        footerState.unsubscribe('configChanged', this.handleConfigStateChange.bind(this));
        footerState.unsubscribe('gridChanged', this.handleGridStateChange.bind(this));
        footerState.unsubscribe('footerStyleChanged', this.handleFooterStyleStateChange.bind(this));
    }

    handleConfigStateChange(newConfig) {
        this.configurations = newConfig;
        this.loadCurrentDeviceState();
    }

    handleGridStateChange({ device }) {
        if (device === this.previewMode) {
            this.loadCurrentDeviceState();
        }
    }

    handleFooterStyleStateChange({ device }) {
        if (device === this.previewMode) {
            this.loadCurrentDeviceState();
        }
    }

    setupEventListeners() {
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundMouseUp = this.handleMouseUp.bind(this);
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
        document.addEventListener('click', this.handleGlobalClick.bind(this));
    }

    removeEventListeners() {
        if (this.boundMouseMove) {
            document.removeEventListener('mousemove', this.boundMouseMove);
        }
        if (this.boundMouseUp) {
            document.removeEventListener('mouseup', this.boundMouseUp);
        }
        if (this.boundGlobalClick) {
            document.removeEventListener('click', this.boundGlobalClick);
        }
    }

    initializeDimensionTypes() {
        // Initialize width type
        if (this.cellWidth === 'auto' || this.cellWidth === '1fr') {
            this.currentCellWidthType = 'auto';
        } else if (this.cellWidth === 'fit-content(100%)') {
            this.currentCellWidthType = 'fit-content';
        } else if (this.cellWidth.includes('px')) {
            this.currentCellWidthType = 'custom';
            this.customWidthValue = parseFloat(this.cellWidth) || '';
            this.showCustomWidthInput = true;
        }
        
        // Initialize height type
        if (this.cellHeight === 'auto') {
            this.currentCellHeightType = 'auto';
        } else if (this.cellHeight === 'fit-content(100%)') {
            this.currentCellHeightType = 'fit-content';
        } else if (this.cellHeight.includes('px')) {
            this.currentCellHeightType = 'custom';
            this.customHeightValue = parseFloat(this.cellHeight) || '';
            this.showCustomHeightInput = true;
        }
    }


    // Enhanced initialization
    initializeResponsiveGrid() {
        const currentConfigurations = footerState.getConfigurations();
        Object.keys(currentConfigurations).forEach(device => {
            const config = currentConfigurations[device];
            this.initializeGrid(device, config.deviceColumns, config.deviceRows);
        });
        
        this.switchDevice('desktop');
    }

    initializeGrid(device = 'desktop', cols = 4, rows = 3) {
        const items = [];
        for (let row = 1; row <= rows; row++) {
            for (let col = 1; col <= cols; col++) {
                items.push({
                    id: `cell-${row}-${col}`,
                    gridColumn: col,
                    gridRow: row,
                    colSpan: 1,
                    rowSpan: 1,
                    content: '',
                    contentType: 'text',
                    imageUrl: '',
                    linkUrl: '',
                    linkTarget: '_self',
                    showPointer: false,
                    isEmpty: true,
                    isTextContent: false,
                    isImageContent: false,
                    className: this.getCellClassName(`cell-${row}-${col}`, true, false),
                    style: this.getCellStyle(col, row, 1, 1),
                    draggable: false,
                    divStyles: this.getDefaultDivStyles()
                });
            }
        }
        
        const currentConfigurations = footerState.getConfigurations();
        if (device && currentConfigurations[device]) {
            currentConfigurations[device].gridItems = items;
            if (!currentConfigurations[device].footerStyles || Object.keys(currentConfigurations[device].footerStyles).length === 0) {
                currentConfigurations[device].footerStyles = {
                    backgroundColor: 'white',
                    padding: '40px',
                    color: 'black',
                    minHeight: '200px'
                };
            }
            footerState.setConfigurations(currentConfigurations);
        } else {
            // Fallback for initial setup if device is not yet defined in state
            this.gridItems = items;
        }
    }

    syncConfigurationsNow() {
        const currentConfig = footerState.getConfigurations();
        if (this.previewMode && currentConfig[this.previewMode]) {
            currentConfig[this.previewMode].gridItems = JSON.parse(JSON.stringify(this.gridItems));
            currentConfig[this.previewMode].footerStyles = JSON.parse(JSON.stringify(this.footerStyles));
            currentConfig[this.previewMode].deviceColumns = this.columns;
            currentConfig[this.previewMode].deviceRows = this.rows;
            currentConfig[this.previewMode].deviceGap = this.gap;
            currentConfig[this.previewMode].deviceCellWidth = this.cellWidth;
            currentConfig[this.previewMode].deviceCellHeight = this.cellHeight;
            footerState.setConfigurations(currentConfig);
        }
    }

    resetFooterPreview() {
        return new Promise(resolve => {
            // Force immediate configuration sync
            this.syncConfigurationsNow();
            
            // Clear any existing timeout
            if (this.refreshTimeout) {
                clearTimeout(this.refreshTimeout);
            }
            
            this.refreshTimeout = setTimeout(() => {
                try {
                    const footerPreview = this.template.querySelector('c-footer-preview');
                    if (footerPreview) {
                        // Force complete re-render for dimension changes
                        if (footerPreview.clearExactPreview) {
                            footerPreview.clearExactPreview();
                        }
                        
                        // Update configurations on the preview component
                        footerPreview.configurations = footerState.getConfigurations();
                        footerPreview.currentDevice = this.previewMode;
                        
                        if (footerPreview.refreshPreview) {
                            footerPreview.refreshPreview();
                        }
                    }
                } catch (error) {
                    console.error('Error refreshing footer preview:', error);
                } finally {
                    resolve();
                }
            }, 150);
        });
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

    getCellClassName(cellId, isEmpty, isDragOver) {
        let className = 'grid-cell';
        if (isEmpty) {
            className += ' empty-cell';
            if (isDragOver) {
                className += ' drag-over';
            } else if (this.isCopyModeActive) {
                className += ' copy-target'; // Add class for visual feedback in copy mode
            }
        } else {
            className += ' filled-cell';
            if (this.selectedDivIds.includes(cellId)) {
                className += ' selected';
            }
        }
        
        return className;
    }

    getCellStyle(col, row, colSpan, rowSpan) {
        const colEnd = col + colSpan;
        const rowEnd = row + rowSpan;
        return `grid-column: ${col} / ${colEnd}; grid-row: ${row} / ${rowEnd}; z-index: ${colSpan > 1 || rowSpan > 1 ? 10 : 1};`;
    }

    updateGridStyle() {
        this.gridItems = [...this.gridItems];
    }

    // Enhanced device switching
    switchToDesktop() { this.switchDevice('desktop'); }
    switchToTablet() { this.switchDevice('tablet'); }
    switchToMobile() { this.switchDevice('mobile'); }

    switchDevice(device) {
        this.saveCurrentDeviceState();
        this.previewMode = device;
        footerState.setFormFactor(device);
        this.loadCurrentDeviceState();
    }

    saveCurrentDeviceState() {
        const currentConfig = footerState.getConfigurations();
        if (this.previewMode && currentConfig[this.previewMode]) {
            currentConfig[this.previewMode].gridItems = JSON.parse(JSON.stringify(this.gridItems));
            currentConfig[this.previewMode].footerStyles = JSON.parse(JSON.stringify(this.footerStyles));
            currentConfig[this.previewMode].deviceColumns = this.columns;
            currentConfig[this.previewMode].deviceRows = this.rows;
            currentConfig[this.previewMode].deviceGap = this.gap;
            currentConfig[this.previewMode].deviceCellWidth = this.cellWidth;
            currentConfig[this.previewMode].deviceCellHeight = this.cellHeight;
            footerState.setConfigurations(currentConfig);
        }
    }

    loadCurrentDeviceState() {
        const config = footerState.getConfigurations()[this.previewMode];
        
        this.columns = config.deviceColumns;
        this.rows = config.deviceRows;
        this.gap = config.deviceGap;
        this.cellWidth = config.deviceCellWidth || 'auto';
        this.cellHeight = config.deviceCellHeight || 'auto';
        this.gridItems = JSON.parse(JSON.stringify(config.gridItems));
        this.footerStyles = JSON.parse(JSON.stringify(config.footerStyles));
        
        // Re-initialize dimension types after device switch
        this.initializeDimensionTypes();
        
        this.updateAllCellClasses();
        // REMOVED: this.resetFooterPreview(); // This was causing the infinite loop
    }

    // Enhanced input handlers
    handleColumnsChange(event) {
        const newColumns = parseInt(event.target.value, 10);
        this.isLoading = true;
        setTimeout(() => {
            try {
                if (newColumns !== this.columns) {
                    this.columns = newColumns;
                    const currentConfig = footerState.getConfigurations();
                    currentConfig[this.previewMode].deviceColumns = newColumns;
                    footerState.setConfigurations(currentConfig);
                    this.updateGridDimensions(newColumns, this.rows);
                }
            } finally {
                this.isLoading = false;
            }
        }, 0);
    }

    handleRowsChange(event) {
        const newRows = parseInt(event.target.value, 10);
        this.isLoading = true;
        setTimeout(() => {
            try {
                if (newRows !== this.rows) {
                    this.rows = newRows;
                    const currentConfig = footerState.getConfigurations();
                    currentConfig[this.previewMode].deviceRows = newRows;
                    footerState.setConfigurations(currentConfig);
                    this.updateGridDimensions(this.columns, newRows);
                }
            } finally {
                this.isLoading = false;
            }
        }, 0);
    }

    handleGapChange(event) {
        const newGap = parseInt(event.target.value, 10);
        this.gap = newGap;
        const currentConfig = footerState.getConfigurations();
        currentConfig[this.previewMode].deviceGap = newGap;
        footerState.setConfigurations(currentConfig);
        this.resetFooterPreview();
    }

    handleCustomWidthChange(event) {
        const value = event.target.value;
        this.customWidthValue = value;
        
        if (value && !isNaN(value) && parseFloat(value) > 0) {
            this.cellWidth = value + 'px';
            const currentConfig = footerState.getConfigurations();
            currentConfig[this.previewMode].deviceCellWidth = this.cellWidth;
            footerState.setConfigurations(currentConfig);
            this.resetFooterPreview();
        }
    }

    handleCustomHeightChange(event) {
        const value = event.target.value;
        this.customHeightValue = value;
        
        if (value && !isNaN(value) && parseFloat(value) > 0) {
            this.cellHeight = value + 'px';
            const currentConfig = footerState.getConfigurations();
            currentConfig[this.previewMode].deviceCellHeight = newCellHeight;
            footerState.setConfigurations(currentConfig);
            this.resetFooterPreview();
        }
    }

    updateAllCellClasses() {
        this.gridItems = this.gridItems.map(item => ({
            ...item,
            className: this.getCellClassName(item.id, item.isEmpty, false)
        }));
    }

    updateGridDimensions(newColumns, newRows) {
        const existingDivs = this.gridItems.filter(cell => !cell.isEmpty);
        
        const newItems = [];
        for (let row = 1; row <= newRows; row++) {
            for (let col = 1; col <= newColumns; col++) {
                newItems.push({
                    id: `cell-${row}-${col}`,
                    gridColumn: col,
                    gridRow: row,
                    colSpan: 1,
                    rowSpan: 1,
                    content: '',
                    contentType: 'text',
                    imageUrl: '',
                    linkUrl: '',
                    linkTarget: '_self',
                    showPointer: false,
                    isEmpty: true,
                    isTextContent: false,
                    isImageContent: false,
                    className: this.getCellClassName(`cell-${row}-${col}`, true, false),
                    style: this.getCellStyle(col, row, 1, 1),
                    draggable: false,
                    divStyles: this.getDefaultDivStyles()
                });
            }
        }
        
        existingDivs.forEach(div => {
            if (div.gridColumn <= newColumns && div.gridRow <= newRows) {
                const maxColSpan = newColumns - div.gridColumn + 1;
                const maxRowSpan = newRows - div.gridRow + 1;
                const adjustedColSpan = Math.min(div.colSpan, maxColSpan);
                const adjustedRowSpan = Math.min(div.rowSpan, maxRowSpan);
                
                const targetIndex = newItems.findIndex(item => 
                    item.gridColumn === div.gridColumn && item.gridRow === div.gridRow
                );
                
                if (targetIndex !== -1) {
                    newItems[targetIndex] = {
                        ...newItems[targetIndex],
                        ...div,
                        colSpan: adjustedColSpan,
                        rowSpan: adjustedRowSpan,
                        style: this.getCellStyle(div.gridColumn, div.gridRow, adjustedColSpan, adjustedRowSpan),
                        className: this.getCellClassName(div.id, false, false)
                    };
                }
            }
        });
        
        this.gridItems = newItems;
        const currentConfig = footerState.getConfigurations();
        currentConfig[this.previewMode].gridItems = newItems;
        footerState.setConfigurations(currentConfig);

        this.resetFooterPreview();
    }

    resetGrid() {
        this.withLoading(() => {
            const currentConfig = footerState.getConfigurations();
            const config = currentConfig[this.previewMode];
            
            const defaultSettings = {
                desktop: { columns: 4, rows: 3, gap: 8, width: 'auto', height: 'fit-content(100%)' },
                tablet: { columns: 3, rows: 3, gap: 6, width: 'auto', height: 'fit-content(100%)' },
                mobile: { columns: 2, rows: 4, gap: 4, width: 'auto', height: 'fit-content(100%)' }
            };
            
            const defaults = defaultSettings[this.previewMode];
            this.columns = defaults.columns;
            this.rows = defaults.rows;
            this.gap = defaults.gap;
            this.cellWidth = defaults.width;
            this.cellHeight = defaults.height;
            
            config.deviceColumns = defaults.columns;
            config.deviceRows = defaults.rows;
            config.deviceGap = defaults.gap;
            config.deviceCellWidth = defaults.width;
            config.deviceCellHeight = defaults.height;
            
            this.initializeGrid(this.previewMode, defaults.columns, defaults.rows);
            this.loadCurrentDeviceState();
            this.resetFooterPreview();
        });
    }

    syncFromDesktop() {
        this.withLoading(() => {
            if (this.previewMode === 'desktop') return;

            const currentConfig = footerState.getConfigurations();
            const desktopConfig = currentConfig.desktop;

            this.saveCurrentDeviceState();

            currentConfig[this.previewMode] = {
                ...currentConfig[this.previewMode],
                gridItems: JSON.parse(JSON.stringify(desktopConfig.gridItems)),
                footerStyles: JSON.parse(JSON.stringify(desktopConfig.footerStyles))
            };

            this.columns = desktopConfig.deviceColumns;
            this.rows = desktopConfig.deviceRows;
            this.gap = desktopConfig.deviceGap;
            this.cellWidth = desktopConfig.deviceCellWidth || 'auto';
            this.cellHeight = desktopConfig.deviceCellHeight || 'fit-content';

            currentConfig[this.previewMode].deviceColumns = desktopConfig.deviceColumns;
            currentConfig[this.previewMode].deviceRows = desktopConfig.deviceRows;
            currentConfig[this.previewMode].deviceGap = desktopConfig.deviceGap;
            currentConfig[this.previewMode].deviceCellWidth = desktopConfig.deviceCellWidth;
            currentConfig[this.previewMode].deviceCellHeight = desktopConfig.deviceCellHeight;
            footerState.setConfigurations(currentConfig);

            this.updateGridDimensions(this.columns, this.rows);
            this.loadCurrentDeviceState();
            this.resetFooterPreview();
        });
    }

    generateClassName(content) {
        if (!content) return '';
        return content.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
    }

    // Enhanced cell interaction
    handleCellClick(event) {
        if (this.isResizing) return;
        
        const cellId = event.currentTarget.dataset.id;
        const cellItem = this.gridItems.find(item => item.id === cellId);
        
        if (!cellItem) return;

        if (this.isCopyModeActive && cellItem.isEmpty) {
            // Paste functionality
            this.pasteDivToCell(cellId);
        } else if (cellItem.isEmpty) {
            this.addDivToCell(cellId);
        } else if (event.ctrlKey || event.metaKey) {
            this.toggleCellSelection(cellId);
        } else if (event.shiftKey) {
            this.handleRangeSelection(cellId);
        } else {
            this.selectedDivIds = [];
            this.updateCellSelectionClasses();
        }
    }

    handleCopyDiv(event) {
        event.stopPropagation();
        const cellId = event.currentTarget.dataset.id;
        const cellData = this.gridItems.find(item => item.id === cellId);

        if (cellData) {
            this.copiedDivData = JSON.parse(JSON.stringify(cellData));
            this.isCopyModeActive = true;
            this.updateAllCellClasses(); // Update classes to show greyed out empty cells

            // Show tooltip for copy action
            const copyButton = event.currentTarget.closest('.copy-button');
            if (copyButton) {
                this.showCopiedTooltip = true;
                setTimeout(() => {
                    this.showCopiedTooltip = false;
                }, 2000);
            }
        }
    }

    pasteDivToCell(cellId) {
        if (!this.copiedDivData) return; // No data to paste

        // Deep copy the copied data to ensure reactivity
        const newDivData = JSON.parse(JSON.stringify(this.copiedDivData));
        // Generate a new unique ID for the pasted div
        newDivData.id = `cell-${Date.now()}`;
        newDivData.isEmpty = false;
        newDivData.draggable = true;

        let classNameKey; // This will store the key used for copiedDivCounts

        // Append '-copy' to customClassName and content
        if (newDivData.customClassName) {
            const originalClassName = newDivData.customClassName.replace(/-copy(-\d+)?$/, ''); // Remove existing -copy or -copy-N
            classNameKey = originalClassName;
            this.copiedDivCounts[classNameKey] = (this.copiedDivCounts[classNameKey] || 0) + 1;
            newDivData.customClassName = `${originalClassName}-copy-${this.copiedDivCounts[classNameKey]}`;
        } else {
            // If no customClassName, create one based on content and append copy count
            const baseClassName = this.generateClassName(newDivData.content || 'div');
            classNameKey = baseClassName;
            this.copiedDivCounts[classNameKey] = (this.copiedDivCounts[classNameKey] || 0) + 1;
            newDivData.customClassName = `${baseClassName}-copy-${this.copiedDivCounts[classNameKey]}`;
        }

        if (newDivData.content && newDivData.contentType === 'text') {
            // Use the same classNameKey that was used to increment the count
            newDivData.content += `-copy-${this.copiedDivCounts[classNameKey]}`;
        }

        // Find the target cell's grid position
        const targetCell = this.gridItems.find(item => item.id === cellId);
        if (!targetCell) return;

        newDivData.gridColumn = targetCell.gridColumn;
        newDivData.gridRow = targetCell.gridRow;
        newDivData.style = this.getCellStyle(newDivData.gridColumn, newDivData.gridRow, newDivData.colSpan, newDivData.rowSpan);

        // Update the grid item in the state service
        footerState.updateGridItem(cellId, this.previewMode, newDivData);

        this.isCopyModeActive = false; // Exit copy mode
        this.copiedDivData = null; // Clear copied data
        this.updateAllCellClasses(); // Refresh classes to remove greyed out effect
        this.resetFooterPreview(); // Force re-render of footer preview
    }

    toggleCellSelection(cellId) {
        const isSelected = this.selectedDivIds.includes(cellId);
        if (isSelected) {
            this.selectedDivIds = this.selectedDivIds.filter(id => id !== cellId);
        } else {
            this.selectedDivIds = [...this.selectedDivIds, cellId];
        }
        
        this.updateCellSelectionClasses();
    }

    handleRangeSelection(cellId) {
        if (this.selectedDivIds.length === 0) {
            this.selectedDivIds = [cellId];
        } else {
            const lastSelected = this.selectedDivIds[this.selectedDivIds.length - 1];
            const startIndex = this.gridItems.findIndex(item => item.id === lastSelected);
            const endIndex = this.gridItems.findIndex(item => item.id === cellId);
            
            if (startIndex !== -1 && endIndex !== -1) {
                const minIndex = Math.min(startIndex, endIndex);
                const maxIndex = Math.max(startIndex, endIndex);
                
                const rangeIds = this.gridItems
                    .slice(minIndex, maxIndex + 1)
                    .filter(item => !item.isEmpty)
                    .map(item => item.id);
                    
                this.selectedDivIds = [...new Set([...this.selectedDivIds, ...rangeIds])];
            }
        }
        
        this.updateCellSelectionClasses();
    }

    updateCellSelectionClasses() {
        this.gridItems = this.gridItems.map(item => ({
            ...item,
            className: this.getCellClassName(item.id, item.isEmpty, false)
        }));
    }

    addDivToCell(cellId) {
        this.withLoading(() => {
            this.pushToUndoStack();
            const cellIndex = this.gridItems.findIndex(item => item.id === cellId);
            if (cellIndex === -1) return;

            const item = this.gridItems[cellIndex];
            if (!item.isEmpty) return;

            const filledCellsCount = this.gridItems.filter(cell => !cell.isEmpty).length;
            const newContent = `div${filledCellsCount + 1}`;

            const newDivStyles = {
                ...this.getDefaultDivStyles(),
                color: this.footerStyles.color || this.getDefaultDivStyles().color,
                fontSize: this.footerStyles.fontSize || this.getDefaultDivStyles().fontSize,
                textAlign: this.footerStyles.textAlign || this.getDefaultDivStyles().textAlign,
                fontWeight: this.footerStyles.fontWeight || this.getDefaultDivStyles().fontWeight,
            };

            footerState.updateGridItem(cellId, this.previewMode, {
                content: newContent,
                contentType: 'text',
                isEmpty: false,
                isTextContent: true,
                isImageContent: false,
                className: this.getCellClassName(cellId, false, false),
                draggable: true,
                divStyles: newDivStyles,
                customClassName: this.generateClassName(newContent)
            });

            this.resetFooterPreview();
        });
    }

    handleDeleteCell(event) {
        this.withLoading(() => {
            this.pushToUndoStack();
            event.stopPropagation();
            const cellId = event.currentTarget.dataset.id; 
            const cellIndex = this.gridItems.findIndex(item => item.id === cellId);
            
            if (cellIndex !== -1) {
                const item = this.gridItems[cellIndex];
                footerState.updateGridItem(cellId, this.previewMode, {
                    content: '',
                    contentType: 'text',
                    imageUrl: '',
                    linkUrl: '',
                    linkTarget: '_self',
                    showPointer: false,
                    isEmpty: true,
                    isTextContent: false,
                    isImageContent: false,
                    className: this.getCellClassName(cellId, true, false),
                    colSpan: 1,
                    rowSpan: 1,
                    style: this.getCellStyle(item.gridColumn, item.gridRow, 1, 1),
                    draggable: false,
                    divStyles: this.getDefaultDivStyles()
                });
                
                this.selectedDivIds = this.selectedDivIds.filter(id => id !== cellId);
                this.updateCellSelectionClasses();
            }
            this.resetFooterPreview();
        });
    }


    // Drag and Drop methods
    handleDragStart(event) {
        this.pushToUndoStack();
        if (event.currentTarget.classList.contains('empty-cell')) {
            event.preventDefault();
            return;
        }
        this.draggedItemId = event.currentTarget.dataset.id;
        event.dataTransfer.effectAllowed = 'move';
        event.currentTarget.classList.add('dragging');
    }

    // ENHANCED: handleDragEnd method with aggressive cleanup
    handleDragEnd(event) {
        if (this.draggedItemId) {
            const draggedElement = this.template.querySelector(`[data-id="${this.draggedItemId}"]`);
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
            }
        }
        this.draggedItemId = null;
        this.clearDragOverEffects();
    }



    // Enhanced handleDragOver method
    handleDragOver(event) {
        event.preventDefault();
        const cellId = event.currentTarget.dataset.id;
        const targetCell = this.gridItems.find(item => item.id === cellId);
    
        // Clear previous drag-over effects first
        if (this.dragOverCellId && this.dragOverCellId !== cellId) {
            const prevCell = this.template.querySelector(`[data-id="${this.dragOverCellId}"]`);
            if (prevCell) {
                prevCell.classList.remove('drag-over', 'drag-over-invalid');
                prevCell.style.transform = '';
            }
        }
    
        if (targetCell && targetCell.isEmpty && this.draggedItemId !== cellId) {
            event.dataTransfer.dropEffect = 'move';
            event.currentTarget.classList.add('drag-over');
            event.currentTarget.classList.remove('drag-over-invalid');
            this.dragOverCellId = cellId;
        } else if (this.draggedItemId !== cellId) {
            event.dataTransfer.dropEffect = 'none';
            event.currentTarget.classList.add('drag-over-invalid');
            event.currentTarget.classList.remove('drag-over');
        }
    }


    handleDragLeave(event) {
        event.preventDefault();
        const cellId = event.currentTarget.dataset.id;
        
        // Clear drag-over effects
        event.currentTarget.classList.remove('drag-over', 'drag-over-invalid');
        event.currentTarget.style.transform = '';
        event.currentTarget.style.opacity = '';
        event.currentTarget.style.filter = '';
        event.currentTarget.style.zIndex = '';
        
        if (this.dragOverCellId === cellId) {
            this.dragOverCellId = null;
        }
    }

    handleDrop(event) {
        this.pushToUndoStack();
        event.preventDefault();
        this.clearDragOverEffects();
    
        if (!this.draggedItemId) return;
    
        const targetCellId = event.target.closest('.grid-cell')?.dataset.id;
        if (!targetCellId || targetCellId === this.draggedItemId) {
            this.draggedItemId = null;
            return;
        }
    
        const targetCell = this.gridItems.find(item => item.id === targetCellId);
        if (targetCell && targetCell.isEmpty) {
            footerState.moveGridItem(this.draggedItemId, targetCellId, this.previewMode);
            this.draggedItemId = null;
            this.dragOverCellId = null;
        } else {
            // Optionally, provide feedback to the user that the drop is not allowed
            console.log('Cannot drop on a non-empty cell.');
            this.draggedItemId = null; // Clear dragged item
        }
    }

    updateDragOverEffect(cellId, isDragOver) {
        const cellIndex = this.gridItems.findIndex(item => item.id === cellId);
        if (cellIndex !== -1) {
            const item = this.gridItems[cellIndex];
            if (item.isEmpty) {
                // This method might need to be re-evaluated if it's still necessary
                // with the new state management. For now, it's left as is.
                // this.updateGridItem(cellIndex, {
                //     className: this.getCellClassName(cellId, true, isDragOver)
                // });
            }
        }
    }

    clearDragOverEffects() {
        // Clear drag-over effects from all cells - FIXED SELECTOR
        const allCells = this.template.querySelectorAll('.grid-cell'); // Changed from .grid-item
        allCells.forEach(cell => {
            // Remove all drag-related classes
            cell.classList.remove('drag-over', 'drag-over-invalid', 'dragging', 'drag-target');
            
            // IMPORTANT: Clear all inline styles that might cause tilting
            cell.style.transform = '';
            cell.style.opacity = '';
            cell.style.filter = '';
            cell.style.zIndex = '';
            cell.style.position = '';
            cell.style.left = '';
            cell.style.top = '';
        });
        
        // Reset any grid container effects
        const gridContainer = this.template.querySelector('.grid-container');
        if (gridContainer) {
            gridContainer.classList.remove('drag-active');
        }
    }

    // Resize methods
    handleResizeStart(event) {
        this.pushToUndoStack();
        event.preventDefault();
        event.stopPropagation();
        
        const cellId = event.target.dataset.id;
        const direction = event.target.dataset.direction;
        const cell = footerState.getConfigurations()[this.previewMode]?.gridItems.find(item => item.id === cellId);
        
        if (!cell) return;

        this.isResizing = true;
        this.resizeData = {
            cellId,
            direction,
            startX: event.clientX,
            startY: event.clientY,
            originalColSpan: cell.colSpan,
            originalRowSpan: cell.rowSpan,
            gridColumn: cell.gridColumn,
            gridRow: cell.gridRow
        };

        document.body.style.cursor = this.getResizeCursor(direction);
    }

    handleMouseMove(event) {
        if (!this.isResizing || !this.resizeData.cellId) return;

        const currentConfig = footerState.getConfigurations();
        const currentDeviceGridItems = currentConfig[this.previewMode]?.gridItems;
        const cellIndex = currentDeviceGridItems.findIndex(item => item.id === this.resizeData.cellId);
        if (cellIndex === -1) return;

        const gridContainer = this.template.querySelector('.grid-container');
        if (!gridContainer) return;

        const containerRect = gridContainer.getBoundingClientRect();
        const cellWidth = containerRect.width / this.columns;
        const cellHeight = containerRect.height / this.rows;

        const deltaX = event.clientX - this.resizeData.startX;
        const deltaY = event.clientY - this.resizeData.startY;

        let newColSpan = this.resizeData.originalColSpan;
        let newRowSpan = this.resizeData.originalRowSpan;

        if (this.resizeData.direction === 'right' || this.resizeData.direction === 'corner') {
            const colChange = Math.round(deltaX / cellWidth);
            newColSpan = Math.max(1, Math.min(
                this.columns - this.resizeData.gridColumn + 1,
                this.resizeData.originalColSpan + colChange
            ));
        }

        if (this.resizeData.direction === 'bottom' || this.resizeData.direction === 'corner') {
            const rowChange = Math.round(deltaY / cellHeight);
            newRowSpan = Math.max(1, Math.min(
                this.rows - this.resizeData.gridRow + 1,
                this.resizeData.originalRowSpan + rowChange
            ));
        }

        const currentItem = currentDeviceGridItems[cellIndex];
        if (newColSpan !== currentItem.colSpan || newRowSpan !== currentItem.rowSpan) {
            footerState.updateGridItem(currentItem.id, this.previewMode, {
                colSpan: newColSpan,
                rowSpan: newRowSpan,
                style: this.getCellStyle(currentItem.gridColumn, currentItem.gridRow, newColSpan, newRowSpan)
            });
        }
    }

    handleMouseUp() {
        if (this.isResizing) {
            this.isResizing = false;
            this.resizeData = {};
            document.body.style.cursor = '';
            this.clearDragOverEffects(); // Clear drag/resize effects
        }
    }

    handleGlobalClick(event) {
        if (this.isDivStyleModalOpen) {
            return;
        }
        const footerGeneratorParent = this.template.querySelector('.grid-generator-container');
        
        // Check if the click is outside the component
        const isOutsideClick = footerGeneratorParent && !footerGeneratorParent.contains(event.target);
        
        // Check if any modifier keys are pressed (for multi-selection)
        const isModifierKeyPressed = event.ctrlKey || event.metaKey || event.shiftKey;

        // Check if the clicked element is the "Style Selected Divs" button
        const isStyleSelectedDivsButton = event.target.closest('button.style-btn.bulk');

        // If it's an outside click and no modifier keys are pressed, clear selection and copy mode
        if (isOutsideClick && !isModifierKeyPressed) {
            this.isCopyModeActive = false;
            this.copiedDivData = null;
            this.updateAllCellClasses();
            this.clearSelection();
        } else if (!isOutsideClick && !isModifierKeyPressed && !isStyleSelectedDivsButton) {
            // If click is inside the component, but not a multi-select click, and not on a cell or the "Style Selected Divs" button, clear selection
            const clickedCell = event.target.closest('.grid-cell');
            if (!clickedCell) {
                this.clearSelection();
            }
        }
    }

    getResizeCursor(direction) {
        switch (direction) {
            case 'right': return 'e-resize';
            case 'bottom': return 's-resize';
            case 'corner': return 'se-resize';
            default: return 'default';
        }
    }

    // Modal handlers
    openFooterStyleModal() {
        this.showFooterStyleModal = true;
    }

    closeFooterStyleModal() {
        this.showFooterStyleModal = false;
    }

    openDivStyleModal(event) {
        event.preventDefault();
        event.stopPropagation();
        const cellId = event.currentTarget.dataset.id;
        const cellData = footerState.getConfigurations()[this.previewMode]?.gridItems.find(item => item.id === cellId);
        
        this.currentDivData = {
            content: cellData.content || '',
            contentType: cellData.contentType || 'text',
            imageUrl: cellData.imageUrl || '',
            linkUrl: cellData.linkUrl || '',
            linkTarget: cellData.linkTarget || '_self',
            showPointer: cellData.showPointer || false,
            customClassName: cellData.customClassName || ''
        };
        
        this.currentDivId = cellId;
        this.selectedDivIds = [];
        this.showDivStyleModal = true;
        this.isDivStyleModalOpen = true;
    }


    closeDivStyleModal() {
        this.showDivStyleModal = false;
        this.currentDivId = null;
        this.currentDivData = {};
        this.isDivStyleModalOpen = false;
        this.withLoading(() => {
            return new Promise(resolve => {
                setTimeout(() => {
                   this.switchDevice(this.previewMode);
                   resolve();
                }, 200);
            });
        });
    }

    openMultiDivStyleModal() {
        if (this.selectedDivIds.length === 0) return; 
        
        const firstCell = footerState.getConfigurations()[this.previewMode]?.gridItems.find(item => this.selectedDivIds.includes(item.id));
        this.currentDivData = firstCell ? {
            content: firstCell.content || '',
            contentType: firstCell.contentType || 'text',
            imageUrl: firstCell.imageUrl || '',
            linkUrl: firstCell.linkUrl || '',
            linkTarget: firstCell.linkTarget || '_self',
            showPointer: firstCell.showPointer || false,
            customClassName: firstCell.customClassName || ''
        } : {};
        
        this.currentDivId = null;
        this.showDivStyleModal = true;
        this.isDivStyleModalOpen = true;
    }

    clearSelection() {
        this.selectedDivIds = [];
        this.updateCellSelectionClasses();
    }

    openConfigModal() {
        this.showConfigModal = true;
    }

    handleCloseConfigModal() {
        this.showConfigModal = false;
    }

    handleConfigUpdate(event) {
        this.withLoading(() => {
            const { configurations, designName } = event.detail;

            // Ensure customClassName exists on all grid items
            Object.values(configurations).forEach(deviceConfig => {
                if (deviceConfig.gridItems) {
                    deviceConfig.gridItems.forEach(item => {
                        if (!item.isEmpty && !item.customClassName) {
                            item.customClassName = this.generateClassName(item.content);
                        }
                    });
                }
            });
            
            // Update all configurations via state service
            footerState.setConfigurations(configurations);
            
            // Update current grid items (local copy)
            this.gridItems = footerState.getConfigurations()[this.previewMode]?.gridItems || [];
            
            // Update dimensions (local copy)
            const currentConfig = footerState.getConfigurations()[this.previewMode];
            this.columns = currentConfig?.deviceColumns || 4;
            this.rows = currentConfig?.deviceRows || 3;
            this.gap = currentConfig?.deviceGap || 8;
            
            // REMOVED: this.resetFooterPreview(); // This was causing the infinite loop
            
            this.showConfigModal = false;
        });
    }

    closeConfigModal() {
        this.showConfigModal = false;
    }

    // Enhanced style update handlers
    handleFooterStyleUpdate(event) {
        this.withLoading(() => {
            const newFooterStyles = { ...event.detail };
            footerState.updateFooterStyles(this.previewMode, newFooterStyles);
            
            // Update local footerStyles to reflect changes
            this.footerStyles = newFooterStyles;

            const defaultDivStyles = this.getDefaultDivStyles();

            // This part might need re-evaluation with the new state management approach
            // as direct manipulation of gridItems here might conflict with state service.
            // For now, keeping it as is, but it might be removed or refactored later.
            this.gridItems = this.gridItems.map(item => {
                if (item.isEmpty) {
                    return item; // Skip empty cells
                }

                let updatedDivStyles = { ...item.divStyles };

                // Handle background color: if it's transparent (default), inherit from footer. Otherwise, keep its value.
                if (updatedDivStyles.backgroundColor === 'transparent') {
                    updatedDivStyles.backgroundColor = 'inherit'; // This will be handled by footerPreview to use footer's background
                }

                // For text-related styles: only update if the div's current style is the default div style
                // This ensures user-set div styles are not overridden.
                if (updatedDivStyles.color === defaultDivStyles.color) {
                    updatedDivStyles.color = newFooterStyles.color;
                }
                if (updatedDivStyles.fontSize === defaultDivStyles.fontSize) {
                    updatedDivStyles.fontSize = newFooterStyles.fontSize;
                }
                if (updatedDivStyles.textAlign === defaultDivStyles.textAlign) {
                    updatedDivStyles.textAlign = newFooterStyles.textAlign;
                }
                if (updatedDivStyles.fontWeight === defaultDivStyles.fontWeight) {
                    updatedDivStyles.fontWeight = newFooterStyles.fontWeight;
                }

                return {
                    ...item,
                    divStyles: updatedDivStyles
                };
            });
        });
    }

    

    // Configuration save/load
    handleConfigSave(event) {
        const configData = {
            configurations: footerState.getConfigurations(),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(configData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.detail.fileName}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.closeConfigModal();
    }

    handleConfigLoad(event) {
        try {
            const configData = JSON.parse(event.detail.fileContent);
            footerState.setConfigurations(configData.configurations);
            this.switchDevice('desktop');
            this.closeConfigModal();
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
    }

    // Utility methods
    // This method is now primarily for local UI updates, state changes are handled by footerState
    updateGridItem(index, updates) {
        const currentItem = this.gridItems[index];
        const updatedItem = { ...currentItem, ...updates };
        
        // Process social icons display data if content type is social-icons
        if (updatedItem.contentType === 'social-icons') {
            updatedItem.isSocialIconsContent = true;
            updatedItem.isTextContent = false;
            updatedItem.isImageContent = false;
            updatedItem.hasSocialIcons = updatedItem.socialIcons && updatedItem.socialIcons.length > 0;
            
            // Prepare social icons for grid preview (limit to first 4 for display)
            if (updatedItem.hasSocialIcons) {
                updatedItem.socialIconsPreview = updatedItem.socialIcons.slice(0, 4).map(icon => ({
                    id: icon.id,
                    iconUrl: icon.iconUrl,
                    platform: icon.platform
                }));
            } else {
                updatedItem.socialIconsPreview = [];
            }
            
            // Set preview styles
            updatedItem.socialPreviewStyle = this.getSocialPreviewStyle(updatedItem);
            updatedItem.iconPreviewStyle = this.getIconPreviewStyle(updatedItem.iconSize || 'medium');
        } else if (updatedItem.contentType === 'image') {
            updatedItem.isImageContent = true;
            updatedItem.isTextContent = false;
            updatedItem.isSocialIconsContent = false;
            updatedItem.hasSocialIcons = false;
            updatedItem.socialIconsPreview = [];
        } else {
            updatedItem.isTextContent = true;
            updatedItem.isImageContent = false;
            updatedItem.isSocialIconsContent = false;
            updatedItem.hasSocialIcons = false;
            updatedItem.socialIconsPreview = [];
        }
        
        this.gridItems = [
            ...this.gridItems.slice(0, index),
            updatedItem,
            ...this.gridItems.slice(index + 1)
        ];
        
        // No need for immediate configuration sync here, as state changes are now pushed via footerState
    }


    getIconPreviewStyle(size) {
        // Smaller sizes for grid view
        const gridSizes = {
            small: '16px',
            medium: '20px',
            large: '24px',
            xl: '28px'
        };
        
        const iconSize = gridSizes[size] || '20px';
        
        return `
            width: ${iconSize};
            height: ${iconSize};
            object-fit: contain;
            border-radius: 2px;
            opacity: 0.8;
        `;
    }

    getSocialPreviewStyle(item) {
        const flexDirection = item.iconLayout === 'horizontal' ? 'row' : 'column';
        const justifyContent = item.iconAlignment || 'center';
        const gap = Math.min(parseFloat(item.iconSpacing) || 8, 8) + 'px'; // Limit gap for grid view
        
        return `
            display: flex;
            flex-direction: ${flexDirection};
            justify-content: ${justifyContent};
            align-items: center;
            gap: ${gap};
            flex-wrap: wrap;
            width: 100%;
            height: 100%;
            padding: 8px;
        `;
    }

    handleCellWidthTypeChange(event) {
        this.currentCellWidthType = event.detail.value;
        
        let newCellWidth;
        switch (this.currentCellWidthType) {
            case 'auto':
                newCellWidth = 'auto';
                this.showCustomWidthInput = false;
                this.customWidthValue = '';
                break;
            case 'fit-content':
                newCellWidth = 'fit-content(100%)';
                this.showCustomWidthInput = false;
                this.customWidthValue = '';
                break;
            case 'custom':
                this.showCustomWidthInput = true;
                if (this.customWidthValue) {
                    newCellWidth = this.customWidthValue + 'px';
                } else {
                    newCellWidth = '200px'; // Default custom value
                    this.customWidthValue = '200';
                }
                break;
            default:
                newCellWidth = 'auto';
        }
        
        this.cellWidth = newCellWidth;
        const currentConfig = footerState.getConfigurations();
        currentConfig[this.previewMode].deviceCellWidth = newCellWidth;
        footerState.setConfigurations(currentConfig);
        // REMOVED: this.resetFooterPreview(); // This was causing the infinite loop
    }

    // Enhanced cell height type change handler
    handleCellHeightTypeChange(event) {
        this.currentCellHeightType = event.detail.value;
        
        let newCellHeight;
        switch (this.currentCellHeightType) {
            case 'auto':
                newCellHeight = 'auto';
                this.showCustomHeightInput = false;
                this.customHeightValue = '';
                break;
            case 'fit-content':
                newCellHeight = 'fit-content(100%)';
                this.showCustomHeightInput = false;
                this.customHeightValue = '';
                break;
            case 'custom':
                this.showCustomHeightInput = true;
                if (this.customHeightValue) {
                    newCellHeight = this.customHeightValue + 'px';
                } else {
                    newCellHeight = '80px'; // Default custom value
                    this.customHeightValue = '80';
                }
                break;
            default:
                newCellHeight = 'auto';
        }
        
        this.cellHeight = newCellHeight;
        const currentConfig = footerState.getConfigurations();
        currentConfig[this.previewMode].deviceCellHeight = newCellHeight;
        footerState.setConfigurations(currentConfig);
        // REMOVED: this.resetFooterPreview(); // This was causing the infinite loop
    }

    // Computed properties
    get gridContainerStyle() {
        const footerStyleString = Object.entries(this.footerStyles)
            .map(([key, value]) => {
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                return `${cssKey}: ${value}`;
            })
            .join('; ');
        
        // Handle visual grid dimensions
        let cellHeightValue;
        let cellWidthValue;
        
        // Handle cell height for visual grid
        if (this.cellHeight === 'auto') {
            cellHeightValue = 'minmax(80px, auto)';
        } else if (this.cellHeight === 'fit-content(100%)') {
            cellHeightValue = 'fit-content(100%)';
        } else {
            cellHeightValue = this.cellHeight; // Custom px values
        }
        
        // Handle cell width for visual grid
        if (this.cellWidth === 'auto') {
            cellWidthValue = '1fr';
        } else if (this.cellWidth === 'fit-content(100%)') {
            cellWidthValue = 'fit-content(100%)';
        } else {
            cellWidthValue = this.cellWidth; // Custom px values
        }
            
        return `
            display: grid;
            grid-template-columns: repeat(${this.columns}, ${cellWidthValue});
            grid-template-rows: repeat(${this.rows}, ${cellHeightValue});
            gap: ${this.gap}px;
            width: 100%;
            min-height: 400px;
            border: 2px dashed #e0e0e0;
            background: #fafafa;
            position: relative;
            ${footerStyleString};
        `;
    }


    get currentDeviceInfo() {
        const filledDivsCount = this.gridItems.filter(item => !item.isEmpty).length;
        return {
            columns: this.columns,
            rows: this.rows,
            gap: this.gap,
            width: this.cellWidth,
            height: this.cellHeight,
            divs: filledDivsCount
        };
    }

    get deviceInfoText() {
        const info = this.currentDeviceInfo;
        return `${info.columns}×${info.rows} grid, ${info.gap}px gap, ${info.divs} divs`;
    }

    get isDesktopActive() { return this.previewMode === 'desktop'; }
    get isTabletActive() { return this.previewMode === 'tablet'; }
    get isMobileActive() { return this.previewMode === 'mobile'; }

    get desktopButtonClass() { return this.previewMode === 'desktop' ? 'device-btn active' : 'device-btn'; }
    get tabletButtonClass() { return this.previewMode === 'tablet' ? 'device-btn active' : 'device-btn'; }
    get mobileButtonClass() { return this.previewMode === 'mobile' ? 'device-btn active' : 'device-btn'; }

    get hasSelectedDivs() { 
        return this.selectedDivIds.length > 0; 
    }

    get selectedDivCount() {
        return this.selectedDivIds.length;
    }

    get previewSectionTitle() {
        return `${this.previewMode} Builder (${this.deviceInfoText})`;
    }

    get deviceGridInfo() {
        const info = this.currentDeviceInfo;
        return `${info.columns}×${info.rows}`;
    }

    get statusDetailText() {
        const info = this.currentDeviceInfo;
        return `in ${info.columns}×${info.rows} grid`;
    }

    get cellWidthOptions() {
        return [
            { label: 'Auto (Flexible)', value: 'auto' },
            { label: 'Fit Content', value: 'fit-content' },
            { label: 'Custom (px)', value: 'custom' }
        ];
    }

    get cellHeightOptions() {
        return [
            { label: 'Auto (Minimum 80px)', value: 'auto' },
            { label: 'Fit Content', value: 'fit-content' },
            { label: 'Custom (px)', value: 'custom' }
        ];
    }

    get processedGridItems() {
        return this.gridItems.map(item => {
            const isTextContent = !item.isEmpty && item.contentType === 'text';
            const isImageContent = !item.isEmpty && item.contentType === 'image';
            const isSocialIconsContent = !item.isEmpty && item.contentType === 'social-icons';
            const hasSocialIcons = isSocialIconsContent && item.socialIcons && item.socialIcons.length > 0;

            let socialIconsPreview = [];
            if (hasSocialIcons) {
                socialIconsPreview = item.socialIcons.slice(0, 4).map(icon => ({...icon}));
            }

            return {
                ...item,
                isTextContent,
                isImageContent,
                isSocialIconsContent,
                hasSocialIcons,
                socialIconsPreview,
                socialPreviewStyle: this.getSocialPreviewStyle(item),
                iconPreviewStyle: this.getIconPreviewStyle(item.iconSize || 'medium')
            };
        });
    }

    async withLoading(operation) {
        this.isLoading = true;
        try {
            await operation();
        } finally {
            // Use a short delay to ensure the spinner is visible for a minimum time
            setTimeout(() => {
                this.isLoading = false;
            }, 200);
        }
    }

    pushToUndoStack() {
        const currentState = JSON.stringify(this.gridItems);
        if (this.undoStack.length > 0 && this.undoStack[this.undoStack.length - 1] === currentState) {
            return; // Avoid pushing duplicate states
        }
        this.undoStack.push(currentState);
        if (this.undoStack.length > HISTORY_STACK_LIMIT) {
            this.undoStack.shift();
        }
        this.redoStack = []; // Clear redo stack on new action
    }

    handleUndo() {
        this.withLoading(() => {
            if (this.undoStack.length > 0) {
                const currentState = JSON.stringify(this.gridItems);
                this.redoStack.push(currentState);
                const prevState = this.undoStack.pop();
                this.gridItems = JSON.parse(prevState);
                this.syncConfigurationsNow();
                this.resetFooterPreview();
            }
        });
    }

    handleRedo() {
        this.withLoading(() => {
            if (this.redoStack.length > 0) {
                const currentState = JSON.stringify(this.gridItems);
                this.undoStack.push(currentState);
                const nextState = this.redoStack.pop();
                this.gridItems = JSON.parse(nextState);
                this.syncConfigurationsNow();
                this.resetFooterPreview();
            }
        });
    }

    get isUndoDisabled() {
        return this.undoStack.length === 0;
    }

    get isRedoDisabled() {
        return this.redoStack.length === 0;
    }

    openDocumentation() {
        window.open(Documentation_Link, '_blank');
    }
}