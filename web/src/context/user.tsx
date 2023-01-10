import React, { createContext, createElement, PropsWithChildren, useContext } from 'react';
import { useUserInfo } from '@site/src/api/user';
import { Auth0Provider } from '@auth0/auth0-react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useMemoizedFn } from 'ahooks';
import { isNullish } from '@site/src/utils/value';
import { useMediaQueryAuth0 } from '@site/src/theme/NavbarItem/useMediaQueryAuth0';

const UserContext = createContext<ReturnType<typeof useUserInfo>>({
  validated: false,
  validating: false,
  userInfo: undefined,
  login: () => {},
  logout: () => {},
  mutate: async () => undefined,
  oToken: undefined,
});

export function UserInfoProvider ({ children }: PropsWithChildren) {
  return createElement(UserContext.Provider, { value: useUserInfo() }, children);
}

export function useUserInfoContext () {
  return useContext(UserContext);
}

export function AuthProvider ({ children }: PropsWithChildren): JSX.Element {
  const {
    siteConfig: { customFields },
  } = useDocusaurusContext();

  return (
    <Auth0Provider
      domain={customFields?.auth0_domain as string}
      clientId={customFields?.auth0_client_id as string}
      audience={`https://${customFields?.auth0_domain as string}/api/v2/`}
      scope="read:current_user"
    >
      {children}
    </Auth0Provider>
  );
}

export function useRequireLogin () {
  const { isLoading, user, login } = useMediaQueryAuth0();

  return useMemoizedFn(async () => {
    if (isLoading) {
      return false;
    }
    if (isNullish(user)) {
      await login();
      return false;
    }
    return true;
  });
}
