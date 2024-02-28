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

    const [tabValue, setTabValue] = useState(-1)

    const handleIdeaGeneration = async () => {
        if (tabValue == 0) {
            return
        }
        setTabValue(0)
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
        generateIdeas({ existing_ideas: ideas, topic: topic }).then(res => {
            const ideas = res.map(idea => idea.text)
            editor.updateShape({
                id: shape.id,
                meta: { ...shape.meta, ideaLoadingStatus: 'loaded', frameIdeas: ideas },
            })
        })
    }

    return (
        <Box>
            <Box>
                <Stack direction='row' spacing={1}>
                    <TextField id="outlined-basic" label="Please enter your need" sx={{ width: "80%", marginRight: 10 }} variant="outlined" />
                    <IconButton><img src="idea.png" style={{ width: 25, height: 25 }} /></IconButton>
                    {/* <Chip
                        label='Idea generation'
                        onClick={() => handleIdeaGeneration()}
                        onTouchStart={() => handleIdeaGeneration()}
                        onPointerDown={stopEventPropagation}
                    />
                    <Chip
                        label=''
                        // onClick={() => }
                        // onTouchStart={() => }
                        onPointerDown={stopEventPropagation}
                    /> */}
                </Stack>
            </Box>
            <Box sx={{ marginTop: 2 }}>
                {
                    shape.meta.ideaLoadingStatus == 'loading' && (
                        <LoadingAnimations />
                    )
                }
                {
                    shape.meta.ideaLoadingStatus == 'loaded' && tabValue == 0 && (
                        <Box>
                            <Grid container spacing={2}>
                                {shape.meta.frameIdeas.map((idea, index) => {
                                    return (
                                        <Grid item xs={3}>
                                            <Paper sx={{ maxHeight: "300px", padding: 1 }}>
                                                <Box key={index}>
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
