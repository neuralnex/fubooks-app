// Polyfills required by the Privy Expo SDK — MUST be imported before any other
// app code, including App.tsx itself. See:
// https://docs.privy.io/guide/expo/quickstart
import 'fast-text-encoding';
import './src/polyfills/crypto';
import '@ethersproject/shims';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
