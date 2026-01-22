import { Box, CircularProgress, Typography } from '@mui/material'

interface FullPageLoadingProps {
  message?: string
}

export const FullPageLoading = ({ message = 'Carregando...' }: FullPageLoadingProps) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="100vh"
    gap={2}
  >
    <CircularProgress />
    <Typography variant="h6">{message}</Typography>
  </Box>
)
