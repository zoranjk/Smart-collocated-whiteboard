import * as React from 'react'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Stack from '@mui/material/Stack';
import { deepOrange, deepPurple } from '@mui/material/colors';

export function TopZoneNameBar () {
	return (
		<Stack direction="row" spacing={2} sx={{ margin: 2 }}>
			<Avatar sx={{ bgcolor: "#faa307" }}>NE</Avatar>
			<Avatar sx={{ bgcolor: "#94d2bd" }}>OP</Avatar>
		</Stack>
	)
}
