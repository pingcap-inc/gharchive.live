import React from "react";
import RepoSelector, {Repo} from "./RepoSelector";
import Grid from "@mui/material/Grid";
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Box, {BoxProps} from "@mui/material/Box";
import useThemeContext from "@theme/hooks/useThemeContext";
import {combineSx} from "../../utils/mui";

interface CompareHeaderProps extends BoxProps {
  repo1: Repo | null
  repo2: Repo | null
  onRepo1Change: (repo: Repo | null) => void
  onRepo2Change: (repo: Repo | null) => void
  onRepo1Valid: (repo: Repo | null) => (string | undefined)
  onRepo2Valid: (repo: Repo | null) => (string | undefined)
  repo1DisableClearable?: boolean
}

function CompareHeader({
  repo1,
  repo2,
  onRepo1Change,
  onRepo2Change,
  onRepo1Valid,
  onRepo2Valid,
  repo1DisableClearable,
  sx,
  ...props
}: CompareHeaderProps) {
  const {isDarkTheme} = useThemeContext();

  return (
    <Box
      position='sticky'
      sx={combineSx({
        my: 2,
        py: 2,
        top: 'var(--ifm-navbar-height)',
        zIndex: 'var(--ifm-z-index-fixed-mui)',
        backgroundColor: isDarkTheme ? 'var(--ifm-background-color)' : 'background.default',
        borderBottom: '1px solid transparent',
        borderBottomColor: 'divider'
      }, sx)}
      {...props}
    >
      <Grid container>
        <Grid item xs={5.5} display='flex' justifyContent='flex-end' px={1}>
          <RepoSelector
            label="Repo Name 1"
            defaultRepoName="recommend-repo-list-1-keyword"
            repo={repo1}
            onChange={onRepo1Change}
            onValid={onRepo1Valid}
            disableClearable={repo1DisableClearable}
          />
        </Grid>
        <Grid item xs={1} display='flex' justifyContent='center' alignItems='center'>
          <Box sx={{
            borderRadius: 1,
            maxWidth: 'min-content',
            px: 1,
            backgroundColor: 'text.primary',
            color: 'background.default',
            fontWeight: 'bolder'
          }}>
            VS.
          </Box>
        </Grid>
        <Grid item xs={5.5} display='flex' justifyContent='flex-start' px={1}>
          <RepoSelector
            label="Repo Name 2"
            defaultRepoName="recommend-repo-list-2-keyword"
            repo={repo2}
            onChange={onRepo2Change}
            onValid={onRepo2Valid}
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default CompareHeader;
