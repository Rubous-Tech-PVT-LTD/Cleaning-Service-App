
import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';
import App from './App';

LogBox.ignoreLogs([
  'Diagnostic error: [Sync] Server wants client to create record',
  'Warning: ...'
]);

registerRootComponent(App);
