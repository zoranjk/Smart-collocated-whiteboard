import React, { useState } from "react";
import { Box, Paper, Chip, Typography } from "@mui/material";

function hexToRgb(hex) {
    // Remove the '#' if present
    hex = hex.replace(/^#/, '');
    const alpha = 0.5;
  
    // Parse the r, g, b values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
  
    // Return the RGB representation
    return `rgb(${r}, ${g}, ${b}, ${alpha})`;
  }

export function ColSuggestion({ editor, data }) {

    // format: { collaborators: [{name: "name of user1"}, {name: "name of user2"}], suggestion: "suggestion for collaboration" }

    return (
        <Box>
            <Paper sx={{
                padding: 2
            }}>
                <Box sx={{ marginBottom: 2 }}>
                    <Typography variant="body1" sx={{ marginBottom: 1 }}>Collaborators</Typography>
                    {data.collaborators.map(collaborator => {
                        return (
                            <Chip label={collaborator.name} sx={{ marginRight: 1, backgroundColor: hexToRgb(collaborator.color) }} />
                        )
                    })}
                </Box>
                <Box>
                    <Typography variant="body2">{data.suggestion}</Typography>
                </Box>
            </Paper>
        </Box>
    )
}