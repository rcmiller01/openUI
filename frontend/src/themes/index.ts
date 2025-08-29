export interface ThemeColors {
  // Background colors
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
    error: string;
    warning: string;
    success: string;
  };
  
  // Border colors
  border: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Syntax highlighting
  syntax: {
    keyword: string;
    string: string;
    number: string;
    comment: string;
    function: string;
    variable: string;
    type: string;
    operator: string;
    bracket: string;
  };
  
  // UI elements
  ui: {
    selection: string;
    highlight: string;
    hover: string;
    active: string;
    disabled: string;
  };
}

export interface Theme {
  name: string;
  variant: 'light-low' | 'light-high' | 'dark-low' | 'dark-high';
  sidebarWidth?: number;
  colors: ThemeColors;
}

// Light Low Contrast Theme
export const lightLowTheme: Theme = {
  name: 'Light Low Contrast',
  variant: 'light-low',
  colors: {
    bg: {
      primary: '#fefefe',
      secondary: '#f8f9fa',
      tertiary: '#f1f3f4',
      accent: '#e8f0fe',
    },
    text: {
      primary: '#202124',
      secondary: '#5f6368',
      muted: '#9aa0a6',
      accent: '#1a73e8',
      error: '#d93025',
      warning: '#f9ab00',
      success: '#137333',
    },
    border: {
      primary: '#e8eaed',
      secondary: '#dadce0',
      accent: '#1a73e8',
    },
    syntax: {
      keyword: '#1976d2',
      string: '#0d7377',
      number: '#7b1fa2',
      comment: '#616161',
      function: '#1565c0',
      variable: '#2e7d32',
      type: '#d84315',
      operator: '#bf360c',
      bracket: '#424242',
    },
    ui: {
      selection: '#c8e6ff',
      highlight: '#fff3cd',
      hover: '#f1f3f4',
      active: '#e8f0fe',
      disabled: '#f1f3f4',
    },
  },
};

// Light High Contrast Theme
export const lightHighTheme: Theme = {
  name: 'Light High Contrast',
  variant: 'light-high',
  colors: {
    bg: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      tertiary: '#eeeeee',
      accent: '#e3f2fd',
    },
    text: {
      primary: '#000000',
      secondary: '#333333',
      muted: '#666666',
      accent: '#0d47a1',
      error: '#b71c1c',
      warning: '#e65100',
      success: '#1b5e20',
    },
    border: {
      primary: '#cccccc',
      secondary: '#999999',
      accent: '#0d47a1',
    },
    syntax: {
      keyword: '#0d47a1',
      string: '#004d40',
      number: '#4a148c',
      comment: '#424242',
      function: '#01579b',
      variable: '#1b5e20',
      type: '#bf360c',
      operator: '#d84315',
      bracket: '#212121',
    },
    ui: {
      selection: '#81d4fa',
      highlight: '#ffecb3',
      hover: '#eeeeee',
      active: '#e3f2fd',
      disabled: '#eeeeee',
    },
  },
};

// Dark Low Contrast Theme
export const darkLowTheme: Theme = {
  name: 'Dark Low Contrast',
  variant: 'dark-low',
  colors: {
    bg: {
      primary: '#1e1e1e',
      secondary: '#252526',
      tertiary: '#2d2d30',
      accent: '#264f78',
    },
    text: {
      primary: '#cccccc',
      secondary: '#9cdcfe',
      muted: '#808080',
      accent: '#569cd6',
      error: '#f48771',
      warning: '#dcdcaa',
      success: '#4ec9b0',
    },
    border: {
      primary: '#3e3e42',
      secondary: '#464647',
      accent: '#569cd6',
    },
    syntax: {
      keyword: '#569cd6',
      string: '#ce9178',
      number: '#b5cea8',
      comment: '#6a9955',
      function: '#dcdcaa',
      variable: '#9cdcfe',
      type: '#4ec9b0',
      operator: '#d4d4d4',
      bracket: '#da70d6',
    },
    ui: {
      selection: '#264f78',
      highlight: '#3c3c3c',
      hover: '#2a2d2e',
      active: '#264f78',
      disabled: '#2d2d30',
    },
  },
};

// Dark High Contrast Theme
export const darkHighTheme: Theme = {
  name: 'Dark High Contrast',
  variant: 'dark-high',
  colors: {
    bg: {
      primary: '#000000',
      secondary: '#0c0c0c',
      tertiary: '#1c1c1c',
      accent: '#003c71',
    },
    text: {
      primary: '#ffffff',
      secondary: '#ffffff',
      muted: '#c0c0c0',
      accent: '#36d0ff',
      error: '#ff5555',
      warning: '#ffff55',
      success: '#55ff55',
    },
    border: {
      primary: '#6fc3df',
      secondary: '#ffffff',
      accent: '#36d0ff',
    },
    syntax: {
      keyword: '#36d0ff',
      string: '#ffaa3e',
      number: '#b8f4b8',
      comment: '#7ca668',
      function: '#ffff55',
      variable: '#ffffff',
      type: '#55ffff',
      operator: '#ff5555',
      bracket: '#da70d6',
    },
    ui: {
      selection: '#003c71',
      highlight: '#2d2d2d',
      hover: '#1c1c1c',
      active: '#003c71',
      disabled: '#1c1c1c',
    },
  },
};

export const themes = {
  'light-low': lightLowTheme,
  'light-high': lightHighTheme,
  'dark-low': darkLowTheme,
  'dark-high': darkHighTheme,
} as const;

export type ThemeVariant = keyof typeof themes;