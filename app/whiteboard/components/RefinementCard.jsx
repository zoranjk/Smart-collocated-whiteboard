import * as React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { createShapeId, stopEventPropagation } from '@tldraw/tldraw'
import { IconButton } from '@mui/material'
import { improveContent } from '../lib/refineContentFromOpenAI'
import MobileScreenShareIcon from '@mui/icons-material/MobileScreenShare'
import KeyboardDoubleArrowDownOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowDownOutlined';
import KeyboardDoubleArrowUpOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowUpOutlined';
export function RefinmentCard({ srcId, suggestion, editor, setLoadingStatus, index }) {

	const [expand, setExpand] = React.useState(false)
	const [needExpand, setNeedExpand] = React.useState(false)
	const myRef = React.useRef(null);

	React.useEffect(() => {
		if (myRef.current) {
			console.log(myRef.current.clientHeight);
			if (myRef.current.clientHeight > 162) {
				setNeedExpand(true)
			}
		}
	}, [expand])

	const handleRefinement = () => {
		console.log('You clicked the Suggestion.')
		const shape = editor.getShape(srcId)
		setLoadingStatus('loading')
		improveContent(shape.text, suggestion).then(res => {
			editor.updateShape({ id: shape.id, type: shape.type, props: { text: res } })
			setLoadingStatus('idle')
		})
	}

	const handleCreation = () => {
		const id = createShapeId()
		const srcShape = editor.getShape(srcId)
		editor.createShape({
			type: 'node',
			id: id,
			x: srcShape.x,
			y: srcShape.y + srcShape.props.h + 100,
			props: {
				text: suggestion,
			}
		})
	}

	return (
		<Card
			className='refinement-card'
			style={{ animationDelay: `${0.1 * index}s`, width: '248px', boxSizing: 'content-box', position: 'relative' }}
			sx={{ width: '100%' }}
			onPointerDown={stopEventPropagation}
			// onClick={handleClick}
			// onTouchStart={handleClick}
		>
			<div className='rotate'>
			</div>
			<CardContent style={{ position: 'relative', width: '240px', minHeight: '210px', padding: '20px 15px 30px', margin: '4px auto', background: '#fff' }}>
				{/*<Typography variant='body2' className='text-ell'>{suggestion}</Typography>*/}
				<div className={needExpand && !expand ? 'text-ell' : 'text-ell2'} ref={myRef}>{suggestion}</div>
				{needExpand && !expand && <div className='expand' onTouchStart={(e) => { setExpand(true); e.stopPropagation()}} onClick={(e) => { setExpand(true); e.stopPropagation() }}><KeyboardDoubleArrowDownOutlinedIcon fontSize='small'></KeyboardDoubleArrowDownOutlinedIcon></div>}
				{needExpand && expand && <div className='expand' onTouchStart={(e) => { setExpand(false); e.stopPropagation() }} onClick={(e) => { setExpand(false); e.stopPropagation() }}><KeyboardDoubleArrowUpOutlinedIcon fontSize='small'></KeyboardDoubleArrowUpOutlinedIcon></div>}
				{/* <IconButton aria-label='share' onClick={handleClick}>
					<MobileScreenShareIcon />
				</IconButton> */}
			</CardContent>
			<div>
				<IconButton onClick={handleRefinement}
					onTouchStart={handleRefinement}>
					<img src='/apply_suggestion.png' style={{ width: '20px', height: '20px' }} />
				</IconButton>
				<IconButton onClick={handleCreation}
					onTouchStart={handleCreation}>
					<img src='/add.png' style={{ width: '20px', height: '20px' }} />
				</IconButton>
			</div>
		</Card>
	)
}
