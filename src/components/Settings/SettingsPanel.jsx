import React from 'react'
import { HelpCircle, RotateCcw } from 'lucide-react'

/**
 * Generic Settings Panel Component
 * Provides a consistent layout for all settings categories
 */
const SettingsPanel = ({ 
  title, 
  description, 
  children, 
  onReset, 
  showReset = true,
  helpText = null 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Panel Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {helpText && (
              <button
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                title={helpText}
              >
                <HelpCircle size={20} />
              </button>
            )}
            
            {showReset && onReset && (
              <button
                onClick={onReset}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Reset to defaults"
              >
                <RotateCcw size={16} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Panel Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

/**
 * Settings Toggle Component
 */
export const SettingsToggle = ({ 
  label, 
  description, 
  checked, 
  onChange, 
  disabled = false 
}) => {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{label}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-youtube-red/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-youtube-red peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
      </label>
    </div>
  )
}

/**
 * Settings Select Component
 */
export const SettingsSelect = ({ 
  label, 
  description, 
  value, 
  onChange, 
  options, 
  disabled = false 
}) => {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{label}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="input-field w-auto min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

/**
 * Settings Input Component
 */
export const SettingsInput = ({ 
  label, 
  description, 
  value, 
  onChange, 
  type = 'text',
  placeholder = '',
  disabled = false,
  min,
  max,
  step
}) => {
  return (
    <div className="py-3">
      <div className="mb-2">
        <h3 className="font-medium text-gray-900">{label}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className="input-field w-full disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}

/**
 * Settings Number Input with Range
 */
export const SettingsRange = ({ 
  label, 
  description, 
  value, 
  onChange, 
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  disabled = false 
}) => {
  return (
    <div className="py-3">
      <div className="mb-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">{label}</h3>
          <span className="text-sm font-medium text-gray-600">
            {value}{unit}
          </span>
        </div>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed"
      />
      
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

/**
 * Settings Color Picker Component
 */
export const SettingsColorPicker = ({ 
  label, 
  description, 
  value, 
  onChange, 
  disabled = false 
}) => {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{label}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="input-field w-20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="#FF0000"
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Settings Section Divider
 */
export const SettingsDivider = ({ title }) => {
  return (
    <div className="py-4">
      <div className="border-t border-gray-200 pt-4">
        {title && (
          <h4 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
            {title}
          </h4>
        )}
      </div>
    </div>
  )
}

export default SettingsPanel
