import { Box, Container, Grid } from '@mui/material';
import { ReactNode } from 'react';
import DashboardHeader from './Header';
import DashboardSidebar from './Sidebar';

interface DashboardLayoutProps {
    children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <DashboardSidebar />
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <DashboardHeader />
                <Container sx={{ mt: 4, mb: 4 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            {children}
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
}

export default DashboardLayout;