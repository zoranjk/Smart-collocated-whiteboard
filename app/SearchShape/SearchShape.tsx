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
import { SearchBar } from '../components/SearchBar'
import React, { useState } from 'react'
import { StyledInputBase } from '../components/SearchBar'
import { FONT_FAMILIES, LABEL_FONT_SIZES, TEXT_PROPS } from '../lib/utils/default-shape-constants'
import { IconButton } from '@mui/material'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import { TextLabel } from '../lib/utils/TextLabel'
import { generateRefinementSuggestion } from '../lib/refineContentFromOpenAI'
import { useEditableText } from '../lib/utils/useEditableText'
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

	override getGeometry(shape: SearchShape) {
		return new Rectangle2d({ width: this.getWidth(shape), height: shape.props.h, isFilled: true })
	}

	override onBeforeCreate = (next: SearchShape) => {
		return getGrowX(this.editor, next, next.props.growX)
	}

	override onBeforeUpdate = (prev: SearchShape, next: SearchShape) => {
		if (
			prev.props.text === next.props.text &&
			prev.props.font === next.props.font &&
			prev.props.size === next.props.size
		) {
			return
		}

		return getGrowX(this.editor, next, prev.props.growX)
	}

	// override onResize: TLOnResizeHandler<any> = (shape, info) => {
	// 	return resizeBox(shape, info)
	// }

	override component(shape: SearchShape) {

		const { id, type, props: { text, w, h } } = shape

		const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

		const editor = useEditor()

		const MemoStyledInputBase = React.memo(StyledInputBase)

		const handleSearch = () => {
			setIsLoading(true)
			generateRefinementSuggestion(text).then((suggestions) => {
				setIsLoading(false)
				suggestions.forEach((suggestion: any, index: any) => {
					const newShapeId = createShapeId()
					const bounds = this.editor.getShapeGeometry(shape).bounds
					editor.createShape({
						id: newShapeId,
						type: 'result',
						x: bounds.maxX + 60 + (index % 4) * 220,
						y: bounds.y + Math.floor(index / 4) * 220,
						parentId: id,
						props: {
							text: suggestion.text,
						},
					})
				})
			})
		}

		const [ isLoading, setIsLoading ] = useState(false)

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

		return (
			<div>
				<div style={{
					// position: 'relative',
					display: 'flex',
					flexDirection: 'row',
					pointerEvents: 'all'
				}}>
					<TextLabel
						id={id}
						type={type}
						text={text}
						labelColor='black'
						setIsKeyboardOpen={setIsKeyboardOpen}
						wrap
					/>
					<div style={{ marginLeft: this.getWidth(shape) + 5, width: 200 }}>
						{
							!isLoading ? (
								<IconButton onPointerDown={stopEventPropagation} onTouchStart={handleSearch} onClick={handleSearch}>
									<TipsAndUpdatesIcon />
								</IconButton>
							) : (
								<div className="loader">
									<div></div><div></div><div></div>
						  		</div>
							)
						}
					</div>
				</div>

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
			<rect
				width={toDomPrecision(bounds.width)}
				height={toDomPrecision(bounds.height)}
				className={`bulletin-indicator`}
				style={{ zIndex: 'auto' }}
			/>
		)
	}
}

function getGrowX(editor, shape, prevGrowY = 0) {
	const PADDING = 25

	const nextTextSize = editor.textMeasure.measureText(shape.props.text, {
		...TEXT_PROPS,

		fontFamily: FONT_FAMILIES[shape.props.font],
		fontSize: LABEL_FONT_SIZES[shape.props.size],
	})

	const nextWidth = nextTextSize.w + PADDING * 2

	let growX: number | null = null

	if (nextWidth > shape.props.w) {
		growX = nextWidth - WIDTH
	} else {
		if (prevGrowY) {
			growX = 0
		}
	}

	if (growX !== null) {
		return {
			...shape,
			props: {
				...shape.props,
				growX,
			},
		}
	}
}