import { createSlice } from '@reduxjs/toolkit'

const initialState = {
	userData: {},
	loading: true,
	error: null,
	curAffinity: null,
}

const userSlice = createSlice({
	name: 'global',
	initialState,
	reducers: {
		setUserData: (state, action) => {
			state.userData = action.payload
			state.loading = false
			state.error = null
		},
		setLoading: (state, action) => {
			state.loading = action.payload
		},
		setError: (state, action) => {
			state.loading = false
			state.error = action.payload
		},
		setCurAffinity: (state, action) => {
			state.curAffinity = action.payload
		}
	},
})

export const { setUserData, setLoading, setError } = userSlice.actions

export default userSlice.reducer