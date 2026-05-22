import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

const reactotron = Reactotron.setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: 'SmartFarm',
  })
  .useReactNative({
    asyncStorage: true,
    networking: {
      ignoreUrls: /symbolicate|logs/,
    },
    editor: false,
    errors: { veto: () => false },
    overlay: false,
  })
  .use(reactotronRedux())
  .connect();

// Extend console to use Reactotron logging
if (__DEV__) {
  console.tron = reactotron;
}

export default reactotron;
