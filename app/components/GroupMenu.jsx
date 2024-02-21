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
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import { Typography } from '@mui/material'
import { getAffinityDiagramming } from '../lib/affinityDiagrammingFromOpenAI'

export const GlobalMenu = ({ editor }) => {
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

	const handleGrouping = e => {
		e.stopPropagation()

		const shapes = editor.getCurrentPageShapes().filter(shape => shape.type === 'node')

		console.log('Shapes: ', shapes)

		groupNotes(editor, shapes, 'Group', 200, 200)
	}
	const [value, setValue] = useState(0)

	const handleGlobalGrouping = e => {
		getAffinityDiagramming(editor).then(res_list => {
			createAndArrangeAffinityDiagram(res_list)
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
					const children = editor.getSortedChildIdsForParent(shape.id).map(id => editor.getShape(id))
					getNodes(children, nodes)
				}
			})
			return nodes
		}

		let nodes = []
		nodes = getNodes(shapes, nodes)
		
		console.log('Nodes: ', nodes)

		getAffinityDiagramming(editor, {ideas: nodes}).then(res_list => {
			createAndArrangeAffinityDiagram(res_list)
		})
	}

	return (
		<Box>
			<BottomNavigation
				sx={{ backgroundColor: 'rgba(240, 240, 240, 0.5)' }}
				showLabels
				value={value}
				onChange={(event, newValue) => {
					setValue(newValue)
				}}
			>
				<BottomNavigationAction
					label='Dimension'
					icon={<img style={{ width: 20, height: 20 }} src='affinity.png' alt='Affinity' />}
				/>
				<BottomNavigationAction label='Favorites' icon={<FavoriteIcon />} />
				<BottomNavigationAction label='Archive' icon={<ArchiveIcon />} />
			</BottomNavigation>
			<Paper variant='outlined'>
				{value == 0 && (
					<List
						sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
						component='nav'
						aria-labelledby='nested-list-subheader'
						// subheader={
						// 	<ListSubheader component='div' id='nested-list-subheader'>
						// 		Nested List Items
						// 	</ListSubheader>
						// }
					>
						<ListItemButton
							onPointerDown={stopEventPropagation}
							onTouchStart={handleGlobalGrouping}
							onClick={handleGlobalGrouping}
						>
							<ListItemText primary='Global common dimensions' />
						</ListItemButton>
						<ListItemButton
							onPointerDown={stopEventPropagation}
							onTouchStart={handleGroupingWithSelection}
							onClick={handleGroupingWithSelection}
						>
							<ListItemText primary='Dimensions for selected groups' />
						</ListItemButton>
						<ListItemButton>
							<ListItemText primary='Group by topic' />
						</ListItemButton>
					</List>
				)}
				{value == 1 && <Typography variant='h6'>Favorites</Typography>}
				{value == 2 && <Typography variant='h6'>Archive</Typography>}
			</Paper>
		</Box>
	)
}
