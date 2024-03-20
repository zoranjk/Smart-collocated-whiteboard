'use client'

require('dotenv').config({ path: '.env.local' });
import dynamic from 'next/dynamic'
// import '@tldraw/tldraw/tldraw.css'
import "./index.css";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, addDoc, getDoc, onSnapshot, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { MakeRealButton } from './components/MakeRealButton'
import { TldrawLogo } from './components/TldrawLogo'
import { ResponseShapeUtil } from './ResponseShape/ResponseShape'
import { RiskyButCoolAPIKeyInput } from './components/RiskyButCoolAPIKeyInput'
import { OverlayKeyboard } from './components/OverlayKeyboard'
import { NodeShapeUtil } from './NodeShape/NodeShape'
import { NodeShapeTool } from './NodeShape/NodeShapeTool'
import FontDownloadIcon from '@mui/icons-material/FontDownload'
import { createArrowBetweenShapes } from './lib/utils/helper'
import { uiOverrides } from './ui-overrides'
import { QuilEditorShapeUtil } from './QuilEditorShape/QuilEditorShape'
import UndoIcon from '@mui/icons-material/Undo';
import Box from '@mui/material/Box'
import {
	TLUiAssetUrlOverrides,
	TLEventInfo,
	TLUiEventHandler,
	TLEditorComponents,
	useEditor,
	TLComponents,
	track,
	stopEventPropagation,
} from '@tldraw/tldraw'
import { TopZoneNameBar } from './components/TopZoneNameBar'
import { useCallback, useEffect, useState } from 'react'
import {
	TaskSplitResponseShapeUtil,
	SubTaskShapeUtil,
} from './TaskSplitResponseShape/TaskSplitResponseShape'
import { ResultShapeUtil } from './ResultShape/ResultShapeUtil'
import { IconButton, Paper, Typography } from '@mui/material'
import { FrameShapeUtil } from './FrameShape/FrameShapeUtil'
import { FrameShapeTool } from './FrameShape/FrameShapeTool'
import { useYjsStore } from './useYjsStore'
import { SearchShapeUtil } from './SearchShape/SearchShape'
import { SearchTool } from './SearchShape/SearchShapeTool'
import { GlobalMenu } from './components/GlobalMenu'
import { getRelationHints } from './lib/ideaRelationFromOpenAI'
import { Provider } from 'react-redux'
import { createWrapper } from 'next-redux-wrapper'
import { useSelector } from 'react-redux'
import ReduxStore from './redux/store' // Import your store
import { useDispatch } from 'react-redux'
import { setTopZonePurpose } from './redux/reducers/globalReducer';
import { useSearchParams  } from 'next/navigation';
import { CustomArrowShapeUtil } from './ArrowShape/CustomArrowShapeUtil';
import { CustomArrowShapeTool } from './ArrowShape/CustomArrowShapeTool';

const Tldraw = dynamic(async () => (await import('@tldraw/tldraw')).Tldraw, {
	ssr: false,
})

const customShapeUtils = [
	ResponseShapeUtil,
	NodeShapeUtil,
	TaskSplitResponseShapeUtil,
	SubTaskShapeUtil,
	QuilEditorShapeUtil,
	SearchShapeUtil,
	FrameShapeUtil,
	ResultShapeUtil,
	CustomArrowShapeUtil
]
const customTools = [NodeShapeTool, FrameShapeTool, SearchTool, CustomArrowShapeTool]

const customAssetUrls: TLUiAssetUrlOverrides = {
	icons: {
		node: '/note-sticky-solid.svg',
		new_frame: '/frame.png',
		search: '/subtask.png',
		new_arrow: '/up-right.png'
	},
}

const FeatureMenu = track(() => {
	const editor = useEditor()

	return (
		<div style={{ pointerEvents: 'all', display: 'flex' }}>
			<GlobalMenu editor={editor} />
		</div>
	)
})

const UpdateRelationHints = (editor, isRelHintActive, isCrossUserRelOnly) => {

	const idea_nodes = editor.getCurrentPageShapes().filter((shape) => shape.type === "node")
	const ideas = idea_nodes.map((node) => {
		return {
			id: node.id,
			text: node.props.text,
			creator: node.props.lastUserName
		}
	})

	getRelationHints({ ideas: ideas, crossUserOnly: isCrossUserRelOnly }).then((relations) => {
		// avoid the case when the user has disabled the relation hint but api already being called
		if (!isRelHintActive) {
			return
		}
		// set confidence threshold to 0.5
		const threshold = 0.5
		const filteredRelations = relations.filter((relation) => relation.confidence > threshold)
		if (filteredRelations.length > 0) {
			const rel_ids = createArrowBetweenShapes({ editor, relationship: filteredRelations })
			editor.setHintingShapes(rel_ids)
		}

	})
}

const TopZoneComponent = track(() => {
	const dispatch = useDispatch()
	const editor = useEditor()
	const topZonePurpose = useSelector((state) => state.global.topZonePurpose)
	const curAffinity = useSelector((state) => state.global.curAffinity)
	const curPage = editor.getCurrentPage()

	useEffect(() => {
		if (curPage.id === "page:page") {
			dispatch(setTopZonePurpose(''))
		}
	}, [curPage])

	const handleReturnButton = () => {
		editor.setCurrentPage("page:page")
	}

	return (
		<Box sx={{ marginTop: 2 }}>
			{
				topZonePurpose === "apply-affinity" && (
					<Box>
						<Paper elevation={1} sx={{ padding: 2, pointerEvents: "all", maxWidth: "500px", display: "inline-flex", alignItems: "center" }}>
							<Typography variant="body1" fontWeight={600} component="div" sx={{ marginRight: 2 }}>
								Group
							</Typography>
							<Typography variant="body2" component="div" sx={{ marginRight: 2 }}>
								{curAffinity.principle}
							</Typography>
							<IconButton onPointerDown={stopEventPropagation} onClick={handleReturnButton} onTouchStart={handleReturnButton}>
								<img src="undo.png" style={{ width: 20, height: 20 }} />
							</IconButton>
						</Paper>
					</Box>
				)
			}
		</Box>
	)
})

const components: TLComponents = {
	StylePanel: null,
	SharePanel: FeatureMenu,
	TopPanel: TopZoneComponent
}

export default function App() {
	const [uiEvents, setUiEvents] = useState<string[]>([])
	const [isPointerPressed, setIsPointerPressed] = useState(false)
	const [showTopZone, setShowTopZone] = useState(false)
	const [topZoneContent, setTopZoneContent] = useState(null)
	const [editor, setEditor] = useState(null)
	const isRelHintActive = useSelector((state) => state.global.isRelHintActive)
	const isCrossUserRelOnly = useSelector((state) => state.global.isCrossUserRelOnly)

	const searchParams = useSearchParams();
	const username = searchParams.get('username');
	const roomId = searchParams.get('roomId');

	const WS_ADDRESS = "smartwhiteboard.xyz"
	const WS_PORT = "5800"

	// const WS_ADDRESS = "0.0.0.0"
	// const WS_PORT = "5800"

	const HOST_URL =
		process.env.NODE_ENV === 'development'
			? `wss://${WS_ADDRESS}:${WS_PORT}`
			: 'wss://demos.yjs.dev'

	const handleEvent = useCallback((data: TLEventInfo, editor: any) => {
		if (data.name == 'pointer_down') {
			setIsPointerPressed(true)
		}
		if (data.name == 'pointer_up') {
			setIsPointerPressed(false)
		}
	}, [])

	const onDragOver = (event) => {
		console.log("onDropOver called")
		event.preventDefault();
	};

	const onDrop = (event) => {
		console.log("onDrop called")
	};

	const store = useYjsStore({
		roomId: roomId,
		hostUrl: HOST_URL,
		shapeUtils: customShapeUtils
	})

	function randromSelectColor() {

		const candidates = [
			"#b5e48c",
			"#ffd6ff",
			"#ffb703",
			"#fefae0",
			"#ffc8dd",
			"#ced4da"
		]

		const randomIndex = Math.floor(Math.random() * candidates.length);

		return candidates[randomIndex];
	}

	function generateRandomUsername() {
		const adjectives = ['Cool', 'Mighty', 'Happy', 'Fast', 'Smart'];
		const nouns = ['Dragon', 'Panda', 'Tiger', 'Eagle', 'Lion'];

		const randomNumber = Math.floor(Math.random() * 100);

		const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
		const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

		return `${randomAdjective}${randomNoun}${randomNumber}`;
	}

	useEffect(() => {
		function callRelationHints() {
			UpdateRelationHints(editor, isRelHintActive, isCrossUserRelOnly)
		}
		if (isRelHintActive) {
			setInterval(callRelationHints, 12000);
		}
	}, [isRelHintActive])

	return (
		<div className='editor'>
			<Tldraw
				// persistenceKey="make-real"
				// shareZone={<MakeRealButton />}
				shareZone={<FeatureMenu />}
				// topZone={<TopZoneNameBar editor={editor} />}
				shapeUtils={customShapeUtils}
				tools={customTools}
				overrides={uiOverrides}
				assetUrls={customAssetUrls}
				// persistenceKey="test"
				// onUiEvent={handleUiEvent}
				components={components}
				onMount={editor => {

					editor.user.updateUserPreferences({
						color: randromSelectColor(),
						name: username
					})

					editor.on('event', event => {
						setEditor(editor)
						handleEvent(event, editor)
					})

					editor.getInitialMetaForShape = (shape) => {
						if (shape.type === 'new_frame') {
							return { isPanelOpen: false, requirements: [], ai_dims: [], loadingStatus: "idle", relationLoadingStatus: "idle", betweenFrameRelations: null, depRelations: [], preRelations: [] }
						}
						if (shape.type === 'search') {
							return { isLoading: false, preferences: [] }
						}
						if (shape.type === 'node') {
							return { history: [] }
						}
					}

				}}
				store={store}
				onDragOver={onDragOver}
				onDrop={onDrop}
			>
				{/* <TldrawLogo /> */}
			</Tldraw>
		</div>
	)
}
