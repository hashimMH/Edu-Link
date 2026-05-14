import { configureStore } from '@reduxjs/toolkit';
import tutorReducer from './tutorSlice';

export const store = configureStore({
  reducer: {
    tutors: tutorReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
