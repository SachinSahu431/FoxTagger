import { createContext, FunctionComponent, ReactNode, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { getThemePreference, setLocalStorage } from './utils';
import { dark, light } from './config/theme';
import { MetaMaskProvider } from './hooks';
import { XmtpContextProvider } from './contexts/XmtpContext';
import { WalletContextProvider } from './contexts/WalletContext';

export type RootProps = {
  children: ReactNode;
};

type ToggleTheme = () => void;

export const ToggleThemeContext = createContext<ToggleTheme>(
  (): void => undefined,
);

export const Root: FunctionComponent<RootProps> = ({ children }) => {
  const [darkTheme, setDarkTheme] = useState(getThemePreference());

  const toggleTheme: ToggleTheme = () => {
    setLocalStorage('theme', darkTheme ? 'light' : 'dark');
    setDarkTheme(!darkTheme);
  };

  return (
    <ToggleThemeContext.Provider value={toggleTheme}>
      <WalletContextProvider>
        <XmtpContextProvider>
          <ThemeProvider theme={darkTheme ? dark : light}>
            <MetaMaskProvider>{children}</MetaMaskProvider>
          </ThemeProvider>
        </XmtpContextProvider>
      </WalletContextProvider>
    </ToggleThemeContext.Provider>
  );
};
