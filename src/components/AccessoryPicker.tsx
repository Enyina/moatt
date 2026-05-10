'use client';

import { useState, useEffect } from 'react';
import { useAvatarStore } from '@/store/useAvatarStore';
import { Accessory, AccessoryType, Vector3 } from '@/lib/types';

const accessoryTypes: { type: AccessoryType; label: string; icon: string }[] = [
  { type: 'hat', label: 'Hats', icon: '🎩' },
  { type: 'glasses', label: 'Glasses', icon: '👓' },
  { type: 'jewelry', label: 'Jewelry', icon: '💍' },
  { type: 'bag', label: 'Bags', icon: '👜' },
  { type: 'shoes', label: 'Shoes', icon: '👟' },
  { type: 'scarf', label: 'Scarves', icon: '🧣' },
  { type: 'belt', label: 'Belts', icon: '👔' },
  { type: 'watch', label: 'Watches', icon: '⌚' },
  { type: 'gloves', label: 'Gloves', icon: '🧤' },
  { type: 'custom', label: 'Custom', icon: '✨' }
];

// Default accessories for each type
const defaultAccessories: Record<AccessoryType, Omit<Accessory, 'id'>> = {
  hat: {
    name: 'Baseball Cap',
    type: 'hat',
    position: { x: 0, y: 1.8, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    modelUrl: '/accessories/hat-cap.glb',
    isVisible: true
  },
  glasses: {
    name: 'Sunglasses',
    type: 'glasses',
    position: { x: 0, y: 1.65, z: 0.1 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    modelUrl: '/accessories/glasses-sunglasses.glb',
    isVisible: true
  },
  jewelry: {
    name: 'Necklace',
    type: 'jewelry',
    position: { x: 0, y: 1.5, z: 0.1 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    modelUrl: '/accessories/necklace-simple.glb',
    isVisible: true
  },
  bag: {
    name: 'Handbag',
    type: 'bag',
    position: { x: 0.3, y: 1.2, z: 0.2 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    modelUrl: '/accessories/bag-handbag.glb',
    isVisible: true
  },
  shoes: {
    name: 'Sneakers',
    type: 'shoes',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    modelUrl: '/accessories/shoes-sneakers.glb',
    isVisible: true
  },
  scarf: {
    name: 'Winter Scarf',
    type: 'scarf',
    position: { x: 0, y: 1.6, z: 0.1 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    modelUrl: '/accessories/scarf-winter.glb',
    isVisible: true
  },
  belt: {
    name: 'Leather Belt',
    type: 'belt',
    position: { x: 0, y: 1.0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    modelUrl: '/accessories/belt-leather.glb',
    isVisible: true
  },
  watch: {
    name: 'Smart Watch',
    type: 'watch',
    position: { x: -0.15, y: 0.8, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    modelUrl: '/accessories/watch-smart.glb',
    isVisible: true
  },
  gloves: {
    name: 'Winter Gloves',
    type: 'gloves',
    position: { x: 0, y: 0.45, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    modelUrl: '/accessories/gloves-winter.glb',
    isVisible: true
  },
  custom: {
    name: 'Custom Accessory',
    type: 'custom',
    position: { x: 0, y: 1.5, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    textureUrl: '',
    isVisible: true
  }
};

export function AccessoryPicker() {
  const [selectedType, setSelectedType] = useState<AccessoryType | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [customColor, setCustomColor] = useState('#EA931D');
  
  const {
    currentAvatar,
    availableAccessories,
    ui,
    addAccessory,
    updateAccessory,
    removeAccessory,
    toggleAccessoryVisibility,
    setSelectedAccessoryType,
    loadAvailableAccessories
  } = useAvatarStore();

  // Load accessories on mount
  useEffect(() => {
    loadAvailableAccessories();
  }, [loadAvailableAccessories]);

  // Sync selected type with store
  useEffect(() => {
    setSelectedType(ui.selectedAccessoryType);
  }, [ui.selectedAccessoryType]);

  const handleAddAccessory = (type: AccessoryType) => {
    const defaultAccessory = defaultAccessories[type];
    if (defaultAccessory) {
      addAccessory({
        ...defaultAccessory,
        color: type === 'custom' ? customColor : undefined
      });
    }
  };

  const handleDrawCustomAccessory = () => {
    setIsDrawingMode(true);
    // This would open a drawing interface for custom accessories
    // For now, we'll add a placeholder
    addAccessory({
      name: 'Custom Drawing',
      type: 'custom',
      position: { x: 0, y: 1.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      textureUrl: '', // Would be populated by drawing interface
      color: customColor,
      isVisible: true
    });
    setIsDrawingMode(false);
  };

  const getAccessoriesByType = (type: AccessoryType) => {
    return currentAvatar.accessories.filter(acc => acc.type === type);
  };

  const isSelectedType = (type: AccessoryType) => {
    return selectedType === type;
  };

  return (
    <div className="bg-[#171717] rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Accessories</h2>
        
        {/* Accessory Types Grid */}
        <div className="grid grid-cols-2 gap-3">
          {accessoryTypes.map(({ type, label, icon }) => {
            const count = getAccessoriesByType(type).length;
            const isSelected = isSelectedType(type);
            
            return (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(isSelected ? null : type);
                  setSelectedAccessoryType(isSelected ? null : type);
                }}
                className={`relative bg-[#0E0E0E] rounded-xl p-4 hover:bg-[#1a1a1a] transition-all text-center ${
                  isSelected ? 'ring-2 ring-[#EA931D]' : ''
                }`}
              >
                {/* Count Badge */}
                {count > 0 && (
                  <span className="absolute top-2 right-2 bg-[#EA931D] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {count}
                  </span>
                )}

                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-white text-sm font-medium">{label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Type Details */}
      {selectedType && (
        <div className="flex-1 overflow-y-auto">
          <div className="bg-[#0E0E0E] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <span className="text-xl">
                  {accessoryTypes.find(t => t.type === selectedType)?.icon}
                </span>
                {accessoryTypes.find(t => t.type === selectedType)?.label}
              </h3>
              <button
                onClick={() => {
                  setSelectedType(null);
                  setSelectedAccessoryType(null);
                }}
                className="text-[#4C4B4B] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Custom Color Picker for custom accessories */}
            {selectedType === 'custom' && (
              <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">Custom Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-12 h-12 rounded border border-[rgba(255,255,255,0.1)] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="flex-1 bg-[#171717] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-3 text-white text-sm"
                    placeholder="#EA931D"
                  />
                </div>
              </div>
            )}

            {/* Add Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleAddAccessory(selectedType)}
                className="flex-1 bg-[#EA931D] text-black py-2 px-4 rounded-lg text-sm font-medium hover:bg-[#EA931D]/90 transition-colors"
              >
                Add {selectedType === 'custom' ? 'Custom' : accessoryTypes.find(t => t.type === selectedType)?.label}
              </button>
              
              {selectedType === 'custom' && (
                <button
                  onClick={handleDrawCustomAccessory}
                  disabled={isDrawingMode}
                  className="flex-1 bg-[#0E0E0E] text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-[#1a1a1a] transition-colors border border-[rgba(255,255,255,0.1)]"
                >
                  {isDrawingMode ? 'Drawing...' : 'Draw Custom'}
                </button>
              )}
            </div>

            {/* Current Accessories of this type */}
            <div className="space-y-3">
              {getAccessoriesByType(selectedType).map((accessory) => (
                <div
                  key={accessory.id}
                  className="bg-[#171717] rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{accessory.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {accessory.color && (
                        <div
                          className="w-3 h-3 rounded-full border border-[rgba(255,255,255,0.3)]"
                          style={{ backgroundColor: accessory.color }}
                        />
                      )}
                      <p className="text-[#4C4B4B] text-xs">
                        {accessory.modelUrl ? '3D Model' : 'Custom Texture'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Visibility Toggle */}
                    <button
                      onClick={() => toggleAccessoryVisibility(accessory.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        accessory.isVisible
                          ? 'bg-[#EA931D] text-black'
                          : 'bg-[rgba(255,255,255,0.1)] text-[#4C4B4B]'
                      }`}
                      title={accessory.isVisible ? 'Hide' : 'Show'}
                    >
                      {accessory.isVisible ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeAccessory(accessory.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Remove accessory"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {getAccessoriesByType(selectedType).length === 0 && (
                <div className="text-center py-4">
                  <p className="text-[#4C4B4B] text-sm">No {accessoryTypes.find(t => t.type === selectedType)?.label.toLowerCase()} added yet</p>
                  <p className="text-[#666] text-xs mt-1">Click "Add" above to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[rgba(234,147,29,0.1)] rounded-lg p-3">
            <h4 className="text-[#EA931D] text-xs font-medium mb-1">💡 Tips</h4>
            <ul className="text-[#CCCCCC] text-xs space-y-1">
              <li>• Click "Add" to place accessories on your mannequin</li>
              <li>• Use the 3D viewer to adjust position and rotation</li>
              <li>• Toggle visibility to temporarily hide accessories</li>
              {selectedType === 'custom' && <li>• Draw custom accessories or use 3D models</li>}
            </ul>
          </div>
        </div>
      )}

      {/* Summary when no type selected */}
      {!selectedType && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#0E0E0E] rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#4C4B4B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium mb-2">Choose an Accessory Type</p>
            <p className="text-[#4C4B4B] text-xs">Select a category above to add accessories to your mannequin</p>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#4C4B4B]">
            {currentAvatar.accessories.length} {currentAvatar.accessories.length === 1 ? 'accessory' : 'accessories'} total
          </span>
          <span className="text-[#4C4B4B]">
            {currentAvatar.accessories.filter(acc => acc.isVisible).length} visible
          </span>
        </div>
      </div>
    </div>
  );
}
