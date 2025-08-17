// LWC module for central state management
let _configurations = {};
let _formFactor = 'desktop';

const subscribers = {};

const subscribe = (eventName, callback) => {
    if (!subscribers[eventName]) {
        subscribers[eventName] = [];
    }
    subscribers[eventName].push(callback);
};

const unsubscribe = (eventName, callback) => {
    if (subscribers[eventName]) {
        subscribers[eventName] = subscribers[eventName].filter(cb => cb !== callback);
    }
};

const publish = (eventName, data) => {
    if (subscribers[eventName]) {
        subscribers[eventName].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in subscriber for event ${eventName}:`, error);
            }
        });
    }
};

const setConfigurations = (newConfig) => {
    _configurations = JSON.parse(JSON.stringify(newConfig));
    publish('configChanged', _configurations);
};

const getConfigurations = () => {
    return JSON.parse(JSON.stringify(_configurations));
};

const getGridItems = (device) => {
    return _configurations[device]?.gridItems || [];
};

const updateGridItem = (divId, device, updates) => {
    if (_configurations[device]) {
        const currentItems = _configurations[device].gridItems || [];
        const itemIndex = currentItems.findIndex(i => i.id === divId);
        if (itemIndex > -1) {
            const newItems = [...currentItems]; // Create a new array
            newItems[itemIndex] = { ...newItems[itemIndex], ...updates }; // Apply all updates
            // Ensure draggable is explicitly set if not provided in updates
            if (updates.draggable === undefined) {
                newItems[itemIndex].draggable = !newItems[itemIndex].isEmpty;
            }
            _configurations[device].gridItems = newItems; // Assign new array
            publish('gridChanged', { device });
        }
    }
};

const moveGridItem = (sourceId, targetId, device) => {
    const items = _configurations[device]?.gridItems || [];
    const sourceIndex = items.findIndex(i => i.id === sourceId);
    const targetIndex = items.findIndex(i => i.id === targetId);

    if (sourceIndex > -1 && targetIndex > -1) {
        const sourceItem = items[sourceIndex];
        const targetItem = items[targetIndex];

        const newItems = [...items];

        newItems[targetIndex] = {
            ...targetItem,
            content: sourceItem.content,
            contentType: sourceItem.contentType,
            imageUrl: sourceItem.imageUrl,
            linkUrl: sourceItem.linkUrl,
            linkTarget: sourceItem.linkTarget,
            showPointer: sourceItem.showPointer,
            isEmpty: false,
            isTextContent: sourceItem.isTextContent,
            isImageContent: sourceItem.isImageContent,
            isSocialIconsContent: sourceItem.isSocialIconsContent,
            divStyles: sourceItem.divStyles,
            customClassName: sourceItem.customClassName,
            socialIcons: sourceItem.socialIcons,
            iconLayout: sourceItem.iconLayout,
            iconAlignment: sourceItem.iconAlignment,
            iconSize: sourceItem.iconSize,
            iconSpacing: sourceItem.iconSpacing,
            colSpan: sourceItem.colSpan,
            rowSpan: sourceItem.rowSpan,
            style: `grid-column: ${targetItem.gridColumn} / span ${sourceItem.colSpan}; grid-row: ${targetItem.gridRow} / span ${sourceItem.rowSpan}; z-index: ${sourceItem.colSpan > 1 || sourceItem.rowSpan > 1 ? 10 : 1};`,
            draggable: true // Ensure dragged item is draggable in new slot
        };

        newItems[sourceIndex] = {
            ...sourceItem,
            content: '',
            contentType: 'text',
            imageUrl: '',
            linkUrl: '',
            linkTarget: '_self',
            showPointer: false,
            isEmpty: true,
            isTextContent: false,
            isImageContent: false,
            isSocialIconsContent: false,
            divStyles: {}, // Reset divStyles for empty cell
            customClassName: '',
            socialIcons: [],
            iconLayout: 'horizontal',
            iconAlignment: 'center',
            iconSize: 'medium',
            iconSpacing: '12px',
            colSpan: 1,
            rowSpan: 1,
            style: `grid-column: ${sourceItem.gridColumn} / span 1; grid-row: ${sourceItem.gridRow} / span 1; z-index: 1;`,
            draggable: false // Empty cell is not draggable
        };

        _configurations[device].gridItems = newItems; // Assign the new array
        publish('gridChanged', { device });
    }
};

const updateFooterStyles = (device, newStyles) => {
    if (_configurations[device]) {
        _configurations[device].footerStyles = { ..._configurations[device].footerStyles, ...newStyles };
        publish('footerStyleChanged', { device });
    }
};



const setFormFactor = (newFormFactor) => {
    _formFactor = newFormFactor;
    publish('formFactorChanged', _formFactor);
};

const getFormFactor = () => {
    return _formFactor;
};

export {
    subscribe,
    unsubscribe,
    setConfigurations,
    getConfigurations,
    getGridItems,
    updateGridItem,
    moveGridItem,
    updateFooterStyles,
    setFormFactor,
    getFormFactor
};