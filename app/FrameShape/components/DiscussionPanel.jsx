import React, { useEffect, useState } from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Divider from '@mui/material/Divider'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import ListItemIcon from '@mui/material/ListItemIcon'
import IconButton from '@mui/material/IconButton'
import CommentIcon from '@mui/icons-material/Comment'
import Collapse from '@mui/material/Collapse'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Paper from '@mui/material/Paper'
import { stopEventPropagation } from '@tldraw/tldraw'
import { Button, Stack, Chip, Avatar, Skeleton, Box, Grid } from '@mui/material'
import { ClickableText } from '../utils'
import { callFrameRelationAPI } from '../utils'
import { ColSuggestion } from './Suggestion'

export function LoadingAnimations() {
	return (
		<Box sx={{ width: '80%' }}>
			<Skeleton />
			<Skeleton animation='wave' />
			<Skeleton animation={false} />
		</Box>
	)
}

export const DiscussionPanel = ({ editor, shape }) => {
	const [selectedDependencies, setSelectedDependencies] = useState([])
	const arrows = editor.getCurrentPageShapes().filter(shape => shape.type === 'arrow')

	const handleAISuggestion = async () => {
		editor.updateShape({
			id: shape.id,
			meta: { ...shape.meta, relationLoadingStatus: 'loading' },
		})
		callFrameRelationAPI(editor, shape.id).then(response => {
			console.log('generateFrameRelation Response: ', response)

			editor.updateShape({
				id: shape.id,
				meta: { ...shape.meta, betweenFrameRelations: response, relationLoadingStatus: 'loaded' },
			})
		})
	}

	const handleColSuggestionGeneration = async () => {
		
	}


	return (
		<div>
			<div style={{ marginBottom: 30 }}>
				<Stack direction='row' spacing={1}>
					<Chip
						label='Collaboration Point'
						onClick={() => handleDepChipClick('dep')}
						onTouchStart={() => handleDepChipClick('dep')}
						onPointerDown={stopEventPropagation}
					/>
					<Chip
						label='Warning'
						onClick={() => handleDepChipClick('pre')}
						onTouchStart={() => handleDepChipClick('pre')}
						onPointerDown={stopEventPropagation}
					/>
					<Chip
						label='Internal Dependency'
						onClick={() => handleDepChipClick('pre')}
						onTouchStart={() => handleDepChipClick('pre')}
						onPointerDown={stopEventPropagation}
					/>
					<Chip
						label='External Dependency'
						onClick={() => handleDepChipClick('pre')}
						onTouchStart={() => handleDepChipClick('pre')}
						onPointerDown={stopEventPropagation}
					/>
				</Stack>
			</div>
			<div>
				<Grid container>
					<Grid item xs={6}>
						<ColSuggestion editor={editor} data={{ collaborators: [{ name: "user 1", color: "#f4a261" }, { name: "user 2", color: "#48cae4" }], suggestion: "Work on this part dudes!" }} />
					</Grid>
				</Grid>
			</div>
		</div>
	)
}
