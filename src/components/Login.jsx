import React, { useState } from 'react'
import { Youtube, Plus, Shield, Users, BarChart3 } from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import toast from 'react-hot-toast'

const Login = () => {
  const { addAccount } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectAccount = async () => {
    setIsConnecting(true)
    try {
      const result = await addAccount()
      if (result.success) {
        toast.success(`Connected to ${result.account.channelName}!`)
      } else {
        toast.error(result.error || 'Failed to connect account')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsConnecting(false)
    }
  }

  const features = [
    {
      icon: Users,
      title: 'Multi-Account Management',
      description: 'Connect and manage multiple YouTube channels from one place'
    },
    {
      icon: Youtube,
      title: 'Video Upload & Scheduling',
      description: 'Upload videos with drag-and-drop and schedule future releases'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track performance across all your channels with detailed insights'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your credentials are encrypted and stored securely on your device'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-youtube-red to-youtube-red-dark flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6">
            <Youtube size={40} className="text-youtube-red" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            YouTube Channel Manager
          </h1>
          <p className="text-xl text-red-100 mb-8">
            Manage multiple YouTube channels with ease
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-red-100">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Get Started
              </h2>
              <p className="text-gray-600">
                Connect your first YouTube account to begin managing your content
              </p>
            </div>

            <button
              onClick={handleConnectAccount}
              disabled={isConnecting}
              className="w-full bg-youtube-red hover:bg-youtube-red-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Connect YouTube Account</span>
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                By connecting your account, you agree to our{' '}
                <button className="text-youtube-red hover:underline">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button className="text-youtube-red hover:underline">
                  Privacy Policy
                </button>
              </p>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• You'll be redirected to Google for secure authentication</li>
                <li>• Grant permissions for YouTube access</li>
                <li>• Your account will be added to the manager</li>
                <li>• Start managing your content immediately</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-red-100 text-sm">
            Desktop app for Windows • Secure local storage • No data collection
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
