import React, { useState } from "react";
import { Button, Box, Paper } from "@mui/material";

export function ColSuggestion({ editor, data }) {

    // format: { collaborators: [{name: "name of user1"}, {name: "name of user2"}], suggestion: "suggestion for collaboration" }

    return (
        <Box>
            <Paper>
                <Box>
                    {data.collaborators.map(collaborator => {
                        return (
                            <Chip label={collaborator.name} />
                        )
                    })}
                </Box>
            </Paper>
        </Box>
    )
}