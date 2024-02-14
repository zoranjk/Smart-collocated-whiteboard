import '../../style.css'
import Chip from '@mui/material-next/Chip'
import { styled } from '@mui/material/styles'
import ControlPointIcon from '@mui/icons-material/ControlPoint'
import { IconButton } from '@mui/material'
import { useState } from 'react'
import TextField from '@mui/material/TextField'
import { Grid } from '@mui/material'
import { stopEventPropagation } from '@tldraw/tldraw'
import { recommendGroupDirection } from '../../lib/groupClassRecommendationFromOpenAI'
import { CustomizedRating } from './Rating'
import DefaultChip from '@mui/material/Chip'
import { groupByTopic } from '../../lib/groupByTopicFromOpenAI'
import { groupNotes, setLayoutForFrame } from '@/app/lib/utils/groupUtil'

export const RequirementPanel = ({ editor, shape }) => {
	// Styling for the text to appear clickable
	const ClickableText = styled('span')({
		textDecoration: 'underline',
		cursor: 'pointer',
		fontSize: '14px',
		color: 'black', // Style as needed
		marginLeft: '5px', // Adjust spacing as needed
		fontWeight: 'bold',
	})

	const [isEditing, setIsEditing] = useState(false)
	const [label, setLabel] = useState('')
	// const [requirements, setRequirements] = useState(['Cost', 'Comfort'])

	const UserNum = 2

	const handleDelete = req => {
		// setRequirements(requirements.filter((item) => item !== req))
		editor.updateShapes([
			{
				id: shape.id,
				meta: {
					...shape.meta,
					requirements: shape.meta.requirements.filter(item => item !== req),
				},
			},
		])
	}

	const handleChange = event => {
		setLabel(event.target.value)
	}

	const handleBlur = () => {
		if (label === '') {
			return
		} else {
			editor.updateShapes([
				{
					id: shape.id,
					meta: {
						...shape.meta,
						requirements: [...shape.meta.requirements, label],
					},
				},
			])
			setLabel('')
		}
		setIsEditing(false)
		// Optionally, trigger an update to the parent component or server here
	}

	const handleEdit = () => {
		setIsEditing(true)
	}

	const handleKeyDown = event => {
		if (event.key === 'Enter') {
			setIsEditing(false)
			// Optionally, trigger an update to the parent component or server here
		}
	}

	const handleGroupByTopic = topic => {
		// get content of all notes belong to the group
		const ideas = editor.getSortedChildIdsForParent(shape.id).map(child => {
			const shape = editor.getShape(child)
			return {
				id: shape.id,
				text: shape.props.text,
			}
		})

		editor.updateShapes([
			{
				id: shape.id,
				meta: {
					...shape.meta,
					loadingStatus: 'loading',
				},
			},
		])

		groupByTopic(editor, ideas, topic).then(group_names => {

			if (Object.keys(group_names).length == 0) {
				return
			}

			console.log('Groups: ', group_names)

			for (const [group_name, note_ids] of Object.entries(group_names)) {

				if (note_ids.length == 0) {
					continue
				}

				const { frame_id, parentWidth, parentHeight } = groupNotes(
					editor,
					note_ids.map(id => editor.getShape(id)),
					group_name,
					shape.x,
					shape.y
				)

				editor.updateShape({
					id: frame_id,
					parentId: shape.id,
					props: {
						backgroundColor: 'rgba(142, 202, 230, 0.5)',
					},
				})
			}

			setLayoutForFrame(editor, shape.id)
		})
	}

	const handleAdd = dim => {
		editor.updateShapes([
			{
				id: shape.id,
				meta: {
					...shape.meta,
					requirements: [...shape.meta.requirements, dim],
					ai_dims: shape.meta.ai_dims.filter(item => item !== dim),
				},
			},
		])
	}

	const handleAISuggestion = () => {
		// get content of all notes belong to the group
		const ideas = editor.getSortedChildIdsForParent(shape.id).map(child => {
			const shape = editor.getShape(child)
			return {
				id: shape.id,
				text: shape.props.text,
			}
		})
		const topic = shape.props.name

		editor.updateShapes([
			{
				id: shape.id,
				meta: {
					...shape.meta,
					loadingStatus: 'loading',
				},
			},
		])

		recommendGroupDirection(editor, ideas, topic).then(group_names => {
			console.log('Group Names: ', group_names)

			editor.updateShapes([
				{
					id: shape.id,
					meta: {
						...shape.meta,
						ai_dims: group_names,
						loadingStatus: 'idle',
					},
				},
			])
		})
	}

	return (
		<div>
			<h2> Dimension(s) used for grouping </h2>
			<div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
				{shape.meta.requirements.map((req, index) => (
					<Chip
						onClick={() => {
							handleGroupByTopic(req)
						}}
						onTouchStart={() => {
							handleGroupByTopic(req)
						}}
						onPointerDown={stopEventPropagation}
						key={index}
						label={req}
						sx={{ mr: 2, mb: 2, height: '35px' }}
						onDelete={() => handleDelete(req)}
					/>
				))}
				<div style={{ height: '35px' }}>
					{isEditing ? (
						<TextField
							size='small'
							sx={{
								backgroundColor: 'rgba(233, 221, 248, 0.5)',
								width: isEditing ? '100%' : '0%', // Make TextField fill its container
								'.MuiInputBase-input': {
									transition: 'width 0.5s ease', // Apply a transition to the input element if needed
								},
							}}
							InputProps={{
								sx: {
									height: '35px', // Set the desired height directly
									alignItems: 'center', // Ensure content is centered
									'& .MuiInputBase-input': {
										height: '35px',
										padding: '0 14px', // Adjust padding as needed, reducing it can help
										'&::placeholder': {
											lineHeight: '35px', // Adjust line height if necessary
										},
									},
								},
							}}
							autoFocus
							fullWidth
							value={label}
							onChange={handleChange}
							onBlur={handleBlur}
							onKeyDown={handleKeyDown}
							variant='outlined'
						/>
					) : (
						<IconButton sx={{ ml: -1 }} onPointerDown={stopEventPropagation} onClick={handleEdit}>
							<ControlPointIcon />
						</IconButton>
					)}
				</div>
			</div>
			<div style={{ marginTop: 25, marginBottom: 25, display: 'flex', flexDirection: 'row' }}>
				<ClickableText
					onPointerDown={stopEventPropagation}
					onClick={handleAISuggestion}
					style={{ marginRight: 20 }}
				>
					See what AI suggests...
				</ClickableText>
				{shape.meta.loadingStatus == 'loading' && (
					<div style={{ display: 'flex', width: '25px', height: '25px' }}>
						<img src='/loading.png' className='loading-icon' />
					</div>
				)}
			</div>
			<div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
				{shape.meta.ai_dims.map((dim, index) => {
					return (
						<div key={index}>
							<DefaultChip
								onPointerDown={stopEventPropagation}
								onClick={() => {
									handleAdd(dim)
								}}
								onTouchStart={() => {
									handleAdd(dim)
								}}
								label={dim}
								sx={{ mr: 2, mb: 2, height: '35px' }}
							/>
						</div>
					)
				})}
			</div>
			{/* <h2>How much do group members consider each factor?</h2>
			<div>
				<Grid container spacing={2}>
					<Grid item xs={2}>
						<></>
					</Grid>
					<Grid className='preference-grid' item xs={Math.floor(10 / UserNum)}>
						<h3>User 1</h3>
					</Grid>
					<Grid className='preference-grid' item xs={Math.floor(10 / UserNum)}>
						<h3>User 2</h3>
					</Grid>
				</Grid>
				{shape.meta.requirements.map((req, index) => (
					<Grid container spacing={2} key={index}>
						<Grid className='preference-grid' item xs={2}>
							<h3>{req}</h3>
						</Grid>
						<Grid className='preference-grid' item xs={Math.floor(10 / UserNum)}>
							<CustomizedRating />
						</Grid>
						<Grid className='preference-grid' item xs={Math.floor(10 / UserNum)}>
							<CustomizedRating />
						</Grid>
					</Grid>
				))}
			</div> */}
		</div>
	)
}
