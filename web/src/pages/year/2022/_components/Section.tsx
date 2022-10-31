import Box from "@mui/material/Box";
import React, { createContext, ForwardedRef, forwardRef, PropsWithChildren, ReactNode, Ref, useContext } from "react";
import { H2, H3, P2 } from './typograph';
import { TypographyProps } from "@mui/material/Typography";

interface SectionProps {
  title?: ReactNode;
  description?: ReactNode;
  descriptionProps?: TypographyProps<'div'>;
}

interface SectionContextValues {
  id: string | undefined;
  ref: Ref<HTMLDivElement | null> | undefined;
}

export const SectionContext = createContext<SectionContextValues>({
  id: undefined,
  ref: undefined,
});

export default function Section({
  title,
  description,
  descriptionProps = {},
  children,
}: PropsWithChildren<SectionProps>) {
  const { id, ref } = useContext(SectionContext);

  return (
    <Box
      id={id}
      component="section"
      sx={theme => ({
        '&:not(:first-of-type)': {
          borderTop: '2px dashed #4D4D4D',
        },
        [theme.breakpoints.up('sm')]: {
          py: 4,
          borderWidth: '3px !important',
        },
        [theme.breakpoints.up('md')]: {
          py: 6,
          borderWidth: '4px !important',
        },
        [theme.breakpoints.up('lg')]: {
          py: 8,
          borderWidth: '6px !important',
          '&:not(:first-of-type)': {
            pt: 8
          },
        },
        py: 3,
      })}
      ref={ref}
    >
      {title && <H2>{title}</H2>}
      {description && <P2 mt={3} {...descriptionProps}>{description}</P2>}
      {children}
    </Box>
  );
}

export function SubSection({ title, description, children }: PropsWithChildren<SectionProps>) {
  return (
    <Box
      component="div"
      sx={theme => ({
        '&:first-of-type': {
          pt: 0,
        },
        '&:not(:first-of-type)': {
          borderTop: '1px solid #4D4D4D40',
        },
        py: 2,
        [theme.breakpoints.up('sm')]: {
          py: 3,
          borderWidth: '2px !important',
        },
        [theme.breakpoints.up('md')]: {
          py: 5,
          borderWidth: '3px !important',
        },
        [theme.breakpoints.up('lg')]: {
          py: 6,
        }
      })}
    >
      {title && <H3>{title}</H3>}
      {description && <P2 mt={3}>{description}</P2>}
      {children}
    </Box>
  );
}
