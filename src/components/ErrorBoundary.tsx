'use client'
import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50 p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-stone-500 mb-6">We&apos;re sorry, something unexpected happened. Please try refreshing the page.</p>
            <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold rounded-xl">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
