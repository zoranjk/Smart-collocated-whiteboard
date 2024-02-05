import {
	BaseBoxShapeUtil,
	Geometry2d,
	Rectangle2d,
	SVGContainer,
	SelectionEdge,
	stopEventPropagation,
	TLFrameShape,
	TLGroupShape,
	TLOnResizeEndHandler,
	TLOnResizeHandler,
	TLShape,
	TLShapeId,
	canonicalizeRotation,
	frameShapeMigrations,
	frameShapeProps,
	getDefaultColorTheme,
	last,
	useEditor,
	HTMLContainer,
	resizeBox,
	toDomPrecision,
	useIsEditing,
	useValue,
} from '@tldraw/editor'
import classNames from 'classnames'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import { Typography, Box } from '@mui/material'
import { useDefaultColorTheme } from '../lib/utils/ShapeFill'
import { createTextSvgElementFromSpans } from '../lib/utils/createTextSvgElementFromSpans'
import { FrameHeading } from './components/FrameHeading'
import IconButton from '@mui/material/IconButton'
import SubjectIcon from '@mui/icons-material/Subject';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import DnsIcon from '@mui/icons-material/Dns'
import { FrameChip } from './components/FrameChip'
import { RequirementPanel } from './components/RequirementPanel'
import '../style.css'
import { useEffect, useState } from 'react'

function TabPanel(props) {
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`full-width-tabpanel-${index}`}
			aria-labelledby={`full-width-tab-${index}`}
			{...other}
		>
			{value === index && (
				<Box sx={{ p: 3 }}>
					{children}
					{/* <button onPointerDown={stopEventPropagation} onClick={() => console.log("Requirement")}>Requirement</button> */}
				</Box>
			)}
		</div>
	);
}

export function defaultEmptyAs(str: string, dflt: string) {
	if (str.match(/^\s*$/)) {
		return dflt
	}
	return str
}

const PADDING = 20

/** @public */
export class FrameShapeUtil extends BaseBoxShapeUtil<TLFrameShape> {
	static override type = 'new_frame' as const
	static override props = frameShapeProps
	static override migrations = frameShapeMigrations

	override canBind = () => true

	override canEdit = () => true

	override getDefaultProps(): TLFrameShape['props'] {
		return { w: 80 * 2, h: 50 * 2, name: '' }
	}

	override getGeometry(shape: TLFrameShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: false,
		})
	}

	override component(shape: TLFrameShape) {
		const bounds = this.editor.getShapeGeometry(shape).bounds
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const theme = useDefaultColorTheme()
		const editor = useEditor()
		const [isSelected, setIsSelected] = useState(false)
		const [curChip, setCurChip] = useState('')
		const children = editor.getSortedChildIdsForParent(shape.id)

		const [tabValue, setTabValue] = useState(0);
		const handleChange = (event, newValue) => {
			setTabValue(newValue);
		};

		// eslint-disable-next-line react-hooks/rules-of-hooks
		const isCreating = useValue(
			'is creating this shape',
			() => {
				const resizingState = this.editor.getStateDescendant('select.resizing')
				if (!resizingState) return false
				if (!resizingState.getIsActive()) return false
				const info = (resizingState as typeof resizingState & { info: { isCreating: boolean } })
					?.info
				if (!info) return false
				return info.isCreating && this.editor.getOnlySelectedShape()?.id === shape.id
			},
			[shape.id]
		)


		useEffect(() => {
			if (!editor.getSelectedShapeIds().includes(shape.id)) {
				setIsSelected(false)
			} else {
				setIsSelected(true)
			}
		}, [editor.getSelectedShapeIds()])

		const handleReqClick = () => {
			setCurChip("requirement")
			console.log("requirement button clicked")
		}

		const handleIdeaClick = () => {
			setCurChip("idea")
		}

		return (
			<div>
				<HTMLContainer style={{ pointerEvents: 'all' }}>
					<SVGContainer className='bulletin'>
					</SVGContainer>
					{isCreating ? null : (
						<div className='frame-heading'>
							<FrameHeading
								id={shape.id}
								name={shape.props.name}
								width={bounds.width}
								height={bounds.height}
							/>
						</div>
					)}
					{/* <div style={{ marginTop: shape.props.h + PADDING }}>
						<Stack direction="row" spacing={1}>
							<FrameChip icon={<SubjectIcon />} eventHandler={handleReqClick} label="Requirement" id="requirement" curChip={curChip} />
							<FrameChip icon={<LightbulbIcon />} onPointerDown={stopEventPropagation} eventHandler={handleIdeaClick} label="Create new ideas" id="idea" curChip={curChip} />
						</Stack>
					</div> */}
				</HTMLContainer>
				<div className="frame-panel" style={{ marginLeft: shape.props.w, height: shape.props.h, width: 700 }}>
					<Tabs
						onPointerDown={stopEventPropagation}
						onChange={handleChange}
						value={tabValue}
						aria-label="Tabs where selection follows focus"
						selectionFollowsFocus
					>
						<Tab label="Factor analysis" />
						<Tab label="Item Two" />
						<Tab label="Item Three" />
					</Tabs>
					<TabPanel value={tabValue} index={0}>
						<RequirementPanel />
					</TabPanel>
				</div>
			</div>

		)
	}

	override toSvg(shape: TLFrameShape): SVGElement | Promise<SVGElement> {
		const theme = getDefaultColorTheme({ isDarkMode: this.editor.user.getIsDarkMode() })
		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

		const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		rect.setAttribute('width', shape.props.w.toString())
		rect.setAttribute('height', shape.props.h.toString())
		rect.setAttribute('fill', theme.solid)
		rect.setAttribute('stroke', theme.black.solid)
		rect.setAttribute('stroke-width', '1')
		rect.setAttribute('rx', '1')
		rect.setAttribute('ry', '1')
		g.appendChild(rect)

		// Text label
		const pageRotation = canonicalizeRotation(
			this.editor.getShapePageTransform(shape.id)!.rotation()
		)
		// rotate right 45 deg
		const offsetRotation = pageRotation + Math.PI / 4
		const scaledRotation = (offsetRotation * (2 / Math.PI) + 4) % 4
		const labelSide: SelectionEdge = (['top', 'left', 'bottom', 'right'] as const)[
			Math.floor(scaledRotation)
		]

		let labelTranslate: string
		switch (labelSide) {
			case 'top':
				labelTranslate = ``
				break
			case 'right':
				labelTranslate = `translate(${toDomPrecision(shape.props.w)}px, 0px) rotate(90deg)`
				break
			case 'bottom':
				labelTranslate = `translate(${toDomPrecision(shape.props.w)}px, ${toDomPrecision(
					shape.props.h
				)}px) rotate(180deg)`
				break
			case 'left':
				labelTranslate = `translate(0px, ${toDomPrecision(shape.props.h)}px) rotate(270deg)`
				break
			default:
				labelTranslate = ``
		}

		// Truncate with ellipsis
		const opts = {
			fontSize: 12,
			fontFamily: 'Inter, sans-serif',
			textAlign: 'start' as const,
			width: shape.props.w,
			height: 32,
			padding: 0,
			lineHeight: 1,
			fontStyle: 'normal',
			fontWeight: 'normal',
			overflow: 'truncate-ellipsis' as const,
			verticalTextAlign: 'middle' as const,
		}

		const spans = this.editor.textMeasure.measureTextSpans(
			defaultEmptyAs(shape.props.name, 'Frame') + String.fromCharCode(8203),
			opts
		)

		const firstSpan = spans[0]
		const lastSpan = last(spans)!
		const labelTextWidth = lastSpan.box.w + lastSpan.box.x - firstSpan.box.x
		const text = createTextSvgElementFromSpans(this.editor, spans, {
			offsetY: -opts.height - 2,
			...opts,
		})
		text.style.setProperty('transform', labelTranslate)

		const textBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		textBg.setAttribute('x', '-8px')
		textBg.setAttribute('y', -opts.height - 4 + 'px')
		textBg.setAttribute('width', labelTextWidth + 16 + 'px')
		textBg.setAttribute('height', `${opts.height}px`)
		textBg.setAttribute('rx', 4 + 'px')
		textBg.setAttribute('ry', 4 + 'px')
		textBg.setAttribute('fill', theme.background)

		g.appendChild(textBg)
		g.appendChild(text)

		return g
	}

	indicator(shape: TLFrameShape) {
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

	override canReceiveNewChildrenOfType = (shape: TLShape, _type: TLShape['type']) => {
		return !shape.isLocked
	}

	override providesBackgroundForChildren(): boolean {
		return true
	}

	override canDropShapes = (shape: TLFrameShape, _shapes: TLShape[]): boolean => {
		return !shape.isLocked
	}

	override onDragShapesOver = (frame: TLFrameShape, shapes: TLShape[]): { shouldHint: boolean } => {
		if (!shapes.every(child => child.parentId === frame.id)) {
			this.editor.reparentShapes(
				shapes.map(shape => shape.id),
				frame.id
			)
			return { shouldHint: true }
		}
		return { shouldHint: false }
	}

	override onDragShapesOut = (_shape: TLFrameShape, shapes: TLShape[]): void => {
		const parent = this.editor.getShape(_shape.parentId)
		const isInGroup = parent && this.editor.isShapeOfType<TLGroupShape>(parent, 'group')

		// If frame is in a group, keep the shape
		// moved out in that group

		if (isInGroup) {
			this.editor.reparentShapes(shapes, parent.id)
		} else {
			this.editor.reparentShapes(shapes, this.editor.getCurrentPageId())
		}
	}

	override onResizeEnd: TLOnResizeEndHandler<TLFrameShape> = shape => {
		const bounds = this.editor.getShapePageBounds(shape)!
		const children = this.editor.getSortedChildIdsForParent(shape.id)

		const shapesToReparent: TLShapeId[] = []

		for (const childId of children) {
			const childBounds = this.editor.getShapePageBounds(childId)!
			if (!bounds.includes(childBounds)) {
				shapesToReparent.push(childId)
			}
		}

		if (shapesToReparent.length > 0) {
			this.editor.reparentShapes(shapesToReparent, this.editor.getCurrentPageId())
		}
	}

	override onResize: TLOnResizeHandler<any> = (shape, info) => {
		return resizeBox(shape, info)
	}

}
