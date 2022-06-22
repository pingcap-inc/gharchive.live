import AnalyticsIcon from '@mui/icons-material/Analytics';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import { BottomNavigation, BottomNavigationAction, useEventCallback } from '@mui/material';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import React from 'react';

const SideContainer = styled('div')({
  width: '100%',
  height: 'calc(100vh - var(--ifm-navbar-height) - 22px)',
  backgroundColor: '#242526',
});

const ColorBox = styled(Box)({
  backgroundColor: '#242526',
  height: '76px',
});

export interface NavigatorProps {
  value: string;
  type: 'side' | 'bottom';
  comparing: boolean;
}

export function Navigator({ value, type, comparing }: NavigatorProps) {
  if (type === 'side') {
    return (
      <SideContainer>
        <ColorBox />
        <Tabs orientation="vertical" value={value ?? 'overview'}
              sx={{
                '.MuiTabs-flexContainer': {
                  gap: '16px',
                },
                '.MuiTab-root': {
                  fontSize: 12,
                  textDecoration: 'none',
                  textTransform: 'none',
                },
              }}
              variant="scrollable"
              scrollButtons="auto"
        >
          {renderTabs(comparing ? 6 : undefined)}
        </Tabs>
      </SideContainer>
    );
  } else {
    return (
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation showLabels value={value ?? 'overview'}>
          {renderBottomNavigationActions(comparing ? 6 : undefined)}
        </BottomNavigation>
      </Paper>
    );
  }
}

const tabs: { id: string, label: string, icon?: JSX.Element }[] = [
  { id: 'divider-0', label: 'Analytics', icon: <AnalyticsIcon fontSize='inherit' sx={{ mr: 0.5 }} /> },
  { id: 'overview', label: 'Overview' },
  { id: 'people', label: 'People' },
  { id: 'commits', label: 'Commits' },
  { id: 'pull-requests', label: 'Pull Requests' },
  { id: 'issues', label: 'Issues' },
  { id: 'divider-1', label: 'Monthly Stats', icon: <AutoGraphIcon fontSize='inherit' sx={{ mr: 0.5 }} /> },
  { id: 'contributors', label: 'Contributors' },
];

const renderTabs = (n?: number) => {
  return tabs.slice(0, n).map(tab => {
    if (tab.id.startsWith('divider-')) {
      return (
        <Stack sx={{ fontSize: 14, pl: 2, color: 'primary.main' }} direction="row" alignItems='center'>
          {tab.icon}
          <span>
            {tab.label}
          </span>
        </Stack>
      );
    } else {
      return (
        <Tab
          key={tab.id}
          label={tab.label}
          value={tab.id}
          icon={tab.icon}
          disableRipple
          onClick={useEventCallback(() => {
            document.getElementById(tab.id)?.scrollIntoView();
          })}
          sx={{
            py: 0.5,
            pl: 4.125,
            height: 28,
            minHeight: 28,
            alignItems: 'flex-start',
          }}
        />
      );
    }
  });
};

const renderBottomNavigationActions = (n?: number) => {
  return tabs.slice(0, n).map(tab => {
    if (tab.id.startsWith('divider-')) {
      return <></>;
    } else {
      return (
        <BottomNavigationAction
          key={tab.id}
          label={tab.label}
          value={tab.id}
          icon={tab.icon}
          disableRipple
          onClick={useEventCallback(() => {
            document.getElementById(tab.id)?.scrollIntoView();
          })}
        />
      );
    }
  });
};
