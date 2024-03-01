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
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import { getAffinityDiagramming } from '../lib/affinityDiagrammingFromOpenAI'
import { writeDoc, fetchDocs } from '../firebase'
import { useSelector, useDispatch } from 'react-redux'
import { setCurAffinity, setTopZonePurpose } from '../redux/reducers/globalReducer'
import { saveShapesOnCurPage, fetchSavedShapes } from '../lib/utils/helper'
import { groupByTopic } from '../lib/groupByTopicFromOpenAI'
import '../style.css'

export const GlobalMenu = ({ editor }) => {
	const [value, setValue] = useState(-1)
	const [existingAffinity, setExistingAffinity] = useState([])
	const [loading, setLoading] = useState(false)
	const [selectedItem, setSelectedItem] = useState('')
	const [instruction, setInstruction] = useState('')
	const dispatch = useDispatch()

	const GroupWithExistingAffinity = ({ affinity = [], has_loaded = false }) => {
		const curPage = editor.getCurrentPage()
		const ideas = editor.getCurrentPageShapes().filter(shape => shape.type === 'node').map((shape) => { return { text: shape.props.text, id: shape.id } })

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

				const node_ids = editor.getCurrentPageShapes().filter(shape => shape.type === 'node' && node_text.includes(shape.props.text)).map((shape) => {
					return shape.id
				})

				console.log("node_text: ", node_text)
				console.log("nodes_ids: ", node_ids)

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

	const handleGlobalGrouping = e => {
		console.log('Doing global grouping...')
		setLoading(true)
		getAffinityDiagramming({ editor }).then(res => {
			console.log('Grouping results: ', res)
			const { themes, rules_of_thumb, name } = res
			const data = { principle: rules_of_thumb, themes, name }
			writeDoc({ collection_name: 'affinity', data: data })
			handleAffinitySelected({ affinity: data, has_loaded: true })
			setLoading(false)
		})
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

		getAffinityDiagramming({ editor, ideas: nodes }).then(res_list => {
			const { themes, rules_of_thumb, name } = res
			const data = { principle: rules_of_thumb, themes, name }
			writeDoc({ collection_name: 'affinity', data: data })
			handleAffinitySelected({ affinity: data, has_loaded: true })
			setLoading(false)
		})
	}

	const handleUseExistingGroup = e => {
		setSelectedItem('use-group')
	}

	const handleCustomGrouping = e => {
		setLoading(true)
		setSelectedItem('')
		getAffinityDiagramming({ editor, instruction }).then(res => {
			console.log('Grouping results: ', res)
			const { themes, rules_of_thumb, name } = res
			const data = { principle: rules_of_thumb, themes, name }
			writeDoc({ collection_name: 'affinity', data: data })
			handleAffinitySelected({ affinity: data, has_loaded: true })
			setLoading(false)
		})
	}

	const handleAffinitySelected = ({ affinity, has_loaded = false }) => {
		console.log("affinity selected: ", affinity)
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
					console.log("fetched shapes: ", shapes)
					// only add those new added shapes to the current affinity page
					const shapesOnCurPage = editor.getCurrentPageShapes()
					const newShapes = shapes.filter(shape => !shapesOnCurPage.find(s => s.meta.corMainPageShapeId === shape.id))
					const existingShapes = shapesOnCurPage.filter(shape => shapes.find(s => shape.meta.corMainPageShapeId === s.id))
					console.log("existing shapes: ", existingShapes)
					const ShapesToDelete = shapesOnCurPage.filter(shape => !shapes.find(s => shape.meta.corMainPageShapeId === s.id))
					console.log("delated shapes: ", ShapesToDelete)

					const newIdeas = newShapes.map(shape => {
						const id = createShapeId()
						return {
							...shape,
							id: id,
							parentId: page.id,
							meta: {
								corMainPageShapeId: shape.id // corMainPageShapeId is the id of the corresponding shape on the main page
							}
						}
					})
					editor.createShapes(newIdeas)

					// update the text of the existing shapes to the latest text on the main page
					existingShapes.forEach(shape => {
						const mainPageShape = shapes.find(s => s.id === shape.meta.corMainPageShapeId)
						editor.updateShape({
							...shape,
							props: {
								...shape.props,
								text: mainPageShape.props.text
							}
						})
					})

					// delete the shapes that are not on the main page
					editor.deleteShapes(ShapesToDelete.map(shape => shape.id))

					setTimeout(() => {
						GroupWithExistingAffinity({ affinity, has_loaded })
					}, 500)

				}
				)
			}
		})
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
						setValue(newValue)
					}}
				>
					<BottomNavigationAction
						label='Group'
						icon={<img style={{ width: 20, height: 20 }} src='affinity.png' alt='Affinity' />}
					/>
					<BottomNavigationAction
						label='Library'
						icon={<img style={{ width: 20, height: 20 }} src='inbox.png' alt='History' />}
					/>
					<BottomNavigationAction label='Archive' icon={<ArchiveIcon />} />
				</BottomNavigation>
			</Box>
			{
				// show loading animation when loading is true
				loading && (
					<div className='loader' style={{ display: "flex", alignItems: "start", marginTop: 2 }}>
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
						// onTouchStart={handleGroupingWithSelection}
						// onClick={handleGroupingWithSelection}
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
				</Box>
			)}
			{value === 1 && selectedItem == '' && !loading && (
				<Box sx={{ display: 'flex', flexDirection: 'column', marginRight: 2 }}>
					<Box
						onPointerDown={stopEventPropagation}
						onTouchStart={loadAffinityGroup}
						onClick={loadAffinityGroup}
						className={`menu-item ${value === 1 ? 'active' : ''}`}
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
							Use existing groups
						</Typography>
					</Box>
					<Box
						onPointerDown={stopEventPropagation}
						onTouchStart={handleUseExistingGroup}
						onClick={handleUseExistingGroup}
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
							src='selected_grouping.png'
							alt='Selected grouping'
						/>
						<Typography sx={{ color: 'black', marginLeft: 2 }} variant='body2'>
							Idea snapshot
						</Typography>
					</Box>
					<Box
						onPointerDown={stopEventPropagation}
						// onTouchStart={handleGroupingWithSelection}
						// onClick={handleGroupingWithSelection}
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
							src='conditional_cluster.png'
							alt='conditional grouping'
						/>
						<Typography sx={{ color: 'black', marginLeft: 2 }} variant='body2'>
							Save idea snapshot
						</Typography>
					</Box>
				</Box>
			)}
			<Box sx={{ overflow: 'auto', maxHeight: '95vh', height: "auto" }}>
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
									cursor: 'pointer',
								}}
							>
								<Box
									sx={{ display: 'flex', flexDirection: 'column', width: '100%', flexWrap: 'wrap' }}
								>
									<Typography
										sx={{ fontWeight: 'bold', color: 'black', margin: '2.5px 5px 5px 5px' }}
										variant='body2'
									>
										Groups:
									</Typography>
									<Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
										{Object.keys(affinity.themes).map((theme, index) => (
											<Box key={index} sx={{ marginRight: 1, marginBottom: 1 }}>
												<Chip size='small' label={theme} />
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
				{
					selectedItem == 'enter-custom-grouping' && (
						<Box sx={{ display: "inline-flex", marginTop: 2 }}>
							<TextField
								id='outlined-basic'
								label='Please enter your prompt'
								sx={{ width: '80%', marginRight: 1 }}
								variant='outlined'
								value={instruction}
								onChange={(e) => setInstruction(e.target.value)}
							/>
							<IconButton
								onPointerDown={stopEventPropagation}
								onClick={handleCustomGrouping}
								onTocuhStart={handleCustomGrouping}
							>
								<img src='idea.png' style={{ width: 18, height: 18 }} />
							</IconButton>
						</Box>
					)
				}
			</Box>
		</Box>
	)
}
