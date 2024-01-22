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
} from '@tldraw/editor'
import { stopEventPropagation, HTMLContainer, useEditor, createShapeId } from '@tldraw/tldraw'
import { TextLabel } from '../lib/utils/TextLabel'
import { FONT_FAMILIES, LABEL_FONT_SIZES, TEXT_PROPS } from '../lib/utils/default-shape-constants'
import { getFontDefForExport } from '../lib/utils/defaultStyleDefs'
import { getTextLabelSvgElement } from '../lib/utils/getTextLabelSvgElement'
import { OverlayKeyboard } from '../components/OverlayKeyboard'
import 'react-simple-keyboard/build/css/index.css'
import { useEffect, useState } from 'react'
import IconButton from '@mui/material/IconButton'
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
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
import ScreenRotationIcon from '@mui/icons-material/ScreenRotation';
import { ComparisonCard } from '../components/ComparisonCard'
import '../style.css'

const NOTE_SIZE = 220
const PADDING = 10
const TAG_SIZE = 20

export type NodeShape = TLBaseShape<
	'node',
	{
		// color:
		// 	| 'black'
		// 	| 'blue'
		// 	| 'green'
		// 	| 'grey'
		// 	| 'light-blue'
		// 	| 'light-green'
		// 	| 'light-red'
		// 	| 'light-violet'
		// 	| 'orange'
		// 	| 'red'
		// 	| 'violet'
		// 	| 'yellow'
		color: string
		size: 'l' | 'm' | 's' | 'xl'
		text: string
		font: 'draw' | 'mono' | 'sans' | 'serif'
		align: 'end-legacy' | 'end' | 'middle-legacy' | 'middle' | 'start-legacy' | 'start'
		verticalAlign: 'end' | 'middle' | 'start'
		growY: number
		url: string
		isPressed: boolean
		isHighlight: boolean
		initSlide: boolean
		index: number
	}
>

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

function mixColors (color1, color2, weight1, weight2) {
	// Convert hex color to RGB
	function hexToRgb (hex) {
		var bigint = parseInt(hex.replace('#', ''), 16)
		var r = (bigint >> 16) & 255
		var g = (bigint >> 8) & 255
		var b = bigint & 255

		return [r, g, b]
	}

	// Mix two RGB colors
	function blend (rgb1, rgb2, weight1, weight2) {
		var totalWeight = weight1 + weight2
		var r = (rgb1[0] * weight1 + rgb2[0] * weight2) / totalWeight
		var g = (rgb1[1] * weight1 + rgb2[1] * weight2) / totalWeight
		var b = (rgb1[2] * weight1 + rgb2[2] * weight2) / totalWeight

		return [Math.round(r), Math.round(g), Math.round(b)]
	}

	// Convert RGB to hex
	function rgbToHex (rgb) {
		return '#' + rgb.map(x => x.toString(16).padStart(2, '0')).join('')
	}

	var rgb1 = hexToRgb(color1)
	var rgb2 = hexToRgb(color2)

	var blendedRgb = blend(rgb1, rgb2, weight1, weight2)

	return rgbToHex(blendedRgb)
}

/** @public */
export class NodeShapeUtil extends ShapeUtil<NodeShape> {
	static override type = 'node' as const

	override canEdit = () => true
	override canResize = () => true
	override hideResizeHandles = () => true
	override hideSelectionBoundsFg = () => true

	override getDefaultProps (): NodeShape {
		return {
			color: '#ffb703',
			size: 'l',
			text: '',
			font: 'serif',
			align: 'middle',
			verticalAlign: 'middle',
			growY: 0,
			url: 'https://zhengzhang.me/',
			isPressed: false,
			isHighlight: false,
			initSlide: false,
			index: 0
		}
	}

	getHeight (shape: NodeShape) {
		return NOTE_SIZE + shape.props.growY
	}

	getGeometry (shape: NodeShape) {
		const height = this.getHeight(shape)
		return new Rectangle2d({ width: NOTE_SIZE, height, isFilled: true })
	}

	component (shape: NodeShape) {
		const {
			id,
			type,
			x,
			y,
			props: { color, font, size, align, text, verticalAlign, isPressed, isHighlight, initSlide, index },
		} = shape

		const editor = useEditor()

		// States
		const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
		const [lastUser, setLastUser] = useState(null)
		const [userClickCount, setUserClickCount] = useState({
			B: 0,
			C: 0,
		})
		const [editHistory, setEditHistory] = useState([{ text: '', author: 'init' }])
		const [loadingStatus, setLoadingStatus] = useState('idle')
		const [tips, setTips] = useState([])
		const [selectedHistory, setSelectedHistory] = useState(null)
		const [curOpenHistory, setCurOpenHistory] = useState(null)
		const [summary, setSummary] = useState({})
		const [searchHistories, setSearchHistories] = useState([])
		const [isSlide, setIsSlide] = useState(null)

		useEffect(() => {
			1
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

		useEffect(() => {
			const editing_shape_id = editor.getEditingShapeId()
			if (id === editing_shape_id) {
				setIsKeyboardOpen(true)
			}
		}, [editor.getEditingShapeId()])

		useEffect(() => {
			if (userClickCount.B > 0 || userClickCount.C > 0) {
				const newColor = mixColors(
					users[0].bgcolor,
					users[1].bgcolor,
					(userClickCount.B * 1.0) / (userClickCount.B + userClickCount.C),
					(userClickCount.C * 1.0) / (userClickCount.B + userClickCount.C)
				)
				console.log('New color: ', newColor)
				editor.updateShapes([
					{
						id,
						type,
						props: {
							color: newColor,
						},
					},
				])
			}
		}, [userClickCount])

		useEffect(() => {
			console.log('isHighlight: ', isHighlight)
		}, [isHighlight])

		return (
			<HTMLContainer
				className={ isSlide ? 'slide-rotate-ver-right' : isSlide != null ? 'slide-rotate-ver-right-revert' : initSlide ? 'slide-rotate-ver-right-translate' : ''}
				id={shape.id}
				style={{
					pointerEvents: 'all',
					display: 'inline-block',
					alignItems: 'center',
					justifyContent: 'center',
					direction: 'ltr',
					boxShadow: '3px 23px 4px rgba(0, 0, 0, 0.5)',
					animationDelay: `${0.1 * index}s`
				}}
			>
				<div
					style={{
						position: 'absolute',
						width: NOTE_SIZE,
						height: this.getHeight(shape),
					}}
				>
					<div
						className='node-user-name'
						style={{
							backgroundColor: color,
							height: TAG_SIZE,
							paddingLeft: 10,
						}}
					>
						Note Type
					</div>
					<div
						className='tl-note__container'
						style={{
							color: color,
							backgroundColor: color,
							borderRadius: 0,
							borderWidth: 2,
							borderColor: isHighlight == true ? 'green' : 'transparent',
						}}
					>
						<div className='tl-note__scrim' />
						<TextLabel
							id={id}
							type={type}
							font={font}
							size={size}
							align={align}
							verticalAlign={verticalAlign}
							text={text}
							labelColor='black'
							wrap
						/>
					</div>
					{!isKeyboardOpen && (
						<div>
							<div>
								<Stack direction='row' spacing={1} sx={{ mt: 1 }}>
									{users.map(user =>
										lastUser == user.name ? (
											<StyledBadge
												overlap='circular'
												anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
												variant='dot'
												onPointerDown={stopEventPropagation}
												onClick={() => {
													setLastUser(user.name)
													setUserClickCount({
														...userClickCount,
														[user.name]: userClickCount[user.name] + 1,
													})
												}}
											>
												<Avatar
													sx={{ bgcolor: user.bgcolor, width: 30, height: 30 }}
													alt='User Name'
												>
													{user.name}
												</Avatar>
											</StyledBadge>
										) : (
											<Avatar
												sx={{ bgcolor: user.bgcolor, width: 30, height: 30 }}
												onPointerDown={stopEventPropagation}
												alt='User Name'
												onClick={() => {
													setLastUser(user.name)
													setUserClickCount({
														...userClickCount,
														[user.name]: userClickCount[user.name] + 1,
													})
													setEditHistory([...editHistory, { text: text, author: user.name }])
												}}
											>
												{user.name}
											</Avatar>
										)
									)}
								</Stack>
							</div>
						</div>
					)}
					<OverlayKeyboard
						size={NOTE_SIZE}
						type={type}
						id={id}
						isKeyboardOpen={isKeyboardOpen}
						setIsKeyboardOpen={setIsKeyboardOpen}
					/>
				</div>
				<div
					style={{
						marginLeft: NOTE_SIZE + PADDING,
					}}
				>
					{loadingStatus == 'idle' && (
						<div>
							<IconButton
								size='small'
								onPointerDown={stopEventPropagation}
								onClick={e => {
									setLoadingStatus('loading')
									generateTipsForObject(editor, shape.id).then(tips => {
										setTips(tips)
										setLoadingStatus('tip-loaded')
										console.log('Tips: ', tips)
									})
								}}
							>
								<DnsIcon />
							</IconButton>
							<IconButton
								size='small'
								onPointerDown={stopEventPropagation}
								onClick={e => {
									setLoadingStatus('loading')
									const selectionBounds = editor.getSelectionPageBounds()
									if (!selectionBounds) throw new Error('No selection bounds')
									generateSubtasks(editor, shape.id, text).then(subtasks => {
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
								}}
							>
								<SafetyDividerIcon />
							</IconButton>
							<IconButton
								onPointerDown={stopEventPropagation}
								onClick={() => {
									setLoadingStatus('search-bar')
								}}
							>
								<TipsAndUpdatesIcon />
							</IconButton>
							<IconButton
								onPointerDown={stopEventPropagation}
								onClick={() => {
									setLoadingStatus('summary-loaded')
									const summary = {
										text: 'Recent interest in design through the artificial intelligence (AI) lens is rapidly increasing. Designers, as a\
										special user group interacting with AI, have received more attention in the Human-Computer Interaction\
										community',
										keywords: [
											'user group',
											'artificial intelligence',
											'Human-Computer Interaction',
										],
									}
									setSummary(summary)
									// generateComparisonSummary(editHistory).then((text) => {
									// 	setLoadingStatus('summary-loaded')
									// 	setSummary(text)
									// })
								}}
							>
								<CompareArrowsIcon />
							</IconButton>
							<IconButton
								onPointerDown={stopEventPropagation}
								onClick={() => {
									editor.deleteShape(id)
								}}
							>
								<DeleteForeverIcon />
							</IconButton>
							<IconButton
								onPointerDown={stopEventPropagation}
								onClick={() => {
									if (isSlide == null || isSlide == false) {
										setIsSlide(true)
										const maxRepeats = 2;
										var repeatCount = 0;
										const interval = setInterval(() => {
											if (repeatCount < maxRepeats) {
												editor.createShape({
													id: createShapeId(),
													type: 'node',
													x: 200*(repeatCount + 1),
													y: 0,
													parentId: id,
													props: {
														text: text,
														initSlide: true,
														index: repeatCount + 1,
													},
												})
												repeatCount++;
											} else {
												// Clear interval once maxRepeats is reached
												clearInterval(interval);
											}
										}, 500)
									} else if (isSlide == true) {
									setIsSlide(false)
									}
								}}
							>
								<ScreenRotationIcon />
							</IconButton>
						</div>
					)}
					{loadingStatus == 'search-bar' && (
						<div style={{ display: 'flex', flexDirection: 'row' }}>
							<div style={{ marginRight: '10px' }}>
								<SearchBar
									setSearchHistories={setSearchHistories}
									searchHistories={searchHistories}
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
							{selectedHistory != null && (
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
							<img src='/loading.png' className='loading-icon' />
						</div>
					)}
					{loadingStatus == 'tip-loaded' &&
						tips.length > 0 &&
						tips.map((tip, index) => (
							<div key={index}>
								<TipsCard
									srcId={id}
									tarId={tip.dstId}
									text={tip.explanation}
									keywords={tip.keywords}
									editor={editor}
								/>
							</div>
						))}
					{loadingStatus == 'summary-loaded' && (
						<div>
							{/* <SummaryCard editor={editor} summary={summary} /> */}
							<ComparisonCard />
						</div>
					)}
				</div>
			</HTMLContainer>
		)
	}

	indicator (shape: NodeShape) {
		return (
			// <rect
			// 	rx='7'
			// 	width={toDomPrecision(NOTE_SIZE)}
			// 	height={toDomPrecision(this.getHeight(shape) + TAG_SIZE)}
			// />
			<div></div>
		)
	}

	override toSvg (shape: NodeShape, ctx: SvgExportContext) {
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

	override onEditEnd: TLOnEditEndHandler<NodeShape> = shape => {
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
}

function getGrowY (editor: Editor, shape: NodeShape, prevGrowY = 0) {
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
