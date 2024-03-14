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
import { createShapeId, stopEventPropagation } from '@tldraw/tldraw'
import { Button, Stack, Chip, Avatar, Skeleton, Box, Grid } from '@mui/material'
import { ClickableText } from '../utils'
import { callFrameRelationAPI } from '../utils'
import { generateIdeas } from '../../lib/ideaGenerationFromOpenAI'
import { getNodes } from '../../lib/utils/helper'
import TextField from '@mui/material/TextField';


export function LoadingAnimations() {
    return (
        <Box sx={{ width: '80%' }}>
            <Skeleton />
            <Skeleton animation='wave' />
            <Skeleton animation={false} />
        </Box>
    )
}

export const IdeaPanel = ({ editor, shape }) => {

    // const [tabValue, setTabValue] = useState(-1)
    const [instruction, setInstruction] = useState('')

    const addIdeaToGroup = (idea) => {
        editor.createShape({
            id: createShapeId(),
            type: 'node',
            x: 50,
            y: 50,
            parentId: shape.id,
            props: {
                text: idea,
            }
        })
    }

    const handleIdeaGeneration = async ({with_instruction=true}) => {
        // if (tabValue == 0) {
        //     return
        // }
        // // setTabValue(0)
        editor.updateShape({
            id: shape.id,
            meta: { ...shape.meta, ideaLoadingStatus: 'loading' },
        })

        let ideas = []
        ideas = getNodes([shape], ideas).map(idea => {
            return {
                text: idea.props.text,
            }
        })

        const topic = shape.props.name
        console.log('ideas:', ideas)
        console.log('topic:', topic)
        const user_instruction = with_instruction ? instruction : ""
        generateIdeas({ existing_ideas: ideas, topic: topic, instruction: user_instruction }).then(res => {
            const ideas = res.map(idea => idea.text)
            editor.updateShape({
                id: shape.id,
                meta: { ...shape.meta, ideaLoadingStatus: 'loaded', frameIdeas: ideas },
            })
        })
    }

    return (
        <Box>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Stack direction='row' spacing={1}>
                    <TextField id="outlined-basic" value={instruction} onChange={(e) => setInstruction(e.target.value)} label="Please enter your prompt" sx={{ width: "90%", marginRight: 10 }} variant="outlined" />
                    <IconButton onPointerDown={stopEventPropagation} onClick={handleIdeaGeneration} onTouchStart={handleIdeaGeneration} ><img src="idea.png" style={{ width: 25, height: 25 }} /></IconButton>
                </Stack>
                <ClickableText
                    onPointerDown={stopEventPropagation}
                    onClick={() => handleIdeaGeneration({with_instruction: false})}
                    onTouchStart={() => handleIdeaGeneration({with_instruction: false})}
                    style={{ marginTop: 15 }}
                >
                    Just generate free ideas...
                </ClickableText>
            </Box>
            <Box sx={{ marginTop: 2 }}>
                {
                    shape.meta.ideaLoadingStatus == 'loading' && (
                        <LoadingAnimations />
                    )
                }
                {
                    shape.meta.ideaLoadingStatus == 'loaded' && (
                        <Box>
                            <Grid container spacing={2}>
                                {shape.meta.frameIdeas.map((idea, index) => {
                                    return (
                                        <Grid item xs={3}>
                                            <Paper onPointerDown={stopEventPropagation} onClick={() => addIdeaToGroup(idea)} onTouchStart={() => addIdeaToGroup(idea)} sx={{ minHeight: "200px", padding: 1, background: 'linear-gradient(to right, #8f41e9, #578aef)',
											color:'#fff' }}>
                                                <Box key={index} sx={{ pointerEvents: 'all', cursor: "pointer" }}>
                                                    <Typography sx={{
                                                        // whiteSpace: "nowrap", /* Prevent text from wrapping to the next line */
                                                        // overflow: "hidden", /* Hide overflow text */
                                                        // textOverflow: "ellipsis"
                                                    }}>{idea}</Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>)
                                })}
                            </Grid>
                        </Box>
                    )
                }
            </Box>

        </Box>
    )
}
