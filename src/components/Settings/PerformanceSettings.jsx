import React from 'react'
import SettingsPanel, { 
  SettingsToggle, 
  SettingsSelect,
  SettingsRange,
  SettingsDivider 
} from './SettingsPanel'

const PerformanceSettings = ({ settings, onChange }) => {
  const performanceSettings = settings.performance || {}

  const handleChange = (key, value) => {
    onChange('performance', { ...performanceSettings, [key]: value })
  }

  const handleOptimizationChange = (key, value) => {
    const optimization = performanceSettings.uploadOptimization || {}
    handleChange('uploadOptimization', { ...optimization, [key]: value })
  }

  const handleBandwidthChange = (key, value) => {
    const bandwidth = performanceSettings.bandwidthManagement || {}
    handleChange('bandwidthManagement', { ...bandwidth, [key]: value })
  }

  const handleOffPeakChange = (key, value) => {
    const bandwidth = performanceSettings.bandwidthManagement || {}
    const offPeak = bandwidth.offPeakHours || {}
    handleBandwidthChange('offPeakHours', { ...offPeak, [key]: value })
  }

  const chunkSizeOptions = [
    { value: 1048576, label: '1 MB' },
    { value: 2097152, label: '2 MB' },
    { value: 4194304, label: '4 MB' },
    { value: 8388608, label: '8 MB (Recommended)' },
    { value: 16777216, label: '16 MB' },
    { value: 33554432, label: '32 MB' }
  ]

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <SettingsPanel
      title="Performance & Quality"
      description="Optimize upload performance, quality settings, and bandwidth usage"
      helpText="Configure upload optimization settings to balance speed, quality, and bandwidth usage"
    >
      <div className="space-y-1">
        <SettingsDivider title="Upload Optimization" />

        <SettingsToggle
          label="Enable Parallel Uploads"
          description="Upload multiple video chunks simultaneously (experimental)"
          checked={performanceSettings.uploadOptimization?.enableParallelUploads || false}
          onChange={(value) => handleOptimizationChange('enableParallelUploads', value)}
        />

        <SettingsRange
          label="Max Concurrent Uploads"
          description="Maximum number of videos to upload at the same time"
          value={performanceSettings.uploadOptimization?.maxConcurrentUploads || 1}
          onChange={(value) => handleOptimizationChange('maxConcurrentUploads', value)}
          min={1}
          max={5}
          step={1}
          unit=" uploads"
        />

        <SettingsToggle
          label="Enable Resumable Uploads"
          description="Allow uploads to resume if interrupted (recommended)"
          checked={performanceSettings.uploadOptimization?.enableResumableUploads !== false}
          onChange={(value) => handleOptimizationChange('enableResumableUploads', value)}
        />

        <SettingsSelect
          label="Upload Chunk Size"
          description="Size of each upload chunk (larger = faster, more memory)"
          value={performanceSettings.uploadOptimization?.chunkSize || 8388608}
          onChange={(value) => handleOptimizationChange('chunkSize', parseInt(value))}
          options={chunkSizeOptions}
        />

        <SettingsRange
          label="Retry Attempts"
          description="Number of times to retry failed upload chunks"
          value={performanceSettings.uploadOptimization?.retryAttempts || 3}
          onChange={(value) => handleOptimizationChange('retryAttempts', value)}
          min={1}
          max={10}
          step={1}
          unit=" attempts"
        />

        <SettingsDivider title="Quality Presets" />

        <div className="space-y-3">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Video Quality Presets</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {Object.entries(performanceSettings.qualityPresets || {
                '4k': { width: 3840, height: 2160, bitrate: 45000 },
                '1440p': { width: 2560, height: 1440, bitrate: 16000 },
                '1080p': { width: 1920, height: 1080, bitrate: 8000 },
                '720p': { width: 1280, height: 720, bitrate: 5000 }
              }).map(([quality, preset]) => (
                <div key={quality} className="p-3 bg-white rounded border">
                  <div className="font-medium text-gray-900">{quality}</div>
                  <div className="text-gray-600">
                    {preset.width}×{preset.height} • {preset.bitrate.toLocaleString()} kbps
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SettingsDivider title="Bandwidth Management" />

        <SettingsToggle
          label="Enable Upload Throttling"
          description="Limit upload speed to preserve bandwidth for other activities"
          checked={performanceSettings.bandwidthManagement?.enableThrottling || false}
          onChange={(value) => handleBandwidthChange('enableThrottling', value)}
        />

        {performanceSettings.bandwidthManagement?.enableThrottling && (
          <SettingsRange
            label="Max Upload Speed"
            description="Maximum upload speed in Mbps (0 = unlimited)"
            value={performanceSettings.bandwidthManagement?.maxUploadSpeed || 0}
            onChange={(value) => handleBandwidthChange('maxUploadSpeed', value)}
            min={0}
            max={100}
            step={1}
            unit=" Mbps"
          />
        )}

        <SettingsToggle
          label="Schedule Uploads During Off-Peak Hours"
          description="Automatically schedule uploads during specified hours"
          checked={performanceSettings.bandwidthManagement?.scheduleUploads || false}
          onChange={(value) => handleBandwidthChange('scheduleUploads', value)}
        />

        {performanceSettings.bandwidthManagement?.scheduleUploads && (
          <div className="ml-6 space-y-3 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Off-Peak Hours</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Start Time</label>
                <input
                  type="time"
                  value={performanceSettings.bandwidthManagement?.offPeakHours?.start || '02:00'}
                  onChange={(e) => handleOffPeakChange('start', e.target.value)}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">End Time</label>
                <input
                  type="time"
                  value={performanceSettings.bandwidthManagement?.offPeakHours?.end || '06:00'}
                  onChange={(e) => handleOffPeakChange('end', e.target.value)}
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">🚀 Performance Metrics</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-green-800">
              {formatBytes(performanceSettings.uploadOptimization?.chunkSize || 8388608)}
            </div>
            <div className="text-green-700">Chunk Size</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-green-800">
              {performanceSettings.uploadOptimization?.maxConcurrentUploads || 1}x
            </div>
            <div className="text-green-700">Concurrent</div>
          </div>
          <div className="text-center p-2 bg-white rounded">
            <div className="font-bold text-green-800">
              {performanceSettings.uploadOptimization?.retryAttempts || 3}
            </div>
            <div className="text-green-700">Retries</div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="mt-6 p-4 bg-orange-50 rounded-lg">
        <h4 className="font-medium text-orange-900 mb-2">⚡ Performance Tips</h4>
        <ul className="text-sm text-orange-800 space-y-1">
          <li>• Larger chunk sizes upload faster but use more memory</li>
          <li>• Parallel uploads can speed up large files but may be unstable</li>
          <li>• Resumable uploads prevent data loss on connection issues</li>
          <li>• Throttling helps maintain internet speed for other activities</li>
          <li>• Off-peak scheduling can improve upload reliability</li>
          <li>• Higher retry counts help with unstable connections</li>
        </ul>
      </div>
    </SettingsPanel>
  )
}

export default PerformanceSettings
