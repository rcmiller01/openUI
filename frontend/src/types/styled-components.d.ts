// frontend/src/types/styled-components.d.ts
import 'styled-components';
import { Theme } from '../themes';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
