import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="text-center max-w-md px-6">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              应用发生错误
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {this.state.error?.message || '未知错误'}
            </p>
            <pre className="text-xs text-left text-gray-400 bg-gray-100 dark:bg-gray-800 rounded p-3 mb-4 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
