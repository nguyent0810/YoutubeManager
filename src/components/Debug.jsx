import React from 'react'
import { useAuth } from '../services/AuthContext'

const Debug = () => {
  const { accounts, activeAccount, loading, isAuthenticated } = useAuth()

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Debug Information</h2>
      
      <div className="space-y-2">
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>Number of Accounts:</strong> {accounts.length}</p>
        <p><strong>Active Account:</strong> {activeAccount ? activeAccount.channelName : 'None'}</p>
        <p><strong>Running in Electron:</strong> {window.electronAPI ? 'Yes' : 'No'}</p>
        <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
      </div>

      {accounts.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold">Accounts:</h3>
          <ul className="list-disc list-inside">
            {accounts.map((account, index) => (
              <li key={index}>{account.email} - {account.channelName}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default Debug
