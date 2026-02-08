import { Card, CardContent, Typography } from '@mui/material';
interface StatCardProps {

    title: string;
    value: string | number;
    icon: React.ReactNode;
}

export function StatCard({ title, value, icon }: StatCardProps) {
    return (
        <Card className="flex items-center p-4 bg-white shadow rounded-lg">

            <div className="text-primary text-3xl mr-4">
                {icon}
            </div>
            <CardContent className="p-0">
                <Typography variant="subtitle2" color="textSecondary">
                    {title}
                </Typography>
                <Typography variant="h5" color="textPrimary">
                    {value}
                </Typography>
            </CardContent>


            