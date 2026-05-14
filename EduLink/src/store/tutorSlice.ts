import { createSlice } from '@reduxjs/toolkit';
import { Tutor } from '../services/api';

const tutorSlice = createSlice({
  name: 'tutors',
  initialState: {
    tutors: [] as Tutor[],
  },
  reducers: {
    storeTutors: (state, action) => {
      state.tutors = action.payload;
    },
  },
});

export const { storeTutors } = tutorSlice.actions;
export default tutorSlice.reducer;
