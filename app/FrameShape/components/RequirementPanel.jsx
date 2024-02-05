import '../../style.css'
import Chip from '@mui/material-next/Chip'
import { styled } from '@mui/material/styles'
import ControlPointIcon from '@mui/icons-material/ControlPoint'
import { IconButton } from '@mui/material'
import { useState } from 'react'
import TextField from '@mui/material/TextField'
import { Grid } from '@mui/material'
import { stopEventPropagation } from '@tldraw/tldraw'

export const RequirementPanel = ({}) => {
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
	const [requirements, setRequirements] = useState(['Cost', 'Comfort'])

	const UserNum = 2

	const handleDelete = () => {
		console.info('You clicked the delete icon.')
	}

	const handleChange = event => {
		setLabel(event.target.value)
	}

	const handleBlur = () => {
		if (label === '') {
			return
		} else {
			setRequirements([...requirements, label])
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

	return (
		<div>
			<h2>What factor(s) do you consider?</h2>
			<div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
				{requirements.map((req, index) => (
					<Chip
						onClick={() => {
							console.log('chip clicked')
						}}
						key={index}
						label={req}
						sx={{ mr: 2, mb: 2, height: '35px' }}
						onDelete={handleDelete}
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
			<div style={{ marginTop: 5, marginBottom: 20 }}>
				<ClickableText>See what AI suggests...</ClickableText>
			</div>
			<h2>How much do group members consider each factor?</h2>
			<div>
				<Grid container spacing={2}>
					<Grid item xs={2}>
						<></>
					</Grid>
					<Grid className='preference-grid' item xs={Math.floor(10/UserNum)}>
						<h3>User 1</h3>
					</Grid>
					<Grid className='preference-grid' item xs={Math.floor(10/UserNum)}>
						<h3>User 2</h3>
					</Grid>
				</Grid>
				{
					requirements.map((req, index) => (
						<Grid container spacing={2} key={index}>
							<Grid className='preference-grid' item xs={2}>
								<h3>{req}</h3>
							</Grid>
							<Grid className='preference-grid' item xs={Math.floor(10/UserNum)}>
								<TextField id='outlined-basic' label='User 1' variant='outlined' fullWidth />
							</Grid>
							<Grid className='preference-grid' item xs={Math.floor(10/UserNum)}>
								<TextField id='outlined-basic' label='User 2' variant='outlined' fullWidth />
							</Grid>
						</Grid>
					))
				}
			</div>
		</div>
	)
}
