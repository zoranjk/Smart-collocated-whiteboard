import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	curAffinity: null,
	topZonePurpose: '',
	isGroupingFinished: true,
	transcript: '',
	showSpeechOptions: false,
	isRelHintActive: false,
	isCrossUserRelOnly: false
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
		setTranscript: (state, action) => {
			state.transcript = action.payload
		},
		setShowSpeechOptions: (state, action) => {
			state.showSpeechOptions = action.payload
		},
		setIsRelHintActive: (state, action) => {
			state.isRelHintActive = action.payload
		},
		setIsCrossUserRelOnly: (state, action) => {
			state.isCrossUserRelOnly = action.payload
		},
	},
})

export const { setIsCrossUserRelOnly, setCurAffinity, setTopZonePurpose, setIsGroupingFinished, setTranscript, setShowSpeechOptions, setIsRelHintActive } = userSlice.actions

export default userSlice.reducer