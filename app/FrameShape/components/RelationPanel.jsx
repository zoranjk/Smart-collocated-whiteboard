import React, { useState } from 'react'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Divider from '@mui/material/Divider'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import ListItemIcon from '@mui/material/ListItemIcon'
import IconButton from '@mui/material/IconButton'
import CommentIcon from '@mui/icons-material/Comment'
import Collapse from '@mui/material/Collapse'
import Box from '@mui/material/Box'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import { stopEventPropagation } from '@tldraw/tldraw'
import { Button, Stack } from '@mui/material'
import Skeleton from '@mui/material/Skeleton'
import Avatar from '@mui/material/Avatar'
import RelationListItem from './RelationListItem'

export function LoadingAnimations () {
	return (
		<Box sx={{ width: '80%' }}>
			<Skeleton />
			<Skeleton animation='wave' />
			<Skeleton animation={false} />
		</Box>
	)
}

export const RelationPanel = ({ editor, shape }) => {

	return (
		<div>
			<h2>Relations with other topic(s)</h2>
			{shape.meta.relationLoadingStatus == 'loading' ? (
				<LoadingAnimations />
			) : (
				shape.meta.betweenFrameRelations != null && shape.meta.relationLoadingStatus == 'loaded' && (
					<List sx={{ width: '100%', maxWidth: '100%', bgcolor: 'background.paper' }}>
						{shape.meta.betweenFrameRelations.map((group, index) => {
							return (
								<div>
									<RelationListItem frame_name={group['name']} relation={group['relationship']} />
									<Divider />
								</div>
							)
						})}
					</List>
				)
			)}
		</div>
	)
}
