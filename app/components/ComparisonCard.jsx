import * as React from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import PhoneIcon from '@mui/icons-material/Phone';
import FavoriteIcon from '@mui/icons-material/Favorite';

export function ComparisonCard () {
	const [value, setValue] = React.useState(0)

	const handleChange = (event, newValue) => {
		setValue(newValue)
	}

	return (
		<div style={{ width: "300px" }}>
			<Tabs value={value} onChange={handleChange} aria-label='icon tabs example'>
				<Tab icon={<PhoneIcon />} aria-label='phone' sx={{ width: "20%" }} />
				<Tab icon={<FavoriteIcon />} aria-label='favorite' sx={{ width: "20%" }} />
			</Tabs>
            <div>
                <h1>Comparison Card</h1>
            </div>
		</div>
	)
}
