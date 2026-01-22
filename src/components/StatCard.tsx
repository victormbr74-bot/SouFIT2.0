import { Card, CardContent, Typography } from '@mui/material'

interface StatCardProps {
  label: string
  value: string
  helper?: string
}

export const StatCard = ({ label, value, helper }: StatCardProps) => (
  <Card elevation={2} sx={{ minWidth: 180 }}>
    <CardContent>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={600}>
        {value}
      </Typography>
      {helper && (
        <Typography variant="body2" color="text.secondary">
          {helper}
        </Typography>
      )}
    </CardContent>
  </Card>
)
