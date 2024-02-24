'use client'

import { configureStore } from '@reduxjs/toolkit'
import globalReducer from './reducers/globalReducer'

const store = configureStore({
	reducer: {
		global: globalReducer,
	},
})

export default store
