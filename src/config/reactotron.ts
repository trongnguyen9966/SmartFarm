import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

let reactotron: typeof Reactotron | null = null;

try {
  reactotron = Reactotron.setAsyncStorageHandler(AsyncStorage)
    .configure({ name: 'SmartFarm' })
    .useReactNative()
    .use(reactotronRedux())
    .connect() as any;

  if (__DEV__) {
    (console as any).tron = reactotron;
  }
} catch (e) {
  console.warn('[Reactotron] Failed to initialize:', e);
}

export default reactotron;
