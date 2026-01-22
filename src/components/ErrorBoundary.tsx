import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Box, Button, Typography } from '@mui/material'

interface State {
  hasError: boolean
  message?: string
}

interface Props {
  children: ReactNode
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          minHeight="100vh"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={2}
          padding={4}
          bgcolor="background.default"
        >
          <Typography variant="h4">Ops, algo deu errado.</Typography>
          <Typography color="text.secondary">
            Tente recarregar a página ou volte mais tarde.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </Box>
      )
    }

    return this.props.children
  }
}
