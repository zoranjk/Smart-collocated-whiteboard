import {
	DefaultFontFamilies,
	Editor,
	Rectangle2d,
	ShapeUtil,
	SvgExportContext,
	TLNoteShape,
	TLOnEditEndHandler,
	getDefaultColorTheme,
	noteShapeProps,
	toDomPrecision,
	TLBaseShape,
	TLOnResizeHandler,
	Vec,
	getUserPreferences,
	resizeBox,
} from '@tldraw/editor'
import {
	stopEventPropagation,
	HTMLContainer,
	useEditor,
	createShapeId,
	T,
	DefaultHorizontalAlignStyle,
	DefaultSizeStyle,
	DefaultFontStyle,
} from '@tldraw/tldraw'
import Popover from '@mui/material/Popover'
import { TextLabel } from '../lib/utils/TextLabel'
import { FONT_FAMILIES, LABEL_FONT_SIZES, TEXT_PROPS } from '../lib/utils/default-shape-constants'
import { getFontDefForExport } from '../lib/utils/defaultStyleDefs'
import { getTextLabelSvgElement } from '../lib/utils/getTextLabelSvgElement'
import { OverlayKeyboard } from '../components/OverlayKeyboard'
import 'react-simple-keyboard/build/css/index.css'
import { useEffect, useState } from 'react'
import IconButton from '@mui/material/IconButton'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import { TipsCard } from '../components/TipsCard'
import { deepOrange, blue } from '@mui/material/colors'
import { generateTipsForObject } from '../lib/generateTipsFromOpenAI'
import { generateSubtasks } from '../lib/generateSubtasksFromOpenAI'
import { StyledBadge } from '../components/StyledBadge'
import SafetyDividerIcon from '@mui/icons-material/SafetyDivider'
import DnsIcon from '@mui/icons-material/Dns'
import { SearchBar } from '../components/SearchBar'
import { RefinmentCard } from '../components/RefinementCard'
import Grid from '@mui/material/Grid'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import { generateComparisonSummary } from '../lib/contentComparison'
import { SummaryCard } from '../components/SummaryCard'
import { SearchHistory } from '../components/SearchHistory'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import ScreenRotationIcon from '@mui/icons-material/ScreenRotation'
import { ComparisonCard } from '../components/ComparisonCard'
import { useKeyboardStatus } from '../lib/utils/keyboardCompatibility'
import { getProportionalColor } from '../lib/utils/colorBlender'
import { NodeShape } from './NodeShapeType'
import { NodeShapeProps } from './NodeShapeProps'
import '../style.css'
import { NodeNestPop } from './NodeNestPop'
import { Card, Button } from '@mui/material'
import { createArrowBetweenShapes } from '@/app/whiteboard/lib/utils/helper'
const NOTE_SIZE = 220
const PADDING = 10
const TAG_SIZE = 20

const LABEL_PADDING = 16
const MIN_SIZE_WITH_LABEL = 17 * 3

const relationTypes = [
	'is a',
	'has a',
	'part of',
	'desires',
	'used for',
	'causes',
	'capaable of',
	'has property',
	'at location',
	'synonym',
	'antonym',
	'instance of',
	'derived from',
]

// TEMP: user
const users = [
	{
		bgcolor: deepOrange[500],
		name: 'B',
	},
	{
		bgcolor: blue[500],
		name: 'C',
	},
]

function getLabelSize(editor: Editor, shape: NodeShape) {
	const text = shape.props.text

	if (!text) {
		return { w: 0, h: 0 }
	}

	const minSize = editor.textMeasure.measureText('w', {
		...TEXT_PROPS,
		fontFamily: FONT_FAMILIES[shape.props.font],
		fontSize: LABEL_FONT_SIZES[shape.props.size],
		maxWidth: 100,
	})

	// TODO: Can I get these from somewhere?
	const sizes = {
		s: 2,
		m: 3.5,
		l: 5,
		xl: 10,
	}

	const size = editor.textMeasure.measureText(text, {
		...TEXT_PROPS,
		fontFamily: FONT_FAMILIES[shape.props.font],
		fontSize: LABEL_FONT_SIZES[shape.props.size],
		minWidth: minSize.w + 'px',
		maxWidth: Math.max(
			// Guard because a DOM nodes can't be less 0
			0,
			// A 'w' width that we're setting as the min-width
			Math.ceil(minSize.w + sizes[shape.props.size]),
			// The actual text size
			Math.ceil(shape.props.w - LABEL_PADDING * 2)
		),
	})

	return {
		w: size.w + LABEL_PADDING * 2,
		h: size.h + LABEL_PADDING * 2,
	}
}

/** @public */
export class NodeShapeUtil extends ShapeUtil<NodeShape> {
	static override type = 'node' as const

	override canEdit = () => true
	override canResize = () => true
	// override hideResizeHandles = () => true
	// override hideSelectionBoundsFg = () => true

	override getDefaultProps(): NodeShape {
		const userColor = getUserPreferences().color

		console.log('user: ', getUserPreferences())

		return {
			color: userColor != undefined ? userColor : '#ffb703',
			size: 'l',
			text: '',
			w: NOTE_SIZE,
			h: NOTE_SIZE,
			font: 'serif',
			align: 'middle',
			verticalAlign: 'middle',
			growY: 0,
			isHighlight: false,
			initSlide: false,
			lastUserName: '',
		}
	}

	getHeight(shape: NodeShape) {
		return shape.props.h + shape.props.growY
	}

	getWidth(shape: NodeShape) {
		return shape.props.w
	}

	getGeometry(shape: NodeShape) {
		const height = this.getHeight(shape)
		return new Rectangle2d({ width: shape.props.w, height: height, isFilled: true })
	}

	component(shape: NodeShape) {
		const {
			id,
			type,
			x,
			y,
			props: {
				color,
				font,
				size,
				align,
				text,
				verticalAlign,
				isHighlight,
				initSlide,
				lastUserName,
			},
		} = shape

		const editor = useEditor()

		const history = shape.meta.history

		// States
		const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
		const [lastUser, setLastUser] = useState(null)
		const [userClickCount, setUserClickCount] = useState({})
		const [editHistory, setEditHistory] = useState([])
		const [loadingStatus, setLoadingStatus] = useState('idle')
		const [tips, setTips] = useState([])
		const [selectedHistory, setSelectedHistory] = useState(null)
		const [curOpenHistory, setCurOpenHistory] = useState(null)
		const [summary, setSummary] = useState({})
		const [searchHistories, setSearchHistories] = useState([])
		const [isSlide, setIsSlide] = useState(null)
		const [isSelected, setIsSelected] = useState(false)
		const userPreference = getUserPreferences()

		useEffect(() => {
			if (!editor.getSelectedShapeIds().includes(id)) {
				editor.updateShapes([
					{
						id,
						type,
						props: {
							isPressed: false,
						},
					},
				])
				setLoadingStatus('idle')
			}
		}, [editor.getSelectedShapeIds()])

		const updateNoteSharedInfo = () => {
			console.log('current user: ', editor.user)

			editor.updateShapes([
				{
					id,
					type,
					props: {
						lastUserName: userPreference.name,
						color: userPreference.color,
					},
				},
			])
		}

		useEffect(() => {
			console.log("loadingStatus: ", loadingStatus)  
		}, [loadingStatus])

		const handleTips = () => {
			setLoadingStatus('tip-loaded')
		}

		function hexTorgba(hex: string, a: number) {
			if (hex.split('(')[0] == 'rgba') return hex
			let rgba = 'rgba('
			hex = hex.replace('#', '')
			for (let i = 0; i < hex.length; i += 2) {
				rgba += parseInt(hex.slice(i, i + 2), 16) + ','
			}
			rgba += a + ')'
			return rgba
		}

		useEffect(() => {
			if ( editor.getSelectedShapeIds().includes(id) && !isSelected) {
				setIsSelected(true)
			} else if (!editor.getSelectedShapeIds().includes(id) && isSelected) {
				setIsSelected(false)
			}
		}, [editor.getSelectedShapeIds()])

		const handleType = (event: any, text: String) => {
			setLoadingStatus('loading')
			let nowShape = editor.getShape(shape.id)
			generateTipsForObject(editor, shape.id, text).then((tips) => {
				setLoadingStatus('loaded')
				let relationship = []
				if (tips.length != 0) {
					tips.forEach((note: any, index: number) => {
						const shapeId = createShapeId()
						editor.createShape({
							id: shapeId,
							type: 'node',
							x: nowShape.x + 800 + (index == 1 ? 1 : 0) * 400,
							y: nowShape.y + (index == 2 ? 1 : 0) * 300,
							props: { text: note.note, color: hexTorgba(nowShape.props.color, 0.5) },
						})
						relationship.push({
							srcId: shape.id,
							dstId: shapeId,
							relation: text,
						})
					})
					createArrowBetweenShapes({ editor, relationship })
				}
			})
		}

		const handleSubtasks = () => {
			setLoadingStatus('loading')
			const selectionBounds = editor.getSelectionPageBounds()
			if (!selectionBounds) throw new Error('No selection bounds')
			generateSubtasks(editor, text).then((subtasks) => {
				for (const [index, subtask] of subtasks.entries()) {
					const newShapeId = createShapeId()
					editor.createShape({
						id: newShapeId,
						type: 'subtask',
						x: selectionBounds.maxX + 60 + (index % 4) * 220,
						y: selectionBounds.y + Math.floor(index / 4) * 220,
						props: {
							text: subtask.task,
						},
					})
				}
				setLoadingStatus('loaded')
			})
		}

		const handleCompare = () => {
			setLoadingStatus('summary-loaded')
			const summary = {
				text: 'Recent interest in design through the artificial intelligence (AI) lens is rapidly increasing. Designers, as a\
				special user group interacting with AI, have received more attention in the Human-Computer Interaction\
				community',
				keywords: ['user group', 'artificial intelligence', 'Human-Computer Interaction'],
			}
			setSummary(summary)
		}

		useEffect(() => {
			// console.log('isHighlight: ', isHighlight)
		}, [isHighlight])

		return (
			<HTMLContainer
				className={
					isSlide
						? 'slide-rotate-ver-right'
						: isSlide != null
							? 'slide-rotate-ver-right-revert'
							: initSlide
								? 'slide-rotate-ver-right-translate'
								: ''
				}
				id={shape.id}
				style={{
					pointerEvents: 'all',
					display: 'inline-block',
					alignItems: 'center',
					justifyContent: 'center',
					direction: 'ltr',
				}}
			>
				<div
					style={{
						position: 'absolute',
						width: shape.props.w,
						height: this.getHeight(shape),
					}}
				>
					<div
						className="node-user-name"
						style={{
							backgroundColor: color,
							height: TAG_SIZE,
							paddingLeft: 10,
							borderTopLeftRadius: 10,
							borderTopRightRadius: 10,
						}}
					>
						{/* Note Type */}
					</div>
					<div
						className="tl-note__container"
						style={{
							color: color,
							height: this.getHeight(shape) - TAG_SIZE,
							backgroundColor: color,
							borderRadius: 0,
							borderWidth: 2,
							borderColor: 'transparent',
							// borderColor: isHighlight == true ? 'green' : 'transparent',
						}}
					>
						<div className="tl-note__scrim" />
						<TextLabel
							id={id}
							type={type}
							font={font}
							size={size}
							align={align}
							verticalAlign={verticalAlign}
							text={text}
							labelColor="black"
							setIsKeyboardOpen={setIsKeyboardOpen}
							updateNoteSharedInfo={updateNoteSharedInfo}
							wrap
						/>
					</div>
					{/* Make sure the device do not have built-in keyboard
					<OverlayKeyboard
						size={NOTE_SIZE}
						type={type}
						id={id}
						isKeyboardOpen={isKeyboardOpen}
						setIsKeyboardOpen={setIsKeyboardOpen}
					/> */}
				</div>
				<div
					style={{
						marginLeft: shape.props.w + PADDING,
					}}
				>
					{loadingStatus == 'idle' && (
						<div>
							<IconButton
								size="small"
								onPointerDown={stopEventPropagation}
								onTouchStart={handleTips}
								onClick={handleTips}
							>
								<img src='arrow.png' style={{ width: "25px", height: "25px" }} />
							</IconButton>
							{/* <IconButton
								size="small"
								onPointerDown={stopEventPropagation}
								onTouchStart={handleSubtasks}
								onClick={handleSubtasks}
							>
								<SafetyDividerIcon />
							</IconButton> */}
							<IconButton
								onPointerDown={stopEventPropagation}
								onTouchStart={() => {
									setLoadingStatus('search-bar')
								}}
								onClick={() => {
									setLoadingStatus('search-bar')
								}}
							>
								<img src='idea.png' style={{ width: "25px", height: "25px" }} />
							</IconButton>
							{/* <IconButton
								onPointerDown={stopEventPropagation}
								onTouchStart={handleCompare}
								onClick={handleCompare}
							>
								<CompareArrowsIcon />
							</IconButton> */}
							<IconButton
								onPointerDown={stopEventPropagation}
								onTouchStart={() => {
									editor.deleteShape(id)
								}}
								onClick={() => {
									editor.deleteShape(id)
								}}
							>
								<img src='delete.png' style={{ width: "25px", height: "25px" }} />
							</IconButton>
						</div>
					)}
					{loadingStatus == 'search-bar' && (
						<div style={{ display: 'flex', flexDirection: 'row' }}>
							<div style={{ marginRight: '10px' }}>
								<SearchBar
									setSearchHistories={setSearchHistories}
									searchHistories={searchHistories}
									setLoadingStatus={setLoadingStatus}
								/>
								<div
									style={{
										display: 'flex',
										marginLeft: '5px',
										alignItems: 'center',
										flexDirection: 'column',
										width: '100%',
									}}
								>
									{searchHistories.map((data, index) => (
										<div key={index}>
											<SearchHistory
												searchHistories={searchHistories}
												setSearchHistories={setSearchHistories}
												curOpenHistory={curOpenHistory}
												setCurOpenHistory={setCurOpenHistory}
												data={data}
												setSelectedHistory={setSelectedHistory}
											/>
										</div>
									))}
								</div>
							</div>
							{selectedHistory != null && selectedHistory.result != undefined && (
								<div>
									<Grid container rowSpacing={2} columnSpacing={2} sx={{ width: 800 }}>
										{selectedHistory.result.map((suggestion, index) => (
											<Grid item xs={4} key={index}>
												<RefinmentCard
													index={index}
													srcId={id}
													setLoadingStatus={setLoadingStatus}
													suggestion={suggestion.text}
													editor={editor}
												/>
											</Grid>
										))}
									</Grid>
								</div>
							)}
						</div>
					)}
					{loadingStatus == 'loading' && (
						<div style={{ display: 'flex', width: '25px', height: '25px' }}>
							<img src="/loading.png" className="loading-icon" />
						</div>
					)}
					{
						loadingStatus == 'tip-loaded' && (
							<Card
								style={{
									width: '440px',
									padding: '10px',
									display: 'flex',
									flexWrap: 'wrap',
									gap: '20px',
								}}
							>
								<div
									style={{ width: '100%', textAlign: 'center', height: '20px', fontSize: '20px' }}
								>
									Relation Types
								</div>

								{relationTypes.map((idea, index) => (
									<Button
										onPointerDown={stopEventPropagation}
										style={{ display: 'block', marginBottom: '5px', width: '200px' }}
										key={index}
										onMouseDown={(e) => {
											// e.stopPropagation()
											// handleType(idea)
										}}
										onClick={(e) => {
											e.stopPropagation()
											handleType(e, idea)
										}}
										onTouchStart={(e) => {
											e.stopPropagation()
											handleType(e, idea)
										}}
										variant="outlined"
									>
										{idea}
									</Button>
								))}
							</Card>
						)
						// <NodeNestPop tips={tips} editor={editor} />
					}
					{loadingStatus == 'summary-loaded' && (
						<div>
							<SummaryCard editor={editor} summary={summary} />
						</div>
					)}
				</div>
			</HTMLContainer>
		)
	}

	indicator(shape: NodeShape) {
		const bounds = this.editor.getShapeGeometry(shape).bounds

		return (
			<rect rx="7" width={toDomPrecision(bounds.width)} height={toDomPrecision(bounds.height)} />
			// <div></div>
		)
	}

	override toSvg(shape: NodeShape, ctx: SvgExportContext) {
		ctx.addExportDef(getFontDefForExport(shape.props.font))
		const theme = getDefaultColorTheme({ isDarkMode: this.editor.user.getIsDarkMode() })
		const bounds = this.editor.getShapeGeometry(shape).bounds

		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

		const adjustedColor = shape.props.color === 'black' ? 'yellow' : shape.props.color

		const rect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		rect1.setAttribute('rx', '10')
		rect1.setAttribute('width', NOTE_SIZE.toString())
		rect1.setAttribute('height', bounds.height.toString())
		rect1.setAttribute('fill', adjustedColor)
		rect1.setAttribute('stroke', adjustedColor)
		rect1.setAttribute('stroke-width', '1')
		g.appendChild(rect1)

		const rect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		rect2.setAttribute('rx', '10')
		rect2.setAttribute('width', NOTE_SIZE.toString())
		rect2.setAttribute('height', bounds.height.toString())
		rect2.setAttribute('fill', theme.background)
		rect2.setAttribute('opacity', '.28')
		g.appendChild(rect2)

		const textElm = getTextLabelSvgElement({
			editor: this.editor,
			shape,
			font: DefaultFontFamilies[shape.props.font],
			bounds,
		})

		textElm.setAttribute('fill', theme.text)
		textElm.setAttribute('stroke', 'none')
		g.appendChild(textElm)

		return g
	}

	override onBeforeCreate = (next: NodeShape) => {
		return getGrowY(this.editor, next, next.props.growY)
	}

	override onBeforeUpdate = (prev: NodeShape, next: NodeShape) => {
		if (
			prev.props.text === next.props.text &&
			prev.props.font === next.props.font &&
			prev.props.size === next.props.size
		) {
			return
		}

		return getGrowY(this.editor, next, prev.props.growY)
	}

	override onEditEnd: TLOnEditEndHandler<NodeShape> = (shape) => {
		const {
			id,
			type,
			props: { text },
		} = shape

		if (text.trimEnd() !== shape.props.text) {
			this.editor.updateShapes([
				{
					id,
					type,
					props: {
						text: text.trimEnd(),
					},
				},
			])
		}
	}

	override onResize: TLOnResizeHandler<any> = (shape, info) => {
		return resizeBox(shape, info)
	}
}

function getGrowY(editor: Editor, shape: NodeShape, prevGrowY = 0) {
	const PADDING = 17

	const nextTextSize = editor.textMeasure.measureText(shape.props.text, {
		...TEXT_PROPS,
		fontFamily: FONT_FAMILIES[shape.props.font],
		fontSize: LABEL_FONT_SIZES[shape.props.size],
		maxWidth: NOTE_SIZE - PADDING * 2,
	})

	const nextHeight = nextTextSize.h + PADDING * 2

	let growY: number | null = null

	if (nextHeight > NOTE_SIZE) {
		growY = nextHeight - NOTE_SIZE
	} else {
		if (prevGrowY) {
			growY = 0
		}
	}

	if (growY !== null) {
		return {
			...shape,
			props: {
				...shape.props,
				growY,
			},
		}
	}
}
