import React from 'react'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import ListItemIcon from '@mui/material/ListItemIcon'
import CommentIcon from '@mui/icons-material/Comment'
import Collapse from '@mui/material/Collapse'
import Button from '@mui/material/Button'
import { LoadingAnimations } from './RelationPanel'
import { stopEventPropagation } from '@tldraw/tldraw'
import { Box, Stack } from '@mui/material'
import { useState } from 'react'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Avatar from '@mui/material/Avatar'

export default function RelationListItem ({ frame_name, relation, editor }) {

	const [open, setOpen] = useState(false)

	const handleExpand = () => {
		setOpen(!open)
	}

	const handleIdeaSpaceRelationship = () => {
		setLoading(true)
	}

	return (
		<div>
			<ListItem
				secondaryAction={
					<React.Fragment>
						<IconButton
							edge='end'
							aria-label='comments'
							sx={{ marginRight: 0.5 }}
							onPointerDown={stopEventPropagation}
							onClick={handleExpand}
						>
							{open ? <ExpandLess /> : <ExpandMore />}
						</IconButton>
						{/* <IconButton edge='end' aria-label='comments' sx={{ marginRight: 0.5 }}>
                    <CommentIcon />
                </IconButton>
                <IconButton edge='end' aria-label='comments'>
                    <CommentIcon />
                </IconButton> */}
					</React.Fragment>
				}
			>
				<ListItemText primary={frame_name} secondary={relation} />
			</ListItem>
			<Collapse in={open} timeout='auto' unmountOnExit>
				<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
					{/* <Stack direction='row' spacing={2} sx={{ marginBottom: 2 }}>
						<Button
							variant='outlined'
							color='primary'
							onPointerDown={stopEventPropagation}
							onClick={handleIdeaSpaceRelationship}
						>
							Idea space relationship
						</Button>
						<Button
							variant='outlined'
							color='primary'
							// endIcon={<Avatar src='/merge.png' />}
						>
							Align frames
						</Button>
					</Stack> */}
				</div>
			</Collapse>
		</div>
	)
}
