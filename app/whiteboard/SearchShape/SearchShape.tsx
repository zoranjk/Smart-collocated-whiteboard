import {
	BaseBoxShapeUtil,
	DefaultSpinner,
	HTMLContainer,
	Icon,
	TLBaseShape,
	stopEventPropagation,
	toDomPrecision,
	useIsEditing,
	useToasts,
	Rectangle2d,
	useEditor,
	TLShapeUtilFlag,
	createShapeId
} from '@tldraw/tldraw'
import { styled, alpha } from '@mui/material/styles'
import { resizeBox } from '@tldraw/editor'
import { Avatar, Stack } from '@mui/material'
import { SearchBar } from '../components/SearchBar'
import React, { useState } from 'react'
import { FONT_FAMILIES, LABEL_FONT_SIZES, TEXT_PROPS } from '../lib/utils/default-shape-constants'
import { IconButton, Box } from '@mui/material'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import { TextLabel } from '../lib/utils/TextLabel'
import { generateRefinementSuggestion } from '../lib/refineContentFromOpenAI'
import { TextField } from '@mui/material'
import { useEditableText } from '../lib/utils/useEditableText'
import { generateSubtasks } from '../lib/generateSubtasksFromOpenAI'
import { Chip } from '@mui/material'
import { Search, StyledInputBase } from '../components/SearchBar'
import { UserPreference } from './components/UserPreference'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import '../style.css'

export type SearchShape = TLBaseShape<
	'search',
	{
		text: string,
		w: number,
		h: number,
		growX: number,
		font: string,
		size: string,
	}
>

const BAR_HEIGHT = 600;
const WIDTH = 400;

export class SearchShapeUtil extends BaseBoxShapeUtil<SearchShape> {
	static override type = 'search' as const

	getDefaultProps(): SearchShape['props'] {
		return {
			text: '',
			w: 400,
			h: 45,
			growX: 0,
			font: 'sans',
			size: 's',
		}
	}

	override canEdit = () => true
	override canBind = () => false
	override canUnmount = () => false

	getWidth(shape: SearchShape) {
		return WIDTH + shape.props.growX
	}

	// override getGeometry(shape: SearchShape) {
	// 	return new Rectangle2d({ width: this.getWidth(shape), height: shape.props.h, isFilled: true })
	// }

	override component(shape: SearchShape) {

		const { id, type, props: { text, w, h } } = shape

		const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
		const [PreferenceOpen, setPreferenceOpen] = useState(false)
		const [createPreference, setCreatePreference] = useState(false)
		const [preferenceValue, setPreferenceValue] = useState('')
		const [input, setInput] = useState('')

		const editor = useEditor()

		const MemoStyledInputBase = React.memo(StyledInputBase)

		const handleCreatePreference = () => {
			setCreatePreference(!createPreference)
		}

		const handleSearch = () => {
			editor.updateShape({
				id: shape.id,
				meta: {
					...shape.meta,
					isLoading: true,
				},

			})
			generateSubtasks(editor, text).then((subtasks) => {
				editor.updateShape({
					id: shape.id,
					meta: {
						...shape.meta,
						isLoading: false,
					},

				})
				subtasks.forEach((subtask: any, index: any) => {
					const newShapeId = createShapeId()
					const bounds = this.editor.getShapeGeometry(shape).bounds
					editor.createShape({
						id: newShapeId,
						type: 'result',
						x: bounds.x + Math.floor(index % 3) * 250 + w / 2 - 350,
						y: bounds.maxY + 30 + Math.floor(index / 3) * 150,
						parentId: id,
						props: {
							text: subtask.task,
						},
					})
				})
			})
		}

		// const [isLoading, setIsLoading] = useState(false)

		const {
			rInput,
			isEmpty,
			isEditing,
			handleFocus,
			handleChange,
			handleKeyDown,
			handleBlur,
			handleInputPointerDown,
			handleDoubleClick,
		} = useEditableText(id, type, text)

		const handleCreatePreferenceClick = () => {
			setCreatePreference(true)
		}

		const handlePreferenceClick = () => {
			setPreferenceOpen(!PreferenceOpen)
		}

		return (
			<div>
				<Box sx={{ flexGrow: 1, width: 400, height: 50, pointerEvents: 'all' }}>
					<Search>
						<StyledInputBase
							onFocus={() => setIsKeyboardOpen(true)}
							placeholder='Please enter your task or goal'
							inputProps={{ 'aria-label': 'search' }}
							value={text}
							onChange={e => editor.updateShape({ id, props: { text: e.target.value } })}
						/>
						{/* <IconButton onPointerDown={e => e.stopPropagation()} onTouchStart={handleSearch} onClick={handleSearch}>
							<TipsAndUpdatesIcon />
						</IconButton> */}
						{
							!shape.meta.isLoading ? (
								<IconButton onPointerDown={stopEventPropagation} onTouchStart={handleSearch} onClick={handleSearch}>
									<TipsAndUpdatesIcon />
								</IconButton>
							) : (
								<div className="loader">
									<div></div><div></div><div></div>
								</div>
							)
						}
					</Search>
				</Box>
			</div>
		)
	}

	override indicator(shape: SearchShape) {
		const bounds = this.editor.getShapeGeometry(shape).bounds

		const isEditing = useIsEditing(shape.id)

		if (isEditing) {
			return null
		}

		return (
			// <rect
			// 	width={toDomPrecision(bounds.width)}
			// 	height={toDomPrecision(bounds.height)}
			// 	className={`bulletin-indicator`}
			// 	style={{ zIndex: 'auto' }}
			// />
			<rect rx="7" width={toDomPrecision(bounds.width)} height={toDomPrecision(bounds.height)} />
		)
	}
}