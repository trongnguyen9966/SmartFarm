import { configureStore } from '@reduxjs/toolkit';
import reactotron from '@/config/reactotron';
import appReducer from './slices/appSlice';

const reactotronEnhancer = __DEV__ && reactotron.createEnhancer
  ? reactotron.createEnhancer()
  : undefined;

export const store = configureStore({
  reducer: {
    app: appReducer,
    // Add more reducers here
  },
  enhancers: (getDefaultEnhancers) => {
    const enhancers = getDefaultEnhancers();
    if (reactotronEnhancer) {
      return enhancers.concat(reactotronEnhancer);
    }
    return enhancers;
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
