import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	curAffinity: null,
	topZonePurpose: '',
	isGroupingFinished: true,
}

const userSlice = createSlice({
	name: 'global',
	initialState,
	reducers: {
		setCurAffinity: (state, action) => {
			state.curAffinity = action.payload
		},
		setTopZonePurpose: (state, action) => {
			state.topZonePurpose = action.payload
		},
		setIsGroupingFinished: (state, action) => {
			state.isGroupingFinished = action.payload
		},
	},
})

export const { setCurAffinity, setTopZonePurpose, setIsGroupingFinished } = userSlice.actions

export default userSlice.reducer