import { useState } from 'react'
import { groupNotes, setLayoutForFrame } from '../lib/utils/groupUtil'
import { createShapeId, stopEventPropagation } from '@tldraw/tldraw'
import Box from '@mui/material/Box'
import CssBaseline from '@mui/material/CssBaseline'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import RestoreIcon from '@mui/icons-material/Restore'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ArchiveIcon from '@mui/icons-material/Archive'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import Chip from '@mui/material/Chip'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemIcon from '@mui/material/ListItemIcon'
import MicIcon from '@mui/icons-material/Mic'
import ListItemText from '@mui/material/ListItemText'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import { getAffinityDiagramming } from '../lib/affinityDiagrammingFromOpenAI'
import { extractInformation } from '../lib/extractKeyInfoFromOpenAI'
import { writeDoc, fetchDocs } from '../firebase'
import { useSelector, useDispatch } from 'react-redux'
import {
	setCurAffinity,
	setTopZonePurpose,
	setShowSpeechOptions,
	setIsRelHintActive,
	setIsCrossUserRelOnly,
} from '../redux/reducers/globalReducer'
import { saveShapesOnCurPage, fetchSavedShapes, saveSnapshot } from '../lib/utils/helper'
import { retrieveInformation } from '../lib/infoRetrievalFromOpenAI'
import { groupByTopic } from '../lib/groupByTopicFromOpenAI'
import { CustomSwitch } from './UtilComponent'
import { AudioRecorder } from './SpeechRecorder'
import '../style.css'

export const GlobalMenu = ({ editor }) => {
	const [value, setValue] = useState(-1)
	const [existingAffinity, setExistingAffinity] = useState([])
	const [loading, setLoading] = useState(false)
	const [selectedItem, setSelectedItem] = useState('')
	const [instruction, setInstruction] = useState('')
	const [infoRetrieval, setInfoRetrieval] = useState([])
	const [extractedInfo, setExtractedInfo] = useState([])
	const [groups, setGroups] = useState([])
	const [snapName, setSnapName] = useState('')
	const [isSelectedGroup, setIsSelectedGroup] = useState()
	const [selectedGroupNodes, setSelectedGroupNodes] = useState()
	const dispatch = useDispatch()
	const isRelHintActive = useSelector(state => state.global.isRelHintActive)
	const transcript = useSelector(state => state.global.transcript)
	const showSpeechOptions = useSelector(state => state.global.showSpeechOptions)
	const isCrossUserRelOnly = useSelector(state => state.global.isCrossUserRelOnly)
	const [snapShotList, setSnapShotList] = useState([])
	// const [toggleRelationHint, setToggleRelationHint] = useState(false)

	const GroupWithExistingAffinity = ({ affinity = [], has_loaded = false }) => {
		const curPage = editor.getCurrentPage()
		const ideas = editor
			.getCurrentPageShapes()
			.filter(shape => shape.type === 'node')
			.map(shape => {
				return { text: shape.props.text, id: shape.id }
			})

		if (has_loaded == true) {
			// already grouped
			console.log('Has loaded: ', has_loaded)
			if (Object.keys(affinity).length == 0) {
				return
			}

			for (const [group_name, nodes_info] of Object.entries(affinity.themes)) {
				// nodes_info: [{text, pre_topic, color}, {text, pre_topic, color}, {text, pre_topic, color}]

				if (nodes_info.length == 0) {
					continue
				}

				const node_text = nodes_info.map(node => node.text)

				const node_ids = editor
					.getCurrentPageShapes()
					.filter(shape => shape.type === 'node' && node_text.includes(shape.props.text))
					.map(shape => {
						return shape.id
					})

				console.log('node_text: ', node_text)
				console.log('nodes_ids: ', node_ids)

				const { frame_id } = groupNotes(
					editor,
					node_ids.map(id => editor.getShape(id)),
					group_name,
					0,
					0
				)

				editor.updateShape({
					id: frame_id,
					parentId: curPage.id,
				})
			}

			setLayoutForFrame(editor, curPage.id)

			return
		}

		const themes = Object.keys(affinity.themes)

		setLoading(true)
		groupByTopic({ editor, ideas, topics: themes }).then(groups => {
			setLoading(false)
			console.log('Groups: ', groups)
			if (Object.keys(groups).length == 0) {
				return
			}

			for (const [group_name, note_ids] of Object.entries(groups)) {
				if (note_ids.length == 0) {
					continue
				}

				const { frame_id } = groupNotes(
					editor,
					note_ids.map(id => editor.getShape(id)),
					group_name,
					0,
					0
				)

				editor.updateShape({
					id: frame_id,
					parentId: curPage.id,
				})
			}

			setLayoutForFrame(editor, curPage.id)
			setLoading(false)
		})
	}

	// Group all the nodes as default
	const createAndArrangeAffinityDiagram = res_list => {
		const startingX = -600
		const startingY = -600
		let lastWidth = 0
		let lastHeight = 0

		res_list.forEach(theme_obj => {
			const { theme, ideas } = theme_obj
			const group = ideas.map(idea => {
				const { text, pre_topic, color } = idea
				const noteId = createShapeId()
				editor.createShape({
					id: noteId,
					type: 'node',
					x: 0,
					y: 0,
					props: {
						text: text,
						w: 200,
						h: 200,
						color: color,
					},
				})
				return noteId
			})

			// we need to set a tiny timeout (0.1s) for the shapes to be created, otherwise the groupNotes function will not work
			setTimeout(() => {
				const { frame_id, parentWidth, parentHeight } = groupNotes(
					editor,
					group,
					theme,
					startingX + lastWidth,
					startingY
				)
				lastWidth += parentWidth + 200
				lastHeight += parentHeight
				setLayoutForFrame(editor, frame_id)
			}, 100)
		})
	}

	const handleCustomGroupingClicked = e => {
		setSelectedItem('enter-custom-grouping')
	}

	const handleRetrievalClicked = id => {
		// editor.setCamera({x, y,}, {duration: 500})
		const global_z = editor.getShapePageBounds(id).width / editor.getViewportScreenBounds().width
		const x = -editor.getShape(id).x + 1250
		const y = -editor.getShape(id).y + 500

		editor.setCamera({ x: x, y: y, global_z }, { duration: 500 })
	}

	const handleToggleRelationHint = e => {
		dispatch(setIsRelHintActive(!isRelHintActive))
	}

	const handleGlobalGrouping = e => {
		console.log('Doing global grouping...')
		setLoading(true)
		setIsSelectedGroup(false)
		getAffinityDiagramming({ editor }).then(groups => {
			console.log('Grouping results: ', groups)
			setGroups(Object.values(groups))
			setSelectedItem('choose-group')
			setLoading(false)
		})
	}

	const handleRetrieveRelevantIdeasThroughSpeech = e => {
		console.log('Retrieving relevant ideas through speech...')
		setLoading(true)

		retrieveInformation({ editor, transcript }).then(res => {
			console.log('Retrieved ideas: ', res)
			setLoading(false)
			setInfoRetrieval(res)
			setSelectedItem('info-retrieval-group')
		})
	}

	const handleExtractInfoThroughSpeech = e => {
		console.log('Extracting information through speech...')
		setLoading(true)

		extractInformation({ editor, transcript }).then(res => {
			console.log('Extracted info: ', res)
			setLoading(false)
			setExtractedInfo(res)
			setSelectedItem('extract-keyword-group')
		})
	}

	const handleCreateNoteFromExtraction = (note) => {
		const viewport = editor.getViewportScreenCenter()
		const offsetX = Math.floor(Math.random() * 11);
		const offsetY = Math.floor(Math.random() * 11);
		editor.createShape({
			id: createShapeId(),
			type: 'node',
			x: viewport.x + offsetX,
			y: viewport.y + offsetY,
			props: {
				text: note
			}
		})
	}

	const handleCrossUserRelOnly = e => {
		dispatch(setIsCrossUserRelOnly(!isCrossUserRelOnly))
	}

	const loadAffinityGroup = e => {
		console.log('Loading affinity group...')
		setLoading(true)
		fetchDocs({ collection_name: 'affinity' }).then(res => {
			console.log('Affinity group: ', res)
			setExistingAffinity(res)
			setSelectedItem('affinity-group')
			setLoading(false)
		})
	}

	const handleGroupingWithSelection = e => {
		// const shapes = editor.getSelectedShapes().filter(shape => shape.type === 'node')
		const shapes = editor.getSelectedShapes()
		setLoading(true)
		// recursively retrieve all the nodes from the selected shapes
		const getNodes = (shapes, nodes = []) => {
			shapes.forEach(shape => {
				if (shape.type === 'node') {
					nodes.push(shape)
				} else if (shape.type === 'new_frame') {
					const children = editor
						.getSortedChildIdsForParent(shape.id)
						.map(id => editor.getShape(id))
					getNodes(children, nodes)
				}
			})
			return nodes
		}

		let nodes = []
		nodes = getNodes(shapes, nodes)

		console.log('Nodes: ', nodes)

		setSelectedGroupNodes(nodes)

		getAffinityDiagramming({ editor, ideas: nodes }).then(groups => {
			setGroups(Object.values(groups))
			setSelectedItem('choose-group')
			setIsSelectedGroup(true)
			setLoading(false)
		})
	}

	const handleUseExistingGroup = e => {
		setIsSelectedGroup(false)
		setSelectedItem('use-group')
	}

	const handleSaveSnapshot = e => {
		console.log('Saving snapshot...')
		saveSnapshot(editor, snapName)
		setSelectedItem('')
		setSnapName('')
	}

	const handleSaveSnapshotClicked = e => {
		console.log('Saving snapshot...')
		setSelectedItem('enter-snapshot-name')

	}

	const handleCustomGrouping = e => {
		setLoading(true)
		setSelectedItem('')
		getAffinityDiagramming({ editor, instruction }).then(groups => {
			console.log('Grouping results: ', groups)
			setGroups(Object.values(groups))
			setSelectedItem('choose-group')
			// writeDoc({ collection_name: 'affinity', data: data })
			// handleAffinitySelected({ affinity: data, has_loaded: true })
			setLoading(false)
		})
	}

	const handleAffinitySelected = ({ affinity, has_loaded = false }) => {
		console.log('affinity selected: ', affinity)
		dispatch(setCurAffinity(affinity))
		dispatch(setTopZonePurpose('apply-affinity'))
		// check if the current page is main page. If it is, save the cur data on the main page to firebase
		const cur_page = editor.getCurrentPage()
		// if the current page is the main page, save the shapes as cur data to firebase
		if (cur_page.id === 'page:page') {
			saveShapesOnCurPage(editor)
		}
		// create pages for the affinity group if not existed
		const pages = editor.getPages()
		const affinityPage = pages.find(page => page.name === affinity.name)
		if (!affinityPage) {
			editor.createPage({ name: affinity.name })
		}
		// switch to the affinity page
		editor.getPages().forEach(page => {
			console.log(page.name, affinity.name)
			if (page.name === affinity.name) {
				editor.setCurrentPage(page.id)
				fetchSavedShapes({ idea_only: true }).then(shapes => {
					const shapesOnCurPage = editor.getCurrentPageShapes()
					// replace with the new shapes from the main page
					editor.deleteShapes(shapesOnCurPage.map(shape => shape.id))

					if (isSelectedGroup) {
						let selected_shapes = selectedGroupNodes
						selected_shapes.map(shape => {
							const id = createShapeId()
							editor.createShape({
								...shape,
								id: id,
								parentId: page.id,
							})
						})
					} else {
						shapes.map(shape => {
							const id = createShapeId()
							editor.createShape({
								...shape,
								id: id,
								parentId: page.id,
							})
						})
					}

					setTimeout(() => {
						GroupWithExistingAffinity({ affinity, has_loaded })
					}, 500)
				})
			}
		})
	}

	const handleLoadSnapshotClicked = e => {
		setLoading(true)
		fetchDocs({ collection_name: 'snapshots' }).then(res => {
			console.log('Snapshots: ', res)
			setSnapShotList(res)
			setSelectedItem('snapshot-list')
			setLoading(false)
		})

	}

	const handleRelationHintButtonClicked = e => {
		console.log('Toggle relation hint...')
		setSelectedItem('toggle-relation-hint')
	}

	const handleLoadSnapshot = (snapshot) => {
		editor.store.loadSnapshot(snapshot)
	}

	return (
		<Box>
			<Box>
				<BottomNavigation
					sx={{ backgroundColor: 'rgba(249,250,251,255)' }}
					showLabels
					value={value}
					onChange={(event, newValue) => {
						setSelectedItem('')
						setShowSpeechOptions(false)
						setValue(newValue)
					}}
				>
					<BottomNavigationAction
						label='Group'
						icon={<img style={{ width: 20, height: 20 }} src='affinity.png' alt='Affinity' />}
					/>
					<BottomNavigationAction
						label='Action'
						icon={<img style={{ width: 20, height: 20 }} src='preferences.png' alt='Preference' />}
					/>
					<BottomNavigationAction label='Speech' icon={<MicIcon />} />
				</BottomNavigation>
			</Box>
			{
				// show loading animation when loading is true
				loading && (
					<div className='loader' style={{ display: 'flex', alignItems: 'start', marginTop: 2 }}>
						<div style={{ marginRight: 4 }}></div>
						<div style={{ marginRight: 4 }}></div>
						<div style={{ marginRight: 4 }}></div>
					</div>
				)
			}
			{value === 0 && selectedItem == '' && !loading && (
				<Box sx={{ display: 'flex', flexDirection: 'column', marginRight: 2 }}>
					<Box
						onPointerDown={stopEventPropagation}
						onTouchStart={handleGlobalGrouping}
						onClick={handleGlobalGrouping}
						className={`menu-item ${value === 0 ? 'active' : ''}`}
						style={{
							animationDelay: `${0 * 100}ms`,
							marginTop: 10,
							width: 'auto',
							marginLeft: 50,
							display: 'inline-flex',
							border: '1px solid black',
							borderRadius: '10px',
							whiteSpace: 'nowrap',
							padding: '5px 20px',
							height: 'auto',
							flexDirection: 'row',
							justifyContent: 'start',
							alignItems: 'start',
							backgroundColor: 'rgba(237,237,233,0.7)',
							cursor: 'pointer',
						}}
					>
						<img style={{ width: 20, height: 20 }} src='grouping.png' alt='grouping' />
						<Typography sx={{ color: 'black', marginLeft: 2 }} variant='body2'>
							Global grouping
						</Typography>
					</Box>
					<Box
						onPointerDown={stopEventPropagation}
						onTouchStart={handleGroupingWithSelection}
						onClick={handleGroupingWithSelection}
						className={`menu-item ${value === 0 ? 'active' : ''}`}
						style={{
							animationDelay: `${1 * 100}ms`,
							marginTop: 10,
							width: 'auto',
							marginLeft: 50,
							display: 'inline-flex',
							border: '1px solid black',
							borderRadius: '10px',
							whiteSpace: 'nowrap',
							padding: '5px 20px',
							height: 'auto',
							flexDirection: 'row',
							justifyContent: 'start',
							alignItems: 'start',
							backgroundColor: 'rgba(237,237,233,0.7)',
							cursor: 'pointer',
						}}
					>
						<img
							style={{ width: 20, height: 20 }}
							src='selected_grouping.png'
							alt='Selected grouping'
						/>
						<Typography sx={{ color: 'black', marginLeft: 2 }} variant='body2'>
							Selected grouping
						</Typography>
					</Box>
					<Box
						onPointerDown={stopEventPropagation}
						onClick={handleCustomGroupingClicked}
						onTouchStart={handleCustomGroupingClicked}
						className={`menu-item ${value === 0 ? 'active' : ''}`}
						style={{
							animationDelay: `${2 * 100}ms`,
							marginTop: 10,
							width: 'auto',
							marginLeft: 50,
							display: 'inline-flex',
							border: '1px solid black',
							borderRadius: '10px',
							whiteSpace: 'nowrap',
							padding: '5px 20px',
							height: 'auto',
							flexDirection: 'row',
							justifyContent: 'start',
							alignItems: 'start',
							backgroundColor: 'rgba(237,237,233,0.7)',
							cursor: 'pointer',
						}}
					>
						<img
							style={{ width: 20, height: 20 }}
							src='conditional_cluster.png'
							alt='conditional grouping'
						/>
						<Typography sx={{ color: 'black', marginLeft: 2 }} variant='body2'>
							Customized grouping
						</Typography>
					</Box>
					<Box
						onPointerDown={stopEventPropagation}
						onTouchStart={loadAffinityGroup}
						onClick={loadAffinityGroup}
						className={`menu-item ${value === 0 ? 'active' : ''}`}
						style={{
							animationDelay: `${3 * 100}ms`,
							marginTop: 10,
							width: 'auto',
							marginLeft: 50,
							display: 'inline-flex',
							border: '1px solid black',
							borderRadius: '10px',
							whiteSpace: 'nowrap',
							padding: '5px 20px',
							height: 'auto',
							flexDirection: 'row',
							justifyContent: 'start',
							alignItems: 'start',
							backgroundColor: 'rgba(237,237,233,0.7)',
							cursor: 'pointer',
						}}
					>
						<img style={{ width: 20, height: 20 }} src='grouping.png' alt='grouping' />
						<Typography sx={{ color: 'black', marginLeft: 2 }} variant='body2'>
							Use existing groups
						</Typography>
					</Box>
				</Box>
			)}
			{value === 1 && selectedItem == '' && !loading && (
				<Box sx={{ display: 'flex', flexDirection: 'column', marginRight: 2 }}>
					<Box
						onPointerDown={stopEventPropagation}
						onTouchStart={handleRelationHintButtonClicked}
						onClick={handleRelationHintButtonClicked}
						className={`menu-item ${value === 1 ? 'active' : ''}`}
						style={{
							animationDelay: `${1 * 100}ms`,
							marginTop: 10,
							width: 'auto',
							marginLeft: 50,
							display: 'inline-flex',
							border: '1px solid black',
							borderRadius: '10px',
							whiteSpace: 'nowrap',
							padding: '5px 20px',
							height: 'auto',
							flexDirection: 'row',
							justifyContent: 'start',
							alignItems: 'start',
							backgroundColor: 'rgba(237,237,233,0.7)',
							cursor: 'pointer',
						}}
					>
						<img
							style={{ width: 20, height: 20 }}
							src='share.png'
							alt='Selected grouping'
						/>
						<Typography sx={{ color: 'black', marginLeft: 2 }} variant='body2'>
							Toggle relation hint
						</Typography>
					</Box>
					<Box
						onPointerDown={stopEventPropagation}
						onTouchStart={handleSaveSnapshotClicked}
						onClick={handleSaveSnapshotClicked}
						className={`menu-item ${value === 1 ? 'active' : ''}`}
						style={{
							animationDelay: `${2 * 100}ms`,
							marginTop: 10,
							width: 'auto',
							marginLeft: 50,
							display: 'inline-flex',
							border: '1px solid black',
							borderRadius: '10px',
							whiteSpace: 'nowrap',
							padding: '5px 20px',
							height: 'auto',
							flexDirection: 'row',
							justifyContent: 'start',
							alignItems: 'start',
							backgroundColor: 'rgba(237,237,233,0.7)',
							cursor: 'pointer',
						}}
					>
						<img
							style={{ width: 20, height: 20 }}
							src='save.png'
							alt='conditional grouping'
						/>
						<Typography sx={{ color: 'black', marginLeft: 2 }} variant='body2'>
							Save Snapshot
						</Typography>
					</Box>
					<Box
						onPointerDown={stopEventPropagation}
						onClick={handleLoadSnapshotClicked}
						onTouchStart={handleLoadSnapshotClicked}
						className={`menu-item ${value === 1 ? 'active' : ''}`}
						style={{
							animationDelay: `${2 * 100}ms`,
							marginTop: 10,
							width: 'auto',
							marginLeft: 50,
							display: 'inline-flex',
							border: '1px solid black',
							borderRadius: '10px',
							whiteSpace: 'nowrap',
							padding: '5px 20px',
							height: 'auto',
							flexDirection: 'row',
							justifyContent: 'start',
							alignItems: 'start',
							backgroundColor: 'rgba(237,237,233,0.7)',
							cursor: 'pointer',
						}}
					>
						<img
							style={{ width: 20, height: 20 }}
							src='collection.png'
							alt='conditional grouping'
						/>
						<Typography sx={{ color: 'black', marginLeft: 2 }} variant='body2'>
							Load Snapshot
						</Typography>
					</Box>
				</Box>
			)}
			{value === 2 && selectedItem == '' && !loading && (
				<Box>
					<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<AudioRecorder />
					</Box>
					{showSpeechOptions && (
						<Box sx={{ display: 'flex', flexDirection: 'column', marginRight: 2 }}>
							<Box
								onPointerDown={stopEventPropagation}
								onTouchStart={handleRetrieveRelevantIdeasThroughSpeech}
								onClick={handleRetrieveRelevantIdeasThroughSpeech}
								className={`menu-item ${value === 2 ? 'active' : ''}`}
								style={{
									animationDelay: `${0 * 100}ms`,
									marginTop: 10,
									width: 'auto',
									marginLeft: 50,
									display: 'inline-flex',
									border: '1px solid black',
									borderRadius: '10px',
									whiteSpace: 'nowrap',
									padding: '5px 20px',
									height: 'auto',
									flexDirection: 'row',
									justifyContent: 'start',
									alignItems: 'start',
									backgroundColor: 'rgba(237,237,233,0.7)',
									cursor: 'pointer',
								}}
							>
								<img style={{ width: 20, height: 20 }} src='grouping.png' alt='grouping' />
								<Typography sx={{ color: 'black', marginLeft: 2 }} variant='body2'>
									Get relevant ideas
								</Typography>
							</Box>
							<Box
								onPointerDown={stopEventPropagation}
								onTouchStart={handleExtractInfoThroughSpeech}
								onClick={handleExtractInfoThroughSpeech}
								className={`menu-item ${value === 2 ? 'active' : ''}`}
								style={{
									animationDelay: `${0 * 100}ms`,
									marginTop: 10,
									width: 'auto',
									marginLeft: 50,
									display: 'inline-flex',
									border: '1px solid black',
									borderRadius: '10px',
									whiteSpace: 'nowrap',
									padding: '5px 20px',
									height: 'auto',
									flexDirection: 'row',
									justifyContent: 'start',
									alignItems: 'start',
									backgroundColor: 'rgba(237,237,233,0.7)',
									cursor: 'pointer',
								}}
							>
								<img style={{ width: 20, height: 20 }} src='grouping.png' alt='grouping' />
								<Typography sx={{ color: 'black', marginLeft: 2 }} variant='body2'>
									Extract key information
								</Typography>
							</Box>
						</Box>
					)}
				</Box>
			)}
			<Box sx={{ overflow: 'auto', maxHeight: '95vh', height: 'auto' }}>
				{selectedItem == 'affinity-group' &&
					loading == false &&
					existingAffinity.map((affinity, index) => (
						<Box
							sx={{ marginTop: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
							key={index}
							onPointerDown={stopEventPropagation}
							onClick={() => handleAffinitySelected({ affinity })}
							onTouchStart={() => handleAffinitySelected({ affinity })}
						>
							<Paper
								elevation={2}
								sx={{
									width: '220px',
									padding: 1,
									borderRadius: '5px',
									marginRight: '0px',
									marginBottom: '20px',
									cursor: 'pointer',
									background: 'linear-gradient(to right, #8f41e9, #578aef)',
									color: '#fff'
								}}
							>
								<Box
									sx={{ display: 'flex', flexDirection: 'column', width: '100%', flexWrap: 'wrap' }}
								>
									<Typography
										sx={{ fontWeight: 'bold', color: 'white', margin: '2.5px 5px 5px 5px' }}
										variant='body2'
									>
										Groups:
									</Typography>
									<Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
										{Object.keys(affinity.themes).map((theme, index) => (
											<Box key={index} sx={{ marginRight: 1, marginBottom: 1, color: 'white' }}>
												<Chip size='small' label={theme} color="primary" />
											</Box>
										))}
									</Box>
								</Box>
								<Box sx={{ marginTop: 2 }}>
									<Typography sx={{ fontWeight: 'bold' }} variant='body2'>
										Rationale:
									</Typography>
									<Typography variant='body2'>{affinity.principle}</Typography>
								</Box>
							</Paper>
						</Box>
					))}
				{selectedItem == 'toggle-relation-hint' && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'start',
							ml: 8,
						}}
					>
						<FormControlLabel
							control={
								<CustomSwitch checked={isRelHintActive} onChange={handleToggleRelationHint} />
							}
							label='Relation hint'
							sx={{ color: 'black' }}
						/>
						{isRelHintActive && (
							<FormControlLabel
								control={
									<CustomSwitch checked={isCrossUserRelOnly} onChange={handleCrossUserRelOnly} />
								}
								label='Cross-user only'
								sx={{ color: 'black' }}
							/>
						)}
					</Box>
				)}
				{selectedItem == 'enter-custom-grouping' && (
					<Box sx={{ display: 'inline-flex', marginTop: 2 }}>
						<TextField
							id='outlined-basic'
							label='Please enter your prompt'
							sx={{ width: '80%', marginRight: 1 }}
							variant='outlined'
							value={instruction}
							onChange={e => setInstruction(e.target.value)}
						/>
						<IconButton
							onPointerDown={stopEventPropagation}
							onClick={handleCustomGrouping}
							onTocuhStart={handleCustomGrouping}
						>
							<img src='idea.png' style={{ width: 18, height: 18 }} />
						</IconButton>
					</Box>
				)}
				{selectedItem == 'enter-snapshot-name' && (
					<Box sx={{ display: 'inline-flex', marginTop: 2 }}>
						<TextField
							id='outlined-basic'
							label='Please enter snapshot name'
							sx={{ width: '80%', marginRight: 1 }}
							variant='outlined'
							value={snapName}
							onChange={e => setSnapName(e.target.value)}
						/>
						<IconButton
							onPointerDown={stopEventPropagation}
							onClick={handleSaveSnapshot}
							onTocuhStart={handleSaveSnapshot}
						>
							<img src='enter.png' style={{ width: 18, height: 18 }} />
						</IconButton>
					</Box>
				)}
				{selectedItem == 'choose-group' &&
					loading == false &&
					groups.map((group, index) => (
						<Box key={index}>
							<Paper
								elevation={2}
								sx={{
									width: '220px',
									padding: 1,
									borderRadius: '5px',
									marginRight: '0px',
									marginBottom: '20px',
									cursor: 'pointer',
									background: 'linear-gradient(to right, #8f41e9, #578aef)',
									color: '#fff'
								}}
								onClick={() => {
									writeDoc({ collection_name: 'affinity', data: group })
									handleAffinitySelected({ affinity: group })
								}}
							>
								<Box
									sx={{ display: 'flex', flexDirection: 'column', width: '100%', flexWrap: 'wrap' }}
								>
									<Typography
										sx={{ fontWeight: 'bold', color: 'white', margin: '2.5px 5px 5px 5px' }}
										variant='body2'
									>
										Groups:
									</Typography>
									<Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
										{Object.keys(group.themes).map((theme, index) => (
											<Box key={index} sx={{ marginRight: 1, marginBottom: 1, color: 'white' }}>
												<Chip size='small' label={theme} color="primary" />
											</Box>
										))}
									</Box>
								</Box>
								<Box sx={{ marginTop: 2 }}>
									<Typography sx={{ fontWeight: 'bold' }} variant='body2'>
										Rationale:
									</Typography>
									<Typography variant='body2'>{group.principle}</Typography>
								</Box>
							</Paper>
						</Box>
					))}
				{
					selectedItem == 'snapshot-list' && (
						snapShotList.map((data, index) => {
							return (
								<Paper
									elevation={2}
									sx={{
										width: '220px',
										padding: 1,
										borderRadius: '5px',
										marginRight: '0px',
										marginBottom: '20px',
										cursor: 'pointer',
										background: 'linear-gradient(to right, #8f41e9, #578aef)',
										color: '#fff'
									}}
									key={index}
									// move camera to the selected shape
									onClick={() => handleLoadSnapshot(data.snapshot)}
									onTouchStart={() => handleLoadSnapshot(data.snapshot)}
								>
									<Box
										sx={{
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'center',
											alignItems: 'center',
											width: '100%',
											flexWrap: 'wrap',
										}}
									>
										<Typography
											sx={{ fontWeight: 'bold', color: 'white', margin: '2.5px 5px 5px 5px' }}
											variant='body2'
										>
											{data.name}
										</Typography>
									</Box>
								</Paper>
							)

						})
					)
				}
				{selectedItem == 'info-retrieval-group' && loading == false && (
					<Box>
						{infoRetrieval.length > 0 ? (
							infoRetrieval.map((info, index) => {
								return (
									<Paper
										elevation={2}
										sx={{
											width: '220px',
											padding: 1,
											borderRadius: '5px',
											marginRight: '0px',
											marginBottom: '20px',
											cursor: 'pointer',
											background: 'linear-gradient(to right, #8f41e9, #578aef)',
											color: '#fff'
										}}
										key={index}
										// move camera to the selected shape
										onClick={() => handleRetrievalClicked(info.id)}
										onTouchStart={() => handleRetrievalClicked(info.id)}
									>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												width: '100%',
												flexWrap: 'wrap',
											}}
										>
											<Typography
												sx={{ fontWeight: 'bold', color: '#fff', margin: '2.5px 5px 5px 5px' }}
												variant='body2'
											>
												{info.text}
											</Typography>
										</Box>
										<Box sx={{ marginTop: 2 }}>
											<Typography sx={{ fontWeight: 'bold' }} variant='body2'>
												Related discussion:
											</Typography>
											<Typography variant='body2'>&quot;{info.segment}&quot;</Typography>
										</Box>
									</Paper>
								)
							})
						) : (
							<Paper
								elevation={2}
								sx={{
									width: '220px',
									padding: 1,
									borderRadius: '5px',
									marginRight: '0px',
									marginBottom: '20px',
									cursor: 'pointer',
									background: 'linear-gradient(to right, #8f41e9, #578aef)',
									color: '#fff'
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Typography variant='body2'>No relevant ideas found</Typography>
								</Box>
							</Paper>
						)}
					</Box>
				)}
				{selectedItem == 'extract-keyword-group' && loading == false && (
					<Box>
						{extractedInfo.length > 0 ? (
							extractedInfo.map((info, index) => {
								return (
									<Paper
										elevation={2}
										sx={{
											width: '220px',
											padding: 1,
											borderRadius: '5px',
											marginRight: '0px',
											marginBottom: '20px',
											cursor: 'pointer',
											background: 'linear-gradient(to right, #8f41e9, #578aef)',
											color: '#fff'
										}}
										key={index}
										// move camera to the selected shape
										onClick={() => handleCreateNoteFromExtraction(info.text)}
										onTouchStart={() => handleCreateNoteFromExtraction(info.text)}
									>
										<Box
											sx={{
												display: 'flex',
												flexDirection: 'column',
												width: '100%',
												flexWrap: 'wrap',
											}}
										>
											<Typography
												sx={{ fontWeight: 'bold', color: '#fff', margin: '2.5px 5px 5px 5px' }}
												variant='body2'
											>
												{info.text}
											</Typography>
										</Box>
										{info.related_notes.length > 0 && (
											<Box sx={{ marginTop: 2 }}>
												<Typography sx={{ fontWeight: 'bold' }} variant='body2'>
													Related notes:
												</Typography>
												{info.related_notes.map((note_id, index) => {
													const note_text = editor.getShape(note_id).props.text
													return (
														<Typography variant='body2' key={index}>
															&quot;{note_text}&quot;
														</Typography>
													)
												})}
											</Box>
										)}
									</Paper>
								)
							})
						) : (
							<Paper
								elevation={2}
								sx={{
									width: '220px',
									padding: 1,
									borderRadius: '5px',
									marginRight: '0px',
									marginBottom: '20px',
									cursor: 'pointer',
									background: 'linear-gradient(to right, #8f41e9, #578aef)',
									color: '#fff'
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Typography variant='body2'>No relevant ideas found</Typography>
								</Box>
							</Paper>
						)}
					</Box>
				)}
			</Box>
		</Box>
	)
}
