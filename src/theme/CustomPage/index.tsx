import React, {PropsWithChildren} from 'react'
import Layout, {Props as LayoutProps} from '@theme/Layout';
import ThemeAdaptor from "../../components/ThemeAdaptor";
import Footer from "../../components/Footer";
import StatusBar from '../../components/StatusBar';

export interface CustomPageProps extends LayoutProps {
  footer?: boolean
  dark?: boolean
  header?: JSX.Element
}

export default function CustomPage({children, header, footer = true, dark, ...props}: PropsWithChildren<CustomPageProps>) {
  return (
    <Layout {...props} header={header}>
      <div hidden style={{ height: 72 }} />
      <div
        style={{
          '--ifm-container-width-xl': '1200px'
      }}
      >
        {children}
        {footer ? <Footer /> : undefined}
      </div>
      <StatusBar/>
    </Layout>
  )
}