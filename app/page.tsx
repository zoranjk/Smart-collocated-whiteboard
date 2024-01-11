'use client'

import dynamic from 'next/dynamic'
import '@tldraw/tldraw/tldraw.css'
import { MakeRealButton } from './components/MakeRealButton'
import { TldrawLogo } from './components/TldrawLogo'
import { ResponseShapeUtil } from './ResponseShape/ResponseShape'
import { RiskyButCoolAPIKeyInput } from './components/RiskyButCoolAPIKeyInput'
import { OverlayKeyboard } from './components/OverlayKeyboard'
import { NodeShapeUtil } from './NodeShape/NodeShape'
import { NodeShapeTool } from './NodeShape/NodeShapeTool'
import FontDownloadIcon from '@mui/icons-material/FontDownload'
import { uiOverrides } from './ui-overrides'
import { QuilEditorShapeUtil } from './QuilEditorShape/QuilEditorShape'
import {
	TLUiAssetUrlOverrides,
	TLEventInfo,
	TLUiEventHandler,
	TLEditorComponents,
	useEditor,
	track,
	stopEventPropagation,
} from '@tldraw/tldraw'
import { TopZoneNameBar } from './components/TopZoneNameBar'
import { useCallback, useEffect, useState } from 'react'
import {
	TaskSplitResponseShapeUtil,
	SubTaskShapeUtil,
} from './TaskSplitResponseShape/TaskSplitResponseShape'
import { IconButton } from '@mui/material'

const Tldraw = dynamic(async () => (await import('@tldraw/tldraw')).Tldraw, {
	ssr: false,
})

const customShapeUtils = [
	ResponseShapeUtil,
	NodeShapeUtil,
	TaskSplitResponseShapeUtil,
	SubTaskShapeUtil,
	QuilEditorShapeUtil
]
const customTools = [NodeShapeTool]

const customAssetUrls: TLUiAssetUrlOverrides = {
	icons: {
		node: '/note-sticky-solid.svg',
	},
}

const components: Partial<TLEditorComponents> = {
	OnTheCanvas: null,
	InFrontOfTheCanvas: null,
	SnapLine: null,
}

export default function App () {
	const [uiEvents, setUiEvents] = useState<string[]>([])
	const [isPointerPressed, setIsPointerPressed] = useState(false)
	const [editor, setEditor] = useState(null)

	// const handleUiEvent = useCallback<TLUiEventHandler>((name, data) => {
	// 	console.log('Name: ', name)
	// 	setUiEvents(events => [`${name} ${JSON.stringify(data)}`, ...events])
	// }, [])

	const handleEvent = useCallback((data: TLEventInfo, editor: any) => {
		// console.log('Event: ', data.name)
		if (data.name == 'pointer_down') {
			setIsPointerPressed(true)
		}
		if (data.name == 'pointer_up') {
			setIsPointerPressed(false)
		}
	}, [])

	useEffect(() => {
		const timer = setTimeout(() => {
			if (isPointerPressed == true) {
				const allowedTypes = ['node', 'subtask']
				if (editor) {
					console.log('Pressed for 1 second')
					console.log('editor: ', editor)
					const shapes = editor.getSelectedShapes()
					// Current only support single shape selection
					if (shapes.length > 0 && allowedTypes.includes(shapes[0].type)) {
						const type = shapes[0].type
						const id = shapes[0].id
						editor.updateShapes([
							{
								id,
								type,
								props: {
									isPressed: true,
								},
							},
						])
						console.log('Shape Id: ', shapes[0].id)
					}
				}
			}
		}, 1000)

		return () => clearTimeout(timer)
	}, [isPointerPressed])

	return (
		<div className='editor'>
			<Tldraw
				// persistenceKey="make-real"
				shareZone={<MakeRealButton />}
				topZone={<TopZoneNameBar />}
				shapeUtils={customShapeUtils}
				tools={customTools}
				overrides={uiOverrides}
				assetUrls={customAssetUrls}
				// onUiEvent={handleUiEvent}
				components={components}
				onMount={editor => {
					editor.on('event', event => {
						setEditor(editor)
						handleEvent(event, editor)
					})
				}}
			>
				{/* <TldrawLogo /> */}
			</Tldraw>
		</div>
	)
}
